"""Supabase implementation of the Repository contract (see base.py for the data shapes).

Used automatically when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in backend/.env
(see app/dependencies.py). The service-role key bypasses RLS, so it must stay on the server.
"""
from datetime import date, datetime

from postgrest.exceptions import APIError

from ..errors import Conflict
from .base import Repository

_DATE_FIELDS = ("pickup_date", "return_date")
_TIME_FIELDS = ("created_at", "last_message_at")
_MONEY_FIELDS = ("price_per_day", "total_price")


def _row(r: dict | None) -> dict | None:
    """Convert Supabase JSON (strings) back to the Python types the services expect."""
    if r is None:
        return None
    r = dict(r)
    for k in _DATE_FIELDS:
        if isinstance(r.get(k), str):
            r[k] = date.fromisoformat(r[k])
    for k in _MONEY_FIELDS:
        if r.get(k) is not None:
            r[k] = float(r[k])
    for k in _TIME_FIELDS:
        if isinstance(r.get(k), str):
            r[k] = datetime.fromisoformat(r[k].replace("Z", "+00:00"))
    return r


def _first(res) -> dict | None:
    return _row(res.data[0]) if res.data else None


class SupabaseRepository(Repository):
    def __init__(self, client):
        self.db = client

    # ---- cars
    def list_cars(self, only_active: bool = True) -> list[dict]:
        q = self.db.table("cars").select("*").order("id")
        if only_active:
            q = q.eq("active", True)
        return [_row(r) for r in q.execute().data]

    def get_car(self, car_id: str) -> dict | None:
        return _first(self.db.table("cars").select("*").eq("id", car_id).limit(1).execute())

    # ---- users
    def get_user(self, user_id: str) -> dict | None:
        return _first(self.db.table("users").select("*").eq("id", user_id).limit(1).execute())

    def get_user_by_email(self, email: str) -> dict | None:
        return _first(self.db.table("users").select("*").eq("email", email.lower()).limit(1).execute())

    def create_user(self, data: dict) -> dict:
        row = {**data, "email": data["email"].lower(), "role": data.get("role", "customer")}
        try:
            return _first(self.db.table("users").insert(row).execute())
        except APIError as e:
            if e.code == "23505":
                raise Conflict("An account with this email already exists.", field="email")
            raise

    # ---- bookings
    def create_booking(self, data: dict) -> dict:
        row = {
            "car_id": data["car_id"],
            "user_id": data.get("user_id"),
            "customer_name": data["customer_name"],
            "phone": data["phone"],
            "pickup_location": data["pickup_location"],
            "pickup_date": data["pickup_date"].isoformat(),
            "return_date": data["return_date"].isoformat(),
            "price_per_day": float(data["price_per_day"]),
            "total_price": float(data["total_price"]),
            "status": "pending",
        }
        return _first(self.db.table("bookings").insert(row).execute())

    def get_booking(self, booking_id: str) -> dict | None:
        try:
            return _first(self.db.table("bookings").select("*").eq("id", booking_id).limit(1).execute())
        except APIError as e:
            if e.code == "22P02":  # not a valid uuid -> simply not found
                return None
            raise

    def list_bookings(self, user_id: str | None = None, status: str | None = None) -> list[dict]:
        q = self.db.table("bookings").select("*").order("created_at", desc=True)
        if user_id is not None:
            q = q.eq("user_id", user_id)
        if status is not None:
            q = q.eq("status", status)
        return [_row(r) for r in q.execute().data]

    def list_confirmed_ranges(self, car_id: str, from_date: date) -> list[dict]:
        res = (
            self.db.table("bookings").select("pickup_date,return_date")
            .eq("car_id", car_id).eq("status", "confirmed").gte("return_date", from_date.isoformat())
            .order("pickup_date").execute()
        )
        return [_row(r) for r in res.data]

    def has_confirmed_overlap(self, car_id: str, pickup: date, ret: date, exclude_id: str | None = None) -> bool:
        q = (
            self.db.table("bookings").select("id")
            .eq("car_id", car_id).eq("status", "confirmed")
            .lt("pickup_date", ret.isoformat()).gt("return_date", pickup.isoformat())
        )
        if exclude_id:
            q = q.neq("id", exclude_id)
        return bool(q.limit(1).execute().data)

    def update_booking_status(self, booking_id: str, status: str) -> dict:
        # Atomic: the database's exclusion constraint rejects overlapping confirmed bookings.
        try:
            return _first(self.db.table("bookings").update({"status": status}).eq("id", booking_id).execute())
        except APIError as e:
            if e.code == "23P01":
                raise Conflict("Cannot confirm: it overlaps another confirmed booking for this car.")
            raise

    # ---- contact form
    def create_contact_message(self, data: dict) -> dict:
        return _first(self.db.table("contact_messages").insert(dict(data)).execute())

    # ---- live chat
    def create_chat_thread(self, data: dict) -> dict:
        row = {k: data.get(k) for k in ("visitor_name", "contact", "user_id", "token_hash")}
        return _first(self.db.table("chat_threads").insert(row).execute())

    def get_chat_thread(self, thread_id: str) -> dict | None:
        try:
            return _first(self.db.table("chat_threads").select("*").eq("id", thread_id).limit(1).execute())
        except APIError as e:
            if e.code == "22P02":  # not a valid uuid -> simply not found
                return None
            raise

    def list_chat_threads(self) -> list[dict]:
        res = self.db.table("chat_threads").select("*").order("last_message_at", desc=True).limit(200).execute()
        return [_row(r) for r in res.data]

    def update_chat_thread(self, thread_id: str, fields: dict) -> dict:
        return _first(self.db.table("chat_threads").update(fields).eq("id", thread_id).execute())

    def add_chat_message(self, thread_id: str, sender: str, body: str) -> dict:
        # The database trigger keeps the thread's last_message_preview and last_message_at up to date.
        row = {"thread_id": thread_id, "sender": sender, "body": body}
        return _first(self.db.table("chat_messages").insert(row).execute())

    def list_chat_messages(self, thread_id: str, limit: int = 200) -> list[dict]:
        res = (
            self.db.table("chat_messages").select("*").eq("thread_id", thread_id)
            .order("created_at", desc=True).limit(limit).execute()
        )
        return [_row(r) for r in reversed(res.data)]
