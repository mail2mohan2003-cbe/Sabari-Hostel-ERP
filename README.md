# Sri Sabari Ladies Hostel - ERP

A web application covering digital registration, room/bed occupancy, vacancy forecasting, EB
(electricity) billing, payment tracking, and receipts for the hostel's 65 rooms (60 two-share, 5
four-share = 140 beds).

## Features

- **Public registration form** (`/register`) - digital version of the paper form, shareable as a
  link with prospective inmates. Submissions land in an admin approval queue.
- **Admin approval workflow** (`/admin/registrations`) - review a submission, allot a room/bed, set
  the advance amount and joining date, and approve. On approval, a confirmation is emailed and
  sent via WhatsApp/SMS to the parent/guardian and local guardian/emergency contact automatically.
- **Dashboard** (`/admin`) - live bed vacancy by room, a vacancy forecast for any future date
  (based on inmates' declared expected checkout dates), an upcoming-checkouts timeline, and a
  payment dues summary.
- **Rooms & Inmates** (`/admin/rooms`) - see every room's beds and current occupant, check an
  inmate out to free the bed.
- **EB Billing** (`/admin/billing`) - enter each room's monthly meter reading; the system computes
  units consumed since the last reading at Rs 14/unit and splits the bill equally among that
  room's currently active inmates, due on the 5th of the following month.
- **Payments & Receipts** (`/admin/payments`) - record a payment against a bill (cash/UPI/bank
  transfer), auto-flag unpaid bills as overdue after the 5th, and generate a printable receipt
  (`/admin/receipts/[id]`, use the browser's "Print > Save as PDF").

## Tech stack

Next.js 16 (App Router, React 19, TypeScript) + Prisma + Postgres + Tailwind CSS.
Email via Nodemailer/SMTP, WhatsApp/SMS via Twilio. Admin auth is a single admin account (from
environment variables) with a signed session cookie - no third-party auth service required.

## Local setup

1. Install [Node.js 20+](https://nodejs.org).
2. Create a free Postgres database at [neon.tech](https://neon.tech) (sign up, create a project,
   copy the connection string it gives you - it looks like
   `postgresql://user:password@host/dbname?sslmode=require`). This same database is used for both
   local development and the deployed app, so you only set it up once.
3. Open a terminal in this folder and install dependencies:
   ```
   npm install
   ```
4. Copy the environment file and fill in real values:
   ```
   copy .env.example .env
   ```
   Set `DATABASE_URL` to the Neon connection string from step 2, plus `ADMIN_EMAIL`,
   `ADMIN_PASSWORD`, and `SESSION_SECRET`. Email and WhatsApp/SMS settings can be left blank while
   testing - the app will log to the console instead of sending.
5. Create the database tables and seed the 65 rooms / 140 beds:
   ```
   npx prisma migrate dev --name init
   npm run seed
   ```
6. Start the app:
   ```
   npm run dev
   ```
   Visit `http://localhost:3000`. The registration form is at `/register`, the admin login at
   `/admin/login` (use the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in `.env`).

If room numbering in `prisma/seed.ts` doesn't match your real numbering scheme, edit the
`ROOM_LAYOUT` logic there before seeding (it currently numbers rooms 101-113, 201-213 ... 501-513,
with the last room on each floor as one of the 5 four-share rooms).

## Configuring notifications

- **Email**: set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` in `.env`. Gmail
  works with an [app password](https://support.google.com/accounts/answer/185833).
- **WhatsApp/SMS**: create a [Twilio](https://www.twilio.com) account, get a WhatsApp-enabled
  sender (Twilio Sandbox for testing, or an approved WhatsApp Business sender for production), and
  set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`, `TWILIO_SMS_FROM`.

Until these are configured, the app runs normally and simply logs what it would have sent.

## Deploying so the registration link works from anywhere (Vercel + Neon)

This is free and doesn't require managing a server. High-level steps:

1. **Put the code on GitHub.** Create a free [GitHub](https://github.com) account if you don't
   have one, create a new repository, and push this project to it (GitHub Desktop is the easiest
   way if you're not comfortable with git commands).
2. **Create a free [Vercel](https://vercel.com) account** and sign in with GitHub.
3. **Import the repository** into Vercel ("Add New Project" > select your repo).
4. **Add environment variables** in the Vercel project's Settings > Environment Variables - copy
   every value from your local `.env` file (`DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
   `SESSION_SECRET`, and the SMTP/Twilio ones if configured). You're reusing the same Neon
   database, so no separate production database setup is needed.
5. **Deploy.** Vercel builds the app and gives you a live URL like
   `https://your-project.vercel.app`.
6. Go back to Environment Variables, set `NEXT_PUBLIC_APP_URL` to that live URL, and redeploy so
   confirmation messages link to the right place.

The database tables and seeded rooms already exist from the local setup steps (same Neon
database), so there's nothing further to run in production.

Once deployed, share the `/register` URL (e.g. `https://your-project.vercel.app/register`) with
prospective inmates. If you'd rather use your own domain name (e.g. `hostel.srisabari.in`) instead
of the `vercel.app` one, add it under the project's Settings > Domains in Vercel.

## Data model notes

- A **Bed** stays linked to every inmate who has ever occupied it (for history); "vacant" is
  computed as "no inmate with `status = ACTIVE`" on that bed.
- **Vacancy forecasting** is rule-based, not machine learning: it looks at each active inmate's
  optional `expectedCheckoutDate` (captured at registration or set by the admin) and projects which
  beds will be free by a chosen future date. Inmates without a declared checkout date are assumed
  to stay indefinitely. Accuracy improves as staff keep expected checkout dates up to date.
- **EB bills** are generated per meter reading, split evenly across a room's currently active
  inmates at the time the reading is entered.
- Admin login is a single shared account by design (matches a small hostel office team). If you
  need multiple named admin logins with audit trails later, that would need a small extension to
  the auth system.

## What to test before relying on this day-to-day

- Submit a test registration via `/register`, approve it in `/admin/registrations`, and confirm
  the email/WhatsApp confirmation behaves as expected (or logs correctly if not yet configured).
- Enter a couple of EB meter readings for a room and confirm the bill split and due date look
  right.
- Record a payment and check the printed receipt.
- Check the dashboard's forecast numbers make sense once a few inmates have expected checkout
  dates set.
