"""Audit log helper — records admin actions in the local database."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from .models import AuditLog


def log_action(
    db: Session,
    *,
    admin_email: str,
    action: str,
    target_type: str,
    target_id: str | int,
    details: dict[str, Any] | None = None,
) -> None:
    """Insert a timestamped audit log entry."""
    entry = AuditLog(
        admin_email=admin_email,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        details_json=json.dumps(details or {}),
        timestamp=datetime.now(timezone.utc),
    )
    db.add(entry)
    db.commit()
