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
        return xmlrpc.client.ServerProxy(f"{self.url}/xmlrpc/2/common", allow_none=True)

    def _models(self) -> xmlrpc.client.ServerProxy:
        return xmlrpc.client.ServerProxy(f"{self.url}/xmlrpc/2/object", allow_none=True)

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

    def list_investor_holdings(self, email: str) -> dict[str, Any]:
        partner = self.find_partner_by_email(email)
        if not partner:
            return {"total_units": 0.0, "per_warehouse": []}

        unit_price = self._default_unit_price()
        if unit_price <= 0:
            return {"total_units": 0.0, "per_warehouse": []}

        orders = self._partner_orders_rows(int(partner["id"]))

        per_wh: dict[tuple[int | None, str | None], float] = {}
        total_units = 0.0

        for row in orders:
            amount = float(row.get("amount_total") or 0.0)
            if amount <= 0:
                continue
            units = amount / unit_price
            warehouse_info = row.get("warehouse_id")
            wh_id = int(warehouse_info[0]) if isinstance(warehouse_info, list) and warehouse_info else None
            wh_name = warehouse_info[1] if isinstance(warehouse_info, list) and len(warehouse_info) > 1 else None
            key = (wh_id, wh_name)
            per_wh[key] = per_wh.get(key, 0.0) + units
            total_units += units

        per_warehouse: list[dict[str, Any]] = []
        for (wh_id, wh_name), units in per_wh.items():
            per_warehouse.append(
                {
                    "warehouse_id": wh_id,
                    "warehouse_name": wh_name,
                    "units": units,
                }
            )

        return {"total_units": total_units, "per_warehouse": per_warehouse}

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

    def get_company_id(self) -> int:
        rows = self.execute_kw(
            "res.company",
            "search_read",
            [[]],
            {"fields": ["id", "name"], "limit": 1},
        )
        if not rows:
            raise ValueError("No company found in Odoo")
        return int(rows[0]["id"])

    def get_bank_journal_id(self) -> int:
        rows = self.execute_kw(
            "account.journal",
            "search_read",
            [[["type", "=", "bank"]]],
            {"fields": ["id", "name"], "limit": 1},
        )
        if not rows:
            raise ValueError("No bank journal found in Odoo")
        return int(rows[0]["id"])

    def get_all_warehouses(self) -> list[dict[str, Any]]:
        """Return all warehouses belonging to Company 2 (AnimalKart Pvt Ltd) only."""
        ALLOWED_COMPANY_ID = 2
        return self.execute_kw(
            "stock.warehouse",
            "search_read",
            [[["company_id", "=", ALLOWED_COMPANY_ID]]],
            {"fields": ["id", "name", "code", "company_id"], "limit": 100},
        )

    def get_all_products(self) -> list[dict[str, Any]]:
        return self.execute_kw(
            "product.product",
            "search_read",
            [[["sale_ok", "=", True]]],
            {"fields": ["id", "name", "default_code", "qty_available", "list_price"], "limit": 200},
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

    def admin_list_warehouses(self) -> list[dict[str, Any]]:
        """List all warehouses restricted to Company 2 (AnimalKart Pvt Ltd) only."""
        ALLOWED_COMPANY_ID = 2
        rows = self.execute_kw(
            "stock.warehouse",
            "search_read",
            [[["company_id", "=", ALLOWED_COMPANY_ID]]],
            {"fields": ["id", "name", "code", "company_id", "lot_stock_id"], "limit": 200},
        )
        items: list[dict[str, Any]] = []
        for row in rows:
            lot_stock = row.get("lot_stock_id")
            lot_stock_id = int(lot_stock[0]) if isinstance(lot_stock, list) and lot_stock else None
            company_info = row.get("company_id")
            company_name = company_info[1] if isinstance(company_info, list) and len(company_info) > 1 else "AnimalKart Pvt Ltd"
            items.append(
                {
                    "id": int(row["id"]),
                    "name": row.get("name") or "",
                    "code": row.get("code") if "code" in row else "",
                    "lot_stock_id": lot_stock_id,
                    "company_id": ALLOWED_COMPANY_ID,
                    "company_name": company_name,
                }
            )
        return items

    def create_warehouse(self, name: str, code: str, company_id: int) -> int:
        warehouse_id = self.execute_kw(
            "stock.warehouse",
            "create",
            [
                {
                    "name": name,
                    "code": code,
                    "company_id": int(company_id),
                }
            ],
        )
        return int(warehouse_id)

    def update_warehouse(self, warehouse_id: int, values: dict[str, Any]) -> None:
        allowed_keys = {"name", "code"}
        payload = {k: v for k, v in values.items() if k in allowed_keys and v is not None}
        if not payload:
            return
        self.execute_kw(
            "stock.warehouse",
            "write",
            [[int(warehouse_id)], payload],
        )

    def archive_warehouse(self, warehouse_id: int) -> None:
        self.execute_kw(
            "stock.warehouse",
            "write",
            [[int(warehouse_id)], {"active": False}],
        )

    def clear_and_archive_warehouse(self, warehouse_id: int) -> None:
        """Zero-out all stock in a warehouse, then archive it."""
        warehouse = self._warehouse_by_id(warehouse_id)
        lot_stock = warehouse.get("lot_stock_id")
        if not isinstance(lot_stock, list) or not lot_stock:
            # No stock location → just archive directly
            self.archive_warehouse(warehouse_id)
            return
        location_id = int(lot_stock[0])

        # Find all quants in this warehouse location (and children)
        quants = self.execute_kw(
            "stock.quant",
            "search_read",
            [
                [
                    ["location_id", "child_of", location_id],
                    ["quantity", ">", 0],
                ]
            ],
            {"fields": ["id", "product_id", "quantity"]},
        )

        # Zero-out every quant via inventory adjustment
        for quant in quants:
            quant_id = int(quant["id"])
            self.execute_kw(
                "stock.quant",
                "write",
                [[quant_id], {"inventory_quantity": 0}],
            )
            try:
                self.execute_kw(
                    "stock.quant",
                    "action_apply_inventory",
                    [[quant_id]],
                )
            except xmlrpc.client.Fault as fault:
                if "cannot marshal None" in str(fault):
                    pass  # action succeeded; Odoo can't serialize the None return
                else:
                    raise

        # Now archive the warehouse
        self.archive_warehouse(warehouse_id)

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

    def add_stock(self, product_id: int, warehouse_id: int, quantity: float) -> None:
        if quantity <= 0:
            raise ValueError("Quantity must be positive for stock addition")

        warehouse = self._warehouse_by_id(warehouse_id)
        lot_stock = warehouse.get("lot_stock_id")
        if not isinstance(lot_stock, list) or not lot_stock:
            raise ValueError(f"Warehouse {warehouse_id} has no internal stock location")
        location_id = int(lot_stock[0])

        # Find existing quant if any
        quants = self.execute_kw(
            "stock.quant",
            "search_read",
            [[
                ["product_id", "=", int(product_id)],
                ["location_id", "child_of", location_id],
            ]],
            {"fields": ["id", "quantity"], "limit": 1},
        )
        current_qty = float(quants[0].get("quantity") or 0.0) if quants else 0.0
        new_qty = current_qty + float(quantity)

        if quants:
            quant_id = int(quants[0]["id"])
            self.execute_kw(
                "stock.quant",
                "write",
                [[quant_id], {"inventory_quantity": new_qty}],
            )
        else:
            quant_id = int(
                self.execute_kw(
                    "stock.quant",
                    "create",
                    [[
                        {
                            "product_id": int(product_id),
                            "location_id": location_id,
                            "inventory_quantity": new_qty,
                        }
                    ]],
                )
            )

        try:
            self.execute_kw(
                "stock.quant",
                "action_apply_inventory",
                [[int(quant_id)]],
            )
        except xmlrpc.client.Fault as fault:
            if "cannot marshal None" in str(fault):
                pass  # action succeeded; Odoo can't serialize the None return
            else:
                raise

    def reduce_stock(self, product_id: int, warehouse_id: int, quantity: float, adjustment_location_id: int) -> None:
        if quantity <= 0:
            raise ValueError("Quantity must be positive for stock reduction")

        warehouse = self._warehouse_by_id(warehouse_id)
        lot_stock = warehouse.get("lot_stock_id")
        if not isinstance(lot_stock, list) or not lot_stock:
            raise ValueError(f"Warehouse {warehouse_id} has no internal stock location")
        location_id = int(lot_stock[0])

        product_rows = self.execute_kw(
            "product.product",
            "read",
            [[int(product_id)]],
            {"fields": ["uom_id"]},
        )
        if not product_rows:
            raise ValueError(f"Product not found: {product_id}")
        uom_info = product_rows[0].get("uom_id")
        uom_id = int(uom_info[0]) if isinstance(uom_info, list) and uom_info else 1

        move_id = self.execute_kw(
            "stock.move",
            "create",
            [[
                {
                    "name": "Admin Adjustment",
                    "product_id": int(product_id),
                    "product_uom_qty": float(quantity),
                    "product_uom": uom_id,
                    "location_id": location_id,
                    "location_dest_id": int(adjustment_location_id),
                }
            ]],
        )
        move_id_int = int(move_id)
        self.execute_kw("stock.move", "action_confirm", [[move_id_int]])
        self.execute_kw("stock.move", "_action_done", [[move_id_int]])

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

    def create_sale_order_draft_simple(
        self,
        customer_id: int,
        warehouse_id: int,
        product_id: int,
        quantity: float,
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
                "product_id": int(product_id),
                "quantity": float(quantity),
            }
        ]

        result = self.create_sale_order_draft(
            customer_email=email,
            payment_method=payment_method,
            lines=lines,
        )
        return {
            "order_id": int(result["sale_order_id"]),
            "status": "pending_admin_approval",
        }

    def list_all_orders(self) -> list[dict[str, Any]]:
        """List all sale orders for Company 2 (AnimalKart Pvt Ltd) only."""
        ALLOWED_COMPANY_ID = 2
        orders = self.execute_kw(
            "sale.order",
            "search_read",
            [[["company_id", "=", ALLOWED_COMPANY_ID]]],
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

    def list_admin_invoices(self) -> list[dict[str, Any]]:
        """List all customer invoices for Company 2 (AnimalKart Pvt Ltd) only."""
        ALLOWED_COMPANY_ID = 2
        invoices = self.execute_kw(
            "account.move",
            "search_read",
            [[["move_type", "=", "out_invoice"], ["company_id", "=", ALLOWED_COMPANY_ID]]],
            {
                "fields": ["id", "name", "invoice_date", "amount_total", "invoice_origin", "payment_state", "partner_id"],
                "order": "id desc",
                "limit": 200,
            },
        )
        if not invoices:
            return []

        partner_ids: set[int] = set()
        for row in invoices:
          partner_info = row.get("partner_id")
          if isinstance(partner_info, list) and partner_info:
              partner_ids.add(int(partner_info[0]))

        partner_map: dict[int, dict[str, Any]] = {}
        if partner_ids:
            partners = self.execute_kw(
                "res.partner",
                "search_read",
                [[["id", "in", list(partner_ids)]]],
                {"fields": ["id", "name", "email"], "limit": len(partner_ids)},
            )
            for p in partners:
                partner_map[int(p["id"])] = p

        items: list[dict[str, Any]] = []
        for row in invoices:
            partner_info = row.get("partner_id")
            partner_id = int(partner_info[0]) if isinstance(partner_info, list) and partner_info else None
            partner = partner_map.get(partner_id or -1, {}) if partner_id is not None else {}
            email = partner.get("email")
            if not isinstance(email, str) or not email:
                email = None
            items.append(
                {
                    "invoice_id": int(row["id"]),
                    "invoice_number": row.get("name") or f"INV/{row['id']}",
                    "invoice_date": row.get("invoice_date") or "",
                    "amount": float(row.get("amount_total") or 0.0),
                    "order_reference": row.get("invoice_origin") or None,
                    "payment_state": row.get("payment_state") or None,
                    "customer_name": partner.get("name") or "",
                    "customer_email": email,
                }
            )
        return items

    def get_order(self, order_id: int) -> dict[str, Any]:
        rows = self.execute_kw(
            "sale.order",
            "search_read",
            [[["id", "=", int(order_id)]]],
            {
                "fields": ["id", "name", "amount_total", "state", "partner_id", "create_date"],
                "limit": 1,
            },
        )
        if not rows:
            raise ValueError(f"Order not found: {order_id}")
        row = rows[0]
        partner_info = row.get("partner_id")
        customer_name = partner_info[1] if isinstance(partner_info, list) and partner_info else ""
        return {
            "order_id": int(row["id"]),
            "order_number": row.get("name") or f"SO{row['id']}",
            "total_amount": float(row.get("amount_total") or 0.0),
            "status": row.get("state") or "draft",
            "customer_name": customer_name,
            "created_at": row.get("create_date") or "",
        }

    def list_animalkart_users(self) -> list[dict[str, Any]]:
        partners = self.execute_kw(
            "res.partner",
            "search_read",
            [[
                ["email", "!=", False],
                ["comment", "ilike", "AnimalKart role="],
            ]],
            {
                "fields": ["id", "name", "email", "comment", "create_date"],
                "limit": 500,
            },
        )
        items: list[dict[str, Any]] = []
        for p in partners:
            role = self.extract_role_from_partner(p)
            items.append(
                {
                    "partner_id": int(p["id"]),
                    "name": p.get("name") or "",
                    "email": p.get("email") or "",
                    "role": role,
                    "created_at": p.get("create_date") or "",
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

    def admin_dashboard_summary(self) -> dict[str, Any]:
        """
        Aggregate units sold, total revenue, and total capacity for the admin dashboard.
        - Units sold and total revenue are based on confirmed/completed sale orders.
        - Total capacity is approximated as units_sold + current available stock.
        """
        unit_price = self._default_unit_price()

        # Revenue and units sold from all non-cancelled, non-draft sale orders.
        orders = self.list_all_orders()
        total_revenue = 0.0
        for o in orders:
            state = str(o.get("status") or "").lower()
            if state in {"cancel", "cancelled", "draft", "sent"}:
                continue
            total_revenue += float(o.get("total_amount") or 0.0)

        units_sold = total_revenue / unit_price if unit_price else 0.0

        # Available units from current warehouse stock.
        stock_rows = self.list_warehouse_stock()
        total_available = sum(float(row.get("qty_available") or 0.0) for row in stock_rows)
        total_capacity = units_sold + total_available

        return {
            "units_sold": units_sold,
            "total_revenue": total_revenue,
            "total_capacity": total_capacity,
        }

    def list_warehouse_sales(self) -> list[dict[str, Any]]:
        """
        Aggregate units sold per warehouse based on sale orders.
        - Uses confirmed/completed sale orders (ignores draft/sent/cancelled).
        - Converts order amount to units using the default unit price.
        """
        unit_price = self._default_unit_price()
        if unit_price <= 0:
            return []

        orders = self.execute_kw(
            "sale.order",
            "search_read",
            [[["state", "not in", ["draft", "sent", "cancel"]]]],
            {
                "fields": ["amount_total", "warehouse_id"],
                "limit": 500,
            },
        )

        per_wh: dict[int, float] = {}
        for row in orders:
            warehouse_info = row.get("warehouse_id")
            if not isinstance(warehouse_info, list) or not warehouse_info:
                continue
            wh_id = int(warehouse_info[0])
            amount = float(row.get("amount_total") or 0.0)
            if amount <= 0:
                continue
            units = amount / unit_price
            per_wh[wh_id] = per_wh.get(wh_id, 0.0) + units

        warehouses = self._warehouse_ids()
        name_map: dict[int, str] = {int(w["id"]): (w.get("name") or "") for w in warehouses}

        items: list[dict[str, Any]] = []
        for wh_id, units in per_wh.items():
            items.append(
                {
                    "warehouse_id": wh_id,
                    "warehouse_name": name_map.get(wh_id, ""),
                    "units_sold": units,
                }
            )
        return items

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

    def create_sale_order_draft(self, customer_email: str, payment_method: str, lines: list[dict[str, Any]]) -> dict[str, Any]:
        """Create a draft sale order in Odoo without confirming, delivering, or invoicing."""
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

        return {
            "sale_order_id": sale_order_id,
            "sale_order_name": order_data.get("name") or f"SO{sale_order_id}",
            "total_amount": float(order_data.get("amount_total") or total_amount),
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

    def confirm_sale_order(self, sale_order_id: int) -> None:
        self.execute_kw("sale.order", "action_confirm", [[int(sale_order_id)]])

    def validate_delivery(self, sale_order_id: int) -> None:
        self._validate_delivery_for_sale_order(int(sale_order_id))

    def create_invoice_for_sale_order(self, sale_order_id: int) -> dict[str, Any]:
        """
        Create an invoice for a confirmed sale order using the
        sale.advance.payment.inv wizard (the public Odoo API).
        """
        sale_order_id = int(sale_order_id)

        # 1) Create the wizard in the context of this sale order
        wizard_id = self.execute_kw(
            "sale.advance.payment.inv",
            "create",
            [{"advance_payment_method": "delivered"}],
            {"context": {"active_ids": [sale_order_id], "active_model": "sale.order"}},
        )

        # 2) Execute the wizard to generate the invoice
        self.execute_kw(
            "sale.advance.payment.inv",
            "create_invoices",
            [[wizard_id]],
            {"context": {"active_ids": [sale_order_id], "active_model": "sale.order"}},
        )

        # 3) Read back the generated invoice(s) from the sale order
        order_data = self.execute_kw(
            "sale.order",
            "read",
            [[sale_order_id]],
            {"fields": ["invoice_ids"]},
        )
        invoice_ids = order_data[0].get("invoice_ids", []) if order_data else []
        if not invoice_ids:
            raise ValueError("No invoice was created for this sale order")

        invoice_id = int(invoice_ids[-1])  # latest invoice
        invoice_data = self.execute_kw(
            "account.move",
            "read",
            [[invoice_id]],
            {"fields": ["name"]},
        )[0]
        invoice_number = invoice_data.get("name") or f"INV/{invoice_id}"
        return {"invoice_id": invoice_id, "invoice_number": invoice_number}

    def post_invoice(self, invoice_id: int) -> None:
        self.execute_kw("account.move", "action_post", [[int(invoice_id)]])

    def register_invoice_payment(
        self,
        invoice_id: int,
        amount: float,
        journal_id: int,
        payment_method_id: int | None = None,
    ) -> None:
        invoice = self.execute_kw(
            "account.move",
            "read",
            [[int(invoice_id)]],
            {"fields": ["partner_id", "amount_residual", "company_id", "name"]},
        )[0]
        partner_info = invoice.get("partner_id")
        if not isinstance(partner_info, list) or not partner_info:
            raise ValueError("Invoice has no customer (partner_id)")
        partner_id = int(partner_info[0])

        amount_to_pay = float(amount or 0.0)
        if amount_to_pay <= 0:
            amount_to_pay = float(invoice.get("amount_residual") or 0.0)
        if amount_to_pay <= 0:
            raise ValueError("Invoice is already fully paid")

        payment_vals: dict[str, Any] = {
            "payment_type": "inbound",
            "partner_type": "customer",
            "partner_id": partner_id,
            "amount": amount_to_pay,
            "journal_id": int(journal_id),
            "ref": invoice.get("name") or f"INV/{invoice_id}",
        }
        if payment_method_id is not None:
            payment_vals["payment_method_id"] = int(payment_method_id)

        payment_id = self.execute_kw(
            "account.payment",
            "create",
            [[payment_vals]],
        )
        self.execute_kw("account.payment", "action_post", [[int(payment_id)]])
    def admin_approve_order(self, sale_order_id: int) -> dict[str, Any]:
        sale_order_id = int(sale_order_id)

        # 1) Confirm order
        self.confirm_sale_order(sale_order_id)

        # 2) Validate delivery (reduces stock)
        self.validate_delivery(sale_order_id)

        # 3) Create invoice
        invoice_info = self.create_invoice_for_sale_order(sale_order_id)
        invoice_id = int(invoice_info["invoice_id"])
        invoice_number = invoice_info["invoice_number"]

        # 4) Post invoice
        self.post_invoice(invoice_id)

        return {
            "order_id": sale_order_id,
            "invoice_id": invoice_id,
            "invoice_number": invoice_number,
            "status": "approved",
        }

    def admin_confirm_payment(self, invoice_id: int) -> dict[str, Any]:
        """
        Register payment for an invoice using the account.payment.register
        wizard, which properly reconciles the payment with the invoice.
        """
        invoice_id = int(invoice_id)
        journal_id = self.get_bank_journal_id()

        invoice = self.execute_kw(
            "account.move",
            "read",
            [[invoice_id]],
            {"fields": ["amount_residual", "state"]},
        )[0]

        # Auto-post the invoice if it's still in draft
        if invoice.get("state") == "draft":
            self.execute_kw("account.move", "action_post", [[invoice_id]])
            # Re-read amount after posting
            invoice = self.execute_kw(
                "account.move",
                "read",
                [[invoice_id]],
                {"fields": ["amount_residual", "state"]},
            )[0]

        amount = float(invoice.get("amount_residual") or 0.0)
        if amount <= 0:
            return {"status": "already_paid"}

        # Use the account.payment.register wizard in the invoice's context
        ctx = {
            "active_model": "account.move",
            "active_ids": [invoice_id],
        }

        wizard_id = self.execute_kw(
            "account.payment.register",
            "create",
            [{"journal_id": journal_id, "amount": amount}],
            {"context": ctx},
        )

        self.execute_kw(
            "account.payment.register",
            "action_create_payments",
            [[int(wizard_id)]],
            {"context": ctx},
        )

        return {"status": "paid"}

    # ── KYC Management ────────────────────────────────────────────────

    def extract_kyc_status(self, partner: dict | None) -> str:
        """
        Extract KYC status from a partner's comment field.
        Expected format: ... | KYC_STATUS=pending | ...
        Returns 'pending' if not found.
        """
        if not partner:
            return "pending"

        comment = str(partner.get("comment") or "")
        marker = "KYC_STATUS="

        if marker in comment:
            value = comment.split(marker, 1)[1].split("|", 1)[0].strip().lower()
            if value in {"pending", "approved", "rejected"}:
                return value

        return "pending"

    def update_kyc_status(self, partner_id: int, status: str) -> dict[str, Any]:
        """
        Update KYC status for a partner (approve or reject).
        Stores status in the comment field of res.partner.
        """
        if status not in {"approved", "rejected"}:
            raise ValueError("Invalid KYC status. Must be 'approved' or 'rejected'.")

        partner = self.execute_kw(
            "res.partner",
            "read",
            [[int(partner_id)]],
            {"fields": ["comment", "name", "email"]},
        )

        if not partner:
            raise ValueError("Partner not found")

        comment = partner[0].get("comment") or ""

        # Remove existing KYC_STATUS marker and rebuild
        parts = [p.strip() for p in comment.split("|") if p.strip()]
        parts = [p for p in parts if not p.startswith("KYC_STATUS=")]
        parts.append(f"KYC_STATUS={status}")

        updated_comment = " | ".join(parts)

        self.execute_kw(
            "res.partner",
            "write",
            [[int(partner_id)], {"comment": updated_comment}],
        )

        return {
            "partner_id": int(partner_id),
            "name": partner[0].get("name") or "",
            "email": partner[0].get("email") or "",
            "kyc_status": status,
            "status": "updated",
        }

    def list_pending_kyc(self) -> list[dict[str, Any]]:
        """List all partners with KYC_STATUS=pending in their comment."""
        partners = self.execute_kw(
            "res.partner",
            "search_read",
            [[["comment", "ilike", "KYC_STATUS=pending"]]],
            {"fields": ["id", "name", "email", "comment"], "limit": 200},
        )
        items: list[dict[str, Any]] = []
        for p in partners:
            items.append({
                "partner_id": int(p["id"]),
                "name": p.get("name") or "",
                "email": p.get("email") or "",
                "kyc_status": self.extract_kyc_status(p),
            })
        return items

    def list_all_kyc(self) -> list[dict[str, Any]]:
        """List all partners that have any KYC_STATUS marker in their comment."""
        partners = self.execute_kw(
            "res.partner",
            "search_read",
            [[["comment", "ilike", "KYC_STATUS="]]],
            {"fields": ["id", "name", "email", "comment"], "limit": 500},
        )
        items: list[dict[str, Any]] = []
        for p in partners:
            items.append({
                "partner_id": int(p["id"]),
                "name": p.get("name") or "",
                "email": p.get("email") or "",
                "kyc_status": self.extract_kyc_status(p),
            })
        return items

    # ── Warehouse Management ─────────────────────────────────────────

    def admin_create_warehouse(self, name: str, code: str) -> dict[str, Any]:
        """
        Create a new warehouse under Company 2 only.
        Rejects if a warehouse with the same code already exists in Company 2.
        Automatically assigns the AnimalKart Pvt Ltd (Company 2) address.
        """

        ALLOWED_COMPANY_ID = 2

        # Check if warehouse code already exists in company 2
        existing = self.execute_kw(
            "stock.warehouse",
            "search_read",
            [[
                ["code", "=", code],
                ["company_id", "=", ALLOWED_COMPANY_ID],
            ]],
            {"fields": ["id"], "limit": 1},
        )

        if existing:
            raise ValueError(f"Warehouse code '{code}' already exists in Company 2.")

        # Fetch Company 2's partner_id (AnimalKart Pvt Ltd address)
        company = self.execute_kw(
            "res.company",
            "search_read",
            [[["id", "=", ALLOWED_COMPANY_ID]]],
            {"fields": ["partner_id"], "limit": 1},
        )
        partner_id = None
        if company:
            partner_info = company[0].get("partner_id")
            if isinstance(partner_info, list) and partner_info:
                partner_id = int(partner_info[0])

        create_vals: dict[str, Any] = {
            "name": name,
            "code": code,
            "company_id": ALLOWED_COMPANY_ID,
        }
        if partner_id:
            create_vals["partner_id"] = partner_id

        warehouse_id = self.execute_kw(
            "stock.warehouse",
            "create",
            [create_vals],
        )

        return {
            "warehouse_id": int(warehouse_id),
            "name": name,
            "code": code,
            "company_id": ALLOWED_COMPANY_ID,
            "partner_id": partner_id,
            "status": "created",
        }

    def admin_list_warehouses(self) -> list[dict[str, Any]]:
        """List all warehouses with id, name, code, and lot_stock_id."""
        warehouses = self.execute_kw(
            "stock.warehouse",
            "search_read",
            [[]],
            {
                "fields": ["id", "name", "code", "lot_stock_id"],
                "limit": 200,
            },
        )
        items: list[dict[str, Any]] = []
        for w in warehouses:
            lot_stock = w.get("lot_stock_id")
            lot_stock_id = int(lot_stock[0]) if isinstance(lot_stock, list) and lot_stock else None
            items.append(
                {
                    "id": int(w["id"]),
                    "name": w.get("name") or "",
                    "code": w.get("code") or "",
                    "lot_stock_id": lot_stock_id,
                }
            )
        return items

    def create_warehouse(self, name: str, code: str, company_id: int) -> int:
        """Create a warehouse with explicit company_id and return the new id."""
        warehouse_id = self.execute_kw(
            "stock.warehouse",
            "create",
            [{"name": name, "code": code, "company_id": int(company_id)}],
        )
        return int(warehouse_id)

    def update_warehouse(self, warehouse_id: int, vals: dict[str, Any]) -> None:
        """Update fields on an existing warehouse."""
        write_vals = {k: v for k, v in vals.items() if v is not None}
        if write_vals:
            self.execute_kw(
                "stock.warehouse",
                "write",
                [[int(warehouse_id)], write_vals],
            )

    def archive_warehouse(self, warehouse_id: int) -> None:
        """Archive (deactivate) a warehouse."""
        self.execute_kw(
            "stock.warehouse",
            "write",
            [[int(warehouse_id)], {"active": False}],
        )

    def admin_edit_warehouse(
        self,
        warehouse_id: int,
        name: str | None = None,
        code: str | None = None,
    ) -> dict[str, Any]:
        """
        Edit warehouse name/code (Company 2 only).
        Prevents editing Company 1 warehouses and duplicate codes.
        """

        ALLOWED_COMPANY_ID = 2

        # Fetch warehouse
        warehouse = self.execute_kw(
            "stock.warehouse",
            "search_read",
            [[["id", "=", int(warehouse_id)]]],
            {"fields": ["id", "name", "code", "company_id"], "limit": 1},
        )

        if not warehouse:
            raise ValueError("Warehouse not found")

        warehouse = warehouse[0]

        company_info = warehouse.get("company_id")
        company_id = int(company_info[0]) if isinstance(company_info, list) and company_info else None

        if company_id != ALLOWED_COMPANY_ID:
            raise ValueError("Cannot edit warehouse outside Company 2")

        update_vals: dict[str, Any] = {}

        # Check duplicate code
        if code and code != warehouse.get("code"):
            duplicate = self.execute_kw(
                "stock.warehouse",
                "search_read",
                [[
                    ["code", "=", code],
                    ["company_id", "=", ALLOWED_COMPANY_ID],
                ]],
                {"fields": ["id"], "limit": 1},
            )
            if duplicate:
                raise ValueError("Warehouse code already exists in Company 2")

            update_vals["code"] = code

        if name:
            update_vals["name"] = name

        if not update_vals:
            raise ValueError("No valid fields provided to update")

        self.execute_kw(
            "stock.warehouse",
            "write",
            [[int(warehouse_id)], update_vals],
        )

        return {
            "warehouse_id": warehouse_id,
            "updated_fields": update_vals,
            "status": "updated",
        }

    def admin_list_warehouse_stock(self, warehouse_id: int) -> list[dict[str, Any]]:
        """
        List all sellable products with stock for a specific warehouse.
        Restricted to Company 2.
        """

        ALLOWED_COMPANY_ID = 2

        # Validate warehouse
        warehouse = self.execute_kw(
            "stock.warehouse",
            "search_read",
            [[["id", "=", int(warehouse_id)]]],
            {"fields": ["id", "name", "company_id"], "limit": 1},
        )

        if not warehouse:
            raise ValueError("Warehouse not found")

        warehouse = warehouse[0]
        company_info = warehouse.get("company_id")
        company_id = int(company_info[0]) if isinstance(company_info, list) and company_info else None

        if company_id != ALLOWED_COMPANY_ID:
            raise ValueError("Access denied: Warehouse not in Company 2")

        warehouse_name = warehouse.get("name") or ""

        # Get sellable products
        products = self.execute_kw(
            "product.product",
            "search_read",
            [[["sale_ok", "=", True]]],
            {
                "fields": ["id", "name", "default_code", "list_price"],
                "limit": 500,
            },
        )

        stock_data: list[dict[str, Any]] = []

        for product in products:
            product_id = int(product["id"])
            qty_data = self.execute_kw(
                "product.product",
                "read",
                [[product_id]],
                {
                    "fields": ["qty_available"],
                    "context": {"warehouse": int(warehouse_id)},
                },
            )
            qty = float(qty_data[0].get("qty_available", 0.0)) if qty_data else 0.0

            stock_data.append(
                {
                    "warehouse_id": int(warehouse_id),
                    "warehouse_name": warehouse_name,
                    "product_id": product_id,
                    "product_name": product.get("name") or "",
                    "sku": product.get("default_code") or "",
                    "unit_price": float(product.get("list_price") or 0.0),
                    "qty_available": qty,
                }
            )

        return stock_data

    def admin_add_stock(self, product_id: int, warehouse_id: int, quantity: float) -> dict[str, Any]:
        """
        Add stock to a specific warehouse (Company 2 only).
        Uses proper inventory adjustment via stock.quant + action_apply_inventory.
        """

        ALLOWED_COMPANY_ID = 2

        if quantity <= 0:
            raise ValueError("Quantity must be greater than 0")

        # Verify warehouse belongs to Company 2
        warehouse = self.execute_kw(
            "stock.warehouse",
            "search_read",
            [[["id", "=", int(warehouse_id)]]],
            {"fields": ["company_id", "lot_stock_id"], "limit": 1},
        )

        if not warehouse:
            raise ValueError("Warehouse not found")

        warehouse = warehouse[0]

        company_info = warehouse.get("company_id")
        company_id = int(company_info[0]) if isinstance(company_info, list) and company_info else None

        if company_id != ALLOWED_COMPANY_ID:
            raise ValueError("Warehouse does not belong to Company 2")

        lot_stock_info = warehouse.get("lot_stock_id")
        if not isinstance(lot_stock_info, list) or not lot_stock_info:
            raise ValueError("Warehouse has no internal stock location")
        location_id = int(lot_stock_info[0])

        # Check existing quant
        existing_quant = self.execute_kw(
            "stock.quant",
            "search_read",
            [[
                ["product_id", "=", int(product_id)],
                ["location_id", "=", location_id],
            ]],
            {"fields": ["id", "quantity"], "limit": 1},
        )

        if existing_quant:
            quant_id = int(existing_quant[0]["id"])
            new_quantity = float(existing_quant[0]["quantity"]) + quantity

            self.execute_kw(
                "stock.quant",
                "write",
                [[quant_id], {"inventory_quantity": new_quantity}],
            )
        else:
            quant_id = int(self.execute_kw(
                "stock.quant",
                "create",
                [[
                    {
                        "product_id": int(product_id),
                        "location_id": location_id,
                        "inventory_quantity": quantity,
                    }
                ]],
            ))

        # Apply inventory adjustment (the ERP-safe way).
        # Odoo's action_apply_inventory returns None which its own XML-RPC
        # server cannot marshal (allow_none=False on server side).  The action
        # is executed BEFORE the serialisation error, so we catch the Fault.
        try:
            self.execute_kw(
                "stock.quant",
                "action_apply_inventory",
                [[quant_id]],
            )
        except xmlrpc.client.Fault as fault:
            if "cannot marshal None" in str(fault):
                pass  # action succeeded; Odoo just can't serialize the None return
            else:
                raise

        return {
            "warehouse_id": warehouse_id,
            "product_id": product_id,
            "quantity_added": quantity,
            "status": "stock_updated",
        }

    def admin_list_warehouses_with_stock(self) -> list[dict[str, Any]]:
        """
        List all warehouses with detailed stock info per product.
        Returns warehouse id, name, code, company_id, and a list of
        product stock entries for the admin panel.
        """
        ALLOWED_COMPANY_ID = 2

        warehouses = self.execute_kw(
            "stock.warehouse",
            "search_read",
            [[["company_id", "=", ALLOWED_COMPANY_ID]]],
            {
                "fields": ["id", "name", "code", "lot_stock_id", "company_id"],
                "limit": 200,
            },
        )

        # Collect all location IDs to batch-query quants
        location_map: dict[int, int] = {}  # location_id -> warehouse_id
        wh_map: dict[int, dict[str, Any]] = {}
        for w in warehouses:
            lot_stock = w.get("lot_stock_id")
            loc_id = int(lot_stock[0]) if isinstance(lot_stock, list) and lot_stock else None
            wh_id = int(w["id"])
            company_info = w.get("company_id")
            company_id = int(company_info[0]) if isinstance(company_info, list) and company_info else None
            wh_map[wh_id] = {
                "id": wh_id,
                "name": w.get("name") or "",
                "code": w.get("code") or "",
                "company_id": company_id,
                "lot_stock_id": loc_id,
                "products": [],
                "total_qty": 0.0,
            }
            if loc_id is not None:
                location_map[loc_id] = wh_id

        if not location_map:
            return list(wh_map.values())

        # Get all quants across these locations
        quants = self.execute_kw(
            "stock.quant",
            "search_read",
            [[
                ["location_id", "in", list(location_map.keys())],
                ["quantity", ">", 0],
            ]],
            {
                "fields": ["product_id", "location_id", "quantity"],
                "limit": 1000,
            },
        )

        # Get product details for all product IDs found
        product_ids: set[int] = set()
        for q in quants:
            prod_info = q.get("product_id")
            if isinstance(prod_info, list) and prod_info:
                product_ids.add(int(prod_info[0]))

        product_map: dict[int, str] = {}
        if product_ids:
            products = self.execute_kw(
                "product.product",
                "search_read",
                [[["id", "in", list(product_ids)]]],
                {"fields": ["id", "name"], "limit": len(product_ids)},
            )
            for p in products:
                product_map[int(p["id"])] = p.get("name") or ""

        # Assign quants to warehouses
        for q in quants:
            loc_info = q.get("location_id")
            loc_id = int(loc_info[0]) if isinstance(loc_info, list) and loc_info else None
            if loc_id is None or loc_id not in location_map:
                continue

            prod_info = q.get("product_id")
            prod_id = int(prod_info[0]) if isinstance(prod_info, list) and prod_info else None
            if prod_id is None:
                continue

            qty = float(q.get("quantity") or 0.0)
            wh_id = location_map[loc_id]
            wh_map[wh_id]["products"].append({
                "product_id": prod_id,
                "product_name": product_map.get(prod_id, ""),
                "qty_available": qty,
            })
            wh_map[wh_id]["total_qty"] += qty

        return list(wh_map.values())


if __name__ == "__main__":
    service = OdooService()

    print("🔐 Authenticating...")
    uid = service.authenticate()
    print("✅ UID:", uid)

    print("\n🏢 Company ID:")
    company_id = service.get_company_id()
    print(company_id)

    print("\n🏦 Bank Journal ID:")
    journal_id = service.get_bank_journal_id()
    print(journal_id)

    print("\n📦 Products:")
    products = service.get_all_products()
    for p in products:
        print(p)

    print("\n🏭 Warehouses:")
    warehouses = service.get_all_warehouses()
    for w in warehouses:
        print(w)
