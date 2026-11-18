"""Plain input validators (no framework). Each returns the cleaned value or raises ValueError."""
import re

PHONE_RE = re.compile(r"^\+?[\d\s\-().]+$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _text(value, label: str, lo: int, hi: int) -> str:
    if not isinstance(value, str):
        raise ValueError(f"{label} is required")
    v = value.strip()
    if not v:
        raise ValueError(f"{label} is required")
    if not lo <= len(v) <= hi:
        raise ValueError(f"{label} must be {lo} to {hi} characters")
    if re.search(r"[<>]", v) or re.search(r"[\x00-\x1f]", v):
        raise ValueError(f"{label} contains invalid characters")
    return v


def validate_name(value) -> str:
    return _text(value, "Name", 2, 80)


def validate_location(value) -> str:
    return _text(value, "Location", 3, 120)


def validate_subject(value) -> str:
    return _text(value, "Subject", 3, 120)


def validate_message(value) -> str:
    return _text(value, "Message", 10, 2000)


def validate_chat_message(value) -> str:
    """Chat text: 1-1000 characters. Line breaks are allowed; other control characters are not."""
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Message is required")
    v = value.strip()
    if len(v) > 1000:
        raise ValueError("Message must be 1000 characters or fewer")
    if re.search(r"[\x00-\x09\x0b-\x1f]", v):
        raise ValueError("Message contains invalid characters")
    return v


def validate_chat_contact(value) -> str:
    """Optional phone or email so we can reply outside the chat. Empty is fine."""
    if value is None or not str(value).strip():
        return ""
    return _text(str(value), "Phone or email", 5, 120)


def validate_phone(value) -> str:
    v = _text(value, "Phone number", 7, 20)
    digits = re.sub(r"\D", "", v)
    if not PHONE_RE.match(v) or not 7 <= len(digits) <= 15:
        raise ValueError("Enter a valid phone number (7 to 15 digits)")
    return v


def validate_email(value) -> str:
    v = _text(value, "Email", 5, 254).lower()
    if not EMAIL_RE.match(v):
        raise ValueError("Enter a valid email address")
    return v


def validate_password(value) -> str:
    if not isinstance(value, str) or not 8 <= len(value) <= 128:
        raise ValueError("Password must be 8 to 128 characters")
    if not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
        raise ValueError("Password must contain at least one letter and one number")
    return value
