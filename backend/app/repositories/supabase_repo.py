"""FUTURE Supabase implementation. NOT connected and NOT used yet.

This file has no imports from supabase, reads no credentials and opens no connection.
It marks exactly where your database code goes.

To connect later:
  1. Run backend/supabase/schema.sql, then backend/supabase/schema_users_contact.sql.
  2. Add your Supabase settings (URL + service-role key) to app/config.py / your .env.
  3. Fill in each method below. backend/main.py (the older version) already contains working
     Supabase calls for cars, availability and bookings that you can copy from.
  4. In app/dependencies.py, return SupabaseRepository(...) from get_repository().
Return the same dict shapes documented in base.py.
"""
from datetime import date

from .base import Repository

_TODO = "Supabase is not connected yet. Implement this method (see the notes at the top of this file)."


class SupabaseRepository(Repository):
    def __init__(self, client=None):
        # FUTURE: self.db = client   (a supabase.Client created with your own credentials)
        self.db = client

    # cars table: select * where active = true
    def list_cars(self, only_active: bool = True) -> list[dict]:
        raise NotImplementedError(_TODO)

    def get_car(self, car_id: str) -> dict | None:
        raise NotImplementedError(_TODO)

    # users table (see schema_users_contact.sql)
    def get_user(self, user_id: str) -> dict | None:
        raise NotImplementedError(_TODO)

    def get_user_by_email(self, email: str) -> dict | None:
        raise NotImplementedError(_TODO)

    def create_user(self, data: dict) -> dict:
        raise NotImplementedError(_TODO)  # map unique-violation (23505) to Conflict(field="email")

    # bookings table
    def create_booking(self, data: dict) -> dict:
        raise NotImplementedError(_TODO)

    def get_booking(self, booking_id: str) -> dict | None:
        raise NotImplementedError(_TODO)

    def list_bookings(self, user_id: str | None = None, status: str | None = None) -> list[dict]:
        raise NotImplementedError(_TODO)

    def list_confirmed_ranges(self, car_id: str, from_date: date) -> list[dict]:
        raise NotImplementedError(_TODO)

    def has_confirmed_overlap(self, car_id: str, pickup: date, ret: date, exclude_id: str | None = None) -> bool:
        raise NotImplementedError(_TODO)  # .lt("pickup_date", ret).gt("return_date", pickup)

    def update_booking_status(self, booking_id: str, status: str) -> dict:
        raise NotImplementedError(_TODO)  # catch error code 23P01 -> raise Conflict(...)

    # contact_messages table
    def create_contact_message(self, data: dict) -> dict:
        raise NotImplementedError(_TODO)
