import {
  formatCents,
  isValidAmount,
  MAX_CENTS,
  MIN_CENTS,
  toCents,
} from "@/lib/amount";
import {
  findPayerActionUrl,
  getAccessToken,
  getPayPalCredentials,
  PAYPAL_API_BASE,
} from "@/lib/paypal";
import { getVendor } from "@/lib/vendors";

/**
 * Creates a PayPal Orders v2 order with Venmo as the payment source.
 *
 * Body: { vendorId: string, amount: string | number }  // amount in dollars
 * 200:  { url: string }                                // Venmo-hosted approval
 * 4xx/5xx: { error: string }                           // safe to show the customer
 *
 * The order is only *created* here. Money moves when the buyer returns to
 * /api/paypal/capture-order and we capture it.
 */
export async function POST(request: Request) {
  const credentials = getPayPalCredentials();
  if (!credentials) {
    console.error(
      "PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET are not set — cannot create an order.",
    );
    return Response.json(
      { error: "Venmo isn't set up yet. Please try another method." },
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

  // Same rule as the Stripe route: the browser's id is a lookup key, nothing
  // more. Any name it sent is ignored.
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

  const cents = toCents(String(amount));
  if (!isValidAmount(cents)) {
    return Response.json(
      {
        error: `Enter an amount between ${formatCents(MIN_CENTS)} and ${formatCents(MAX_CENTS)}.`,
      },
      { status: 400 },
    );
  }

  const origin = request.headers.get("origin") ?? new URL(request.url).origin;

  try {
    const accessToken = await getAccessToken(credentials);

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        // Guards against a double-submit creating two orders.
        "PayPal-Request-Id": crypto.randomUUID(),
      },
      cache: "no-store",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            // Read back after capture so the success page does not have to
            // trust anything in the return URL.
            custom_id: vendor.id,
            description: `Payment to ${vendor.name}`.slice(0, 127),
            amount: {
              currency_code: "USD",
              value: (cents / 100).toFixed(2),
            },
          },
        ],
        payment_source: {
          venmo: {
            experience_context: {
              brand_name: "Santa Cruz Fair",
              shipping_preference: "NO_SHIPPING",
              return_url: `${origin}/api/paypal/capture-order`,
              cancel_url: `${origin}/vendor/${vendor.id}`,
            },
          },
        },
      }),
    });

    const order = await response.json();

    if (!response.ok) {
      // Most common cause in sandbox: the business account is not enabled for
      // Venmo, which surfaces here rather than at token time.
      console.error(
        "PayPal create-order failed:",
        response.status,
        JSON.stringify(order),
      );
      console.error(
        "Hint: Venmo requires a US sandbox business account with Venmo enabled.",
      );
      return Response.json(
        { error: "We couldn't start Venmo checkout. Please try again." },
        { status: 502 },
      );
    }

    const url = findPayerActionUrl(order.links);
    if (!url) {
      console.error(
        "PayPal create-order returned no payer-action link:",
        JSON.stringify(order),
      );
      return Response.json(
        { error: "We couldn't start Venmo checkout. Please try again." },
        { status: 502 },
      );
    }

    return Response.json({ url });
  } catch (error) {
    console.error(
      "PayPal checkout failed:",
      error instanceof Error ? error.message : error,
    );
    return Response.json(
      { error: "We couldn't start Venmo checkout. Please try again." },
      { status: 502 },
    );
  }
}
