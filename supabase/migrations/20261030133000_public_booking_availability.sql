-- Return only day-level availability. Customer and appointment details stay private.
create or replace function public.get_public_booking_availability(
  p_start_date date,
  p_end_date date
)
returns table (
  availability_date date,
  is_available boolean,
  is_blocked boolean
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
    (
      coalesce(booked.active_count, 0) < settings.daily_booking_limit
      and not exists (
        select 1
        from public.blocked_dates as blocked
        where blocked.blocked_date = days.day_value::date
      )
    ) as is_available,
    exists (
      select 1
      from public.blocked_dates as blocked
      where blocked.blocked_date = days.day_value::date
    ) as is_blocked
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
  where settings.singleton = true;
end;
$$;

revoke all on function public.get_public_booking_availability(date, date)
  from public, anon, authenticated;
grant execute on function public.get_public_booking_availability(date, date)
  to anon, authenticated;