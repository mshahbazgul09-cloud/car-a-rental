"""Schema tests (pydantic only). Run:  python -m unittest discover -s tests -t . -v"""
import unittest
from datetime import date, datetime, timezone

from pydantic import ValidationError

from app import schemas, services
from app.repositories.memory import MemoryRepository

GOOD_BOOKING = dict(customer_name=" Ali Khan ", phone="+1 510 555 0123", car_id="car-1",
                    pickup_date="2030-01-02", return_date="2030-01-05", pickup_location="Berkeley")


def fields_with_errors(model, data):
    try:
        model(**data)
    except ValidationError as e:
        return {err["loc"][0] for err in e.errors()}
    return set()


class RequestSchemas(unittest.TestCase):
    def test_booking_ok_and_cleaned(self):
        b = schemas.BookingIn(**GOOD_BOOKING)
        self.assertEqual(b.customer_name, "Ali Khan")
        self.assertEqual(b.pickup_date, date(2030, 1, 2))

    def test_booking_field_errors(self):
        for field, bad in [("customer_name", "<x>"), ("phone", "abc"), ("pickup_location", "ab"),
                           ("car_id", " "), ("pickup_date", "not-a-date")]:
            self.assertEqual(fields_with_errors(schemas.BookingIn, {**GOOD_BOOKING, field: bad}), {field}, field)

    def test_booking_missing_fields(self):
        self.assertEqual(len(fields_with_errors(schemas.BookingIn, {})), 6)

    def test_register(self):
        ok = dict(name="Sam Lee", email="SAM@Example.com", phone="+1 555 123 4567", password="Passw0rdX")
        self.assertEqual(schemas.RegisterIn(**ok).email, "sam@example.com")
        for field, bad in [("name", "S"), ("email", "nope"), ("phone", "1"), ("password", "short")]:
            self.assertEqual(fields_with_errors(schemas.RegisterIn, {**ok, field: bad}), {field}, field)

    def test_login_and_status_and_contact(self):
        self.assertEqual(fields_with_errors(schemas.LoginIn, dict(email="a@b.co", password="")), {"password"})
        self.assertEqual(fields_with_errors(schemas.StatusIn, dict(status="pending")), {"status"})
        self.assertEqual(schemas.StatusIn(status="confirmed").status, "confirmed")
        ok = dict(name="Sam", email="sam@example.com", subject="Question", message="Hello, do you deliver?")
        schemas.ContactIn(**ok)
        self.assertEqual(fields_with_errors(schemas.ContactIn, {**ok, "message": "short"}), {"message"})


class ResponseSchemas(unittest.TestCase):
    """Real service output must satisfy the response models (this is what FastAPI will do)."""

    def test_service_output_matches_models(self):
        repo = MemoryRepository()
        for car in repo.list_cars():
            schemas.CarOut(**car)
        for r in repo.list_confirmed_ranges("car-1", date.min):
            schemas.RangeOut(**r)
        user = services.register_user(repo, "Sam Lee", "sam@example.com", "+1 555 123 4567", "Passw0rdX")
        schemas.TokenOut(access_token="x", user=user)
        booking = services.create_booking(
            repo, customer_name="Sam Lee", phone="+1 555 123 4567", car_id="car-2",
            pickup_date=date(2031, 1, 1), return_date=date(2031, 1, 3), pickup_location="Main Office",
            user_id=user["id"], today=date(2030, 1, 1))
        out = schemas.BookingOut(**booking)
        self.assertEqual((out.rental_days, out.total_price), (2, 520.0))
        adm = schemas.AdminBookingOut(**booking)
        self.assertEqual(adm.user_id, user["id"])
        self.assertNotIn("phone", out.model_dump())
        self.assertIsInstance(out.created_at, datetime)
        self.assertEqual(out.created_at.tzinfo, timezone.utc)


if __name__ == "__main__":
    unittest.main()
