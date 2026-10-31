# Nails By Gift

A WhatsApp-first nail salon website for Nails By Gift in Abule-Egba, Lagos. Customers can browse services and nail-work photos, check available dates and preferred start times, then send a booking request to Gift on WhatsApp. Gift manages confirmed appointments and availability in a private dashboard.

## Features

- Responsive landing page with salon details, services, styles, and a nail-work gallery.
- Lazy-loaded gallery photos with loading placeholders.
- Availability calendar showing open, full, and blocked dates.
- Preferred start times at 10:00 am, 1:00 pm, and 4:00 pm.
- Booking requests open WhatsApp with the customer’s selected details. Customers can attach inspiration photos in WhatsApp.
- Private owner dashboard at `/owner` with email magic-link sign-in.
- Appointment management, booking status, deposit status, and agreed price.
- Daily booking limit controls (2 or 3) and per-date controls for a custom limit and closed start times.
- Whole-day closures and availability checks that prevent overlapping active appointments.

## How booking works

The customer form sends a request to WhatsApp; it does not create or reserve an appointment in the database. Gift discusses the design, price, home-service travel cost, and deposit with the customer, then records the agreed appointment in the dashboard. The public calendar reflects appointments Gift has recorded. Requests remain subject to Gift’s confirmation.

Gift can mark a deposit as pending or received and set the appointment status. Appointments awaiting a deposit or confirmed reserve their times. Cancelled and completed appointments do not reserve availability. Emergency appointments are arranged directly with Gift on WhatsApp.

The salon is open Monday through Saturday, 10:00 am–6:00 pm Lagos time, and closed Sundays. Regular appointments are typically two to three hours. The dashboard fixes a 4:00 pm regular appointment to two hours so it ends by closing time. Prices can vary by design and are confirmed with Gift.

## Contact

- WhatsApp: [+234 901 381 4632](https://wa.me/2349013814632)
- TikTok: [@nailsbygift145](https://www.tiktok.com/@nailsbygift145)
- Salon: 13 Amusan Street, off Babs Ogunwole Street, by Samadola Junction, Abule-Egba, Lagos, Nigeria

## Technology

- React and Vite
- Supabase Auth and PostgreSQL
- WhatsApp links for booking conversations
- Vercel deployment

## Run locally

### Requirements

- Node.js and npm
- Access to the Nails By Gift Supabase project

### 1. Clone and install

```powershell
git clone https://github.com/Isreal-Jumbo/nails-by-gift-booking.git
cd nails-by-gift-booking
npm install
```

### 2. Add local Supabase settings

Copy the example environment file and edit the new `.env.local` file:

```powershell
Copy-Item .env.example .env.local
```

Fill in the Supabase project URL and **publishable** key from the Supabase project’s API settings:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Do not put a Supabase secret or `service_role` key in this file. The browser app uses only the publishable key; database permissions and Row Level Security protect private data. `.env.local` is ignored by Git.

### 3. Prepare Supabase

For a brand-new database, run the SQL files in `supabase/migrations/` once, in timestamp order, using the Supabase SQL Editor. They create the booking tables, public availability functions, owner-only policies, and per-date scheduling controls.

If the project already has the earlier migrations applied, run only migrations that have not yet been applied. In particular, `20261030170000_date_booking_overrides.sql` adds the date-specific limit and time controls and updates the public availability function. Do not rerun `20261030120000_initial_booking_schema.sql` on a database where those tables already exist.

Create or invite Gift’s account in **Authentication → Users**, then add that account to `public.business_owners` using the account email in this SQL:

```sql
insert into public.business_owners (user_id)
select id
from auth.users
where email = 'owner@example.com'
on conflict (user_id) do nothing;
```

Replace `owner@example.com` with the email address of the Auth account. Only an account in `business_owners` can use the owner dashboard.

For local magic-link sign-in, add `http://localhost:5173/owner` under **Authentication → URL Configuration → Redirect URLs**. Keep the Vite server running when opening the sign-in link.

### 4. Start the development server

```powershell
npm run dev
```

Open the local URL printed in the terminal. The owner dashboard is at `/owner` (normally `http://localhost:5173/owner`).

## Deploy to Vercel

1. Import `Isreal-Jumbo/nails-by-gift-booking` from GitHub in Vercel.
2. Use the Vite preset, build command `npm run build`, and output directory `dist`.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the Vercel project’s environment variables, then deploy.
4. In Supabase **Authentication → URL Configuration**, set the Site URL to the deployed site and add the deployed `/owner` URL to Redirect URLs. Keep `http://localhost:5173/owner` for local development.
5. Test the public calendar and Gift’s sign-in on the deployed domain.

The included `vercel.json` rewrites app routes such as `/owner` to the React application entry point.

## Useful commands

```powershell
npm run dev      # Start local development
npm run build    # Create the production build in dist/
npm run preview  # Preview the production build locally
npm run format   # Format source, project docs, and configuration files
```

## Project structure

```text
public/
  images/                 Salon gallery and image assets
  videos/                 Hero video assets
src/
  components/             Booking form and shared interface pieces
  pages/                  Customer home page and owner dashboard
  services/               Supabase availability, dashboard, and WhatsApp helpers
  styles/                 Customer and owner page styles
supabase/
  migrations/             Database schema, availability RPCs, and access policies
docs/
  PROJECT_PLAN.md         Product requirements and operating rules
.env.example              Local environment variable template
vercel.json               Client-side route rewrite for Vercel
```

## Security and privacy

- Never commit `.env.local` or a Supabase secret / `service_role` key.
- Appointment and customer records are private to approved owner accounts through Row Level Security.
- The public availability function returns dates and open start times only; it does not return customer details.
- The customer request form sends details to WhatsApp and does not store them in Supabase.

See [the project plan](docs/PROJECT_PLAN.md) for the product scope and business rules.
