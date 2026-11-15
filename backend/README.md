# Car Rental API (FastAPI)

Runs today on **temporary mock data held in memory**. There is no database, no Supabase connection and
nothing to configure. Data resets every time the server restarts.

## Run

```bash
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt      # Windows (macOS/Linux: .venv/bin/python)
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Docs and a try-it page: http://localhost:8000/docs  ·  Health check: http://localhost:8000/api/health

## Mock logins (development only)

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | Admin12345 |
| Customer | demo@example.com | Demo12345 |

They live in `app/repositories/memory.py` and disappear when you switch to a real database.
Never deploy this version publicly with these accounts.

## Endpoints

| Method | Path | Who | Purpose |
|---|---|---|---|
| GET | `/api/health` | anyone | Health check |
| GET | `/api/cars` | anyone | List cars. Query: `q`, `category`, `min_price`, `max_price`, `sort` |
| GET | `/api/cars/{id}` | anyone | One car |
| GET | `/api/cars/{id}/availability` | anyone | Confirmed (unavailable) date ranges |
| POST | `/api/auth/register` | anyone | Create account, returns a login token |
| POST | `/api/auth/login` | anyone | Log in, returns a login token |
| GET | `/api/auth/me` | logged in | Current user |
| POST | `/api/bookings` | guest or logged in | Create a booking (saved to the account if logged in) |
| GET | `/api/bookings/me` | logged in | My bookings |
| POST | `/api/bookings/{id}/cancel` | owner or admin | Cancel a booking |
| GET | `/api/admin/bookings` | admin | All bookings, optional `?status=` |
| PATCH | `/api/admin/bookings/{id}` | admin | Confirm or cancel (`{"status": "confirmed"}`) |
| POST | `/api/contact` | anyone | Contact form message |

Send the login token as `Authorization: Bearer <token>`.

## Booking rules

- New bookings are `pending`; an admin confirms them.
- Rental days = return date minus pickup date. The return day is free (same-day turnover is allowed).
- Max 90 days, no past pickup dates. The total is always calculated on the server.
- A booking is rejected (409) if it overlaps a **confirmed** booking of the same car. Pending bookings never block.
- Confirming a booking that would overlap another confirmed one is refused.

## How the code is organised

```
app/
  main.py            app, CORS, error handling
  config.py          settings (all optional, safe defaults)
  schemas.py         request/response models and input checks
  validators.py      plain validation functions
  services.py        business rules (pure Python)
  security.py        password hashing (scrypt) and login tokens (JWT)
  dependencies.py    get_repository() <- the switch for the database; login checks
  routers/           auth, cars, bookings, admin, contact
  repositories/
    base.py          the interface every data source must implement
    memory.py        TEMPORARY mock data (in use now)
    supabase_repo.py FUTURE Supabase version (empty placeholders, not connected)
tests/               unit tests
supabase/            SQL for when you connect Supabase yourself
main.py              OLDER single-file version that needs Supabase keys. Not used by the steps above.
```

## Tests

```bash
.venv\Scripts\python.exe -m unittest discover -s tests -t . -v
```

## When you are ready to connect Supabase (your step, later)

1. Run `supabase/schema.sql`, then `supabase/schema_users_contact.sql` in the Supabase SQL Editor.
2. Put your Supabase URL and service-role key in `.env` (copy `.env.example`) and load them in `app/config.py`.
3. Fill in the methods in `app/repositories/supabase_repo.py`. The older `main.py` already has working
   Supabase calls for cars, availability and bookings that you can copy from.
4. In `app/dependencies.py`, make `get_repository()` return `SupabaseRepository(...)`.

Routes, business rules and the website need no changes.

## Before going live

- Set a long random `JWT_SECRET` (otherwise logins reset on every restart).
- Set `ALLOWED_ORIGINS` to your real website address.
- Remove the mock accounts. Add login rate limiting (not included yet) and serve everything over HTTPS.
