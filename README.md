# Nails By Gift

A simple, WhatsApp-first appointment website for Nails By Gift in Abule-Egba,
Lagos. Customers can browse services and nail-work photos, see published
availability, then contact Gift on WhatsApp to discuss a design, final price,
and appointment.

## Contact

- WhatsApp: [+234 901 381 4632](https://wa.me/2349013814632)
- TikTok: [@nailsbygift145](https://www.tiktok.com/@nailsbygift145)
- Salon: 13 Amusan Street, off Babs Ogunwole Street, by Samadola Junction,
  Abule-Egba, Lagos, Nigeria

## Planned stack

- React and Vite for the customer pages and owner dashboard
- Supabase for the private appointment schedule and owner sign-in
- WhatsApp for booking conversations, design review, and manual deposit
  coordination
- Vercel for hosting

There will be no online checkout in the first version. A time is confirmed only
after Gift agrees with the customer and verifies the deposit.

Gallery photos and the hero video are kept as public files in
`public/images` and `public/videos`. Customers will attach their own inspiration
photos directly in WhatsApp.

## Project status

The React/Vite foundation and the first customer landing page are in progress.
The WhatsApp calls to action and sample gallery are wired up. The availability
calendar, owner sign-in, and dashboard still need to be connected to Supabase.
See [the project plan](docs/PROJECT_PLAN.md).
