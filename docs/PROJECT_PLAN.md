# Nails By Gift — project plan

## Goal

Make it easy for customers to see Nails By Gift's services and work, choose a
preferred appointment date and time, and continue the conversation in WhatsApp.
Gift discusses custom designs, final pricing, home-service travel costs, and
deposit instructions with the customer there.

## Confirmed business details

- Business name: Nails By Gift
- Salon address: 13 Amusan Street, off Babs Ogunwole Street, by Samadola
  Junction, Abule-Egba, Lagos, Nigeria
- WhatsApp: +234 901 381 4632
- TikTok: @nailsbygift145
- Opening hours: 10:00 a.m.–6:00 p.m., Monday through Saturday
- Closed: Sunday
- Home service: available within Lagos; travel cost is agreed in WhatsApp
- Usual capacity: two appointments per day; Gift may raise the limit to three
- Typical appointment length: about two to three hours
- Deposits: paid manually; Gift verifies and records them
- Emergency appointments: requests through WhatsApp only
- No online checkout or customer accounts in the first version

## Customer experience

1. Browse the salon introduction, contact information, service options, and
   photos of Gift's work.
2. Choose a service and, if desired, a nail shape or design idea.
3. Choose salon or home service and a preferred available date and time.
4. Use a WhatsApp call to action to send the request details to Gift. Customers
   can attach inspiration photos directly in WhatsApp.
5. Discuss the design, final price, travel cost if applicable, and deposit.
6. Gift confirms the appointment after agreeing on the details and verifying the
   deposit.

A requested time is not reserved until Gift confirms it. The public calendar is
based on appointments Gift has recorded, so it must say that availability is
subject to confirmation.

## Services and pricing display

- Acrylic nails: ₦18,000–₦20,000 usual range
- Gel nails: ₦12,000–₦15,000 usual range
- Toe nails: service offered; price to be supplied
- Final prices can vary with the design and are negotiated in WhatsApp.
- Shapes include almond, duck, stiletto, and square.
- Design ideas include cat eye, French tips, marble, and plain nails.
- Emergency requests are handled separately in WhatsApp and may have an extra
  charge agreed with Gift.

## Frontend pages and sections

- Home page with salon introduction and booking/contact calls to action
- Services and styles with indicative prices and a custom-design WhatsApp link
- Gallery of Gift's nail-work photos
- Availability calendar and preferred-time selection
- Booking request summary that opens WhatsApp with the selected details
- Contact section with address, salon contacts, and map link if supplied
- Private Gift dashboard for appointments, blocked dates, daily capacity,
  services, and gallery photos

## Backend and data

Use Supabase with PostgreSQL, owner authentication, and image storage. The
website may read public service, published gallery, and available-time data.
Customer and appointment details must stay private to the owner dashboard.

Planned data groups:

- `services`: service name, estimated duration, indicative minimum and maximum
  price, active status
- `appointments`: requested/confirmed appointment date and time, service,
  customer contact, visit type, negotiated price, deposit status, and booking
  status
- `business_hours`: open days and hours
- `business_settings`: daily booking limit (starts at two; Gift can raise it to
  three) and `Africa/Lagos` time zone
- `blocked_dates`: days or times Gift is unavailable
- `gallery_photos`: stored image path, caption/alt text, publication status, and
  display order

The backend must recheck availability when Gift records or confirms an
appointment. A date is unavailable when the daily limit is reached or no
appointment time remains that fits within 10:00 a.m.–6:00 p.m. The initial limit
is two; raising it to three does not override time conflicts or the closing
time.

## Planned repository layout

```text
nails-by-gift-booking/
├── docs/
│   └── PROJECT_PLAN.md
├── public/
│   └── images/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   ├── functions/
│   └── migrations/
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── README.md
```

This is a small, feature-based layout: page components live in `pages`, shared
interface pieces in `components`, and database/WhatsApp helpers in `services`.
We can adjust it before creating the folders or installing dependencies.

## Still needed before implementation

- Confirm that service durations may start as adjustable estimates within the
  usual two-to-three-hour range
- Toe-nail indicative price, if it should be displayed
- Photos for the gallery
- Any additional contact details Gift wants shown

Do not put Supabase secret keys or customer information in GitHub. The browser
will use only the Supabase project URL and publishable key; database access must
be restricted with Row Level Security. Owner-only actions must require Gift's
authenticated account.

## Build sequence

1. Confirm the remaining business details and this plan.
2. Agree on the folder/file layout and add the project scaffold.
3. Choose and install dependencies.
4. Create the Supabase schema and access rules.
5. Build the customer pages and WhatsApp request flow.
6. Build the owner dashboard and availability management.
7. Verify the booking rules, mobile layout, and deployment settings.
