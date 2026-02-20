from __future__ import annotations

from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .odoo_service import OdooService
from .schemas import (
    AdminOrdersResponse,
    AdminStockResponse,
    ApiOrderCreateRequest,
    ApiOrderCreateResponse,
    ApiOrdersResponse,
    ApiProductsResponse,
    AuthResponse,
    CheckoutRequest,
    CheckoutResponse,
    HealthResponse,
    InvoicesResponse,
    InvestorProfileResponse,
    LoginRequest,
    OrdersResponse,
    ProductsResponse,
    ReferralsResponse,
    RegisterRequest,
    RewardsResponse,
    TransferCreateRequest,
    TransferCreateResponse,
    TransfersResponse,
    WalletResponse,
    WarehousesResponse,
    WarehouseStocksResponse,
)

app = FastAPI(title="AnimalKart Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="animalkart-backend")


@app.post("/auth/register", response_model=AuthResponse)
def register(payload: RegisterRequest) -> AuthResponse:
    try:
        service = OdooService()
        partner_id, created = service.register_partner(payload.model_dump())
        return AuthResponse(
            success=True,
            message="Registered in Odoo" if created else "User already exists in Odoo",
            token=f"ak_partner_{partner_id}",
            partner_id=partner_id,
            full_name=payload.full_name,
            email=payload.email,
            role=payload.role,
            phone=payload.phone,
            whatsapp_number=payload.whatsapp_number,
            address=payload.address,
            pan_card=payload.pan_card,
            aadhaar_number=payload.aadhaar_number,
            bank_name=payload.bank_name,
            account_number=payload.account_number,
            ifsc_code=payload.ifsc_code,
            account_holder_name=payload.account_holder_name,
            referral_code=f"AK{partner_id}",
            kyc_status="pending",
            registration_date=datetime.now(timezone.utc).isoformat(),
            units_owned=0.0,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/auth/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    try:
        service = OdooService()
        partner = service.find_partner_by_email(payload.email)
        if not partner:
            raise HTTPException(status_code=404, detail="User not found in Odoo. Please register.")
        partner_id = int(partner["id"])
        profile = service.extract_profile_from_partner(partner)
        return AuthResponse(
            success=True,
            message="Login synced with Odoo partner",
            token=f"ak_partner_{partner_id}",
            partner_id=partner_id,
            full_name=str(partner.get("name") or ""),
            email=payload.email,
            role=service.extract_role_from_partner(partner),
            phone=str(partner.get("phone") or profile.get("Phone") or ""),
            whatsapp_number=str(partner.get("mobile") or profile.get("WhatsApp") or ""),
            address=str(partner.get("street") or profile.get("Address") or ""),
            pan_card=profile.get("PAN") or "",
            aadhaar_number=profile.get("Aadhaar") or "",
            bank_name=profile.get("BankName") or "",
            account_number=profile.get("AccountNumber") or "",
            ifsc_code=profile.get("IFSC") or "",
            account_holder_name=profile.get("AccountHolder") or "",
            referral_code=f"AK{partner_id}",
            kyc_status="pending",
            registration_date=str(partner.get("create_date") or datetime.now(timezone.utc).isoformat()),
            units_owned=0.0,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/products", response_model=ProductsResponse)
def products() -> ProductsResponse:
    try:
        items = OdooService().list_animalkart_products()
        return ProductsResponse(success=True, count=len(items), items=items)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/warehouses/stock", response_model=WarehouseStocksResponse)
def warehouse_stock() -> WarehouseStocksResponse:
    try:
        items = OdooService().list_warehouse_stock()
        return WarehouseStocksResponse(success=True, count=len(items), items=items)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/checkout", response_model=CheckoutResponse)
def checkout(payload: CheckoutRequest) -> CheckoutResponse:
    try:
        result = OdooService().create_sale_order_and_reduce_stock(
            customer_email=payload.customer_email,
            payment_method=payload.payment_method,
            lines=[line.model_dump() for line in payload.lines],
        )
        return CheckoutResponse(
            success=True,
            sale_order_id=result["sale_order_id"],
            sale_order_name=result["sale_order_name"],
            total_amount=result["total_amount"],
            invoice_id=result.get("invoice_id"),
            invoice_number=result.get("invoice_number"),
            message="Order created in Odoo and inventory updated",
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/orders", response_model=OrdersResponse)
def orders(email: str = Query(..., description="Investor email")) -> OrdersResponse:
    try:
        items = OdooService().list_partner_orders(email)
        return OrdersResponse(success=True, count=len(items), items=items)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/invoices", response_model=InvoicesResponse)
def invoices(email: str = Query(..., description="Investor email")) -> InvoicesResponse:
    try:
        items = OdooService().list_partner_invoices(email)
        return InvoicesResponse(success=True, count=len(items), items=items)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/wallet", response_model=WalletResponse)
def wallet(email: str = Query(..., description="Partner email")) -> WalletResponse:
    try:
        data = OdooService().list_partner_wallet(email)
        return WalletResponse(success=True, **data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/referrals", response_model=ReferralsResponse)
def referrals(email: str = Query(..., description="Partner email")) -> ReferralsResponse:
    try:
        data = OdooService().list_partner_referrals(email)
        return ReferralsResponse(
            success=True,
            referral_code=data["referral_code"],
            total_referrals=len(data["items"]),
            direct_referrals=data["direct_referrals"],
            indirect_referrals=data["indirect_referrals"],
            items=data["items"],
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/rewards", response_model=RewardsResponse)
def rewards(email: str = Query(..., description="Partner email")) -> RewardsResponse:
    try:
        data = OdooService().list_partner_rewards(email)
        return RewardsResponse(success=True, **data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/transfers", response_model=TransfersResponse)
def transfers(email: str = Query(..., description="Agent email")) -> TransfersResponse:
    try:
        data = OdooService().list_partner_transfers(email)
        return TransfersResponse(success=True, **data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/transfers", response_model=TransferCreateResponse)
def create_transfer(payload: TransferCreateRequest) -> TransferCreateResponse:
    try:
        item = OdooService().create_transfer_request(payload.model_dump())
        return TransferCreateResponse(success=True, item=item, message="Transfer request submitted")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/products", response_model=ApiProductsResponse)
def api_products() -> ApiProductsResponse:
    try:
        items = OdooService().list_products_for_api()
        return ApiProductsResponse(success=True, count=len(items), items=items)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/warehouses", response_model=WarehousesResponse)
def api_warehouses() -> WarehousesResponse:
    try:
        items = OdooService().list_warehouses()
        return WarehousesResponse(success=True, count=len(items), items=items)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/investor/{investor_id}", response_model=InvestorProfileResponse)
def api_investor_profile(investor_id: int) -> InvestorProfileResponse:
    try:
        data = OdooService().get_investor_profile(investor_id)
        return InvestorProfileResponse(success=True, **data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/orders", response_model=ApiOrderCreateResponse)
def api_create_order(payload: ApiOrderCreateRequest) -> ApiOrderCreateResponse:
    try:
        data = OdooService().create_order_by_customer_id(
            customer_id=payload.customer_id,
            warehouse_id=payload.warehouse_id,
            items=[item.model_dump() for item in payload.items],
            payment_method=payload.payment_method,
        )
        return ApiOrderCreateResponse(success=True, **data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/orders", response_model=ApiOrdersResponse)
def api_order_history(customer_id: int = Query(..., description="Customer/Investor partner id")) -> ApiOrdersResponse:
    try:
        rows = OdooService().list_orders_by_customer_id(customer_id)
        items = [
            {
                "order_id": int(row["order_id"]),
                "order_number": row.get("order_reference") or f"SO{row['order_id']}",
                "total_amount": float(row.get("total_amount") or 0.0),
                "status": row.get("status") or "draft",
            }
            for row in rows
        ]
        return ApiOrdersResponse(success=True, count=len(items), items=items)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/invoices", response_model=InvoicesResponse)
def api_invoices(
    customer_id: int | None = Query(default=None, description="Customer/Investor partner id"),
    email: str | None = Query(default=None, description="Investor email"),
) -> InvoicesResponse:
    try:
        service = OdooService()
        if customer_id is not None:
            items = service.list_partner_invoices_by_partner_id(customer_id)
            if not items and email:
                items = service.list_partner_invoices(email)
        elif email:
            items = service.list_partner_invoices(email)
        else:
            raise HTTPException(status_code=422, detail="Either customer_id or email is required")
        return InvoicesResponse(success=True, count=len(items), items=items)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/wallet", response_model=WalletResponse)
def api_wallet(email: str = Query(..., description="Partner email")) -> WalletResponse:
    try:
        data = OdooService().list_partner_wallet(email)
        return WalletResponse(success=True, **data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/referrals", response_model=ReferralsResponse)
def api_referrals(email: str = Query(..., description="Partner email")) -> ReferralsResponse:
    try:
        data = OdooService().list_partner_referrals(email)
        return ReferralsResponse(
            success=True,
            referral_code=data["referral_code"],
            total_referrals=len(data["items"]),
            direct_referrals=data["direct_referrals"],
            indirect_referrals=data["indirect_referrals"],
            items=data["items"],
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/rewards", response_model=RewardsResponse)
def api_rewards(email: str = Query(..., description="Partner email")) -> RewardsResponse:
    try:
        data = OdooService().list_partner_rewards(email)
        return RewardsResponse(success=True, **data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/transfers", response_model=TransfersResponse)
def api_transfers(email: str = Query(..., description="Agent email")) -> TransfersResponse:
    try:
        data = OdooService().list_partner_transfers(email)
        return TransfersResponse(success=True, **data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/transfers", response_model=TransferCreateResponse)
def api_create_transfer(payload: TransferCreateRequest) -> TransferCreateResponse:
    try:
        item = OdooService().create_transfer_request(payload.model_dump())
        return TransferCreateResponse(success=True, item=item, message="Transfer request submitted")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/admin/orders", response_model=AdminOrdersResponse)
def api_admin_orders() -> AdminOrdersResponse:
    try:
        items = OdooService().list_all_orders()
        return AdminOrdersResponse(success=True, count=len(items), items=items)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/admin/stock", response_model=AdminStockResponse)
def api_admin_stock() -> AdminStockResponse:
    try:
        items = OdooService().admin_stock_report()
        return AdminStockResponse(success=True, count=len(items), items=items)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/stock", response_model=AdminStockResponse)
def api_stock_alias() -> AdminStockResponse:
    return api_admin_stock()
