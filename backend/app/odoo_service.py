from __future__ import annotations

import json
import uuid
import xmlrpc.client
from datetime import datetime, timezone
from typing import Any

try:
    from .config import settings, validate_required_env
except ImportError:  # allows `python app/odoo_service.py`
    from config import settings, validate_required_env


class OdooService:
    def __init__(self) -> None:
        self.url = settings.odoo_url
        self.db = settings.odoo_db
        self.username = settings.odoo_username
        self.password = settings.odoo_password

    def _common(self) -> xmlrpc.client.ServerProxy:
        return xmlrpc.client.ServerProxy(f"{self.url}/xmlrpc/2/common")

    def _models(self) -> xmlrpc.client.ServerProxy:
        return xmlrpc.client.ServerProxy(f"{self.url}/xmlrpc/2/object")

    def _ensure(self) -> None:
        missing = validate_required_env()
        if missing:
            raise ValueError(f"Missing required env vars: {', '.join(missing)}")

    def authenticate(self) -> int:
        self._ensure()
        uid = self._common().authenticate(self.db, self.username, self.password, {})
        if not uid:
            raise ValueError("Odoo authentication failed. Verify DB username/password.")
        return int(uid)

    def execute_kw(self, model: str, method: str, args: list[Any], kwargs: dict[str, Any] | None = None) -> Any:
        uid = self.authenticate()
        return self._models().execute_kw(
            self.db,
            uid,
            self.password,
            model,
            method,
            args,
            kwargs or {},
        )

    def find_partner_by_email(self, email: str) -> dict[str, Any] | None:
        partners = self.execute_kw(
            "res.partner",
            "search_read",
            [[["email", "=", email]]],
            {"fields": ["id", "name", "email", "phone", "mobile", "street", "comment"], "limit": 1},
        )
        return partners[0] if partners else None

    def find_partner_by_id(self, partner_id: int) -> dict[str, Any] | None:
        partners = self.execute_kw(
            "res.partner",
            "search_read",
            [[["id", "=", int(partner_id)]]],
            {"fields": ["id", "name", "email", "phone", "mobile", "street", "comment", "create_date"], "limit": 1},
        )
        return partners[0] if partners else None

    def _default_unit_price(self) -> float:
        products = self.list_animalkart_products()
        if products:
            return float(products[0].get("list_price") or 0.0) or 350000.0
        return 350000.0

    def _partner_orders_rows(self, partner_id: int) -> list[dict[str, Any]]:
        return self.execute_kw(
            "sale.order",
            "search_read",
            [[["partner_id", "=", int(partner_id)]]],
            {
                "fields": ["id", "name", "amount_total", "state", "warehouse_id", "create_date", "note"],
                "order": "id desc",
                "limit": 100,
            },
        )

    @staticmethod
    def extract_role_from_partner(partner: dict[str, Any] | None) -> str:
        if not partner:
            return "investor"
        comment = str(partner.get("comment") or "")
        marker = "AnimalKart role="
        if marker in comment:
            value = comment.split(marker, 1)[1].split("|", 1)[0].strip().lower()
            if value in {"investor", "agent", "admin"}:
                return value
        return "investor"

    @staticmethod
    def extract_profile_from_partner(partner: dict[str, Any] | None) -> dict[str, str]:
        if not partner:
            return {}
        comment = str(partner.get("comment") or "")
        fields: dict[str, str] = {}
        for chunk in [c.strip() for c in comment.split("|") if c.strip()]:
            if "=" not in chunk:
                continue
            key, value = chunk.split("=", 1)
            fields[key.strip()] = value.strip()
        return fields

    def list_partner_orders(self, email: str) -> list[dict[str, Any]]:
        partner = self.find_partner_by_email(email)
        if not partner:
            return []

        orders = self._partner_orders_rows(int(partner["id"]))

        items: list[dict[str, Any]] = []
        for row in orders:
            warehouse_info = row.get("warehouse_id")
            warehouse_id = int(warehouse_info[0]) if isinstance(warehouse_info, list) and warehouse_info else None
            warehouse_name = warehouse_info[1] if isinstance(warehouse_info, list) and len(warehouse_info) > 1 else None
            items.append(
                {
                    "order_id": int(row["id"]),
                    "order_reference": row.get("name") or f"SO{row['id']}",
                    "total_amount": float(row.get("amount_total") or 0.0),
                    "payment_method": (row.get("note") or "").replace("Payment Method:", "").strip() or "unknown",
                    "status": row.get("state") or "draft",
                    "warehouse_id": warehouse_id,
                    "warehouse_name": warehouse_name,
                    "created_at": row.get("create_date") or "",
                }
            )
        return items

    def list_orders_by_customer_id(self, customer_id: int) -> list[dict[str, Any]]:
        partner = self.find_partner_by_id(customer_id)
        if not partner:
            return []

        items = self.list_partner_orders(str(partner.get("email") or ""))
        if items:
            return items

        # fallback if partner has no email
        orders = self._partner_orders_rows(int(customer_id))
        fallback_items: list[dict[str, Any]] = []
        for row in orders:
            fallback_items.append(
                {
                    "order_id": int(row["id"]),
                    "order_reference": row.get("name") or f"SO{row['id']}",
                    "total_amount": float(row.get("amount_total") or 0.0),
                    "payment_method": (row.get("note") or "").replace("Payment Method:", "").strip() or "unknown",
                    "status": row.get("state") or "draft",
                    "warehouse_id": int(row["warehouse_id"][0]) if isinstance(row.get("warehouse_id"), list) and row.get("warehouse_id") else None,
                    "warehouse_name": row["warehouse_id"][1] if isinstance(row.get("warehouse_id"), list) and len(row.get("warehouse_id")) > 1 else None,
                    "created_at": row.get("create_date") or "",
                }
            )
        return fallback_items

    def list_partner_wallet(self, email: str) -> dict[str, Any]:
        partner = self.find_partner_by_email(email)
        if not partner:
            return {
                "balance": 0.0,
                "total_earned": 0.0,
                "total_spent": 0.0,
                "transactions": [],
            }

        unit_price = self._default_unit_price()
        partner_orders = self._partner_orders_rows(int(partner["id"]))

        total_spent = 0.0
        transactions: list[dict[str, Any]] = []
        for row in partner_orders:
            amount = float(row.get("amount_total") or 0.0)
            total_spent += amount
            order_ref = row.get("name") or f"SO{int(row['id'])}"
            transactions.append(
                {
                    "transaction_id": f"ord-{int(row['id'])}",
                    "type": "unit_purchased",
                    "amount": -amount,
                    "description": f"Purchase via {order_ref}",
                    "date": row.get("create_date") or "",
                }
            )

        # Use direct referral commissions for wallet earnings when available.
        referrals_data = self.list_partner_referrals(email)
        total_earned = float(referrals_data["direct_commission"] + referrals_data["indirect_commission"])
        for ref in referrals_data["items"]:
            if float(ref.get("commission_earned") or 0.0) <= 0:
                continue
            transactions.append(
                {
                    "transaction_id": f"ref-{ref['referral_id']}",
                    "type": "commission_earned",
                    "amount": float(ref.get("commission_earned") or 0.0),
                    "description": f"Referral commission from {ref.get('name') or 'Investor'}",
                    "date": ref.get("date") or "",
                }
            )

        transactions.sort(key=lambda x: x.get("date") or "", reverse=True)
        balance = total_earned

        return {
            "balance": balance,
            "total_earned": total_earned,
            "total_spent": total_spent,
            "transactions": transactions,
        }

    def _search_partners(self, domain: list[Any]) -> list[dict[str, Any]]:
        return self.execute_kw(
            "res.partner",
            "search_read",
            [domain],
            {"fields": ["id", "name", "email", "create_date", "parent_id"], "limit": 500},
        )

    def list_partner_referrals(self, email: str) -> dict[str, Any]:
        partner = self.find_partner_by_email(email)
        if not partner:
            return {
                "referral_code": "",
                "items": [],
                "direct_referrals": 0,
                "indirect_referrals": 0,
                "direct_commission": 0.0,
                "indirect_commission": 0.0,
            }

        unit_price = self._default_unit_price()
        direct = self._search_partners([["parent_id", "=", int(partner["id"])], ["email", "!=", False]])
        direct_ids = [int(item["id"]) for item in direct]
        indirect: list[dict[str, Any]] = []
        if direct_ids:
            indirect = self._search_partners([["parent_id", "in", direct_ids], ["email", "!=", False]])

        items: list[dict[str, Any]] = []
        direct_commission = 0.0
        indirect_commission = 0.0

        def _units_and_amount(partner_id: int) -> tuple[float, float, str]:
            orders = self._partner_orders_rows(partner_id)
            amount = sum(float(o.get("amount_total") or 0.0) for o in orders)
            units = amount / unit_price if unit_price else 0.0
            latest_date = orders[0].get("create_date") if orders else ""
            return units, amount, latest_date or ""

        for row in direct:
            units, amount, date = _units_and_amount(int(row["id"]))
            commission = amount * 0.05
            direct_commission += commission
            items.append(
                {
                    "referral_id": str(row["id"]),
                    "name": row.get("name") or "",
                    "level": 1,
                    "units_purchased": units,
                    "commission_earned": commission,
                    "date": date or (row.get("create_date") or ""),
                    "email": row.get("email"),
                }
            )

        for row in indirect:
            units, amount, date = _units_and_amount(int(row["id"]))
            commission = amount * 0.005
            indirect_commission += commission
            items.append(
                {
                    "referral_id": str(row["id"]),
                    "name": row.get("name") or "",
                    "level": 2,
                    "units_purchased": units,
                    "commission_earned": commission,
                    "date": date or (row.get("create_date") or ""),
                    "email": row.get("email"),
                }
            )

        items.sort(key=lambda x: x.get("date") or "", reverse=True)
        return {
            "referral_code": f"AK{int(partner['id'])}",
            "items": items,
            "direct_referrals": len(direct),
            "indirect_referrals": len(indirect),
            "direct_commission": direct_commission,
            "indirect_commission": indirect_commission,
        }

    def list_partner_rewards(self, email: str) -> dict[str, Any]:
        partner = self.find_partner_by_email(email)
        if not partner:
            return {"total_units": 0.0, "purchase_rewards": [], "referral_rewards": []}

        unit_price = self._default_unit_price()
        orders = self._partner_orders_rows(int(partner["id"]))
        total_amount = sum(float(o.get("amount_total") or 0.0) for o in orders)
        total_units = total_amount / unit_price if unit_price else 0.0

        purchase_reward_defs = [
            ("thailand_1", "Thailand Trip for 1 Person", 5),
            ("thailand_2", "Thailand Trip for 2 Persons", 10),
            ("silver_thailand", "1kg Silver + Thailand Trip for 2", 50),
            ("thar", "Mahindra Thar Roxx 4x4", 100),
        ]
        purchase_rewards = [
            {
                "id": reward_id,
                "type": reward_id,
                "label": label,
                "threshold": threshold,
                "claimed": False,
                "eligible": total_units >= threshold,
            }
            for reward_id, label, threshold in purchase_reward_defs
        ]

        referrals = self.list_partner_referrals(email)
        referral_rewards: list[dict[str, Any]] = []
        for item in referrals["items"]:
            if int(item.get("level") or 0) != 1:
                continue
            units = float(item.get("units_purchased") or 0.0)
            referral_rewards.append(
                {
                    "investor_name": item.get("name") or "",
                    "investor_id": str(item.get("referral_id") or ""),
                    "total_units": units,
                    "checkpoints": {
                        "checkpoint_30": {"reached": units >= 30, "claimed": False, "reward_chosen": None},
                        "checkpoint_50": {"reached": units >= 50, "claimed": False, "reward_chosen": None},
                        "checkpoint_100": {"reached": units >= 100, "claimed": False, "reward_chosen": None},
                    },
                }
            )

        return {
            "total_units": total_units,
            "purchase_rewards": purchase_rewards,
            "referral_rewards": referral_rewards,
        }

    def _transfer_store_key(self, agent_partner_id: int) -> str:
        return f"animalkart.transfer.requests.{agent_partner_id}"

    def _load_transfer_store(self, agent_partner_id: int) -> list[dict[str, Any]]:
        key = self._transfer_store_key(agent_partner_id)
        raw = self.execute_kw("ir.config_parameter", "get_param", [key])
        if not raw:
            return []
        try:
            data = json.loads(raw)
            return data if isinstance(data, list) else []
        except Exception:
            return []

    def _save_transfer_store(self, agent_partner_id: int, rows: list[dict[str, Any]]) -> None:
        key = self._transfer_store_key(agent_partner_id)
        payload = json.dumps(rows)
        self.execute_kw("ir.config_parameter", "set_param", [key, payload])

    def list_partner_transfers(self, agent_email: str) -> dict[str, Any]:
        agent = self.find_partner_by_email(agent_email)
        if not agent:
            return {"owned_units": [], "transfers": []}

        unit_price = self._default_unit_price()
        orders = self._partner_orders_rows(int(agent["id"]))

        owned_units: list[dict[str, Any]] = []
        for row in orders:
            amount = float(row.get("amount_total") or 0.0)
            units_count = int(round(amount / unit_price)) if unit_price else 0
            warehouse_info = row.get("warehouse_id")
            warehouse_name = warehouse_info[1] if isinstance(warehouse_info, list) and len(warehouse_info) > 1 else None
            order_ref = row.get("name") or f"SO{int(row['id'])}"
            for i in range(max(units_count, 0)):
                owned_units.append(
                    {
                        "unit_id": f"{order_ref}/U{i + 1}",
                        "warehouse_name": warehouse_name,
                        "purchased_date": row.get("create_date") or "",
                    }
                )

        transfers = self._load_transfer_store(int(agent["id"]))
        return {"owned_units": owned_units, "transfers": transfers}

    def create_transfer_request(self, payload: dict[str, Any]) -> dict[str, Any]:
        agent = self.find_partner_by_email(payload["agent_email"])
        if not agent:
            raise ValueError("Agent not found in Odoo")

        investor = self.find_partner_by_email(payload["investor_email"])
        if not investor:
            raise ValueError("Investor not found in Odoo")

        transfer_data = self.list_partner_transfers(payload["agent_email"])
        unit_ids = {item["unit_id"] for item in transfer_data["owned_units"]}
        if payload["unit_id"] not in unit_ids:
            raise ValueError("Selected unit is not owned by this agent")

        transfers = transfer_data["transfers"]
        for row in transfers:
            if row.get("unit_id") == payload["unit_id"] and row.get("transfer_status") != "rejected":
                raise ValueError("Transfer request already exists for this unit")

        created_at = datetime.now(timezone.utc).isoformat()
        item = {
            "transfer_id": f"TRF-{uuid.uuid4().hex[:8].upper()}",
            "unit_id": payload["unit_id"],
            "investor_email": payload["investor_email"],
            "investor_name": investor.get("name") or "",
            "transfer_date": created_at,
            "transfer_status": "pending",
            "notes": payload.get("notes") or None,
        }
        transfers.insert(0, item)
        self._save_transfer_store(int(agent["id"]), transfers)
        return item

    def _list_invoices_for_partner_id(self, partner_id: int) -> list[dict[str, Any]]:
        invoices = self.execute_kw(
            "account.move",
            "search_read",
            [[
                ["partner_id", "=", int(partner_id)],
                ["move_type", "=", "out_invoice"],
            ]],
            {
                "fields": ["id", "name", "invoice_date", "amount_total", "invoice_origin", "payment_state"],
                "order": "id desc",
                "limit": 100,
            },
        )

        if not invoices:
            order_refs = [
                str(row.get("name") or "")
                for row in self._partner_orders_rows(int(partner_id))
                if row.get("name")
            ]
            if order_refs:
                invoices = self.execute_kw(
                    "account.move",
                    "search_read",
                    [[
                        ["move_type", "=", "out_invoice"],
                        ["invoice_origin", "in", order_refs],
                    ]],
                    {
                        "fields": ["id", "name", "invoice_date", "amount_total", "invoice_origin", "payment_state"],
                        "order": "id desc",
                        "limit": 100,
                    },
                )

        items: list[dict[str, Any]] = []
        for row in invoices:
            items.append(
                {
                    "invoice_id": int(row["id"]),
                    "invoice_number": row.get("name") or f"INV/{row['id']}",
                    "invoice_date": row.get("invoice_date") or "",
                    "amount": float(row.get("amount_total") or 0.0),
                    "order_reference": row.get("invoice_origin") or None,
                    "payment_state": row.get("payment_state") or None,
                }
            )
        return items

    def list_partner_invoices(self, email: str) -> list[dict[str, Any]]:
        partner = self.find_partner_by_email(email)
        if not partner:
            return []
        return self._list_invoices_for_partner_id(int(partner["id"]))

    def list_partner_invoices_by_partner_id(self, partner_id: int) -> list[dict[str, Any]]:
        return self._list_invoices_for_partner_id(int(partner_id))

    def register_partner(self, payload: dict[str, Any]) -> tuple[int, bool]:
        existing = self.find_partner_by_email(payload["email"])
        if existing:
            return int(existing["id"]), False

        comment_parts = [
            f"AnimalKart role={payload.get('role', 'investor')}",
            f"PAN={payload.get('pan_card', '')}",
            f"Aadhaar={payload.get('aadhaar_number', '')}",
            f"Phone={payload.get('phone', '')}",
            f"WhatsApp={payload.get('whatsapp_number', '')}",
            f"Address={payload.get('address', '')}",
            f"BankName={payload.get('bank_name', '')}",
            f"AccountNumber={payload.get('account_number', '')}",
            f"IFSC={payload.get('ifsc_code', '')}",
            f"AccountHolder={payload.get('account_holder_name', '')}",
        ]
        values = {
            "name": payload["full_name"],
            "email": payload["email"],
            "phone": payload.get("phone") or False,
            "mobile": payload.get("whatsapp_number") or False,
            "street": payload.get("address") or False,
            "comment": " | ".join(comment_parts),
            "customer_rank": 1,
        }
        partner_id = self.execute_kw("res.partner", "create", [values])
        return int(partner_id), True

    def list_animalkart_products(self) -> list[dict[str, Any]]:
        domain: list[list[Any]] = [["sale_ok", "=", True]]
        if settings.product_ids:
            domain.append(["id", "in", settings.product_ids])
        elif settings.animalkart_skus:
            domain.append(["default_code", "in", settings.animalkart_skus])
        else:
            domain.append(["default_code", "ilike", settings.animalkart_sku_prefix])

        return self.execute_kw(
            "product.product",
            "search_read",
            [domain],
            {"fields": ["id", "name", "default_code", "qty_available", "list_price"], "limit": 500},
        )

    def _warehouse_ids(self) -> list[dict[str, Any]]:
        domain: list[list[Any]] = []
        if settings.warehouse_ids:
            domain.append(["id", "in", settings.warehouse_ids])
        if settings.company_ids:
            domain.append(["company_id", "in", settings.company_ids])

        return self.execute_kw(
            "stock.warehouse",
            "search_read",
            [domain],
            {"fields": ["id", "name", "company_id", "lot_stock_id"], "limit": 200},
        )

    def _warehouse_by_id(self, warehouse_id: int) -> dict[str, Any]:
        rows = self.execute_kw(
            "stock.warehouse",
            "search_read",
            [[["id", "=", warehouse_id]]],
            {"fields": ["id", "name", "company_id", "lot_stock_id"], "limit": 1},
        )
        if not rows:
            raise ValueError(f"Warehouse not found: {warehouse_id}")
        row = rows[0]
        if settings.warehouse_ids and int(row["id"]) not in settings.warehouse_ids:
            raise ValueError(f"Warehouse {warehouse_id} is not allowed")
        company_info = row.get("company_id")
        company_id = int(company_info[0]) if isinstance(company_info, list) and company_info else None
        if company_id and settings.company_ids and company_id not in settings.company_ids:
            raise ValueError(f"Warehouse {warehouse_id} company {company_id} is not allowed")
        return row

    def list_warehouse_stock(self) -> list[dict[str, Any]]:
        products = self.list_animalkart_products()
        warehouses = self._warehouse_ids()

        items: list[dict[str, Any]] = []
        for warehouse in warehouses:
            wh_id = int(warehouse["id"])
            wh_name = warehouse["name"]
            for prod in products:
                qty = self.execute_kw(
                    "product.product",
                    "read",
                    [[int(prod["id"])]],
                    {
                        "fields": ["qty_available"],
                        "context": {"warehouse": wh_id},
                    },
                )[0].get("qty_available", 0.0)
                items.append(
                    {
                        "warehouse_id": wh_id,
                        "warehouse_name": wh_name,
                        "sku": prod.get("default_code") or "",
                        "product_id": int(prod["id"]),
                        "product_name": prod.get("name") or "",
                        "unit_price": float(prod.get("list_price") or 0.0),
                        "qty_available": float(qty),
                    }
                )
        return items

    def list_warehouses(self) -> list[dict[str, Any]]:
        rows = self._warehouse_ids()
        return [{"id": int(row["id"]), "name": row.get("name") or ""} for row in rows]

    def list_products_for_api(self) -> list[dict[str, Any]]:
        stock_rows = self.list_warehouse_stock()
        items: list[dict[str, Any]] = []
        for row in stock_rows:
            items.append(
                {
                    "id": int(row["product_id"]),
                    "name": row.get("product_name") or "",
                    "sku": row.get("sku") or "",
                    "price": float(row.get("unit_price") or 0.0),
                    "stock_available": float(row.get("qty_available") or 0.0),
                    "warehouse": row.get("warehouse_name") or "",
                    "warehouse_id": int(row["warehouse_id"]),
                }
            )
        return items

    def get_investor_profile(self, investor_id: int) -> dict[str, Any]:
        partner = self.find_partner_by_id(investor_id)
        if not partner:
            raise ValueError("Investor not found")

        email = str(partner.get("email") or "")
        wallet = self.list_partner_wallet(email) if email else {"balance": 0.0}
        return {
            "id": int(partner["id"]),
            "name": str(partner.get("name") or ""),
            "wallet_balance": float(wallet.get("balance") or 0.0),
        }

    def create_order_by_customer_id(
        self,
        customer_id: int,
        warehouse_id: int,
        items: list[dict[str, Any]],
        payment_method: str,
    ) -> dict[str, Any]:
        partner = self.find_partner_by_id(customer_id)
        if not partner:
            raise ValueError("Customer not found")

        email = str(partner.get("email") or "").strip()
        if not email:
            raise ValueError("Customer email is missing in Odoo; cannot create order")

        lines = [
            {
                "warehouse_id": int(warehouse_id),
                "product_id": int(item["product_id"]),
                "quantity": float(item["quantity"]),
            }
            for item in items
        ]

        result = self.create_sale_order_and_reduce_stock(
            customer_email=email,
            payment_method=payment_method,
            lines=lines,
        )
        return {
            "order_id": int(result["sale_order_id"]),
            "order_number": str(result.get("sale_order_name") or f"SO{result['sale_order_id']}"),
            "invoice_id": result.get("invoice_id"),
            "invoice_number": result.get("invoice_number"),
            "status": "completed",
        }

    def list_all_orders(self) -> list[dict[str, Any]]:
        orders = self.execute_kw(
            "sale.order",
            "search_read",
            [[]],
            {
                "fields": ["id", "name", "amount_total", "state", "partner_id", "create_date"],
                "order": "id desc",
                "limit": 200,
            },
        )
        items: list[dict[str, Any]] = []
        for row in orders:
            partner_info = row.get("partner_id")
            customer_name = partner_info[1] if isinstance(partner_info, list) and len(partner_info) > 1 else ""
            items.append(
                {
                    "order_id": int(row["id"]),
                    "order_number": row.get("name") or f"SO{row['id']}",
                    "total_amount": float(row.get("amount_total") or 0.0),
                    "status": row.get("state") or "draft",
                    "customer_name": customer_name,
                    "created_at": row.get("create_date") or "",
                }
            )
        return items

    def admin_stock_report(self) -> list[dict[str, Any]]:
        products = self.execute_kw(
            "product.product",
            "search_read",
            [[["sale_ok", "=", True]]],
            {"fields": ["id", "name", "qty_available", "virtual_available"], "limit": 500},
        )
        return [
            {
                "product": row.get("name") or "",
                "on_hand": float(row.get("qty_available") or 0.0),
                "forecasted": float(row.get("virtual_available") or 0.0),
            }
            for row in products
        ]

    def create_sale_order_and_reduce_stock(self, customer_email: str, payment_method: str, lines: list[dict[str, Any]]) -> dict[str, Any]:
        partner = self.find_partner_by_email(customer_email)
        if not partner:
            raise ValueError("Customer not found in Odoo. Please register first.")

        sku_to_product: dict[str, dict[str, Any]] = {
            (p.get("default_code") or ""): p for p in self.list_animalkart_products()
        }
        product_by_id: dict[int, dict[str, Any]] = {
            int(p["id"]): p for p in self.list_animalkart_products()
        }

        order_lines: list[tuple[int, int, dict[str, Any]]] = []
        total_amount = 0.0
        order_warehouse_id: int | None = None
        order_company_id: int | None = None

        for line in lines:
            warehouse_id = int(line["warehouse_id"])
            warehouse = self._warehouse_by_id(warehouse_id)
            company_info = warehouse.get("company_id")
            warehouse_company_id = int(company_info[0]) if isinstance(company_info, list) and company_info else None
            if order_warehouse_id is None:
                order_warehouse_id = warehouse_id
                order_company_id = warehouse_company_id
            elif order_warehouse_id != warehouse_id:
                raise ValueError("All checkout lines must use the same warehouse_id")
            elif order_company_id != warehouse_company_id:
                raise ValueError("All checkout lines must belong to the same warehouse company")

            sku = line.get("sku") or ""
            qty = float(line["quantity"])
            product_id_from_line = line.get("product_id")

            product: dict[str, Any] | None = None
            if product_id_from_line is not None:
                product = product_by_id.get(int(product_id_from_line))
            elif sku:
                product = sku_to_product.get(sku)
            elif len(product_by_id) == 1:
                product = list(product_by_id.values())[0]

            if not product:
                raise ValueError("Product not found. Provide valid product_id or sku.")

            product_id = int(product["id"])
            if settings.product_ids and product_id not in settings.product_ids:
                raise ValueError(f"Product {product_id} is not allowed")

            qty_available = float(
                self.execute_kw(
                    "product.product",
                    "read",
                    [[product_id]],
                    {"fields": ["qty_available"], "context": {"warehouse": warehouse_id}},
                )[0].get("qty_available", 0.0)
            )
            if qty > qty_available:
                raise ValueError(
                    f"Insufficient stock for product_id={product_id} at warehouse_id={warehouse_id}. "
                    f"Available={qty_available}, requested={qty}"
                )

            product_read = self.execute_kw(
                "product.product",
                "read",
                [[product_id]],
                {"fields": ["list_price", "name"]},
            )[0]
            unit_price = float(product_read.get("list_price") or 0.0)
            total_amount += unit_price * qty

            order_lines.append(
                (
                    0,
                    0,
                    {
                        "product_id": product_id,
                        "name": product_read.get("name") or product.get("name") or sku,
                        "product_uom_qty": qty,
                        "price_unit": unit_price,
                    },
                )
            )

        sale_order_id = int(
            self.execute_kw(
                "sale.order",
                "create",
                [
                    {
                        "partner_id": int(partner["id"]),
                        "company_id": order_company_id,
                        "warehouse_id": order_warehouse_id,
                        "client_order_ref": f"AnimalKart-{uuid.uuid4().hex[:8]}",
                        "note": f"Payment Method: {payment_method}",
                        "order_line": order_lines,
                    }
                ],
            )
        )

        order_data = self.execute_kw(
            "sale.order",
            "read",
            [[sale_order_id]],
            {"fields": ["name", "amount_total"]},
        )[0]

        # Confirm order and create invoice in Odoo.
        self.execute_kw("sale.order", "action_confirm", [[sale_order_id]])
        self._validate_delivery_for_sale_order(sale_order_id)

        invoice_id: int | None = None
        invoice_number: str | None = None
        try:
            invoice_ids = self.execute_kw("sale.order", "_create_invoices", [[sale_order_id]])
            if isinstance(invoice_ids, list) and invoice_ids:
                invoice_id = int(invoice_ids[0])
                self.execute_kw("account.move", "action_post", [[invoice_id]])
                invoice_data = self.execute_kw(
                    "account.move",
                    "read",
                    [[invoice_id]],
                    {"fields": ["name"]},
                )[0]
                invoice_number = invoice_data.get("name") or f"INV/{invoice_id}"
        except Exception:
            # Keep checkout successful even if invoice generation is blocked by Odoo permissions/config.
            invoice_id = None
            invoice_number = None

        return {
            "sale_order_id": sale_order_id,
            "sale_order_name": order_data.get("name") or f"SO{sale_order_id}",
            "total_amount": float(order_data.get("amount_total") or total_amount),
            "invoice_id": invoice_id,
            "invoice_number": invoice_number,
        }

    def _validate_delivery_for_sale_order(self, sale_order_id: int) -> None:
        picking_ids = self.execute_kw(
            "stock.picking",
            "search",
            [[
                ["sale_id", "=", int(sale_order_id)],
                ["state", "not in", ["done", "cancel"]],
            ]],
        )
        if not picking_ids:
            return

        self.execute_kw("stock.picking", "action_assign", [picking_ids])

        for picking_id in picking_ids:
            # Odoo versions differ on move/move-line quantity field names.
            # Try a compatible strategy; if unavailable, still attempt button_validate
            # and process the returned immediate transfer/backorder wizard.
            try:
                move_lines = self.execute_kw(
                    "stock.move.line",
                    "search_read",
                    [[["picking_id", "=", int(picking_id)]]],
                    {"fields": ["id", "qty_done", "reserved_uom_qty"], "limit": 500},
                )
                for line in move_lines:
                    required_qty = float(line.get("reserved_uom_qty") or 0.0)
                    done_qty = float(line.get("qty_done") or 0.0)
                    if done_qty < required_qty:
                        self.execute_kw(
                            "stock.move.line",
                            "write",
                            [[int(line["id"])], {"qty_done": required_qty}],
                        )
            except Exception:
                # Keep going; button_validate may still work via immediate transfer flow.
                pass

            result = self.execute_kw("stock.picking", "button_validate", [[int(picking_id)]])
            if isinstance(result, dict):
                res_model = result.get("res_model")
                res_id = result.get("res_id")
                if res_model == "stock.immediate.transfer" and res_id:
                    self.execute_kw("stock.immediate.transfer", "process", [[int(res_id)]])
                elif res_model == "stock.backorder.confirmation" and res_id:
                    self.execute_kw("stock.backorder.confirmation", "process", [[int(res_id)]])

    def _reduce_onhand_quantity(self, product_id: int, warehouse_id: int, quantity_to_reduce: float) -> None:
        warehouse = self._warehouse_by_id(warehouse_id)
        lot_stock = warehouse.get("lot_stock_id")
        if not isinstance(lot_stock, list) or not lot_stock:
            raise ValueError(f"Warehouse {warehouse_id} has no internal stock location")
        location_id = int(lot_stock[0])

        quants = self.execute_kw(
            "stock.quant",
            "search_read",
            [[
                ["product_id", "=", product_id],
                ["location_id", "child_of", location_id],
                ["quantity", ">", 0],
            ]],
            {"fields": ["id", "quantity", "company_id"], "order": "quantity desc", "limit": 1},
        )
        if not quants:
            raise ValueError(f"No stock.quant found for product_id={product_id} in warehouse_id={warehouse_id}")

        quant = quants[0]
        company_info = quant.get("company_id")
        quant_company_id = int(company_info[0]) if isinstance(company_info, list) and company_info else None
        if quant_company_id and settings.company_ids and quant_company_id not in settings.company_ids:
            raise ValueError(f"Quant company {quant_company_id} is not allowed")

        current = float(quant.get("quantity") or 0.0)
        if quantity_to_reduce > current:
            raise ValueError(
                f"Not enough quant stock for product_id={product_id} in warehouse_id={warehouse_id}"
            )

        self.execute_kw(
            "stock.quant",
            "write",
            [[int(quant["id"])], {"quantity": current - quantity_to_reduce}],
        )


if __name__ == "__main__":
    service = OdooService()
    uid = service.authenticate()
    print("UID:", uid)
    products = service.list_animalkart_products()
    print("Products:", products)
