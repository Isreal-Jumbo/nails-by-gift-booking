# Nails By Gift — product scope

## Goal

Give customers a polished way to browse Nails By Gift’s work, check preferred appointment times, and start a booking conversation with Gift on WhatsApp. Give Gift a private dashboard for the schedule and availability.

## Business details

- Business: Nails By Gift
- Salon: 13 Amusan Street, off Babs Ogunwole Street, by Samadola Junction, Abule-Egba, Lagos, Nigeria
- WhatsApp: +234 901 381 4632
- TikTok: @nailsbygift145
- Time zone: Africa/Lagos
- Hours: Monday–Saturday, 10:00 am–6:00 pm; closed Sunday
- Home service: available within Lagos; travel cost is agreed in WhatsApp
- Typical set length: two to three hours
- Usual daily capacity: two appointments; Gift can raise it to three
- Deposit: paid manually and marked by Gift in the dashboard
- Emergency requests: arranged through WhatsApp
- No online checkout or customer accounts

## Customer flow

1. Browse the landing page, services, nail styles, and gallery.
2. Select an available date and a preferred start time: 10:00 am, 1:00 pm, or 4:00 pm.
3. Select a service and salon or home service, enter contact details and optional design notes.
4. Continue to WhatsApp with a prefilled request. Customers can attach design inspiration there.
5. Gift and the customer agree on the design, final price, travel cost when relevant, and deposit.
6. Gift records the agreed appointment and deposit status in the owner dashboard.

The website sends a request; it does not reserve an appointment. Availability reflects appointments Gift has entered. The page tells customers that Gift must confirm the requested appointment.

## Availability rules

- Sundays and whole days marked unavailable are closed.
- The public calendar shows only open days and start times; it does not expose customer details.
- Active appointments awaiting a deposit or confirmed reserve their recorded time. Cancelled and completed appointments do not reserve availability.
- The system checks appointment overlap before showing a preferred start time.
- A global daily limit can be set to two or three appointments.
- Gift can set a one-day limit from one to three and close individual start times for that date. A full day can be managed with a whole-day closure.
- Dashboard entries at 4:00 pm are fixed to two hours so regular appointments finish by 6:00 pm.
- Emergency appointments are not offered in the public booking form; they are arranged directly with Gift.

## Owner dashboard

The private `/owner` page uses Supabase email magic-link sign-in. Only users listed in `public.business_owners` may manage records. Gift can:

- Add and update appointments, services, visit type, notes, agreed price, and appointment status.
- Mark a deposit pending or received.
- Set the global daily booking limit to two or three.
- Block and reopen whole dates.
- Set a date-specific booking limit and close selected public start times.

Because customer requests are handled in WhatsApp, Gift must enter an agreed booking in the dashboard for it to affect public availability.

## Implementation

- React and Vite frontend.
- Supabase Auth and PostgreSQL database.
- Row Level Security protects appointments, blocked dates, per-date overrides, and owner actions.
- A security-definer availability function returns only dates and available start times.
- Public salon photos and video are static assets in `public/images` and `public/videos`.
- Gallery photos load lazily with placeholders.
- Vercel hosts the production site; `vercel.json` supports direct visits to client-side routes such as `/owner`.

## Database objects

- `business_settings`: operating hours, time zone, and global daily limit.
- `appointments`: owner-entered customer appointments, statuses, deposit status, and agreed price.
- `blocked_dates`: whole-day closures.
- `date_booking_overrides`: per-date booking limit and unavailable preferred start times.
- `business_owners`: approved Supabase Auth user IDs.
- `get_public_booking_time_availability`: public date/time availability without customer data.

SQL migrations are stored in `supabase/migrations/` and should be applied once, in timestamp order, to a new database.

## Current status and next step

The customer page, availability calendar, WhatsApp request flow, owner dashboard, and date-specific controls are implemented. The current Supabase project has the migrations applied and the local production build succeeds. The next project step is deploying to Vercel, adding the two Vite Supabase variables there, and configuring the production Auth redirect URL.
