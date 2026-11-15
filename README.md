# Car Rental Website

React 19 + Vite + Tailwind CSS v4 + React Router, with a FastAPI backend (`backend/`).
Theme: premium Black / White / Red. Runs on **mock data**: no database is connected.

## Run (two terminals)

Backend (see `backend/README.md`):
```bash
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Frontend:
```bash
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173). If the backend is not running, the car pages
still work from sample data in `src/data/cars.js`; login, booking and contact need the backend.

Mock logins (development only): `demo@example.com` / `Demo12345` and `admin@example.com` / `Admin12345`.

## Pages

| Path | Page |
|---|---|
| `/` | Home: hero, featured cars, why choose us, how it works |
| `/cars`, `/cars/:id` | Fleet with search, category, price filters and sorting; car details |
| `/booking` | Booking form with live price and availability |
| `/services`, `/about`, `/contact` | Info pages and contact form |
| `/login`, `/register` | Authentication |
| `/account/bookings` | My bookings (login required) |
| `/admin` | Confirm / cancel bookings (admin only) |

## Your content to replace

- Car photos: `public/images/hero.png`, `public/images/showroom.png` and `public/images/cars/*.png` (3 cars; see `src/data/cars.js`)
- Cars, names, prices: `src/data/cars.js` (and the matching mock data in `backend/app/repositories/memory.py`)
- Brand name, phone, email, address: `src/config/site.js`
- Services, About text, "why choose us" copy are placeholders: `src/data/services.js`, `src/pages/About.jsx`

## Structure

```
src/
  components/ui/       Button, Container, Field, PageHeader, SectionHeading, StatusBadge
  components/layout/   Navbar, Footer, Layout
  components/home/     Hero, CarShowcase, WhyChooseUs, HowItWorks
  components/cars/     CarCard (3D tilt)
  components/booking/  BookingForm, BookingSummary
  components/auth/     RequireAuth (route guard)
  context/             AuthContext
  hooks/               useCars (API with mock fallback), useTilt
  lib/api.js           every call to the backend lives here
  pages/               one file per page
  utils/               pricing, validation, filters
backend/               FastAPI API (see backend/README.md)
```

## Theme

Defined in `src/index.css` under `@theme`: `brand` (red), `ink` (black), `charcoal`, `graphite`, `line`, `mist`.
