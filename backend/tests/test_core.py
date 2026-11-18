"""Unit tests for the backend core. Run from the backend folder:  python -m unittest discover -s tests -t . -v"""
import unittest
from datetime import date, timedelta

from app import services, validators
from app.errors import Conflict, Forbidden, NotFound, Unauthorized, ValidationFailed
from app.repositories.memory import MemoryRepository
from app.security import create_access_token, decode_access_token, hash_password, verify_password

TODAY = date(2030, 6, 1)


def d(n):  # n days after TODAY
    return TODAY + timedelta(days=n)


def book(repo, car="car-1", p=1, r=4, user_id=None, **kw):
    return services.create_booking(
        repo, customer_name="Ali Khan", phone="+1 510 555 0123", car_id=car, pickup_date=d(p), return_date=d(r),
        pickup_location="Berkeley", user_id=user_id, today=TODAY, **kw)


class Validators(unittest.TestCase):
    def test_name(self):
        self.assertEqual(validators.validate_name("  Ali Khan "), "Ali Khan")
        for bad in ["", " ", "A", "x" * 81, "<b>hi</b>", None]:
            with self.assertRaises(ValueError):
                validators.validate_name(bad)

    def test_phone(self):
        self.assertEqual(validators.validate_phone("+1 (510) 555-0123"), "+1 (510) 555-0123")
        for bad in ["12ab", "123", "1234567890123456", ""]:
            with self.assertRaises(ValueError):
                validators.validate_phone(bad)

    def test_email(self):
        self.assertEqual(validators.validate_email(" Ali@Example.COM "), "ali@example.com")
        for bad in ["nope", "a@b", "a b@c.com", ""]:
            with self.assertRaises(ValueError):
                validators.validate_email(bad)

    def test_password(self):
        validators.validate_password("Abcdef12")
        for bad in ["short1", "allletters", "12345678", "x" * 200]:
            with self.assertRaises(ValueError):
                validators.validate_password(bad)


class Security(unittest.TestCase):
    def test_hash_and_verify(self):
        h = hash_password("Secret123")
        self.assertNotIn("Secret123", h)
        self.assertTrue(verify_password("Secret123", h))
        self.assertFalse(verify_password("secret123", h))
        self.assertNotEqual(h, hash_password("Secret123"))  # random salt
        self.assertFalse(verify_password("x", "garbage"))

    def test_token(self):
        t = create_access_token("u1", "admin", "s3cret", 5)
        claims = decode_access_token(t, "s3cret")
        self.assertEqual((claims["sub"], claims["role"]), ("u1", "admin"))
        with self.assertRaises(Unauthorized):
            decode_access_token(t, "other-secret")
        with self.assertRaises(Unauthorized):
            decode_access_token("not.a.token", "s3cret")
        with self.assertRaises(Unauthorized):
            decode_access_token(create_access_token("u1", "admin", "s3cret", -1), "s3cret")


class Auth(unittest.TestCase):
    def setUp(self):
        self.repo = MemoryRepository()

    def test_register_and_login(self):
        u = services.register_user(self.repo, "New User", "new@example.com", "+1 555 123 4567", "Passw0rdX")
        self.assertEqual(u["role"], "customer")
        self.assertNotIn("password_hash", u)
        self.assertEqual(services.authenticate(self.repo, "NEW@example.com", "Passw0rdX")["id"], u["id"])

    def test_duplicate_email(self):
        with self.assertRaises(Conflict):
            services.register_user(self.repo, "Dup", "demo@example.com", "+1 555 123 4567", "Passw0rdX")

    def test_bad_login(self):
        for email, pw in [("demo@example.com", "wrong"), ("ghost@example.com", "Demo12345")]:
            with self.assertRaises(Unauthorized):
                services.authenticate(self.repo, email, pw)

    def test_seeded_logins(self):
        self.assertEqual(services.authenticate(self.repo, "admin@example.com", "Admin12345")["role"], "admin")
        self.assertEqual(services.authenticate(self.repo, "demo@example.com", "Demo12345")["role"], "customer")


class Cars(unittest.TestCase):
    def setUp(self):
        self.repo = MemoryRepository()

    def test_search_filter_sort(self):
        self.assertEqual(len(services.search_cars(self.repo)), 3)
        self.assertEqual([c["id"] for c in services.search_cars(self.repo, category="electric")], ["car-2", "car-3"])
        self.assertEqual([c["id"] for c in services.search_cars(self.repo, q="audi")], ["car-2"])
        self.assertEqual({c["id"] for c in services.search_cars(self.repo, max_price=260)}, {"car-1", "car-2"})
        asc = [c["price_per_day"] for c in services.search_cars(self.repo, sort="price_asc")]
        self.assertEqual(asc, sorted(asc))
        desc = [c["price_per_day"] for c in services.search_cars(self.repo, sort="price_desc")]
        self.assertEqual(desc, sorted(desc, reverse=True))

    def test_get_car(self):
        self.assertEqual(services.get_car_or_404(self.repo, "car-2")["model"], "e-tron GT")
        with self.assertRaises(NotFound):
            services.get_car_or_404(self.repo, "nope")


class Bookings(unittest.TestCase):
    def setUp(self):
        self.repo = MemoryRepository(seed=False)

    def test_price_is_calculated_server_side(self):
        b = book(self.repo, "car-1", 1, 4)  # 3 days x 250
        self.assertEqual((b["rental_days"], b["price_per_day"], b["total_price"], b["status"]), (3, 250.0, 750.0, "pending"))
        self.assertEqual(b["car_name"], "Mercedes-Benz S-Class")

    def test_date_rules(self):
        with self.assertRaises(ValidationFailed) as e:
            book(self.repo, p=-1, r=2)
        self.assertEqual(e.exception.field, "pickup_date")
        with self.assertRaises(ValidationFailed) as e:
            book(self.repo, p=3, r=3)
        self.assertEqual(e.exception.field, "return_date")
        with self.assertRaises(ValidationFailed):
            book(self.repo, p=1, r=200)
        book(self.repo, p=0, r=1)  # same-day pickup, 1 day: fine

    def test_unknown_car(self):
        with self.assertRaises(NotFound):
            book(self.repo, car="nope")

    def test_pending_bookings_do_not_block(self):
        book(self.repo, p=1, r=5)
        book(self.repo, p=2, r=6)  # overlapping, but neither is confirmed

    def test_confirmed_blocks_overlap_but_not_back_to_back(self):
        first = book(self.repo, p=1, r=5)
        services.set_booking_status(self.repo, first["id"], "confirmed")
        with self.assertRaises(Conflict):
            book(self.repo, p=3, r=7)
        with self.assertRaises(Conflict):
            book(self.repo, p=0, r=2)
        book(self.repo, p=5, r=8)   # picks up on the return day: allowed
        book(self.repo, p=-0, r=1)  # ends on the pickup day: allowed
        book(self.repo, car="car-2", p=1, r=5)  # a different car is unaffected

    def test_confirm_race_is_stopped(self):
        a, b = book(self.repo, p=1, r=5), book(self.repo, p=3, r=7)
        services.set_booking_status(self.repo, a["id"], "confirmed")
        with self.assertRaises(Conflict):
            services.set_booking_status(self.repo, b["id"], "confirmed")
        self.assertEqual(self.repo.get_booking(b["id"])["status"], "pending")

    def test_status_transitions(self):
        b = book(self.repo)
        services.set_booking_status(self.repo, b["id"], "confirmed")
        with self.assertRaises(Conflict):
            services.set_booking_status(self.repo, b["id"], "confirmed")
        services.set_booking_status(self.repo, b["id"], "cancelled")
        with self.assertRaises(Conflict):
            services.set_booking_status(self.repo, b["id"], "cancelled")
        with self.assertRaises(NotFound):
            services.set_booking_status(self.repo, "missing", "confirmed")

    def test_cancelled_frees_the_dates(self):
        b = book(self.repo, p=1, r=5)
        services.set_booking_status(self.repo, b["id"], "confirmed")
        services.set_booking_status(self.repo, b["id"], "cancelled")
        book(self.repo, p=2, r=4)

    def test_availability_ranges(self):
        b = book(self.repo, p=1, r=5)
        self.assertEqual(self.repo.list_confirmed_ranges("car-1", TODAY), [])
        services.set_booking_status(self.repo, b["id"], "confirmed")
        self.assertEqual(self.repo.list_confirmed_ranges("car-1", TODAY), [{"pickup_date": d(1), "return_date": d(5)}])
        self.assertEqual(self.repo.list_confirmed_ranges("car-1", d(9)), [])

    def test_ownership_and_listing(self):
        mine = services.register_user(self.repo, "Mine", "mine@example.com", "+1 555 111 2222", "Passw0rdX")
        other = services.register_user(self.repo, "Other", "other@example.com", "+1 555 333 4444", "Passw0rdX")
        b = book(self.repo, user_id=mine["id"])
        book(self.repo, car="car-2", user_id=other["id"])
        book(self.repo, car="car-3")  # guest
        self.assertEqual([x["id"] for x in services.list_user_bookings(self.repo, mine["id"])], [b["id"]])
        self.assertEqual(len(services.list_all_bookings(self.repo)), 3)
        self.assertEqual(len(services.list_all_bookings(self.repo, status="confirmed")), 0)
        with self.assertRaises(Forbidden):
            services.cancel_booking(self.repo, b["id"], other)
        self.assertEqual(services.cancel_booking(self.repo, b["id"], mine)["status"], "cancelled")
        with self.assertRaises(Conflict):
            services.cancel_booking(self.repo, b["id"], mine)
        admin = dict(id="a", role="admin")
        guest = book(self.repo, car="car-3", p=20, r=22)
        self.assertEqual(services.cancel_booking(self.repo, guest["id"], admin)["status"], "cancelled")


class Seed(unittest.TestCase):
    def test_seed_data(self):
        repo = MemoryRepository()
        self.assertEqual(len(repo.list_cars()), 3)
        self.assertEqual(len(repo.list_confirmed_ranges("car-1", date.min)), 1)
        demo = repo.get_user_by_email("demo@example.com")
        self.assertEqual(len(services.list_user_bookings(repo, demo["id"])), 1)


class Chat(unittest.TestCase):
    def setUp(self):
        self.repo = MemoryRepository(seed=False)
        self.chat = services.start_chat(self.repo, name="Ali Khan", contact="+1 510 555 0123", message="Is the Audi free?")

    def test_start_flags_admin_and_returns_token(self):
        self.assertTrue(self.chat["token"])
        self.assertEqual([m["body"] for m in self.chat["messages"]], ["Is the Audi free?"])
        thread = services.list_chats(self.repo)[0]
        self.assertTrue(thread["admin_unread"])
        self.assertNotIn(self.chat["token"], thread["token_hash"])  # only the hash is stored

    def test_wrong_token_cannot_read_or_send(self):
        for token in (None, "", "wrong"):
            with self.assertRaises(NotFound):
                services.get_visitor_chat(self.repo, self.chat["id"], token)
            with self.assertRaises(NotFound):
                services.visitor_send(self.repo, self.chat["id"], token, "hi")

    def test_conversation_both_ways(self):
        opened = services.admin_open_chat(self.repo, self.chat["id"])
        self.assertFalse(opened["thread"]["admin_unread"])
        services.admin_reply(self.repo, self.chat["id"], "Yes, it is free.")
        seen = services.get_visitor_chat(self.repo, self.chat["id"], self.chat["token"])
        self.assertEqual([m["sender"] for m in seen["messages"]], ["visitor", "admin"])
        services.visitor_send(self.repo, self.chat["id"], self.chat["token"], "Great, thanks!")
        thread = services.list_chats(self.repo)[0]
        self.assertTrue(thread["admin_unread"])
        self.assertEqual(thread["last_message_preview"], "Great, thanks!")

    def test_visitor_message_reopens_closed_chat(self):
        services.admin_set_chat_status(self.repo, self.chat["id"], "closed")
        out = services.visitor_send(self.repo, self.chat["id"], self.chat["token"], "One more question")
        self.assertEqual(out["status"], "open")

    def test_unknown_chat(self):
        with self.assertRaises(NotFound):
            services.admin_open_chat(self.repo, "nope")

    def test_message_validation(self):
        self.assertEqual(validators.validate_chat_message("  hi\nthere "), "hi\nthere")
        for bad in ("", "   ", "x" * 1001, "bad\x00char"):
            with self.assertRaises(ValueError):
                validators.validate_chat_message(bad)
        self.assertEqual(validators.validate_chat_contact(None), "")


if __name__ == "__main__":
    unittest.main()
