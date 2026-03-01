from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, Integer, String, UniqueConstraint

from .db import Base


class OrderStatusEnum(str):
    PENDING = "pending"
    APPROVED = "approved"
    DELIVERED = "delivered"
    INVOICED = "invoiced"
    PAID = "paid"


class KycStatusEnum(str):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class OrderStatus(Base):
    __tablename__ = "orders"
    __table_args__ = (UniqueConstraint("sale_order_id", name="uq_orders_sale_order_id"),)

    id = Column(Integer, primary_key=True, index=True)
    sale_order_id = Column(Integer, nullable=False)
    status = Column(
        Enum(
            OrderStatusEnum.PENDING,
            OrderStatusEnum.APPROVED,
            OrderStatusEnum.DELIVERED,
            OrderStatusEnum.INVOICED,
            OrderStatusEnum.PAID,
            name="order_status_enum",
        ),
        nullable=False,
        default=OrderStatusEnum.PENDING,
    )
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class UserKyc(Base):
    __tablename__ = "user_kyc"
    __table_args__ = (UniqueConstraint("partner_id", name="uq_user_kyc_partner_id"),)

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(Integer, nullable=False)
    email = Column(String(255), nullable=False)
    kyc_status = Column(
        Enum(
            KycStatusEnum.PENDING,
            KycStatusEnum.APPROVED,
            KycStatusEnum.REJECTED,
            name="kyc_status_enum",
        ),
        nullable=False,
        default=KycStatusEnum.PENDING,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

