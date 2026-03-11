from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class HealthResponse(BaseModel):
    status: str
    service: str


class LoginRequest(BaseModel):
    email: EmailStr


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2)
    email: EmailStr
    phone: str | None = None
    whatsapp_number: str | None = None
    address: str | None = None
    pan_card: str | None = None
    aadhaar_number: str | None = None
    bank_name: str | None = None
    account_number: str | None = None
    ifsc_code: str | None = None
    account_holder_name: str | None = None
    role: str = "investor"


class AuthResponse(BaseModel):
    success: bool
    message: str
    token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    partner_id: int
    full_name: str | None = None
    email: EmailStr | None = None
    role: str = "investor"
    phone: str | None = None
    whatsapp_number: str | None = None
    address: str | None = None
    pan_card: str | None = None
    aadhaar_number: str | None = None
    bank_name: str | None = None
    account_number: str | None = None
    ifsc_code: str | None = None
    account_holder_name: str | None = None
    referral_code: str | None = None
    kyc_status: str = "pending"
    registration_date: str | None = None
    units_owned: float = 0.0


class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    success: bool
    token: str
    refresh_token: str
    token_type: str = "bearer"


class ProductItem(BaseModel):
    id: int
    name: str
    default_code: str | None = None
    qty_available: float | int | None = None
    warehouse_id: int | None = None
    warehouse_name: str | None = None


class ProductsResponse(BaseModel):
    success: bool
    count: int
    items: list[ProductItem]


class WarehouseStock(BaseModel):
    warehouse_id: int
    warehouse_name: str
    sku: str
    product_id: int
    product_name: str
    unit_price: float
    qty_available: float


class WarehouseStocksResponse(BaseModel):
    success: bool
    count: int
    items: list[WarehouseStock]


class CartLine(BaseModel):
    sku: str | None = None
    product_id: int | None = None
    warehouse_id: int
    quantity: float = Field(gt=0)


class CheckoutRequest(BaseModel):
    customer_email: EmailStr
    payment_method: str
    lines: list[CartLine]


class CheckoutResponse(BaseModel):
    success: bool
    sale_order_id: int
    sale_order_name: str
    total_amount: float
    invoice_id: int | None = None
    invoice_number: str | None = None
    message: str


class OrderItem(BaseModel):
    order_id: int
    order_reference: str
    total_amount: float
    payment_method: str
    status: str
    warehouse_id: int | None = None
    warehouse_name: str | None = None
    created_at: str


class OrdersResponse(BaseModel):
    success: bool
    count: int
    items: list[OrderItem]


class InvoiceItem(BaseModel):
    invoice_id: int
    invoice_number: str
    invoice_date: str
    amount: float
    order_reference: str | None = None
    payment_state: str | None = None


class InvoicesResponse(BaseModel):
    success: bool
    count: int
    items: list[InvoiceItem]


class WalletTransactionItem(BaseModel):
    transaction_id: str
    type: str
    amount: float
    description: str
    date: str


class WalletResponse(BaseModel):
    success: bool
    balance: float
    total_earned: float
    total_spent: float
    transactions: list[WalletTransactionItem]


class ReferralItem(BaseModel):
    referral_id: str
    name: str
    level: int
    units_purchased: float
    commission_earned: float
    date: str
    email: str | None = None


class ReferralsResponse(BaseModel):
    success: bool
    referral_code: str
    total_referrals: int
    direct_referrals: int
    indirect_referrals: int
    items: list[ReferralItem]


class PurchaseRewardItem(BaseModel):
    id: str
    type: str
    label: str
    threshold: int
    claimed: bool
    eligible: bool


class ReferralRewardCheckpoint(BaseModel):
    reached: bool
    claimed: bool
    reward_chosen: str | None = None


class ReferralRewardItem(BaseModel):
    investor_name: str
    investor_id: str
    total_units: float
    checkpoints: dict[str, ReferralRewardCheckpoint]


class RewardsResponse(BaseModel):
    success: bool
    total_units: float
    purchase_rewards: list[PurchaseRewardItem]
    referral_rewards: list[ReferralRewardItem]


class OwnedUnitItem(BaseModel):
    unit_id: str
    warehouse_name: str | None = None
    purchased_date: str


class TransferItem(BaseModel):
    transfer_id: str
    unit_id: str
    investor_email: str | None = None
    investor_name: str | None = None
    transfer_date: str
    transfer_status: str
    notes: str | None = None


class TransfersResponse(BaseModel):
    success: bool
    owned_units: list[OwnedUnitItem]
    transfers: list[TransferItem]


class TransferCreateRequest(BaseModel):
    agent_email: EmailStr
    investor_email: EmailStr
    unit_id: str
    notes: str | None = None


class TransferCreateResponse(BaseModel):
    success: bool
    item: TransferItem
    message: str


class ApiProductItem(BaseModel):
    id: int
    name: str
    sku: str
    price: float
    stock_available: float
    warehouse: str
    warehouse_id: int


class ApiProductsResponse(BaseModel):
    success: bool
    count: int
    items: list[ApiProductItem]


class WarehouseItem(BaseModel):
    id: int
    name: str


class WarehousesResponse(BaseModel):
    success: bool
    count: int
    items: list[WarehouseItem]


class InvestorProfileResponse(BaseModel):
    success: bool
    id: int
    name: str
    wallet_balance: float


class ApiOrderLine(BaseModel):
    product_id: int
    quantity: float = Field(gt=0)


class ApiOrderCreateRequest(BaseModel):
    customer_id: int
    warehouse_id: int
    items: list[ApiOrderLine]
    payment_method: str


class ApiOrderCreateResponse(BaseModel):
    success: bool
    order_id: int
    order_number: str
    invoice_id: int | None = None
    invoice_number: str | None = None
    status: str


class ApiOrderHistoryItem(BaseModel):
    order_id: int
    order_number: str
    total_amount: float
    status: str


class ApiOrdersResponse(BaseModel):
    success: bool
    count: int
    items: list[ApiOrderHistoryItem]


class AdminOrderItem(BaseModel):
    order_id: int
    order_number: str
    total_amount: float
    status: str
    customer_name: str
    created_at: str


class AdminOrdersResponse(BaseModel):
    success: bool
    count: int
    items: list[AdminOrderItem]


class AdminStockItem(BaseModel):
    product: str
    on_hand: float
    forecasted: float


class AdminStockResponse(BaseModel):
    success: bool
    count: int
    items: list[AdminStockItem]


class AdminInvoiceItem(BaseModel):
    invoice_id: int
    invoice_number: str
    invoice_date: str
    amount: float
    customer_name: str
    customer_email: EmailStr | None = None
    payment_state: str | None = None
    order_reference: str | None = None


class AdminInvoicesResponse(BaseModel):
    success: bool
    count: int
    items: list[AdminInvoiceItem]


class AdminUserItem(BaseModel):
    partner_id: int
    name: str
    email: EmailStr
    role: str
    kyc_status: str
    created_at: str | None = None


class AdminUsersResponse(BaseModel):
    success: bool
    count: int
    items: list[AdminUserItem]


class AdminWarehouseItem(BaseModel):
    id: int
    name: str
    code: str | None = None
    lot_stock_id: int | None = None


class AdminWarehousesResponse(BaseModel):
    success: bool
    count: int
    items: list[AdminWarehouseItem]


class AdminWarehouseSalesItem(BaseModel):
    warehouse_id: int
    warehouse_name: str | None = None
    units_sold: float


class AdminWarehouseSalesResponse(BaseModel):
    success: bool
    count: int
    items: list[AdminWarehouseSalesItem]


class HoldingItem(BaseModel):
    warehouse_id: int | None = None
    warehouse_name: str | None = None
    units: float


class HoldingsResponse(BaseModel):
    success: bool
    total_units: float
    per_warehouse: list[HoldingItem]


class AdminDashboardSummary(BaseModel):
    units_sold: float
    total_revenue: float
    total_capacity: float


class AdminActionResponse(BaseModel):
    success: bool
    message: str


class AdminInvoiceActionResponse(BaseModel):
    success: bool
    invoice_id: int | None = None
    invoice_number: str | None = None
    message: str


class AdminInvoicePdfResponse(BaseModel):
    success: bool
    download_url: str


class RegisterPaymentRequest(BaseModel):
    amount: float
    journal_id: int
    payment_method_id: int | None = None


class KycUpdateRequest(BaseModel):
    email: EmailStr
    status: str


class WarehouseCreateRequest(BaseModel):
    name: str
    code: str
    company_id: int


class AdminCreateWarehouseRequest(BaseModel):
    """Request body for POST /api/admin/warehouses — company is hard-locked to 2."""
    name: str
    code: str


class AdminCreateWarehouseResponse(BaseModel):
    warehouse_id: int
    name: str
    code: str
    company_id: int
    partner_id: int | None = None
    status: str


class WarehouseUpdateRequest(BaseModel):
    name: str | None = None
    code: str | None = None


class AdminEditWarehouseResponse(BaseModel):
    warehouse_id: int
    updated_fields: dict
    status: str


class AdminWarehouseStockItem(BaseModel):
    warehouse_id: int
    warehouse_name: str
    product_id: int
    product_name: str
    sku: str | None = None
    unit_price: float
    qty_available: float


class AdminWarehouseStockResponse(BaseModel):
    success: bool
    count: int
    items: list[AdminWarehouseStockItem]


class StockAddRequest(BaseModel):
    product_id: int
    warehouse_id: int
    quantity: float = Field(gt=0)


class StockReduceRequest(StockAddRequest):
    adjustment_location_id: int


class AdminAddStockRequest(BaseModel):
    """Request body for POST /api/admin/stock/add — Company 2 enforced by backend."""
    warehouse_id: int
    product_id: int
    quantity: float = Field(gt=0)


class AdminAddStockResponse(BaseModel):
    warehouse_id: int
    product_id: int
    quantity_added: float
    status: str


class WarehouseProductStock(BaseModel):
    product_id: int
    product_name: str
    qty_available: float


class AdminWarehouseDetailItem(BaseModel):
    id: int
    name: str
    code: str | None = None
    company_id: int | None = None
    lot_stock_id: int | None = None
    products: list[WarehouseProductStock] = []
    total_qty: float = 0.0


class AdminWarehouseDetailResponse(BaseModel):
    success: bool
    count: int
    items: list[AdminWarehouseDetailItem]


# ── KYC Schemas ──────────────────────────────────────────────────────

class KYCApprovalRequest(BaseModel):
    """Request body for POST /api/admin/kyc/{partner_id}"""
    status: str  # "approved" or "rejected"


class KYCApprovalResponse(BaseModel):
    partner_id: int
    name: str
    email: str
    kyc_status: str
    status: str


class KYCPartnerItem(BaseModel):
    partner_id: int
    name: str
    email: str
    kyc_status: str


class KYCListResponse(BaseModel):
    success: bool
    count: int
    items: list[KYCPartnerItem]


# ── Audit Log Schemas ────────────────────────────────────────────────

class AuditLogItem(BaseModel):
    id: int
    admin_email: str
    action: str
    target_type: str
    target_id: str
    details: dict | None = None
    timestamp: str


class AuditLogResponse(BaseModel):
    success: bool
    count: int
    items: list[AuditLogItem]


# ── Webhook Schemas ──────────────────────────────────────────────────

class OdooWebhookPayload(BaseModel):
    event: str  # e.g. "payment.confirmed", "stock.updated", "partner.updated"
    model: str | None = None
    record_id: int | None = None
    data: dict | None = None
