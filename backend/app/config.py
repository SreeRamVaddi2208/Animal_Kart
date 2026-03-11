from __future__ import annotations

import os
from dataclasses import dataclass, field

from dotenv import load_dotenv

load_dotenv()


def _normalize_odoo_url(raw_url: str) -> str:
    value = (raw_url or "").strip().replace("/:", ":")
    return value.rstrip("/")


def _csv_to_list(value: str) -> list[str]:
    return [item.strip() for item in (value or "").split(",") if item.strip()]


def _csv_to_int_list(value: str) -> list[int]:
    result: list[int] = []
    for item in (value or "").split(","):
        item = item.strip()
        if not item:
            continue
        result.append(int(item))
    return result


@dataclass(frozen=True)
class Settings:
    odoo_url: str
    odoo_db: str
    odoo_username: str
    odoo_password: str
    company_ids: list[int]
    product_ids: list[int]
    warehouse_ids: list[int]
    animalkart_skus: list[str]
    animalkart_sku_prefix: str
    backend_host: str
    backend_port: int
    allowed_origins: list[str]
    database_url: str

    # JWT
    jwt_refresh_secret: str = ""
    jwt_refresh_expire_days: int = 7

    # SMTP
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@animalkart.com"

    # Odoo webhooks
    odoo_webhook_secret: str = ""


settings = Settings(
    odoo_url=_normalize_odoo_url(os.getenv("ODOO_URL", "http://13.232.87.253:8069")),
    odoo_db=os.getenv("ODOO_DB", "AnimalKart"),
    odoo_username=os.getenv("ODOO_USERNAME", "sreeramvaddi0816@gmail.com"),
    odoo_password=os.getenv("ODOO_PASSWORD", "da72e58fa9d6edbb75ae349c41d1065ccc24a7f8"),
    company_ids=_csv_to_int_list(os.getenv("ODOO_COMPANY_IDS", "2")),
    product_ids=_csv_to_int_list(os.getenv("ODOO_PRODUCT_IDS", "1")),
    warehouse_ids=_csv_to_int_list(os.getenv("ODOO_WAREHOUSE_IDS", "7,8,9,10")),
    animalkart_skus=_csv_to_list(os.getenv("ANIMALKART_SKUS", "AK-BUF-INV-001")),
    animalkart_sku_prefix=os.getenv("ANIMALKART_SKU_PREFIX", "AK-"),
    backend_host=os.getenv("BACKEND_HOST", "127.0.0.1"),
    backend_port=int(os.getenv("BACKEND_PORT", "8000")),
    allowed_origins=_csv_to_list(os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001")),
    database_url=os.getenv("DATABASE_URL", "sqlite:///./animalkart.db"),
    # JWT refresh
    jwt_refresh_secret=os.getenv("JWT_REFRESH_SECRET_KEY", ""),
    jwt_refresh_expire_days=int(os.getenv("JWT_REFRESH_EXPIRE_DAYS", "7")),
    # SMTP
    smtp_host=os.getenv("SMTP_HOST", "smtp.gmail.com"),
    smtp_port=int(os.getenv("SMTP_PORT", "587")),
    smtp_user=os.getenv("SMTP_USER", ""),
    smtp_password=os.getenv("SMTP_PASSWORD", ""),
    smtp_from=os.getenv("SMTP_FROM", "noreply@animalkart.com"),
    # Odoo webhook
    odoo_webhook_secret=os.getenv("ODOO_WEBHOOK_SECRET", ""),
)


def validate_required_env() -> list[str]:
    missing: list[str] = []
    if not settings.odoo_url:
        missing.append("ODOO_URL")
    if not settings.odoo_db:
        missing.append("ODOO_DB")
    if not settings.odoo_username:
        missing.append("ODOO_USERNAME")
    if not settings.odoo_password:
        missing.append("ODOO_PASSWORD")
    return missing
