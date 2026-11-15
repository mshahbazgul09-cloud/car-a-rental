"""
Car rental booking API (FastAPI + Supabase).

Run:  uvicorn main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""
import hmac
import os
import re
from datetime import date, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal
from typing import Literal
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from postgrest.exceptions import APIError
from pydantic import BaseModel, Field, field_validator, model_validator
from supabase import Client, create_client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]  # server-side only, never ship to the browser
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o.strip()]
BUSINESS_TZ = ZoneInfo(os.getenv("BUSINESS_TIMEZONE", "UTC"))
MAX_RENTAL_DAYS = int(os.getenv("MAX_RENTAL_DAYS", "90"))

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI(title="Car Rental API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Content-Type", "X-Admin-Key"],
)

PHONE_RE = re.compile(r"^\+?[\d\s\-().]+$")


def today() -> date:
    return datetime.now(BUSINESS_TZ).date()


# ---------------------------------------------------------------- schemas
class BookingCreate(BaseModel):
    customer_name: str = Field(min_length=2, max_length=80)
    phone: str = Field(min_length=7, max_length=20)
    car_id: str = Field(min_length=1, max_length=50)
    pickup_date: date
    return_date: date
    pickup_location: str = Field(min_length=3, max_length=120)

    @field_validator("customer_name", "pickup_location", "car_id", "phone", mode="before")
    @classmethod
    def strip_text(cls, v):
        return v.strip() if isinstance(v, str) else v

    @field_validator("customer_name", "pickup_location")
    @classmethod
    def no_markup(cls, v: str) -> str:
        if re.search(r"[<>]", v) or re.search(r"[\x00-\x1f]", v):
            raise ValueError("contains invalid characters")
        return v

    @field_validator("phone")
    @classmethod
    def valid_phone(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if not PHONE_RE.match(v) or not 7 <= len(digits) <= 15:
            raise ValueError("enter a valid phone number (7 to 15 digits)")
        return v

    @model_validator(mode="after")
    def valid_dates(self):
        if self.pickup_date < today():
            raise ValueError("pickup_date cannot be in the past")
        if self.return_date <= self.pickup_date:
            raise ValueError("return_date must be after pickup_date")
        if (self.return_date - self.pickup_date).days > MAX_RENTAL_DAYS:
            raise ValueError(f"rentals are limited to {MAX_RENTAL_DAYS} days")
        return self


class BookingOut(BaseModel):
    id: str
    car_id: str
    car_name: str
    pickup_date: date
    return_date: date
    rental_days: int
    price_per_day: float
    total_price: float
    status: str


class StatusUpdate(BaseModel):
    status: Literal["confirmed", "cancelled"]


# ---------------------------------------------------------------- helpers
def money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def find_confirmed_overlap(car_id: str, pickup: date, ret: date, exclude_id: str | None = None) -> bool:
    """True if a CONFIRMED booking of this car overlaps [pickup, ret). Return day is free."""
    q = (
        supabase.table("bookings")
        .select("id")
        .eq("car_id", car_id)
        .eq("status", "confirmed")
        .lt("pickup_date", ret.isoformat())
        .gt("return_date", pickup.isoformat())
        .limit(1)
    )
    if exclude_id:
        q = q.neq("id", exclude_id)
    return bool(q.execute().data)


# ---------------------------------------------------------------- routes
@app.get("/api/health")
def health():
    return {"ok": True}


@app.get("/api/cars/{car_id}/availability")
def availability(car_id: str):
    """Confirmed (unavailable) date ranges for a car, from today onward. Dates only, no customer data."""
    res = (
        supabase.table("bookings")
        .select("pickup_date, return_date")
        .eq("car_id", car_id)
        .eq("status", "confirmed")
        .gte("return_date", today().isoformat())
        .order("pickup_date")
        .execute()
    )
    return res.data


@app.post("/api/bookings", response_model=BookingOut, status_code=201)
def create_booking(body: BookingCreate):
    car_res = supabase.table("cars").select("*").eq("id", body.car_id).eq("active", True).limit(1).execute()
    if not car_res.data:
        raise HTTPException(404, "Selected car was not found.")
    car = car_res.data[0]

    if find_confirmed_overlap(body.car_id, body.pickup_date, body.return_date):
        raise HTTPException(409, "This car is already booked for some of the selected dates.")

    # Price is always calculated here from the database rate, never trusted from the browser.
    days = (body.return_date - body.pickup_date).days
    rate = Decimal(str(car["price_per_day"]))
    total = money(rate * days)

    try:
        res = (
            supabase.table("bookings")
            .insert(
                {
                    "car_id": body.car_id,
                    "customer_name": body.customer_name,
                    "phone": body.phone,
                    "pickup_location": body.pickup_location,
                    "pickup_date": body.pickup_date.isoformat(),
                    "return_date": body.return_date.isoformat(),
                    "price_per_day": float(rate),
                    "total_price": float(total),
                    "status": "pending",
                }
            )
            .execute()
        )
    except APIError:
        raise HTTPException(500, "Could not save your booking. Please try again.")

    row = res.data[0]
    return BookingOut(
        id=row["id"],
        car_id=row["car_id"],
        car_name=f'{car["name"]} {car["model"]}',
        pickup_date=row["pickup_date"],
        return_date=row["return_date"],
        rental_days=row["rental_days"],
        price_per_day=float(row["price_per_day"]),
        total_price=float(row["total_price"]),
        status=row["status"],
    )


@app.patch("/api/admin/bookings/{booking_id}")
def update_booking_status(booking_id: str, body: StatusUpdate, x_admin_key: str = Header(default="")):
    """Owner-only: confirm or cancel a booking. Send header  X-Admin-Key: <ADMIN_API_KEY>."""
    if not ADMIN_API_KEY:
        raise HTTPException(503, "Admin access is not configured.")
    if not hmac.compare_digest(x_admin_key, ADMIN_API_KEY):
        raise HTTPException(401, "Invalid admin key.")

    found = supabase.table("bookings").select("*").eq("id", booking_id).limit(1).execute()
    if not found.data:
        raise HTTPException(404, "Booking not found.")
    booking = found.data[0]

    if body.status == "confirmed":
        if booking["status"] != "pending":
            raise HTTPException(409, f'Only pending bookings can be confirmed (this one is {booking["status"]}).')
        pickup = date.fromisoformat(booking["pickup_date"])
        ret = date.fromisoformat(booking["return_date"])
        if find_confirmed_overlap(booking["car_id"], pickup, ret, exclude_id=booking_id):
            raise HTTPException(409, "Cannot confirm: it overlaps another confirmed booking for this car.")

    try:
        res = supabase.table("bookings").update({"status": body.status}).eq("id", booking_id).execute()
    except APIError as e:
        # 23P01 = exclusion violation: the database stopped a race between two confirmations.
        if getattr(e, "code", None) == "23P01":
            raise HTTPException(409, "Cannot confirm: it overlaps another confirmed booking for this car.")
        raise HTTPException(500, "Could not update the booking.")
    return res.data[0]
