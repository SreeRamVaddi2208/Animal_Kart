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
