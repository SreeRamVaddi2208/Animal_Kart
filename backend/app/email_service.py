"""Email notification service for AnimalKart."""

from __future__ import annotations

import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from .config import settings

logger = logging.getLogger(__name__)


# ── Core sender ──────────────────────────────────────────────────────

def _send_email_sync(to: str, subject: str, html_body: str) -> None:
    """Blocking SMTP send — called inside a thread."""
    if not settings.smtp_user or not settings.smtp_password:
        logger.warning("SMTP credentials not configured — skipping email to %s", to)
        return

    msg = MIMEMultipart("alternative")
    msg["From"] = settings.smtp_from
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from, to, msg.as_string())
        logger.info("Email sent to %s: %s", to, subject)
    except Exception:
        logger.exception("Failed to send email to %s", to)


def send_email_background(to: str, subject: str, html_body: str) -> None:
    """Fire-and-forget email — runs in a background thread so the API doesn't block."""
    try:
        loop = asyncio.get_running_loop()
        loop.run_in_executor(None, _send_email_sync, to, subject, html_body)
    except RuntimeError:
        # No event loop — just send synchronously (dev / test)
        _send_email_sync(to, subject, html_body)


# ── Template helpers ─────────────────────────────────────────────────

_STYLE = """
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 520px; margin: 0 auto; padding: 32px 24px;
            background: #f9fafb; border-radius: 16px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; width: 48px; height: 48px; border-radius: 12px;
                background: linear-gradient(135deg, #34d399, #059669); line-height: 48px;
                color: white; font-weight: 800; font-size: 16px;">AK</div>
  </div>
  <div style="background: white; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
"""
_END = """
  </div>
  <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 16px;">
    AnimalKart · Automated notification — please do not reply
  </p>
</div>
"""


def send_kyc_approved(email: str, name: str) -> None:
    """Notify investor their KYC has been approved."""
    html = f"""{_STYLE}
    <h2 style="color: #059669; margin: 0 0 8px;">✅ KYC Approved</h2>
    <p style="color: #374151;">Hi <strong>{name}</strong>,</p>
    <p style="color: #4b5563;">Your KYC verification has been <strong style="color:#059669;">approved</strong>.
       You can now purchase units and access all investor features.</p>
    <a href="https://animalkart.com/dashboard/investor" style="display: inline-block;
       margin-top: 16px; padding: 10px 24px; background: #059669; color: white; font-weight: 600;
       border-radius: 8px; text-decoration: none;">Go to Dashboard →</a>
    {_END}"""
    send_email_background(email, "KYC Approved — AnimalKart", html)


def send_kyc_rejected(email: str, name: str) -> None:
    """Notify investor their KYC has been rejected."""
    html = f"""{_STYLE}
    <h2 style="color: #dc2626; margin: 0 0 8px;">❌ KYC Rejected</h2>
    <p style="color: #374151;">Hi <strong>{name}</strong>,</p>
    <p style="color: #4b5563;">Your KYC verification was <strong style="color:#dc2626;">rejected</strong>.
       Please review your submitted documents and contact support if you believe this is an error.</p>
    {_END}"""
    send_email_background(email, "KYC Rejected — AnimalKart", html)


def send_payment_confirmed(email: str, name: str, amount: float) -> None:
    """Notify investor that payment has been registered."""
    html = f"""{_STYLE}
    <h2 style="color: #059669; margin: 0 0 8px;">💳 Payment Confirmed</h2>
    <p style="color: #374151;">Hi <strong>{name}</strong>,</p>
    <p style="color: #4b5563;">A payment of <strong>₹{amount:,.2f}</strong> has been confirmed for your account.</p>
    <a href="https://animalkart.com/dashboard/investor/wallet" style="display: inline-block;
       margin-top: 16px; padding: 10px 24px; background: #059669; color: white; font-weight: 600;
       border-radius: 8px; text-decoration: none;">View Wallet →</a>
    {_END}"""
    send_email_background(email, "Payment Confirmed — AnimalKart", html)
