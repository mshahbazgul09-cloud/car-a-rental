-- ALREADY APPLIED to the Supabase project 'car-a-rental' (with schema_users_contact.sql).
-- Kept so the database can be rebuilt: run this, then schema_users_contact.sql, in the SQL Editor.
-- Creates the cars + bookings tables and a database-level rule that makes it
-- impossible to have two CONFIRMED bookings for the same car on overlapping dates.

create extension if not exists btree_gist with schema extensions;

-- ---------- Cars ----------
create table if not exists public.cars (
  id            text primary key,                      -- must match the ids in src/data/cars.js
  name          text not null,
  model         text not null,
  category      text not null default 'Standard',
  year          integer not null,
  seats         integer not null check (seats > 0),
  transmission  text not null,
  fuel          text not null,
  price_per_day numeric(10,2) not null check (price_per_day > 0),
  image         text not null default '',               -- e.g. /images/cars/your-car.png
  description   text not null default '',
  features      text[] not null default '{}',
  active        boolean not null default true
);

-- SAMPLE rows matching src/data/cars.js. Edit names/prices to your real fleet.
insert into public.cars (id, name, model, category, year, seats, transmission, fuel, price_per_day, image, description, features) values
  ('car-1','Mercedes-Benz','S-Class','Luxury',2024,5,'Automatic','Petrol',250,'/images/cars/mercedes-s-class.png','Flagship comfort with a hand-finished interior and effortless power.', array['Leather seats','Panoramic roof','Massage seats','Premium sound']),
  ('car-2','Audi','e-tron GT','Electric',2024,5,'Automatic','Electric',260,'/images/cars/audi-e-tron-gt.png','A silent electric grand tourer with supercar pace and striking lines.', array['Fast charging','Matrix LED lights','Virtual cockpit','Premium sound']),
  ('car-3','Mercedes-Benz','EQS','Electric',2024,5,'Automatic','Electric',280,'/images/cars/mercedes-eqs.png','Electric luxury with a calm, spacious cabin and a long range.', array['Long range','Air suspension','Hyperscreen','Heated seats'])
on conflict (id) do nothing;

-- ---------- Bookings ----------
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  car_id          text not null references public.cars(id),
  customer_name   text not null check (char_length(customer_name) between 2 and 80),
  phone           text not null check (char_length(phone) between 7 and 20),
  pickup_location text not null check (char_length(pickup_location) between 3 and 120),
  pickup_date     date not null,
  return_date     date not null,
  rental_days     integer generated always as (return_date - pickup_date) stored,
  price_per_day   numeric(10,2) not null,              -- rate at time of booking
  total_price     numeric(10,2) not null,              -- calculated by the backend
  status          text not null default 'pending'
                    check (status in ('pending', 'confirmed', 'cancelled')),
  created_at      timestamptz not null default now(),

  constraint return_after_pickup check (return_date > pickup_date),

  -- Two confirmed bookings of the same car cannot overlap.
  -- '[)' means the return day is free: one customer can return a car on the
  -- same day the next customer picks it up.
  constraint no_overlapping_confirmed_bookings exclude using gist (
    car_id with =,
    daterange(pickup_date, return_date, '[)') with &&
  ) where (status = 'confirmed')
);

create index if not exists bookings_car_dates_idx on public.bookings (car_id, pickup_date, return_date);

-- ---------- Security ----------
-- RLS on with NO policies = the public (anon) key cannot read or write these tables.
-- Only the FastAPI backend can, using the service-role key (which bypasses RLS).
alter table public.cars     enable row level security;
alter table public.bookings enable row level security;
