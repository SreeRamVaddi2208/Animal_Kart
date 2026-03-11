from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Query, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .auth import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
    get_current_user,
    require_admin,
    require_agent,
    require_investor,
)
from .audit import log_action
from .config import settings
from .db import init_db, get_db
from .email_service import send_kyc_approved, send_kyc_rejected, send_payment_confirmed
from .models import AuditLog, OrderStatus, OrderStatusEnum, UserKyc, KycStatusEnum
from .odoo_service import OdooService
from .schemas import (
    AdminActionResponse,
    AdminAddStockRequest,
    AdminAddStockResponse,
    AdminCreateWarehouseRequest,
    AdminCreateWarehouseResponse,
    AdminDashboardSummary,
    AdminEditWarehouseResponse,
    AdminInvoiceActionResponse,
    AdminInvoiceItem,
    AdminInvoicePdfResponse,
    AdminInvoicesResponse,
    AdminOrderItem,
    AdminOrdersResponse,
    AdminStockResponse,
    AdminUserItem,
    AdminUsersResponse,
    AdminWarehouseDetailItem,
    AdminWarehouseDetailResponse,
    AdminWarehouseItem,
    AdminWarehouseSalesResponse,
    AdminWarehouseStockItem,
    AdminWarehouseStockResponse,
    AdminWarehousesResponse,
    ApiOrderCreateRequest,
    ApiOrderCreateResponse,
    ApiOrdersResponse,
    ApiProductsResponse,
    AuditLogItem,
    AuditLogResponse,
    AuthResponse,
    CheckoutRequest,
    CheckoutResponse,
    HealthResponse,
    HoldingsResponse,
    InvoicesResponse,
    InvestorProfileResponse,
    KycUpdateRequest,
    KYCApprovalRequest,
    KYCApprovalResponse,
    KYCListResponse,
    KYCPartnerItem,
    LoginRequest,
    OdooWebhookPayload,
    OrdersResponse,
    ProductsResponse,
    ReferralsResponse,
    RefreshRequest,
    RefreshResponse,
    RegisterPaymentRequest,
    RegisterRequest,
    RewardsResponse,
    StockAddRequest,
    StockReduceRequest,
    TransferCreateRequest,
    TransferCreateResponse,
    TransfersResponse,
    WalletResponse,
    WarehouseCreateRequest,
    WarehousesResponse,
    WarehouseStocksResponse,
    WarehouseUpdateRequest,
)

logger = logging.getLogger(__name__)

# ── Rate limiter ─────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="AnimalKart Backend", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

init_db()

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
@limiter.limit("5/minute")
def register(request: Request, payload: RegisterRequest) -> AuthResponse:
    try:
        service = OdooService()
        partner_id, created = service.register_partner(payload.model_dump())
        token_data = {
                "sub": payload.email,
                "role": payload.role,
                "partner_id": partner_id,
                "kyc_status": "pending",
            }
        token = create_access_token(token_data)
        refresh = create_refresh_token(token_data)
        return AuthResponse(
            success=True,
            message="Registered in Odoo" if created else "User already exists in Odoo",
            token=token,
            refresh_token=refresh,
            token_type="bearer",
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
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest) -> AuthResponse:
    try:
        service = OdooService()
        partner = service.find_partner_by_email(payload.email)
        if not partner:
            raise HTTPException(status_code=404, detail="User not found in Odoo. Please register.")
        partner_id = int(partner["id"])
        role = service.extract_role_from_partner(partner)
        kyc_status = service.extract_kyc_status(partner)
        profile = service.extract_profile_from_partner(partner)
        token_data = {
                "sub": payload.email,
                "role": role,
                "partner_id": partner_id,
                "kyc_status": kyc_status,
            }
        token = create_access_token(token_data)
        refresh = create_refresh_token(token_data)
        return AuthResponse(
            success=True,
            message="Login synced with Odoo partner",
            token=token,
            refresh_token=refresh,
            token_type="bearer",
            partner_id=partner_id,
            full_name=str(partner.get("name") or ""),
            email=payload.email,
            role=role,
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
            kyc_status=kyc_status,
            registration_date=str(partner.get("create_date") or datetime.now(timezone.utc).isoformat()),
            units_owned=0.0,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/admin/login", response_model=AuthResponse)
@limiter.limit("5/minute")
def admin_login(request: Request, payload: LoginRequest) -> AuthResponse:
    try:
        service = OdooService()
        partner = service.find_partner_by_email(payload.email)
        if not partner:
            raise HTTPException(status_code=404, detail="User not found in Odoo. Please register.")
        role = service.extract_role_from_partner(partner)
        if role != "admin":
            raise HTTPException(status_code=403, detail="Not an admin account")
        partner_id = int(partner["id"])
        kyc_status = service.extract_kyc_status(partner)
        profile = service.extract_profile_from_partner(partner)
        token_data = {
                "sub": payload.email,
                "role": "admin",
                "partner_id": partner_id,
                "kyc_status": kyc_status,
            }
        token = create_access_token(token_data)
        refresh = create_refresh_token(token_data)
        return AuthResponse(
            success=True,
            message="Admin login synced with Odoo partner",
            token=token,
            refresh_token=refresh,
            token_type="bearer",
            partner_id=partner_id,
            full_name=str(partner.get("name") or ""),
            email=payload.email,
            role="admin",
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
            kyc_status=kyc_status,
            registration_date=str(partner.get("create_date") or datetime.now(timezone.utc).isoformat()),
            units_owned=0.0,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/auth/refresh", response_model=RefreshResponse)
def refresh_tokens(payload: RefreshRequest) -> RefreshResponse:
    """Exchange a valid refresh token for a new access + refresh pair (rotation)."""
    old = verify_refresh_token(payload.refresh_token)
    service = OdooService()
    partner = service.find_partner_by_email(str(old.get("sub", "")))
    if not partner:
        raise HTTPException(status_code=401, detail="User no longer exists")
    role = service.extract_role_from_partner(partner)
    kyc_status = service.extract_kyc_status(partner)
    token_data = {
        "sub": old["sub"],
        "role": role,
        "partner_id": int(partner["id"]),
        "kyc_status": kyc_status,
    }
    return RefreshResponse(
        success=True,
        token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@app.post("/auth/demo-admin", response_model=AuthResponse)
def demo_admin_login() -> AuthResponse:
    """Issue a real JWT for the Demo Admin user (no Odoo lookup)."""
    token = create_access_token(
        {
            "sub": "admin.demo@animalkart.com",
            "role": "admin",
            "partner_id": 0,
            "kyc_status": "approved",
        }
    )
    return AuthResponse(
        success=True,
        message="Demo admin token issued",
        token=token,
        token_type="bearer",
        partner_id=0,
        full_name="Demo Admin",
        email="admin.demo@animalkart.com",
        role="admin",
        kyc_status="approved",
        registration_date=datetime.now(timezone.utc).isoformat(),
    )


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
def checkout(payload: CheckoutRequest, db=Depends(get_db), user: dict = Depends(get_current_user)) -> CheckoutResponse:
    try:
        result = OdooService().create_sale_order_draft(
            customer_email=payload.customer_email,
            payment_method=payload.payment_method,
            lines=[line.model_dump() for line in payload.lines],
        )
        # Track status locally as pending
        order_status = (
            db.query(OrderStatus)
            .filter(OrderStatus.sale_order_id == int(result["sale_order_id"]))
            .one_or_none()
        )
        if order_status is None:
            order_status = OrderStatus(
                sale_order_id=int(result["sale_order_id"]),
                status=OrderStatusEnum.PENDING,
            )
            db.add(order_status)
        db.commit()
        return CheckoutResponse(
            success=True,
            sale_order_id=result["sale_order_id"],
            sale_order_name=result["sale_order_name"],
            total_amount=result["total_amount"],
            invoice_id=None,
            invoice_number=None,
            message="Draft order created in Odoo. Pending admin approval.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/orders", response_model=OrdersResponse)
def orders(email: str = Query(..., description="Investor email"), user: dict = Depends(get_current_user)) -> OrdersResponse:
    try:
        items = OdooService().list_partner_orders(email)
        return OrdersResponse(success=True, count=len(items), items=items)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/invoices", response_model=InvoicesResponse)
def invoices(email: str = Query(..., description="Investor email"), user: dict = Depends(get_current_user)) -> InvoicesResponse:
    try:
        items = OdooService().list_partner_invoices(email)
        return InvoicesResponse(success=True, count=len(items), items=items)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/wallet", response_model=WalletResponse)
def wallet(email: str = Query(..., description="Partner email"), user: dict = Depends(get_current_user)) -> WalletResponse:
    try:
        data = OdooService().list_partner_wallet(email)
        return WalletResponse(success=True, **data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/referrals", response_model=ReferralsResponse)
def referrals(email: str = Query(..., description="Partner email"), user: dict = Depends(get_current_user)) -> ReferralsResponse:
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
def rewards(email: str = Query(..., description="Partner email"), user: dict = Depends(get_current_user)) -> RewardsResponse:
    try:
        data = OdooService().list_partner_rewards(email)
        return RewardsResponse(success=True, **data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/transfers", response_model=TransfersResponse)
def transfers(email: str = Query(..., description="Agent email"), user: dict = Depends(require_agent)) -> TransfersResponse:
    try:
        data = OdooService().list_partner_transfers(email)
        return TransfersResponse(success=True, **data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/transfers", response_model=TransferCreateResponse)
def create_transfer(payload: TransferCreateRequest, user: dict = Depends(require_agent)) -> TransferCreateResponse:
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
def api_create_order(payload: ApiOrderCreateRequest, db=Depends(get_db), user: dict = Depends(get_current_user)) -> ApiOrderCreateResponse:
    try:
        service = OdooService()
        partner = service.find_partner_by_id(payload.customer_id)
        if not partner:
            raise HTTPException(status_code=404, detail="Customer not found")

        # KYC Guard — only approved users can place orders
        kyc_status = service.extract_kyc_status(partner)
        if kyc_status != "approved":
            raise HTTPException(
                status_code=403,
                detail=f"KYC not approved (status: {kyc_status}). Cannot place order.",
            )

        email = str(partner.get("email") or "").strip()
        if not email:
            raise HTTPException(status_code=400, detail="Customer email is missing in Odoo; cannot create order")

        lines = [
            {
                "warehouse_id": int(payload.warehouse_id),
                "product_id": int(item.product_id),
                "quantity": float(item.quantity),
            }
            for item in payload.items
        ]
        result = service.create_sale_order_draft(
            customer_email=email,
            payment_method=payload.payment_method,
            lines=lines,
        )
        order_status = (
            db.query(OrderStatus)
            .filter(OrderStatus.sale_order_id == int(result["sale_order_id"]))
            .one_or_none()
        )
        if order_status is None:
            order_status = OrderStatus(
                sale_order_id=int(result["sale_order_id"]),
                status=OrderStatusEnum.PENDING,
            )
            db.add(order_status)
        db.commit()
        return ApiOrderCreateResponse(
            success=True,
            order_id=int(result["sale_order_id"]),
            order_number=result["sale_order_name"],
            invoice_id=None,
            invoice_number=None,
            status="draft",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/orders/create", response_model=ApiOrderCreateResponse)
def api_create_order_simple(payload: ApiOrderCreateRequest, db=Depends(get_db)) -> ApiOrderCreateResponse:
    # Alias for api_create_order to match investor API naming
    return api_create_order(payload, db)


@app.get("/api/orders", response_model=ApiOrdersResponse)
def api_order_history(customer_id: int = Query(..., description="Customer/Investor partner id"), user: dict = Depends(get_current_user)) -> ApiOrdersResponse:
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


@app.get("/api/orders/my", response_model=ApiOrdersResponse)
def api_orders_my(customer_id: int = Query(..., description="Customer/Investor partner id"), user: dict = Depends(get_current_user)) -> ApiOrdersResponse:
    # Convenience alias for api_order_history
    return api_order_history(customer_id, user)


@app.get("/api/invoices", response_model=InvoicesResponse)
def api_invoices(
    customer_id: int | None = Query(default=None, description="Customer/Investor partner id"),
    email: str | None = Query(default=None, description="Investor email"),
    user: dict = Depends(get_current_user),
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
def api_wallet(email: str = Query(..., description="Partner email"), user: dict = Depends(get_current_user)) -> WalletResponse:
    try:
        data = OdooService().list_partner_wallet(email)
        return WalletResponse(success=True, **data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/referrals", response_model=ReferralsResponse)
def api_referrals(email: str = Query(..., description="Partner email"), user: dict = Depends(get_current_user)) -> ReferralsResponse:
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
def api_rewards(email: str = Query(..., description="Partner email"), user: dict = Depends(get_current_user)) -> RewardsResponse:
    try:
        data = OdooService().list_partner_rewards(email)
        return RewardsResponse(success=True, **data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/admin/invoices", response_model=AdminInvoicesResponse)
def admin_invoices(user: dict = Depends(require_admin)) -> AdminInvoicesResponse:
    try:
        items = OdooService().list_admin_invoices()
        return AdminInvoicesResponse(
            success=True,
            count=len(items),
            items=[AdminInvoiceItem(**item) for item in items],
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/admin/dashboard/summary", response_model=AdminDashboardSummary)
def admin_dashboard_summary(user: dict = Depends(require_admin)) -> AdminDashboardSummary:
    try:
        data = OdooService().admin_dashboard_summary()
        return AdminDashboardSummary(**data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/holdings", response_model=HoldingsResponse)
def api_holdings(email: str = Query(..., description="Investor email"), user: dict = Depends(get_current_user)) -> HoldingsResponse:
    try:
        data = OdooService().list_investor_holdings(email)
        return HoldingsResponse(success=True, **data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/transfers", response_model=TransfersResponse)
def api_transfers(email: str = Query(..., description="Agent email"), user: dict = Depends(require_agent)) -> TransfersResponse:
    try:
        data = OdooService().list_partner_transfers(email)
        return TransfersResponse(success=True, **data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/transfers", response_model=TransferCreateResponse)
def api_create_transfer(payload: TransferCreateRequest, user: dict = Depends(require_agent)) -> TransferCreateResponse:
    try:
        item = OdooService().create_transfer_request(payload.model_dump())
        return TransferCreateResponse(success=True, item=item, message="Transfer request submitted")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/admin/orders", response_model=AdminOrdersResponse)
def api_admin_orders(user: dict = Depends(require_admin)) -> AdminOrdersResponse:
    try:
        items = OdooService().list_all_orders()
        return AdminOrdersResponse(success=True, count=len(items), items=items)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/admin/stock", response_model=AdminStockResponse)
def api_admin_stock(user: dict = Depends(require_admin)) -> AdminStockResponse:
    try:
        items = OdooService().admin_stock_report()
        return AdminStockResponse(success=True, count=len(items), items=items)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/stock", response_model=AdminStockResponse)
def api_stock_alias(user: dict = Depends(require_admin)) -> AdminStockResponse:
    return api_admin_stock(user)


@app.get("/admin/orders", response_model=AdminOrdersResponse)
def admin_orders(user: dict = Depends(require_admin)) -> AdminOrdersResponse:
    return api_admin_orders(user)


@app.get("/admin/orders/{order_id}", response_model=AdminOrderItem)
def admin_order_detail(order_id: int, user: dict = Depends(require_admin)) -> AdminOrderItem:
    try:
        data = OdooService().get_order(order_id)
        return AdminOrderItem(**data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/admin/orders/{order_id}/approve", response_model=AdminActionResponse)
@limiter.limit("10/minute")
def admin_approve_order(request: Request, order_id: int, db=Depends(get_db), user: dict = Depends(require_admin)) -> AdminActionResponse:
    try:
        OdooService().confirm_sale_order(order_id)
        order_status = (
            db.query(OrderStatus)
            .filter(OrderStatus.sale_order_id == int(order_id))
            .one_or_none()
        )
        if order_status is None:
            order_status = OrderStatus(sale_order_id=int(order_id), status=OrderStatusEnum.APPROVED)
            db.add(order_status)
        else:
            order_status.status = OrderStatusEnum.APPROVED
        db.commit()
        log_action(db, admin_email=user.get("sub", ""), action="approve_order", target_type="order", target_id=order_id)
        return AdminActionResponse(success=True, message="Sale order confirmed in Odoo")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/admin/orders/{order_id}/approve", response_model=AdminInvoiceActionResponse)
def api_admin_approve_order(order_id: int, db=Depends(get_db), user: dict = Depends(require_admin)) -> AdminInvoiceActionResponse:
    try:
        data = OdooService().admin_approve_order(order_id)
        order_status = (
            db.query(OrderStatus)
            .filter(OrderStatus.sale_order_id == int(order_id))
            .one_or_none()
        )
        if order_status is None:
            order_status = OrderStatus(
                sale_order_id=int(order_id),
                status=OrderStatusEnum.INVOICED,
            )
            db.add(order_status)
        else:
            order_status.status = OrderStatusEnum.INVOICED
        db.commit()
        return AdminInvoiceActionResponse(
            success=True,
            invoice_id=data["invoice_id"],
            invoice_number=data["invoice_number"],
            message="Order confirmed, delivered, invoiced and posted in Odoo",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/admin/orders/{order_id}/validate-delivery", response_model=AdminActionResponse)
def admin_validate_delivery(order_id: int, db=Depends(get_db), user: dict = Depends(require_admin)) -> AdminActionResponse:
    try:
        OdooService().validate_delivery(order_id)
        order_status = (
            db.query(OrderStatus)
            .filter(OrderStatus.sale_order_id == int(order_id))
            .one_or_none()
        )
        if order_status is None:
            order_status = OrderStatus(sale_order_id=int(order_id), status=OrderStatusEnum.DELIVERED)
            db.add(order_status)
        else:
            order_status.status = OrderStatusEnum.DELIVERED
        db.commit()
        return AdminActionResponse(success=True, message="Delivery validated in Odoo")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/admin/orders/{order_id}/generate-invoice", response_model=AdminInvoiceActionResponse)
def admin_generate_invoice(order_id: int, db=Depends(get_db), user: dict = Depends(require_admin)) -> AdminInvoiceActionResponse:
    try:
        data = OdooService().create_invoice_for_sale_order(order_id)
        order_status = (
            db.query(OrderStatus)
            .filter(OrderStatus.sale_order_id == int(order_id))
            .one_or_none()
        )
        if order_status is None:
            order_status = OrderStatus(sale_order_id=int(order_id), status=OrderStatusEnum.INVOICED)
            db.add(order_status)
        else:
            order_status.status = OrderStatusEnum.INVOICED
        db.commit()
        return AdminInvoiceActionResponse(
            success=True,
            invoice_id=data["invoice_id"],
            invoice_number=data["invoice_number"],
            message="Invoice created in Odoo",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/admin/invoices/{invoice_id}/post", response_model=AdminActionResponse)
def admin_post_invoice(invoice_id: int, user: dict = Depends(require_admin)) -> AdminActionResponse:
    try:
        OdooService().post_invoice(invoice_id)
        return AdminActionResponse(success=True, message="Invoice posted in Odoo")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/admin/invoices/{invoice_id}/register-payment", response_model=AdminActionResponse)
@limiter.limit("10/minute")
def admin_register_payment(
    request: Request,
    invoice_id: int,
    payload: RegisterPaymentRequest,
    db=Depends(get_db),
    user: dict = Depends(require_admin),
) -> AdminActionResponse:
    try:
        OdooService().register_invoice_payment(
            invoice_id=invoice_id,
            amount=payload.amount,
            journal_id=payload.journal_id,
            payment_method_id=payload.payment_method_id,
        )
        # mark as paid locally if we can find associated sale order
        order_status = (
            db.query(OrderStatus)
            .filter(OrderStatus.status == OrderStatusEnum.INVOICED)
            .first()
        )
        if order_status is not None:
            order_status.status = OrderStatusEnum.PAID
            db.commit()

        # Audit + email
        log_action(db, admin_email=user.get("sub", ""), action="register_payment", target_type="invoice", target_id=invoice_id, details={"amount": payload.amount})
        try:
            send_payment_confirmed(user.get("sub", ""), user.get("sub", ""), payload.amount)
        except Exception:
            logger.warning("Payment email failed", exc_info=True)

        return AdminActionResponse(success=True, message="Payment registered in Odoo")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/admin/invoices/{invoice_id}/pdf", response_model=AdminInvoicePdfResponse)
def admin_invoice_pdf(invoice_id: int, user: dict = Depends(require_admin)) -> AdminInvoicePdfResponse:
    # We return the Odoo report URL; the frontend/backend can proxy it as needed.
    url = f"{settings.odoo_url}/report/pdf/account.report_invoice/{int(invoice_id)}"
    return AdminInvoicePdfResponse(success=True, download_url=url)


@app.post("/api/admin/invoice/{invoice_id}/pay", response_model=AdminActionResponse)
def api_admin_invoice_pay(invoice_id: int, user: dict = Depends(require_admin)) -> AdminActionResponse:
    try:
        data = OdooService().admin_confirm_payment(invoice_id)
        return AdminActionResponse(
            success=True,
            message=f"Invoice payment status: {data['status']}",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.put("/admin/users/{partner_id}/verify", response_model=AdminActionResponse)
@limiter.limit("10/minute")
def admin_verify_user(request: Request, partner_id: int, payload: KycUpdateRequest, db=Depends(get_db), user: dict = Depends(require_admin)) -> AdminActionResponse:
    try:
        status_value = payload.status.lower()
        if status_value not in {KycStatusEnum.PENDING, KycStatusEnum.APPROVED, KycStatusEnum.REJECTED}:
            raise HTTPException(status_code=400, detail="Invalid KYC status")

        # update local DB
        record = (
            db.query(UserKyc)
            .filter(UserKyc.partner_id == int(partner_id))
            .one_or_none()
        )
        if record is None:
            record = UserKyc(
                partner_id=int(partner_id),
                email=str(payload.email),
                kyc_status=status_value,  # type: ignore[arg-type]
            )
            db.add(record)
        else:
            record.email = str(payload.email)
            record.kyc_status = status_value  # type: ignore[arg-type]
        db.commit()

        # best-effort update of res.partner comment in Odoo
        service = OdooService()
        partner = service.find_partner_by_id(partner_id)
        if partner:
            comment = str(partner.get("comment") or "")
            # simple marker "KYC=<status>"
            marker = "KYC="
            parts = [chunk.strip() for chunk in comment.split("|") if chunk.strip()]
            new_parts: list[str] = []
            replaced = False
            for chunk in parts:
                if chunk.startswith(marker):
                    new_parts.append(f"{marker}{status_value}")
                    replaced = True
                else:
                    new_parts.append(chunk)
            if not replaced:
                new_parts.append(f"{marker}{status_value}")
            new_comment = " | ".join(new_parts)
            service.execute_kw(
                "res.partner",
                "write",
                [[int(partner["id"])], {"comment": new_comment}],
            )

        # Audit + email
        log_action(db, admin_email=user.get("sub", ""), action=f"kyc_{status_value}", target_type="kyc", target_id=partner_id, details={"email": str(payload.email)})
        partner_name = str(partner.get("name", "")) if partner else str(payload.email)
        try:
            if status_value == KycStatusEnum.APPROVED:
                send_kyc_approved(str(payload.email), partner_name)
            elif status_value == KycStatusEnum.REJECTED:
                send_kyc_rejected(str(payload.email), partner_name)
        except Exception:
            logger.warning("KYC email failed", exc_info=True)

        return AdminActionResponse(success=True, message=f"KYC status updated to {status_value}")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/admin/users", response_model=AdminUsersResponse)
def admin_users(db=Depends(get_db), user: dict = Depends(require_admin)) -> AdminUsersResponse:
    try:
        service = OdooService()
        users = service.list_animalkart_users()
        results = []
        for u in users:
            kyc = (
                db.query(UserKyc)
                .filter(UserKyc.partner_id == int(u["partner_id"]))
                .one_or_none()
            )
            kyc_status = kyc.kyc_status if kyc else KycStatusEnum.PENDING
            results.append(
                {
                    "partner_id": u["partner_id"],
                    "name": u["name"],
                    "email": u["email"],
                    "role": u["role"],
                    "kyc_status": kyc_status,
                    "created_at": u["created_at"],
                }
            )
        return AdminUsersResponse(success=True, count=len(results), items=results)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/admin/users/{partner_id}", response_model=AdminUserItem)
def admin_user_detail(partner_id: int, db=Depends(get_db), user: dict = Depends(require_admin)) -> AdminUserItem:
    try:
        service = OdooService()
        partner = service.find_partner_by_id(partner_id)
        if not partner:
            raise HTTPException(status_code=404, detail="User not found")
        role = service.extract_role_from_partner(partner)
        kyc = (
            db.query(UserKyc)
            .filter(UserKyc.partner_id == int(partner_id))
            .one_or_none()
        )
        kyc_status = kyc.kyc_status if kyc else KycStatusEnum.PENDING
        return AdminUserItem(
            partner_id=int(partner["id"]),
            name=str(partner.get("name") or ""),
            email=str(partner.get("email") or ""),
            role=role,
            kyc_status=kyc_status,
            created_at=str(partner.get("create_date") or ""),
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/admin/warehouses", response_model=AdminWarehousesResponse)
def admin_warehouses(user: dict = Depends(require_admin)) -> AdminWarehousesResponse:
    try:
        items = OdooService().admin_list_warehouses()
        return AdminWarehousesResponse(
            success=True,
            count=len(items),
            items=[AdminWarehouseItem(**item) for item in items],
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/admin/warehouses", response_model=AdminCreateWarehouseResponse)
def admin_create_warehouse(payload: AdminCreateWarehouseRequest, user: dict = Depends(require_admin)) -> AdminCreateWarehouseResponse:
    """Create a new warehouse — hard-locked to Company 2 (AnimalKart Pvt Ltd)."""
    try:
        result = OdooService().admin_create_warehouse(
            name=payload.name,
            code=payload.code,
        )
        return AdminCreateWarehouseResponse(**result)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.put("/admin/warehouses/{warehouse_id}", response_model=AdminEditWarehouseResponse)
def admin_update_warehouse(warehouse_id: int, payload: WarehouseUpdateRequest, user: dict = Depends(require_admin)) -> AdminEditWarehouseResponse:
    """Edit warehouse name/code — Company 2 enforced, duplicate codes rejected."""
    try:
        result = OdooService().admin_edit_warehouse(
            warehouse_id=warehouse_id,
            name=payload.name,
            code=payload.code,
        )
        return AdminEditWarehouseResponse(**result)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.delete("/admin/warehouses/{warehouse_id}", response_model=AdminActionResponse)
def admin_archive_warehouse(warehouse_id: int, user: dict = Depends(require_admin)) -> AdminActionResponse:
    try:
        OdooService().clear_and_archive_warehouse(warehouse_id)
        return AdminActionResponse(success=True, message="Stock cleared and warehouse archived in Odoo")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/admin/stock", response_model=WarehouseStocksResponse)
def admin_stock(user: dict = Depends(require_admin)) -> WarehouseStocksResponse:
    try:
        items = OdooService().list_warehouse_stock()
        return WarehouseStocksResponse(success=True, count=len(items), items=items)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/admin/warehouse-sales", response_model=AdminWarehouseSalesResponse)
def admin_warehouse_sales(user: dict = Depends(require_admin)) -> AdminWarehouseSalesResponse:
    try:
        items = OdooService().list_warehouse_sales()
        return AdminWarehouseSalesResponse(success=True, count=len(items), items=items)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/admin/stock/add", response_model=AdminAddStockResponse)
def admin_stock_add(payload: StockAddRequest, user: dict = Depends(require_admin)) -> AdminAddStockResponse:
    try:
        result = OdooService().admin_add_stock(
            product_id=payload.product_id,
            warehouse_id=payload.warehouse_id,
            quantity=payload.quantity,
        )
        return AdminAddStockResponse(**result)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/admin/stock/reduce", response_model=AdminActionResponse)
def admin_stock_reduce(payload: StockReduceRequest, user: dict = Depends(require_admin)) -> AdminActionResponse:
    try:
        OdooService().reduce_stock(
            product_id=payload.product_id,
            warehouse_id=payload.warehouse_id,
            quantity=payload.quantity,
            adjustment_location_id=payload.adjustment_location_id,
        )
        return AdminActionResponse(success=True, message="Stock reduced via stock move")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/admin/warehouses", response_model=AdminCreateWarehouseResponse)
def api_admin_create_warehouse(payload: AdminCreateWarehouseRequest, user: dict = Depends(require_admin)) -> AdminCreateWarehouseResponse:
    """Create a new warehouse — hard-locked to Company 2 (AnimalKart Pvt Ltd)."""
    try:
        result = OdooService().admin_create_warehouse(
            name=payload.name,
            code=payload.code,
        )
        return AdminCreateWarehouseResponse(**result)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/api/admin/stock/add", response_model=AdminAddStockResponse)
def api_admin_add_stock(payload: AdminAddStockRequest, user: dict = Depends(require_admin)) -> AdminAddStockResponse:
    """Add stock to a warehouse — Company 2 enforced, uses proper inventory adjustment."""
    try:
        result = OdooService().admin_add_stock(
            product_id=payload.product_id,
            warehouse_id=payload.warehouse_id,
            quantity=payload.quantity,
        )
        return AdminAddStockResponse(**result)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/admin/warehouses/details", response_model=AdminWarehouseDetailResponse)
def api_admin_warehouses_details(user: dict = Depends(require_admin)) -> AdminWarehouseDetailResponse:
    """List all Company 2 warehouses with per-product stock details."""
    try:
        items = OdooService().admin_list_warehouses_with_stock()
        return AdminWarehouseDetailResponse(
            success=True,
            count=len(items),
            items=[AdminWarehouseDetailItem(**item) for item in items],
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.put("/api/admin/warehouses/{warehouse_id}", response_model=AdminEditWarehouseResponse)
def api_admin_update_warehouse(warehouse_id: int, payload: WarehouseUpdateRequest, user: dict = Depends(require_admin)) -> AdminEditWarehouseResponse:
    """Edit warehouse name/code — Company 2 enforced, duplicate codes rejected."""
    try:
        result = OdooService().admin_edit_warehouse(
            warehouse_id=warehouse_id,
            name=payload.name,
            code=payload.code,
        )
        return AdminEditWarehouseResponse(**result)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.delete("/api/admin/warehouses/{warehouse_id}", response_model=AdminActionResponse)
def api_admin_archive_warehouse(warehouse_id: int, user: dict = Depends(require_admin)) -> AdminActionResponse:
    """Archive (deactivate) a warehouse."""
    try:
        OdooService().clear_and_archive_warehouse(warehouse_id)
        return AdminActionResponse(success=True, message="Stock cleared and warehouse archived in Odoo")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/admin/warehouses/{warehouse_id}/stock", response_model=AdminWarehouseStockResponse)
def api_admin_warehouse_stock(warehouse_id: int, user: dict = Depends(require_admin)) -> AdminWarehouseStockResponse:
    """List all sellable products with stock for a specific warehouse (Company 2 only)."""
    try:
        items = OdooService().admin_list_warehouse_stock(warehouse_id)
        return AdminWarehouseStockResponse(
            success=True,
            count=len(items),
            items=[AdminWarehouseStockItem(**item) for item in items],
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# ── KYC Admin Routes ─────────────────────────────────────────────────

@app.post("/api/admin/kyc/{partner_id}", response_model=KYCApprovalResponse)
def api_admin_kyc_update(partner_id: int, payload: KYCApprovalRequest, user: dict = Depends(require_admin)) -> KYCApprovalResponse:
    """Approve or reject KYC for a partner."""
    try:
        result = OdooService().update_kyc_status(
            partner_id=partner_id,
            status=payload.status,
        )
        return KYCApprovalResponse(**result)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/admin/kyc/pending", response_model=KYCListResponse)
def api_admin_kyc_pending(user: dict = Depends(require_admin)) -> KYCListResponse:
    """List all partners with pending KYC."""
    try:
        items = OdooService().list_pending_kyc()
        return KYCListResponse(
            success=True,
            count=len(items),
            items=[KYCPartnerItem(**item) for item in items],
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/admin/kyc/all", response_model=KYCListResponse)
def api_admin_kyc_all(user: dict = Depends(require_admin)) -> KYCListResponse:
    """List all partners with any KYC status."""
    try:
        items = OdooService().list_all_kyc()
        return KYCListResponse(
            success=True,
            count=len(items),
            items=[KYCPartnerItem(**item) for item in items],
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# ── Audit Log ─────────────────────────────────────────────────────────

@app.get("/admin/audit-log", response_model=AuditLogResponse)
def admin_audit_log(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db=Depends(get_db),
    user: dict = Depends(require_admin),
) -> AuditLogResponse:
    """Paginated admin audit trail."""
    rows = (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    items = [
        AuditLogItem(
            id=r.id,
            admin_email=r.admin_email,
            action=r.action,
            target_type=r.target_type,
            target_id=r.target_id,
            details=json.loads(r.details_json) if r.details_json else None,
            timestamp=r.timestamp.isoformat() if r.timestamp else "",
        )
        for r in rows
    ]
    return AuditLogResponse(success=True, count=len(items), items=items)


# ── Odoo Webhook Receiver ─────────────────────────────────────────────

@app.post("/webhooks/odoo")
def odoo_webhook(
    payload: OdooWebhookPayload,
    x_webhook_secret: str | None = Header(default=None),
) -> dict:
    """Receive push events from Odoo automations."""
    expected = settings.odoo_webhook_secret
    if expected and x_webhook_secret != expected:
        raise HTTPException(status_code=403, detail="Invalid webhook secret")

    event = payload.event
    logger.info("Odoo webhook received: event=%s model=%s record_id=%s", event, payload.model, payload.record_id)

    # Process known events
    if event == "payment.confirmed":
        logger.info("Payment confirmed via webhook for record %s", payload.record_id)
    elif event == "stock.updated":
        logger.info("Stock updated via webhook for record %s", payload.record_id)
    elif event == "partner.updated":
        logger.info("Partner updated via webhook for record %s", payload.record_id)
    else:
        logger.warning("Unknown webhook event: %s", event)

    return {"success": True, "event": event, "message": "Webhook processed"}
