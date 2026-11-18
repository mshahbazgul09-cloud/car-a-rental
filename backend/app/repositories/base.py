"""The data-access contract.

Routes and services only use these methods. Today MemoryRepository implements them with
temporary mock data. To go live, implement SupabaseRepository (supabase_repo.py) with the
same methods and return it from dependencies.get_repository(). Nothing else has to change.

Data shapes (plain dicts; dates are datetime.date):
  car     {id, name, model, category, year, seats, transmission, fuel, price_per_day,
           image, description, features[list[str]], active}
  user    {id, name, email, phone, password_hash, role('customer'|'admin'), created_at}
  booking {id, car_id, user_id|None, customer_name, phone, pickup_location, pickup_date,
           return_date, rental_days, price_per_day, total_price,
           status('pending'|'confirmed'|'cancelled'), created_at}
"""
from abc import ABC, abstractmethod
from datetime import date


class Repository(ABC):
    # ---- cars
    @abstractmethod
    def list_cars(self, only_active: bool = True) -> list[dict]: ...

    @abstractmethod
    def get_car(self, car_id: str) -> dict | None: ...

    # ---- users
    @abstractmethod
    def get_user(self, user_id: str) -> dict | None: ...

    @abstractmethod
    def get_user_by_email(self, email: str) -> dict | None: ...

    @abstractmethod
    def create_user(self, data: dict) -> dict:
        """data: name, email, phone, password_hash, role. Must raise Conflict if the email exists."""

    # ---- bookings
    @abstractmethod
    def create_booking(self, data: dict) -> dict:
        """Insert with status 'pending' and return the stored booking."""

    @abstractmethod
    def get_booking(self, booking_id: str) -> dict | None: ...

    @abstractmethod
    def list_bookings(self, user_id: str | None = None, status: str | None = None) -> list[dict]:
        """Newest first. user_id=None means all bookings (admin)."""

    @abstractmethod
    def list_confirmed_ranges(self, car_id: str, from_date: date) -> list[dict]:
        """[{pickup_date, return_date}] of CONFIRMED bookings ending on/after from_date, oldest first."""

    @abstractmethod
    def has_confirmed_overlap(self, car_id: str, pickup: date, ret: date, exclude_id: str | None = None) -> bool:
        """True if a confirmed booking of this car overlaps [pickup, ret). The return day is free."""

    @abstractmethod
    def update_booking_status(self, booking_id: str, status: str) -> dict:
        """Must be atomic. Raise Conflict if confirming would overlap another confirmed booking
        (Supabase: catch Postgres error 23P01 from the exclusion constraint)."""

    # ---- contact form
    @abstractmethod
    def create_contact_message(self, data: dict) -> dict: ...

    # ---- live chat
    # thread  {id, visitor_name, contact, user_id|None, token_hash, status('open'|'closed'),
    #          admin_unread(bool), last_message_preview, last_message_at, created_at}
    # message {id, thread_id, sender('visitor'|'admin'), body, created_at}
    @abstractmethod
    def create_chat_thread(self, data: dict) -> dict:
        """data: visitor_name, contact, user_id, token_hash."""

    @abstractmethod
    def get_chat_thread(self, thread_id: str) -> dict | None: ...

    @abstractmethod
    def list_chat_threads(self) -> list[dict]:
        """Most recent activity first."""

    @abstractmethod
    def update_chat_thread(self, thread_id: str, fields: dict) -> dict: ...

    @abstractmethod
    def add_chat_message(self, thread_id: str, sender: str, body: str) -> dict:
        """Also updates the thread's last_message_preview and last_message_at."""

    @abstractmethod
    def list_chat_messages(self, thread_id: str, limit: int = 200) -> list[dict]:
        """Oldest first, at most the last `limit` messages."""
