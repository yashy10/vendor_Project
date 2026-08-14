# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

**Santa Cruz Fair** — a multi-vendor payments MVP. Pick a vendor, enter an amount, pay.

```
Vendor list → Vendor page → Enter $10 → Pay Now → Stripe Checkout → Success
```

Deliberately small: **no database, no accounts, no Stripe Connect.** All payments land in one
Stripe account and the vendor is recorded as Stripe metadata (`metadata.vendor`). Vendors are
three hardcoded entries in `src/lib/vendors.ts`.

### Status

- **Pass 1 (UI) — done.** All four screens exist and the flow is clickable end to end.
- **Pass 2 (Stripe Checkout) — done.** `POST /api/checkout` validates server-side, creates a
  `mode: payment` Session with dynamic `price_data`, and returns `session.url`. Test mode only.
- **Pass 3 (Venmo + Zelle) — done on `feature/venmo-zelle`.** The vendor page now offers three
  methods. Venmo is a real PayPal Orders v2 sandbox flow; Zelle is *not* an integration.
- **Not built:** webhooks (`checkout.session.completed`), Stripe Connect, payouts, persistence.
  Nothing records that a payment happened — the Stripe and PayPal Dashboards are the only ledgers.

## Commands

```bash
npm run dev            # http://localhost:3000
npm run build          # production build
npm start              # serve the production build
npx tsc --noEmit       # typecheck (currently clean)
```

There is **no linter and no test framework** configured — `package.json` has only `dev`/`build`/`start`,
and Next 16 removed `next lint`. Don't reference a `npm test` or `npm run lint` that doesn't exist;
if verification is needed, `npx tsc --noEmit` plus `npm run build` is the whole check.

### Environment

The app needs `STRIPE_SECRET_KEY` in `.env` (gitignored via the `.env*` pattern). Without it,
`/api/checkout` returns a 500 with `"Payments aren't set up yet"` — the UI still runs, so a missing
key looks like a working app that fails only at the Pay button.

- **Test keys only** (`sk_test_…`). A live key would move real money; this project has no webhook,
  no reconciliation, and no refund path.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is present in `.env` but **read by nothing** — verified, no
  reference anywhere in `src/`. We redirect to Stripe-hosted Checkout, so Stripe.js never loads.
  It only becomes necessary if we adopt Elements or embedded Checkout.
- Exercise the flow with Stripe's test card `4242 4242 4242 4242`, any future expiry and CVC.

Venmo needs `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` (sandbox app credentials). Both are
server-only — we never load the PayPal JS SDK, so no client id reaches the browser;
`NEXT_PUBLIC_PAYPAL_CLIENT_ID` is accepted as a fallback name only for convenience. The API base is
hardcoded to `api-m.sandbox.paypal.com` in `src/lib/paypal.ts`; there is no production switch, by
design. Missing PayPal credentials degrade to a 500 on the Venmo button only — card and Zelle keep
working. `.env.example` documents all of it.

## Stack

Next.js 16.3.1 (App Router) · React 19.2.8 · TypeScript strict · Tailwind CSS v4.

Two things routinely trip up assumptions from older Next/Tailwind:

- **Read `node_modules/next/dist/docs/` before writing Next-specific code** (see `AGENTS.md`).
  This version has breaking changes vs. common training data. Guides live under
  `node_modules/next/dist/docs/01-app/`.
- **Tailwind v4 is CSS-first.** There is no `tailwind.config.js`. The design tokens are declared in
  an `@theme` block in `src/app/globals.css`, which is what generates the semantic color utilities
  (`text-ink`, `bg-clay`, `border-sand`, `font-display`, …) used throughout. Add or change a color
  there, not in a JS config.

### Next 16 conventions already in use here — match them

- Page/layout props come from **globally generated typed-route helpers**: `PageProps<"/vendor/[id]">`,
  `PageProps<"/success">`, `LayoutProps<"/">`. These are generated into `.next/types` — do not
  hand-roll `{ params: { id: string } }` prop types.
- `params` and `searchParams` are **Promises** and must be awaited (`const { id } = await params`),
  which is why the page components are `async`.
- `@/*` maps to `./src/*`.

## Architecture

Pages in `src/app/`: `/` (vendor list), `/vendor/[id]`, `/success`, `/pending`, plus `not-found.tsx`.
Route handlers: `api/checkout` (Stripe), `api/paypal/create-order` and `api/paypal/capture-order`
(Venmo). The structure is small enough to read directly; what matters are the invariants below.

`/vendor/[id]` renders dynamically rather than statically despite `generateStaticParams`, because it
reads `?error=` to report a failed Venmo capture. Costs nothing here — the page renders from an
in-memory array.

### Money is whole cents everywhere

The only place a dollar *string* exists is the `<input>` in `AmountInput` — and that raw string is
what gets POSTed to `/api/checkout`, which parses it itself. Everything else — bounds checks, URL
params, `unit_amount` — is integer cents. `src/lib/amount.ts` is the single source of truth:

- `toCents(input)` → cents or `null`; `isValidAmount(cents)` → bounds check; `formatCents(cents)` → display.
- Bounds: `MIN_CENTS = 50` ($0.50) to `MAX_CENTS = 50_000` ($500).
- `AMOUNT_PATTERN` is applied **on every keystroke**, so the field can never hold a value the Pay
  button would have to reason about.

`amount.ts` is intentionally **dependency-free so it can run in both places** — it is imported by a
`"use client"` component *and* by the route handler, and both call `toCents`/`isValidAmount` on the
same input. Keep new imports out of that file, and change the bounds in one place only: `MIN_CENTS`
and `MAX_CENTS` feed the button state, the helper text, and the server's rejection message at once.

### The three payment methods

`PaymentPanel` (`src/components/PaymentPanel.tsx`) is the one client component that owns the amount
and dispatches to a method. `AmountInput` below it is purely presentational — controlled, no state —
because every method needs to read the same amount.

Card and Venmo are the *same shape*: POST `{ vendorId, amount }`, get back `{ url }`, then
`window.location.href = data.url`. They share one `startHostedCheckout` helper and differ only by
endpoint, since both destinations are on someone else's domain — a `router.push` would not work.
**Zelle is not that shape at all** and deliberately touches no API.

#### Card — Stripe

The route handler (`src/app/api/checkout/route.ts`) is the trust boundary:

- **`STRIPE_SECRET_KEY` is read only here.** It is server-only (no `NEXT_PUBLIC_` prefix) and must
  never be imported into a `"use client"` file. There is no publishable key in the flow at all —
  we redirect to the hosted page, so Stripe.js never loads.
- **The browser's `vendorId` is a lookup key, nothing more.** Name and description come from
  `getVendor()`. A request carrying `vendorName: "EVIL"` is ignored.
- **`toCents`/`isValidAmount` run again here.** Client-side validation is a UX affordance.
- `success_url` → `/success?vendor=<id>&amount=<cents>`; `cancel_url` → `/vendor/<id>`. Both are
  built from the request's `origin` header, so localhost and every Vercel URL work unconfigured.
- Metadata (`vendorId`, `vendorName`) goes on **both** the Session and the PaymentIntent, so the
  vendor shows up on the payment itself in the Dashboard, not just the session.

Error responses are always `{ error }` with customer-safe wording; Stripe's raw error is logged
server-side only. The client renders `data.error` straight into the helper-text slot under the
button, which is why those strings are written to be shown to a customer.

SDK is `stripe@22.5.0`, constructed as `new Stripe(secretKey)` per request inside the `try` — **no
`apiVersion` pinned**, so it follows the account's default API version and a Dashboard-side version
bump can change behaviour without a code change. Pin it if that ever matters.

#### Venmo — PayPal Orders v2

Two handlers, because approval and capture are separate steps and **money only moves at capture**:

- `api/paypal/create-order` mirrors the Stripe route's validation exactly (same `toCents` /
  `isValidAmount`, same "id is a lookup key" rule), then creates an order with
  `payment_source.venmo` and returns the `payer-action` link to redirect to.
- `api/paypal/capture-order` is PayPal's `return_url`. PayPal appends `?token=<order id>`; we
  capture, then redirect to the shared `/success` screen. **Vendor and amount are read back off the
  captured order** (`custom_id`, `captures[0].amount.value`) rather than trusted from the URL.
  A failed capture redirects to `/vendor/<id>?error=venmo`, which `PaymentPanel` shows via
  `initialError` — reusing the existing error slot.

No raw SDK: plain `fetch` against `api-m.sandbox.paypal.com` with a client-credentials token per
request. Venmo requires a **US sandbox business account with Venmo enabled on the app**; when it
isn't, PayPal rejects at create-order and the hint is logged server-side.

#### Zelle — not a payment integration

Zelle is a bank transfer the customer makes themselves. `ZelleModal` shows where to send it and a
generated memo (`src/lib/reference.ts`, `SCF-XXXXX`); "I've Sent the Payment" routes to `/pending`.

Two invariants worth defending:

- **`/pending` never says "successful" or "verified".** Nothing in this app can confirm a Zelle
  transfer, so the terminal state is "Payment Submitted / Pending Confirmation". Don't let this
  drift toward the `/success` wording.
- **No generated QR codes or deep links.** There is no supported way to build a Zelle payment link,
  so `zelleQrSrc` renders only a vendor's *own* official image and is unset for everyone today.
- **The Zelle number is published on purpose.** It is a payment address customers read off the
  screen, so it is a literal in `vendors.ts` and is expected to be public. This was a deliberate
  reversal of an earlier env-var approach — don't "fix" it back into the environment.

The memo alphabet omits `I`, `O`, `0`, `1` because a human retypes it into a banking app, and
`/pending` re-validates it against `REFERENCE_PATTERN` before display. Codes are not persisted —
uniqueness is probabilistic (32^5), which is fine for a fair stall and not for a real ledger.

### Data flow

`src/lib/vendors.ts` is the vendor registry — adding an entry there makes it appear on the list page
*and* register a `/vendor/[id]` route, because `generateStaticParams` enumerates the same array.
`getVendor(id)` returns `undefined` for unknown ids; the vendor page calls `notFound()`.

Card and Venmo are global (one merchant account each), so only Zelle is configured per vendor:
`zelleEnabled` plus a `zelleIdentifier` literal. `resolveZelleIdentifier` in the vendor page needs
both and passes the result to `PaymentPanel` as a prop; when it's undefined the Zelle button does
not render at all. Zelle has no credentials and reads no environment variable — the destination is
meant to be seen.

All three vendors currently share one number, so **the memo is the only thing distinguishing which
stand a transfer was for.** Give a vendor its own `zelleIdentifier` to split them apart.

`/success` is deliberately **tolerant of missing or garbage query params** — it degrades through
"You sent $X to Vendor" → "Your payment to Vendor went through" → "Thank you for your payment"
rather than erroring, since it's the landing target for an external Stripe redirect.

### UI conventions

Mobile-first: the root layout constrains everything to `max-w-md` centered. Components use the
semantic `@theme` tokens rather than raw Tailwind palette colors (`text-ink`, not `text-stone-800`).
Decorative emoji and glyphs carry `aria-hidden`. The QR block on the vendor page is a `md:`-only
placeholder for a stretch goal, not live functionality.
