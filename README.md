# Event Ticketing & Seat Booking System

DBMS Level 3 Experiential Learning mini project, PES University (Section 5-J).

| Member | SRN | Focus |
|---|---|---|
| Sakshi Ghodke | PES2UG24CS914 | Database design, SQL/MongoDB, backend API routes |
| Viren James Fernandes | PES2UG24CS590 | Frontend (Next.js UI) |

## What it does

Organizers publish events with a seating layout. Attendees browse events, pick seats, hold them for 10 minutes, and pay to confirm. The database guarantees that a seat can never be booked twice, expired holds release their seats automatically, and ticket prices respond to demand.

## Tech stack

- **Next.js 16** (App Router) with **Route Handlers** as the backend (`frontend/src/app/api/**`)
- **MySQL 8**: transactional data (users, events, seats, bookings, payments)
- **MongoDB**: event content and search (descriptions, banners, tags, artists, FAQs)
- Auth: **bcryptjs** password hashing, **JWT** in an httpOnly cookie
- Database access: `mysql2` (raw SQL, no ORM) and the official `mongodb` driver

## Why both SQL and NoSQL

| Data | Store | Reason |
|---|---|---|
| Users, seats, bookings, payments | MySQL | Needs ACID transactions, foreign keys and constraints. A booking, its seats, its hold and its payment must change together or not at all, and a seat must never be sold twice. |
| Event pages (description, banner, tags, artists, FAQs) | MongoDB | Flexible, nested, variable-shape documents. Every event has different artists and FAQs, which would need several sparse tables in SQL. MongoDB also gives full-text search (`$text` index) and tag aggregation without extra machinery. |

The two are linked by `event_id`. If the MongoDB write fails when an organizer creates an event, the MySQL rows are removed again (compensating delete), so the two stores stay consistent.

## Project structure

```
event-ticketing-system/
├── database/                 SQL scripts (run in numeric order)
│   ├── 01_schema.sql         12 tables, constraints, indexes
│   ├── 02_seed.sql           sample data
│   ├── 03_advanced_features.sql   procedures, trigger, event, function, view
│   ├── 04_fixes.sql          hardened booking procedures and trigger
│   ├── 05_dynamic_pricing.sql     demand-based pricing
│   └── 06_dml_queries.sql    INSERT/UPDATE/DELETE and SELECT query set
└── frontend/
    ├── scripts/seed-mongo.mjs     seeds MongoDB and creates the text index
    └── src/
        ├── lib/              db.ts, mongodb.ts, auth.ts
        └── app/api/          API route handlers
```

## Setup

**Prerequisites:** Node.js 20+, MySQL 8, MongoDB (local), Git.

1. **Clone and install**
   ```
   git clone https://github.com/virenfern/event-ticketing-system.git
   cd event-ticketing-system/frontend
   npm install
   ```
2. **Create the MySQL database.** From the `database` folder, open the MySQL client and run the scripts in order:
   ```
   mysql -u root -p
   source 01_schema.sql
   source 02_seed.sql
   source 03_advanced_features.sql
   source 04_fixes.sql
   source 05_dynamic_pricing.sql
   ```
   `03_advanced_features.sql` turns the MySQL event scheduler on (`SET GLOBAL event_scheduler = ON`), which needs a privileged user. If MySQL restarts, run that statement again.
3. **Create `frontend/.env.local`** (git-ignored, never committed):
   ```
   DB_HOST=localhost
   DB_USER=<your mysql user>
   DB_PASSWORD=<your mysql password>
   DB_NAME=event_booking
   JWT_SECRET=<a long random string>
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB_NAME=event_booking_content
   ```
4. **Seed MongoDB** (from `frontend/`). This replaces everything in the `event_content` collection:
   ```
   node scripts/seed-mongo.mjs
   ```
5. **Run**
   ```
   npm run dev
   ```
   The app is at http://localhost:3000.

The seeded users have placeholder password hashes and cannot log in. Register real accounts through `POST /api/auth/signup`.

## Database design

12 tables: `users`, `organizers`, `attendees`, `admins`, `venues`, `events`, `seats`, `dynamic_pricing_rules`, `bookings`, `booking_seats`, `seat_holds`, `payments`.

- Role-specific tables (`organizers`, `attendees`, `admins`) extend `users` through a one-to-one `user_id` key.
- `booking_seats` has `UNIQUE(seat_id)`, so the database itself refuses to attach one seat to two bookings.
- **Database-level validation** with `CHECK` constraints: valid roles and statuses, non-negative prices and amounts, positive venue capacity, valid seat, booking, hold and payment states, valid pricing rule types.
- Foreign keys with `ON DELETE CASCADE` or `RESTRICT` as appropriate (a venue cannot be deleted while events use it).

## Advanced database features

1. **Transactions (stored procedures).** `hold_seats` and `confirm_booking` run as single transactions with row locks (`SELECT ... FOR UPDATE`) and a rollback handler. Concurrent attempts on the same seat cannot both succeed. `hold_seats` rejects unknown, duplicate or unavailable seats, and `confirm_booking` only confirms an unexpired hold and takes the amount from the booking rather than from the client.
2. **Trigger plus scheduled event.** `trg_release_expired_hold` frees the seats and marks the booking `expired` when a hold is released. The `evt_release_expired_holds` event scheduler job runs every minute and releases holds that have passed their expiry.
3. **Stored function.** `calculate_dynamic_price(seat_id)` returns the base price, plus the event's active pricing rules (percentage or flat), plus a demand surcharge: +10% once half the seats are taken, +25% at 80%. It never returns below zero.
4. **View.** `organizer_sales_dashboard` reports seats sold, total seats and revenue per event, using pre-aggregated subqueries so multi-seat bookings do not double-count revenue.
5. **Indexes.** Composite indexes on `events(venue_id, event_date)`, `seats(event_id, status)`, `bookings(event_id, status)`, `payments(booking_id, payment_status)` and `seat_holds(status, expires_at)`.

Prices are locked at hold time: the dynamic price is stored in `price_at_booking` and `bookings.total_amount`, so an attendee pays what was quoted even if demand changes during the 10-minute hold.

## Query set (DML)

`database/06_dml_queries.sql` contains INSERT, UPDATE and DELETE (each inside a transaction that is rolled back), plus SELECT queries covering multi-table JOINs, LEFT JOIN, GROUP BY with aggregates, HAVING, ORDER BY with LIMIT, and scalar, IN, NOT EXISTS and correlated subqueries. The last three queries use the stored function, the view and the pricing rules.

## API reference

JSON in and out. Errors return `{ "error": "message" }`. Protected routes read the `token` cookie (send requests with `credentials: "include"`).

| Method | Route | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/signup` | public | `{ name, email, password, role, orgName?, phone? }`, role is `attendee` or `organizer` |
| POST | `/api/auth/login` | public | `{ email, password }`, sets the cookie |
| POST | `/api/auth/logout` | any | clears the cookie |
| GET | `/api/auth/me` | logged in | current user |
| GET | `/api/events` | public | list events |
| GET | `/api/events/[id]` | public | event, seats (with `dynamic_price`) and MongoDB content |
| GET | `/api/events/search?q=` | public | full-text search over event content |
| GET | `/api/events/tags` | public | tag popularity (aggregation) |
| GET | `/api/venues` | public | list venues |
| POST | `/api/events` | organizer | create an event with its seat layout and optional content |
| PATCH | `/api/events/[id]/content` | organizer (owner) | update description, banner, tags, artists, FAQs |
| GET | `/api/organizer/dashboard` | organizer | sales for the organizer's own events |
| POST | `/api/bookings` | attendee | `{ eventId, seatIds }`, holds seats for 10 minutes |
| GET | `/api/bookings` | attendee | the attendee's own bookings |
| POST | `/api/bookings/[id]/confirm` | attendee (owner) | `{ paymentMethod }`: `upi`, `card` or `netbanking` |

`frontend/new_event.json` and `frontend/update_content.json` are sample request bodies for `POST /api/events` and the content update.

## Security

- Passwords are hashed with bcrypt (10 rounds); plain text is never stored.
- Sessions use a signed JWT in an httpOnly, SameSite=Lax cookie, so scripts in the page cannot read it.
- **Role-based access control** with attendee and organizer roles (admin exists in the schema). Every protected route checks login (401) and role (403). Organizers can only change or see their own events, and attendees can only see or confirm their own bookings.
- The server never trusts the client for identity, price or hold time: the attendee comes from the JWT, and the hold length and payment amount come from the server and database.
- All SQL uses parameterized queries. Credentials and secrets come from environment variables, with `.env*` git-ignored.
- Admin accounts cannot be self-registered through the API.

## Testing

Tests were run against the live API with `curl` and the MySQL client.

| # | Test | Expected | Result |
|---|---|---|---|
| 1 | Sign up with a duplicate email | 409 | Pass |
| 2 | Login with a wrong password | 401 | Pass |
| 3 | Sign up with role `admin` | 400 Invalid role | Pass |
| 4 | Book seats while logged out | 401 | Pass |
| 5 | Book seats as an organizer | 403 | Pass |
| 6 | Hold available seats | 201 with a booking id | Pass |
| 7 | Hold a seat that is already held | 409, nothing changes | Pass |
| 8 | Hold unknown or duplicate seat ids | 400 | Pass |
| 9 | Confirm a held booking | Booking confirmed, seats booked, payment recorded | Pass |
| 10 | Confirm an expired booking | 409 | Pass |
| 11 | Confirm another user's booking | 404 | Pass |
| 12 | Let a hold expire, then re-book the seat | Seat released automatically, new booking succeeds | Pass |
| 13 | Organizer edits another organizer's event content | 403 | Pass |
| 14 | Seat list shows `dynamic_price`; booking total uses it | 2250.00 for a 2500 seat with a 10% discount rule | Pass |
| 15 | Full-text search and tag aggregation | Matching events with relevance, tag counts | Pass |
| 16 | Create an event with a layout | Event and seats created, Mongo content stored | Pass |

## Known limitations

- Payment is simulated: `confirm_booking` records a successful payment without a real gateway.
- JWTs are not revoked when an account is suspended; `/api/auth/me` checks the database status, but other routes accept a valid token until it expires (7 days).
- Cross-database consistency uses a compensating delete rather than a distributed transaction.
- The MySQL event scheduler must be on for automatic hold expiry. Expired holds are also rejected at confirm time even if the sweep has not run yet.
