-- ALREADY APPLIED to the Supabase project 'car-a-rental'. Run after schema.sql when rebuilding.
-- It adds what the login and contact features need.

create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 80),
  email         text not null unique check (email = lower(email)),
  phone         text not null,
  password_hash text not null,
  role          text not null default 'customer' check (role in ('customer', 'admin')),
  created_at    timestamptz not null default now()
);

-- Link bookings to the customer who made them (null = guest booking).
alter table public.bookings
  add column if not exists user_id uuid references public.users(id) on delete set null;
create index if not exists bookings_user_idx on public.bookings (user_id);

create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text not null,
  message    text not null,
  created_at timestamptz not null default now()
);

-- Same protection as the other tables: only the backend (service-role key) can access them.
alter table public.users            enable row level security;
alter table public.contact_messages enable row level security;

-- Note: the website uses its own email + password login (users table above).
-- If you prefer Supabase Auth instead, replace app/security.py and the /api/auth routes.

-- The owner's email becomes an admin automatically when it registers. Everyone else is a customer.
create or replace function public.make_owner_admin()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.email = 'gullsafs@gmail.com' then
    new.role := 'admin';
  end if;
  return new;
end $$;

revoke execute on function public.make_owner_admin() from public, anon, authenticated;

drop trigger if exists users_make_owner_admin on public.users;
create trigger users_make_owner_admin
  before insert on public.users
  for each row execute function public.make_owner_admin();

-- ---------- Live chat ----------
-- One thread per visitor conversation. The visitor's secret token is stored only as a hash.
create table if not exists public.chat_threads (
  id                   uuid primary key default gen_random_uuid(),
  visitor_name         text not null check (char_length(visitor_name) between 2 and 80),
  contact              text not null default '' check (char_length(contact) <= 120),
  user_id              uuid references public.users(id) on delete set null,
  token_hash           text not null,
  status               text not null default 'open' check (status in ('open','closed')),
  admin_unread         boolean not null default false,
  last_message_preview text not null default '',
  last_message_at      timestamptz not null default now(),
  created_at           timestamptz not null default now()
);
create index if not exists chat_threads_last_idx on public.chat_threads (last_message_at desc);

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.chat_threads(id) on delete cascade,
  sender     text not null check (sender in ('visitor','admin')),
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_thread_idx on public.chat_messages (thread_id, created_at);

-- Keep each thread's preview and time in step with its newest message.
create or replace function public.chat_touch_thread()
returns trigger language plpgsql set search_path = '' as $$
begin
  update public.chat_threads
     set last_message_preview = left(new.body, 120),
         last_message_at = new.created_at
   where id = new.thread_id;
  return new;
end $$;
revoke execute on function public.chat_touch_thread() from public, anon, authenticated;

drop trigger if exists chat_messages_touch_thread on public.chat_messages;
create trigger chat_messages_touch_thread
  after insert on public.chat_messages
  for each row execute function public.chat_touch_thread();

alter table public.chat_threads  enable row level security;
alter table public.chat_messages enable row level security;
