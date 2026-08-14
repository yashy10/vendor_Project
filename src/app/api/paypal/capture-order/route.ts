import {
  getAccessToken,
  getPayPalCredentials,
  PAYPAL_API_BASE,
} from "@/lib/paypal";

/**
 * PayPal's return_url. The buyer lands here after approving in Venmo, with
 * ?token=<order id> appended by PayPal.
 *
 * This is where the money actually moves: approval alone captures nothing.
 * On success we hand off to the same /success screen the Stripe flow uses.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin") ?? requestUrl.origin;
  const orderId = requestUrl.searchParams.get("token");

  const backToStart = (vendorId?: string) =>
    Response.redirect(
      vendorId ? `${origin}/vendor/${vendorId}?error=venmo` : `${origin}/`,
      303,
    );

  const credentials = getPayPalCredentials();
  if (!credentials || !orderId) {
    console.error("Venmo capture: missing credentials or order token.");
    return backToStart();
  }

  try {
    const accessToken = await getAccessToken(credentials);

    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    const order = await response.json();
    const unit = order?.purchase_units?.[0];
    const capture = unit?.payments?.captures?.[0];
    const vendorId: string | undefined = unit?.custom_id ?? capture?.custom_id;

    if (!response.ok || order?.status !== "COMPLETED") {
      console.error(
        "Venmo capture failed:",
        response.status,
        JSON.stringify(order),
      );
      return backToStart(vendorId);
    }

    // Trust the captured amount over anything that travelled through the URL.
    const value: string | undefined =
      capture?.amount?.value ?? unit?.amount?.value;
    const cents = value ? Math.round(Number(value) * 100) : NaN;

    if (!vendorId || !Number.isSafeInteger(cents)) {
      console.error("Venmo capture succeeded but was unreadable:", JSON.stringify(order));
      return backToStart(vendorId);
    }

    return Response.redirect(
      `${origin}/success?vendor=${encodeURIComponent(vendorId)}&amount=${cents}`,
      303,
    );
  } catch (error) {
    console.error(
      "Venmo capture threw:",
      error instanceof Error ? error.message : error,
    );
    return backToStart();
  }
}
