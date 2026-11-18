"""Request and response models. Input checks reuse the plain validators in validators.py."""
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, field_validator

from . import validators as v


# ------------------------------------------------------------------ requests
class RegisterIn(BaseModel):
    name: str
    email: str
    phone: str
    password: str

    _name = field_validator("name")(lambda cls, x: v.validate_name(x))
    _email = field_validator("email")(lambda cls, x: v.validate_email(x))
    _phone = field_validator("phone")(lambda cls, x: v.validate_phone(x))
    _password = field_validator("password")(lambda cls, x: v.validate_password(x))


class LoginIn(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def _email(cls, x):
        return v.validate_email(x)

    @field_validator("password")
    @classmethod
    def _password(cls, x):
        if not x:
            raise ValueError("Password is required")
        return x


class BookingIn(BaseModel):
    customer_name: str
    phone: str
    car_id: str
    pickup_date: date
    return_date: date
    pickup_location: str

    @field_validator("customer_name")
    @classmethod
    def _name(cls, x):
        return v.validate_name(x)

    @field_validator("phone")
    @classmethod
    def _phone(cls, x):
        return v.validate_phone(x)

    @field_validator("pickup_location")
    @classmethod
    def _location(cls, x):
        return v.validate_location(x)

    @field_validator("car_id")
    @classmethod
    def _car(cls, x):
        x = x.strip()
        if not x or len(x) > 50:
            raise ValueError("Please select a car")
        return x


class StatusIn(BaseModel):
    status: Literal["confirmed", "cancelled"]


class ContactIn(BaseModel):
    name: str
    email: str
    subject: str
    message: str

    @field_validator("name")
    @classmethod
    def _name(cls, x):
        return v.validate_name(x)

    @field_validator("email")
    @classmethod
    def _email(cls, x):
        return v.validate_email(x)

    @field_validator("subject")
    @classmethod
    def _subject(cls, x):
        return v.validate_subject(x)

    @field_validator("message")
    @classmethod
    def _message(cls, x):
        return v.validate_message(x)


class ChatStartIn(BaseModel):
    name: str
    contact: str | None = None
    message: str

    _name = field_validator("name")(lambda cls, x: v.validate_name(x))
    _contact = field_validator("contact")(lambda cls, x: v.validate_chat_contact(x))
    _message = field_validator("message")(lambda cls, x: v.validate_chat_message(x))


class ChatMessageIn(BaseModel):
    body: str

    _body = field_validator("body")(lambda cls, x: v.validate_chat_message(x))


class ChatStatusIn(BaseModel):
    status: Literal["open", "closed"]


# ------------------------------------------------------------------ responses
class UserOut(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class CarOut(BaseModel):
    id: str
    name: str
    model: str
    category: str
    year: int
    seats: int
    transmission: str
    fuel: str
    price_per_day: float
    image: str
    description: str
    features: list[str]


class RangeOut(BaseModel):
    pickup_date: date
    return_date: date


class BookingOut(BaseModel):
    id: str
    car_id: str
    car_name: str
    customer_name: str
    pickup_location: str
    pickup_date: date
    return_date: date
    rental_days: int
    price_per_day: float
    total_price: float
    status: str
    created_at: datetime


class AdminBookingOut(BookingOut):
    phone: str
    user_id: str | None = None


class ChatMessageOut(BaseModel):
    id: str
    sender: Literal["visitor", "admin"]
    body: str
    created_at: datetime


class ChatOut(BaseModel):
    """What the visitor sees: their conversation."""
    id: str
    status: str
    messages: list[ChatMessageOut]


class ChatStartOut(ChatOut):
    token: str  # the visitor keeps this to read and reply to their chat


class AdminChatThreadOut(BaseModel):
    id: str
    visitor_name: str
    contact: str
    user_id: str | None = None
    status: str
    admin_unread: bool
    last_message_preview: str
    last_message_at: datetime
    created_at: datetime


class AdminChatOut(BaseModel):
    thread: AdminChatThreadOut
    messages: list[ChatMessageOut]
