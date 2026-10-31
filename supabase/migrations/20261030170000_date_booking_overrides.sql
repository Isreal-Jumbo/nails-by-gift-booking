-- Let Gift adjust the booking limit and close selected start times for one date.
-- Appointment and customer records remain private; the public RPC returns only availability.
create table if not exists public.date_booking_overrides (
  booking_date date primary key,
  daily_booking_limit smallint
    check (daily_booking_limit is null or daily_booking_limit between 1 and 3),
  unavailable_times time[] not null default array[]::time[],
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    unavailable_times <@ array[time '10:00', time '13:00', time '16:00']
  )
);

alter table public.date_booking_overrides enable row level security;
revoke all on table public.date_booking_overrides from anon, authenticated;
grant select, insert, update, delete
  on table public.date_booking_overrides to authenticated;

drop policy if exists "Owner manages date booking overrides"
  on public.date_booking_overrides;
create policy "Owner manages date booking overrides"
  on public.date_booking_overrides
  for all
  to authenticated
  using ((select public.is_nails_by_gift_owner()))
  with check ((select public.is_nails_by_gift_owner()));

create or replace function public.get_public_booking_time_availability(
  p_start_date date,
  p_end_date date
)
returns table (
  availability_date date,
  is_available boolean,
  is_blocked boolean,
  available_times text[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_start_date is null
    or p_end_date is null
    or p_end_date < p_start_date
    or p_end_date > p_start_date + 90
  then
    raise exception 'Choose a valid date range of 90 days or less.'
      using errcode = '22023';
  end if;

  return query
  select
    days.day_value::date as availability_date,
    pg_catalog.cardinality(time_slots.available_times) > 0 as is_available,
    exists (
      select 1
      from public.blocked_dates as blocked
      where blocked.blocked_date = days.day_value::date
    ) as is_blocked,
    time_slots.available_times
  from pg_catalog.generate_series(
    p_start_date::timestamp,
    p_end_date::timestamp,
    interval '1 day'
  ) as days(day_value)
  cross join public.business_settings as settings
  left join public.date_booking_overrides as date_override
    on date_override.booking_date = days.day_value::date
  left join lateral (
    select pg_catalog.count(*) as active_count
    from public.appointments as appointment
    where appointment.appointment_date = days.day_value::date
      and appointment.status in ('awaiting_deposit', 'confirmed')
  ) as booked on true
  cross join lateral (
    select coalesce(
      pg_catalog.array_agg(
        pg_catalog.to_char(slot.start_time, 'HH24:MI')
        order by slot.start_time
      ),
      array[]::text[]
    ) as available_times
    from (values
      (time '10:00'),
      (time '13:00'),
      (time '16:00')
    ) as slot(start_time)
    where booked.active_count < coalesce(
        date_override.daily_booking_limit,
        settings.daily_booking_limit
      )
      and pg_catalog.date_part('dow', days.day_value::date) <> 0
      and not exists (
        select 1
        from public.blocked_dates as blocked
        where blocked.blocked_date = days.day_value::date
      )
      and not (
        slot.start_time = any(
          coalesce(date_override.unavailable_times, array[]::time[])
        )
      )
      and not exists (
        select 1
        from public.appointments as appointment
        where appointment.appointment_date = days.day_value::date
          and appointment.status in ('awaiting_deposit', 'confirmed')
          and slot.start_time < appointment.end_time
          and slot.start_time + interval '3 hours' > appointment.start_time
      )
  ) as time_slots
  where settings.singleton = true;
end;
$$;

revoke all on function public.get_public_booking_time_availability(date, date)
  from public, anon, authenticated;
grant execute on function public.get_public_booking_time_availability(date, date)
  to anon, authenticated;
