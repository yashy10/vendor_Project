# Santa Cruz Fair — multi-vendor payments MVP

Pick a vendor, enter an amount, pay. A deliberately small prototype: no database, no
accounts, no Stripe Connect. All payments land in one Stripe account and the vendor is
recorded as Stripe metadata.

```
Santa Cruz Fair → Taco Bros → Enter $10 → Pay Now → Stripe Checkout → Payment Successful
```

## Status

**Working end to end in Stripe test mode.** No webhooks, no Connect, no persistence —
Stripe's Dashboard is the only record that a payment happened.

## Running it

```bash
npm install
cp .env.example .env.local     # then paste your Stripe TEST secret key into it
npm run dev                    # http://localhost:3000
```

Get a test key at [dashboard.stripe.com/test/apikeys](https://dashboard.stripe.com/test/apikeys).
It must start with `sk_test_`. `.env.local` is gitignored.

Pay with card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.

## Layout

| Path | What it is |
| --- | --- |
| `src/lib/vendors.ts` | The three hardcoded vendors. Add one here and it appears everywhere. |
| `src/lib/amount.ts` | `toCents` / `isValidAmount`. The checkout API must reuse these to re-validate server-side. |
| `src/app/page.tsx` | Vendor list |
| `src/app/vendor/[id]/page.tsx` | Vendor payment page |
| `src/app/success/page.tsx` | Success screen, reads `?vendor=&amount=` |
| `src/components/AmountInput.tsx` | Amount field + Pay Now → `POST /api/checkout` → redirect to Stripe |
| `src/app/api/checkout/route.ts` | Creates the Checkout Session. The only place `STRIPE_SECRET_KEY` is read. |

Amounts are held as whole cents everywhere except the input field itself, and are capped
at $0.50–$500.

### The payment flow

`Pay Now` POSTs `{ vendorId, amount }` to `/api/checkout`. The server re-validates the
amount, resolves the vendor from `vendors.ts` (the browser's `vendorId` is only a lookup
key — any name it sends is ignored), and creates a `mode: payment` Session with dynamic
`price_data`, so no Product or Price needs to exist in the Dashboard. `vendorId` and
`vendorName` are attached as metadata to both the Session and the PaymentIntent.

The browser then does a full-page navigation to `session.url`. Stripe returns the customer
to `/success?vendor=&amount=`; cancelling returns them to `/vendor/[id]`. Both URLs are
derived from the request origin, so no base-URL env var is needed.

> The success page reads those query params for display only — it does not verify the
> payment. Don't build fulfillment on it; that's what the `checkout.session.completed`
> webhook is for.
