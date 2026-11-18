"""Settings, read from backend/.env (see .env.example).

With no SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY the API runs on temporary mock data.
"""
import os
import secrets
from datetime import date, datetime, timezone

try:
    from dotenv import load_dotenv

    load_dotenv()
except ImportError:  # pragma: no cover
    pass

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()  # server-side only
USE_SUPABASE = bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)

try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover
    ZoneInfo = None

ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if o.strip()
]

# Used to sign login tokens. Without JWT_SECRET a random one is made at start-up,
# which simply means everyone is logged out whenever the server restarts.
JWT_SECRET = os.getenv("JWT_SECRET") or secrets.token_urlsafe(48)
TOKEN_MINUTES = int(os.getenv("TOKEN_MINUTES", "480"))

MAX_RENTAL_DAYS = int(os.getenv("MAX_RENTAL_DAYS", "90"))

# These emails become admins when they register. Comma-separated.
ADMIN_EMAILS = {
    e.strip().lower() for e in os.getenv("ADMIN_EMAILS", "gullsafs@gmail.com").split(",") if e.strip()
}
BUSINESS_TIMEZONE = os.getenv("BUSINESS_TIMEZONE", "UTC")


def today() -> date:
    """Today's date in the business time zone."""
    try:
        tz = ZoneInfo(BUSINESS_TIMEZONE) if ZoneInfo else timezone.utc
    except Exception:  # unknown zone name, or tzdata not installed
        tz = timezone.utc
    return datetime.now(tz).date()
