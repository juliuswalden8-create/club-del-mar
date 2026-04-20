create extension if not exists pgcrypto;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  source text not null default 'website',
  name text not null,
  email text not null,
  phone text not null,
  booking_date date not null,
  booking_time time not null,
  guests integer not null check (guests between 1 and 12),
  notes text not null default '',
  language text not null default 'en',
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists bookings_created_at_idx
  on public.bookings (created_at desc);

create index if not exists bookings_date_time_idx
  on public.bookings (booking_date, booking_time);

alter table public.bookings enable row level security;

comment on table public.bookings is 'Club Del Mar reservations created from the website booking form.';
