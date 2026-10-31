-- Give customers open preferred start times without exposing appointment or customer data.
-- A public request needs a conservative 3-hour window; Gift confirms the final time in WhatsApp.
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
  left join lateral (
    select pg_catalog.count(*) as active_count
    from public.appointments as appointment
    where appointment.appointment_date = days.day_value::date
      and appointment.status in ('awaiting_deposit', 'confirmed')
  ) as booked on true
  cross join lateral (
    select coalesce(
      pg_catalog.array_agg(pg_catalog.to_char(slot.start_time, 'HH24:MI') order by slot.start_time),
      array[]::text[]
    ) as available_times
    from (values (time '10:00'), (time '13:00'), (time '16:00')) as slot(start_time)
    where booked.active_count < settings.daily_booking_limit
      and pg_catalog.date_part('dow', days.day_value::date) <> 0
      and not exists (
        select 1
        from public.blocked_dates as blocked
        where blocked.blocked_date = days.day_value::date
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
