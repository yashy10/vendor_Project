# Santa Cruz Fair — multi-vendor payments MVP

Pick a vendor, enter an amount, pay. A deliberately small prototype: no database, no
accounts, no Stripe Connect. All payments land in one Stripe account and the vendor is
recorded as Stripe metadata.

```
Santa Cruz Fair → Taco Bros → Enter $10 → Pay Now → Stripe Checkout → Payment Successful
```

## Status

**Pass 1 (UI) — done.** All four screens exist and the flow is clickable end to end.
`Pay Now` currently jumps straight to the success page instead of opening Stripe.

**Pass 2 (Stripe) — not started.** Adds `POST /api/checkout`, which validates the amount,
creates a Checkout Session with `metadata.vendor`, and returns the Stripe URL.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

## Layout

| Path | What it is |
| --- | --- |
| `src/lib/vendors.ts` | The three hardcoded vendors. Add one here and it appears everywhere. |
| `src/lib/amount.ts` | `toCents` / `isValidAmount`. The checkout API must reuse these to re-validate server-side. |
| `src/app/page.tsx` | Vendor list |
| `src/app/vendor/[id]/page.tsx` | Vendor payment page |
| `src/app/success/page.tsx` | Success screen, reads `?vendor=&amount=` |
| `src/components/AmountInput.tsx` | Amount field + Pay Now. **The only file pass 2 has to change.** |

Amounts are held as whole cents everywhere except the input field itself, and are capped
at $0.50–$500.

### Where Stripe plugs in

`AmountInput.handlePay` does a `router.push('/success?vendor=…&amount=…')`. Pass 2 swaps
that for a `POST /api/checkout` and redirects to the returned Stripe URL. Stripe's
`success_url` uses those same two query params, so the success page needs no changes.
`cancel_url` points back at `/vendor/[id]`.
