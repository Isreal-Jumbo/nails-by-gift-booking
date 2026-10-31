-- Owner access is tied to a Supabase Auth user ID, not a public email address.
create table if not exists public.business_owners (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.business_owners enable row level security;
revoke all on table public.business_owners from anon, authenticated;
grant select on table public.business_owners to authenticated;

drop policy if exists "Owner can read own membership" on public.business_owners;
create policy "Owner can read own membership"
  on public.business_owners
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.is_nails_by_gift_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.business_owners as owner_record
    where owner_record.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_nails_by_gift_owner() from public, anon, authenticated;
grant execute on function public.is_nails_by_gift_owner() to authenticated;

-- Appointment and closure records are never available to public visitors.
revoke all on table public.appointments, public.blocked_dates from anon, authenticated;
grant select, insert, update, delete
  on table public.appointments, public.blocked_dates
  to authenticated;

drop policy if exists "Owner manages appointments" on public.appointments;
create policy "Owner manages appointments"
  on public.appointments
  for all
  to authenticated
  using ((select public.is_nails_by_gift_owner()))
  with check ((select public.is_nails_by_gift_owner()));

drop policy if exists "Owner manages blocked dates" on public.blocked_dates;
create policy "Owner manages blocked dates"
  on public.blocked_dates
  for all
  to authenticated
  using ((select public.is_nails_by_gift_owner()))
  with check ((select public.is_nails_by_gift_owner()));

-- The settings stay readable by the public, but only the owner can change them.
grant select on table public.business_settings to anon, authenticated;
grant update on table public.business_settings to authenticated;

drop policy if exists "Owner updates booking settings" on public.business_settings;
create policy "Owner updates booking settings"
  on public.business_settings
  for update
  to authenticated
  using ((select public.is_nails_by_gift_owner()))
  with check ((select public.is_nails_by_gift_owner()));