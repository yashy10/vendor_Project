import Stripe from "stripe";

import {
  formatCents,
  isValidAmount,
  MAX_CENTS,
  MIN_CENTS,
  toCents,
} from "@/lib/amount";
import { getVendor } from "@/lib/vendors";

/**
 * Creates a one-time Stripe Checkout Session for a vendor payment.
 *
 * Body: { vendorId: string, amount: string | number }  // amount in dollars
 * 200:  { url: string }                                // Stripe-hosted Checkout
 * 4xx/5xx: { error: string }                           // safe to show the customer
 */
export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    // Never echo the key or its absence to the browser.
    console.error("STRIPE_SECRET_KEY is not set — cannot create a session.");
    return Response.json(
      { error: "Payments aren't set up yet. Please try again later." },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { vendorId, amount } = (body ?? {}) as {
    vendorId?: unknown;
    amount?: unknown;
  };

  if (typeof vendorId !== "string") {
    return Response.json({ error: "Pick a vendor first." }, { status: 400 });
  }

  // Resolve the vendor from our own data. Any name or description the browser
  // sent is ignored — only the id is used, and only as a lookup key.
  const vendor = getVendor(vendorId);
  if (!vendor) {
    return Response.json(
      { error: "We couldn't find that vendor." },
      { status: 400 },
    );
  }

  if (typeof amount !== "string" && typeof amount !== "number") {
    return Response.json({ error: "Enter an amount." }, { status: 400 });
  }

  // Re-run the exact validation the client ran. The client-side check is a UX
  // affordance; this is the control.
  const cents = toCents(String(amount));
  if (!isValidAmount(cents)) {
    return Response.json(
      {
        error: `Enter an amount between ${formatCents(MIN_CENTS)} and ${formatCents(MAX_CENTS)}.`,
      },
      { status: 400 },
    );
  }

  // Works on localhost and on any Vercel deployment URL without extra config.
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  const metadata = { vendorId: vendor.id, vendorName: vendor.name };

  try {
    const stripe = new Stripe(secretKey);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          // Built inline so no Product or Price has to exist in the Dashboard —
          // the customer picks the amount.
          price_data: {
            currency: "usd",
            unit_amount: cents,
            product_data: {
              name: `Payment to ${vendor.name}`,
              description: vendor.description,
            },
          },
        },
      ],
      // On the Session (Payments → Checkout sessions) and on the PaymentIntent,
      // so the vendor is visible on the payment itself in the Dashboard.
      metadata,
      payment_intent_data: { metadata },
      success_url: `${origin}/success?vendor=${vendor.id}&amount=${cents}`,
      cancel_url: `${origin}/vendor/${vendor.id}`,
    });

    if (!session.url) {
      return Response.json(
        { error: "We couldn't start checkout. Please try again." },
        { status: 502 },
      );
    }

    return Response.json({ url: session.url });
  } catch (error) {
    console.error(
      "Stripe checkout session failed:",
      error instanceof Error ? error.message : error,
    );
    return Response.json(
      { error: "We couldn't start checkout. Please try again." },
      { status: 502 },
    );
  }
}
