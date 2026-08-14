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
- **Not built:** webhooks (`checkout.session.completed`), Stripe Connect, payouts, persistence.
  Nothing records that a payment happened — Stripe's Dashboard is the only ledger.

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

Four routes, all in `src/app/`: `/` (vendor list), `/vendor/[id]`, `/success`, plus `not-found.tsx`.
Everything else is two `src/lib` modules and two `src/components`. The structure is small enough to
read directly; what matters are the invariants below.

### Money is whole cents everywhere

The only place a dollar *string* exists is the `<input>` in `AmountInput`. Everything downstream —
state, URL params, the future Stripe call — is integer cents. `src/lib/amount.ts` is the single
source of truth:

- `toCents(input)` → cents or `null`; `isValidAmount(cents)` → bounds check; `formatCents(cents)` → display.
- Bounds: `MIN_CENTS = 50` ($0.50) to `MAX_CENTS = 50_000` ($500).
- `AMOUNT_PATTERN` is applied **on every keystroke**, so the field can never hold a value the Pay
  button would have to reason about.

`amount.ts` is intentionally **dependency-free so the checkout API can re-run the same validation
server-side.** Client-side validation is a UX affordance, not a control — pass 2 must call `toCents`
and `isValidAmount` again in the route handler and reject anything out of bounds before creating a
Session. Keep new imports out of that file.

### How Stripe is wired

`AmountInput.handlePay` POSTs `{ vendorId, amount }` to `/api/checkout`
(`src/app/api/checkout/route.ts`) and does `window.location.href = data.url` — a full-page
navigation, because Checkout is on Stripe's domain. A `router.push` would not work.

The route handler is the trust boundary:

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
server-side only.

### Data flow

`src/lib/vendors.ts` is the vendor registry — adding an entry there makes it appear on the list page
*and* pre-render a `/vendor/[id]` route, because `generateStaticParams` enumerates the same array.
`getVendor(id)` returns `undefined` for unknown ids; the vendor page calls `notFound()`.

`/success` is deliberately **tolerant of missing or garbage query params** — it degrades through
"You sent $X to Vendor" → "Your payment to Vendor went through" → "Thank you for your payment"
rather than erroring, since it's the landing target for an external Stripe redirect.

### UI conventions

Mobile-first: the root layout constrains everything to `max-w-md` centered. Components use the
semantic `@theme` tokens rather than raw Tailwind palette colors (`text-ink`, not `text-stone-800`).
Decorative emoji and glyphs carry `aria-hidden`. The QR block on the vendor page is a `md:`-only
placeholder for a stretch goal, not live functionality.
