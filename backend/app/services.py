"""Business rules. Pure Python on top of the Repository interface: no web framework, no database.

Rules:
- Rental days = return date - pickup date. The return day is free (same-day turnover is allowed).
- The price is always calculated here from the car's rate. The browser's number is never trusted.
- New bookings are 'pending'. An admin confirms them. Confirmed bookings of one car cannot overlap.
"""
from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from . import config
from .errors import Conflict, Forbidden, NotFound, Unauthorized, ValidationFailed
from .repositories.base import Repository
from .security import hash_password, verify_password

# A real hash used to keep login timing the same whether or not the email exists.
_DUMMY_HASH = hash_password("not-a-real-password-1")


def public_user(user: dict) -> dict:
    return {k: user[k] for k in ("id", "name", "email", "phone", "role")}


def money(value) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


# ------------------------------------------------------------------ cars
def search_cars(repo: Repository, q=None, category=None, min_price=None, max_price=None, sort="featured") -> list[dict]:
    cars = repo.list_cars()
    if q:
        needle = q.strip().lower()
        cars = [c for c in cars if needle in f'{c["name"]} {c["model"]} {c["category"]}'.lower()]
    if category and category.lower() != "all":
        cars = [c for c in cars if c["category"].lower() == category.lower()]
    if min_price is not None:
        cars = [c for c in cars if c["price_per_day"] >= min_price]
    if max_price is not None:
        cars = [c for c in cars if c["price_per_day"] <= max_price]
    if sort == "price_asc":
        cars.sort(key=lambda c: c["price_per_day"])
    elif sort == "price_desc":
        cars.sort(key=lambda c: -c["price_per_day"])
    return cars


def get_car_or_404(repo: Repository, car_id: str) -> dict:
    car = repo.get_car(car_id)
    if not car or not car.get("active", True):
        raise NotFound("Selected car was not found.")
    return car


# ------------------------------------------------------------------ auth
def register_user(repo: Repository, name: str, email: str, phone: str, password: str) -> dict:
    role = "admin" if email.strip().lower() in config.ADMIN_EMAILS else "customer"
    return public_user(
        repo.create_user(dict(name=name, email=email, phone=phone, password_hash=hash_password(password), role=role))
    )


def authenticate(repo: Repository, email: str, password: str) -> dict:
    user = repo.get_user_by_email(email.strip().lower())
    ok = verify_password(password, user["password_hash"] if user else _DUMMY_HASH)
    if not user or not ok:
        raise Unauthorized("Incorrect email or password.")
    return public_user(user)


# ------------------------------------------------------------------ bookings
def _with_car_name(repo: Repository, booking: dict) -> dict:
    car = repo.get_car(booking["car_id"])
    return {**booking, "car_name": f'{car["name"]} {car["model"]}' if car else booking["car_id"]}


def create_booking(repo: Repository, *, customer_name, phone, car_id, pickup_date: date, return_date: date,
                   pickup_location, user_id: str | None = None, today: date | None = None) -> dict:
    today = today or config.today()
    if pickup_date < today:
        raise ValidationFailed("Pickup date cannot be in the past.", field="pickup_date")
    if return_date <= pickup_date:
        raise ValidationFailed("Return date must be after the pickup date.", field="return_date")
    days = (return_date - pickup_date).days
    if days > config.MAX_RENTAL_DAYS:
        raise ValidationFailed(f"Rentals are limited to {config.MAX_RENTAL_DAYS} days.", field="return_date")

    car = get_car_or_404(repo, car_id)

    if repo.has_confirmed_overlap(car_id, pickup_date, return_date):
        raise Conflict("This car is already booked for some of the selected dates.")

    rate = money(car["price_per_day"])
    booking = repo.create_booking(dict(
        car_id=car_id, user_id=user_id, customer_name=customer_name, phone=phone, pickup_location=pickup_location,
        pickup_date=pickup_date, return_date=return_date, price_per_day=float(rate), total_price=float(money(rate * days)),
    ))
    return _with_car_name(repo, booking)


def list_user_bookings(repo: Repository, user_id: str) -> list[dict]:
    return [_with_car_name(repo, b) for b in repo.list_bookings(user_id=user_id)]


def list_all_bookings(repo: Repository, status: str | None = None) -> list[dict]:
    return [_with_car_name(repo, b) for b in repo.list_bookings(status=status)]


def _get_booking_or_404(repo: Repository, booking_id: str) -> dict:
    booking = repo.get_booking(booking_id)
    if not booking:
        raise NotFound("Booking not found.")
    return booking


def set_booking_status(repo: Repository, booking_id: str, status: str) -> dict:
    """Admin: 'confirmed' (only from pending) or 'cancelled' (from pending or confirmed)."""
    booking = _get_booking_or_404(repo, booking_id)
    if status == "confirmed" and booking["status"] != "pending":
        raise Conflict(f'Only pending bookings can be confirmed (this one is {booking["status"]}).')
    if status == "cancelled" and booking["status"] == "cancelled":
        raise Conflict("This booking is already cancelled.")
    return _with_car_name(repo, repo.update_booking_status(booking_id, status))


def cancel_booking(repo: Repository, booking_id: str, user: dict) -> dict:
    """A customer may cancel their own booking. An admin may cancel any."""
    booking = _get_booking_or_404(repo, booking_id)
    if user["role"] != "admin" and booking["user_id"] != user["id"]:
        raise Forbidden("You can only cancel your own bookings.")
    if booking["status"] == "cancelled":
        raise Conflict("This booking is already cancelled.")
    return _with_car_name(repo, repo.update_booking_status(booking_id, "cancelled"))
