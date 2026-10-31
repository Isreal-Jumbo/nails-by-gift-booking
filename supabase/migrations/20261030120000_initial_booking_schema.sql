-- Nails By Gift's first database schema.
-- Run this only after reviewing it together in Supabase's SQL Editor.

-- One settings row controls the regular daily booking cap and salon hours.
create table public.business_settings (
  singleton boolean primary key default true check (singleton),
  daily_booking_limit smallint not null default 2
    check (daily_booking_limit in (2, 3)),
  opening_time time not null default time '10:00',
  closing_time time not null default time '18:00',
  time_zone text not null default 'Africa/Lagos',
  updated_at timestamptz not null default now(),
  check (closing_time > opening_time)
);

insert into public.business_settings (singleton)
values (true)
on conflict (singleton) do nothing;

-- Gift can block a whole day when she is unavailable.
create table public.blocked_dates (
  blocked_date date primary key,
  note text,
  created_at timestamptz not null default now()
);

-- Appointment and customer information is private.
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  customer_name text not null,
  customer_phone text not null,
  service_name text not null,
  design_notes text,
  visit_type text not null default 'salon'
    check (visit_type in ('salon', 'home_service')),
  home_address text,
  booking_type text not null default 'regular'
    check (booking_type in ('regular', 'emergency')),
  agreed_price_ngn integer check (agreed_price_ngn is null or agreed_price_ngn >= 0),
  deposit_status text not null default 'pending'
    check (deposit_status in ('pending', 'received')),
  status text not null default 'awaiting_deposit'
    check (status in ('awaiting_deposit', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  check (
    booking_type = 'emergency'
    or (
      extract(dow from appointment_date) <> 0
      and start_time >= time '10:00'
      and end_time <= time '18:00'
    )
  )
);

create index appointments_date_status_idx
  on public.appointments (appointment_date, status);

-- RLS is enabled now, with no browser access policies yet. We'll add narrowly
-- scoped owner and public-availability policies in a later reviewed migration.
alter table public.business_settings enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.appointments enable row level security;
