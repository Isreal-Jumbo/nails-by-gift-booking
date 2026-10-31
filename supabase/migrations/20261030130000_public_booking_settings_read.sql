-- Public visitors may read non-sensitive salon booking settings only.
-- Appointment and customer information remains inaccessible to anon clients.
revoke all on table public.business_settings from anon, authenticated;
grant select on table public.business_settings to anon, authenticated;

create policy "Public can read booking settings"
  on public.business_settings
  for select
  to anon, authenticated
  using (singleton = true);