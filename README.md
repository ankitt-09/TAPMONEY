# TapMoney

Log spending in two taps, then double-tap the back of your iPhone to do it. A mobile-first money tracker built as an installable web app (PWA), designed around the iOS **Back Tap** accessibility shortcut.

**Stack:** Next.js (App Router) · React · TypeScript · Tailwind CSS · Zustand · PostgreSQL (Neon in production, PGlite locally)

## What it does

- **Quick-add screen** with a big keypad, category chips, and an optional note. It's the page Back Tap opens.
- **Silent logging.** An iOS Shortcut can POST straight to the API, so no app opens at all. You get a notification like "Saved ₹250 · Food".
- **Dashboard.** Monthly spend, income, left over, a per-day bar chart, and a per-category breakdown.
- **History.** Transactions grouped by day, with delete.
- **Installable.** Web manifest and icons, so it runs full-screen from the Home Screen.
- **Private.** Single-user passcode login, plus a bearer token for the Shortcut.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The dev passcode is `1234`. With no `DATABASE_URL` set, the app uses PGlite (Postgres running in-process, stored in `.data/`), so there is nothing else to set up.

## Deploy (free): Vercel + Neon

1. Create a free Postgres database at [neon.tech](https://neon.tech) and copy its connection string.
2. Push this repo to GitHub and import it into [Vercel](https://vercel.com).
3. Add these environment variables in Vercel:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | your Neon connection string |
   | `APP_SECRET` | a long random passphrase. It is your login passcode and the Shortcut's bearer token |
   | `APP_TZ` | optional, defaults to `Asia/Kolkata`. Controls month and day boundaries |
   | `NEXT_PUBLIC_CURRENCY` | optional, defaults to `INR` |

4. Deploy. The table is created automatically on first request.
5. Open the site in Safari, then Share → Add to Home Screen.

## Set up Back Tap

The app has a step-by-step guide on its **Setup** tab. In short:

1. In the **Shortcuts** app, create a shortcut that either opens `https://<your-app>/add` ("Open URLs"), or asks for an amount and category and POSTs to `/api/transactions` (silent logging).
2. Go to **Settings → Accessibility → Touch → Back Tap**, choose Double Tap, and pick the shortcut.

Back Tap needs an iPhone 8 or newer on iOS 14 or later.

## API

All endpoints need either the session cookie (set by `/api/login`) or `Authorization: Bearer <APP_SECRET>`.

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/api/login` | `{ "passcode": "..." }` sets the session cookie |
| `POST` | `/api/logout` | clears the session cookie |
| `GET` | `/api/session` | `{ "authed": boolean }` |
| `GET` | `/api/transactions?month=YYYY-MM&limit=200` | list transactions for a month |
| `POST` | `/api/transactions` | `{ amount, kind?, category?, note? }` creates a transaction |
| `DELETE` | `/api/transactions/:id` | delete one |
| `GET` | `/api/summary?month=YYYY-MM` | totals, per-category and per-day spend |

```bash
curl -X POST https://your-app.vercel.app/api/transactions \
  -H "Authorization: Bearer $APP_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"amount": 250, "category": "Food", "note": "Lunch"}'
# {"transaction":{...},"message":"Saved ₹250 · Food"}
```

## Design decisions

- **Why a database instead of `localStorage`?** On iOS, Safari and the Home Screen app have separate storage. A Shortcut that saved to one would be invisible in the other. A server database is the single source of truth.
- **Money is stored as integer minor units** (paise or cents) to avoid floating-point errors. Amounts are parsed leniently, so `"₹1,250.50"` works from a Shortcut.
- **Month boundaries are computed in SQL in the configured timezone**, using a range predicate on `created_at` that can use the index. This is not a `to_char()` comparison.
- **Plain SQL behind a tiny `Db` interface** instead of an ORM. The same queries run on Neon (HTTP driver, suited to serverless) and PGlite (zero-setup dev).
- **Auth:** constant-time secret comparison, an httpOnly `SameSite=Lax` cookie that stores a hash rather than the secret, and a delay on failed logins.
- **No chart or font libraries.** The bar and category charts are plain divs and the font stack is native, which keeps the JS small and the app fast on mobile.

## Known limitations / next steps

- Single user only (one passcode). Multi-user would need real accounts and a `user_id` column.
- No rate limiting beyond the failed-login delay. Add one (for example Upstash) before sharing the URL widely.
- Not yet built: budgets per category, recurring transactions, CSV export, and editing an existing transaction.
- No automated tests yet. API behaviour was verified manually with `curl`.

## Project layout

```
src/app/            pages (Home, Add, History, Setup), API routes, manifest, icons
src/components/     AuthGate, TabBar, MonthSwitcher, TxRow, Login
src/lib/            db, auth, money, dates, categories, Zustand store
```
