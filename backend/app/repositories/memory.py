"""TEMPORARY in-memory repository with mock data. Resets every time the server restarts.

MOCK LOGINS (development only; remove with this file when you connect Supabase):
  admin     admin@example.com  /  Admin12345
  customer  demo@example.com   /  Demo12345
"""
import threading
import uuid
from datetime import date, datetime, timedelta, timezone

from ..config import today
from ..errors import Conflict
from ..security import hash_password
from .base import Repository

# SAMPLE fleet. Keep in step with src/data/cars.js (used by the website if the API is offline).
SEED_CARS = [
    dict(id="car-1", name="Mercedes-Benz", model="S-Class", category="Luxury", year=2024, seats=5,
         transmission="Automatic", fuel="Petrol", price_per_day=250, image="/images/cars/mercedes-s-class.png",
         description="Flagship comfort with a hand-finished interior and effortless power.",
         features=["Leather seats", "Panoramic roof", "Massage seats", "Premium sound"]),
    dict(id="car-2", name="Audi", model="e-tron GT", category="Electric", year=2024, seats=5,
         transmission="Automatic", fuel="Electric", price_per_day=260, image="/images/cars/audi-e-tron-gt.png",
         description="A silent electric grand tourer with supercar pace and striking lines.",
         features=["Fast charging", "Matrix LED lights", "Virtual cockpit", "Premium sound"]),
    dict(id="car-3", name="Mercedes-Benz", model="EQS", category="Electric", year=2024, seats=5,
         transmission="Automatic", fuel="Electric", price_per_day=280, image="/images/cars/mercedes-eqs.png",
         description="Electric luxury with a calm, spacious cabin and a long range.",
         features=["Long range", "Air suspension", "Hyperscreen", "Heated seats"]),
]


class MemoryRepository(Repository):
    def __init__(self, seed: bool = True):
        self._lock = threading.RLock()
        self._cars = {c["id"]: {**c, "active": True} for c in SEED_CARS}
        self._users: dict[str, dict] = {}
        self._bookings: dict[str, dict] = {}
        self._messages: list[dict] = []
        self._chat_threads: dict[str, dict] = {}
        self._chat_messages: list[dict] = []
        if seed:
            self._seed()

    # ------------------------------------------------------------ seed
    def _seed(self):
        admin = self.create_user(dict(name="Admin", email="admin@example.com", phone="+1 555 000 0001",
                                      password_hash=hash_password("Admin12345"), role="admin"))
        demo = self.create_user(dict(name="Demo Customer", email="demo@example.com", phone="+1 555 000 0002",
                                     password_hash=hash_password("Demo12345"), role="customer"))
        t = today()
        # A confirmed booking so "unavailable dates" can be seen working on car-1.
        b = self._insert_booking("car-1", None, "Sample Customer", "+1 555 000 0003", "Airport Terminal",
                                 t + timedelta(days=5), t + timedelta(days=8), "confirmed")
        # A pending booking that belongs to the demo customer.
        self._insert_booking("car-3", demo["id"], demo["name"], demo["phone"], "Main Office",
                             t + timedelta(days=12), t + timedelta(days=15), "pending")
        self._seed_admin_id = admin["id"]

    def _insert_booking(self, car_id, user_id, name, phone, location, pickup, ret, status):
        car = self._cars[car_id]
        days = (ret - pickup).days
        rate = float(car["price_per_day"])
        booking = dict(
            id=str(uuid.uuid4()), car_id=car_id, user_id=user_id, customer_name=name, phone=phone,
            pickup_location=location, pickup_date=pickup, return_date=ret, rental_days=days,
            price_per_day=rate, total_price=round(rate * days, 2), status=status,
            created_at=datetime.now(timezone.utc),
        )
        self._bookings[booking["id"]] = booking
        return booking

    # ------------------------------------------------------------ cars
    def list_cars(self, only_active=True):
        with self._lock:
            return [dict(c) for c in self._cars.values() if c["active"] or not only_active]

    def get_car(self, car_id):
        with self._lock:
            c = self._cars.get(car_id)
            return dict(c) if c else None

    # ------------------------------------------------------------ users
    def get_user(self, user_id):
        with self._lock:
            u = self._users.get(user_id)
            return dict(u) if u else None

    def get_user_by_email(self, email):
        with self._lock:
            for u in self._users.values():
                if u["email"] == email.lower():
                    return dict(u)
            return None

    def create_user(self, data):
        with self._lock:
            if self.get_user_by_email(data["email"]):
                raise Conflict("An account with this email already exists.", field="email")
            user = dict(id=str(uuid.uuid4()), name=data["name"], email=data["email"].lower(),
                        phone=data["phone"], password_hash=data["password_hash"],
                        role=data.get("role", "customer"), created_at=datetime.now(timezone.utc))
            self._users[user["id"]] = user
            return dict(user)

    # ------------------------------------------------------------ bookings
    def create_booking(self, data):
        with self._lock:
            b = self._insert_booking(data["car_id"], data.get("user_id"), data["customer_name"], data["phone"],
                                     data["pickup_location"], data["pickup_date"], data["return_date"], "pending")
            # price fields are decided by the service (server-side), so overwrite the simple defaults
            b["price_per_day"] = data["price_per_day"]
            b["total_price"] = data["total_price"]
            return dict(b)

    def get_booking(self, booking_id):
        with self._lock:
            b = self._bookings.get(booking_id)
            return dict(b) if b else None

    def list_bookings(self, user_id=None, status=None):
        with self._lock:
            rows = [dict(b) for b in self._bookings.values()
                    if (user_id is None or b["user_id"] == user_id) and (status is None or b["status"] == status)]
        return sorted(rows, key=lambda b: b["created_at"], reverse=True)

    def list_confirmed_ranges(self, car_id, from_date):
        with self._lock:
            rows = [dict(pickup_date=b["pickup_date"], return_date=b["return_date"])
                    for b in self._bookings.values()
                    if b["car_id"] == car_id and b["status"] == "confirmed" and b["return_date"] >= from_date]
        return sorted(rows, key=lambda r: r["pickup_date"])

    def has_confirmed_overlap(self, car_id, pickup, ret, exclude_id=None):
        with self._lock:
            return any(
                b["car_id"] == car_id and b["status"] == "confirmed" and b["id"] != exclude_id
                and pickup < b["return_date"] and ret > b["pickup_date"]
                for b in self._bookings.values()
            )

    def update_booking_status(self, booking_id, status):
        with self._lock:
            b = self._bookings[booking_id]
            if status == "confirmed" and self.has_confirmed_overlap(
                b["car_id"], b["pickup_date"], b["return_date"], exclude_id=booking_id
            ):
                raise Conflict("Cannot confirm: it overlaps another confirmed booking for this car.")
            b["status"] = status
            return dict(b)

    # ------------------------------------------------------------ contact
    def create_contact_message(self, data):
        with self._lock:
            msg = dict(id=str(uuid.uuid4()), created_at=datetime.now(timezone.utc), **data)
            self._messages.append(msg)
            return dict(msg)

    # ------------------------------------------------------------ live chat
    def create_chat_thread(self, data):
        with self._lock:
            now = datetime.now(timezone.utc)
            t = dict(id=str(uuid.uuid4()), visitor_name=data["visitor_name"], contact=data.get("contact", ""),
                     user_id=data.get("user_id"), token_hash=data["token_hash"], status="open", admin_unread=False,
                     last_message_preview="", last_message_at=now, created_at=now)
            self._chat_threads[t["id"]] = t
            return dict(t)

    def get_chat_thread(self, thread_id):
        with self._lock:
            t = self._chat_threads.get(thread_id)
            return dict(t) if t else None

    def list_chat_threads(self):
        with self._lock:
            rows = [dict(t) for t in self._chat_threads.values()]
        return sorted(rows, key=lambda t: t["last_message_at"], reverse=True)

    def update_chat_thread(self, thread_id, fields):
        with self._lock:
            t = self._chat_threads[thread_id]
            t.update(fields)
            return dict(t)

    def add_chat_message(self, thread_id, sender, body):
        with self._lock:
            now = datetime.now(timezone.utc)
            m = dict(id=str(uuid.uuid4()), thread_id=thread_id, sender=sender, body=body, created_at=now)
            self._chat_messages.append(m)
            self._chat_threads[thread_id].update(last_message_preview=body[:120], last_message_at=now)
            return dict(m)

    def list_chat_messages(self, thread_id, limit=200):
        with self._lock:
            rows = [dict(m) for m in self._chat_messages if m["thread_id"] == thread_id]
        return rows[-limit:]
