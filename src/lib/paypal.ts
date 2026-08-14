/**
 * Minimal PayPal Orders v2 helpers for the Venmo sandbox flow.
 *
 * Sandbox only, on purpose: this MVP has no webhook, no reconciliation and no
 * refund path, so it has no business holding live credentials.
 */
export const PAYPAL_API_BASE = "https://api-m.sandbox.paypal.com";

/**
 * The client id does not need the NEXT_PUBLIC_ prefix here — we never load the
 * PayPal JS SDK in the browser, we redirect to PayPal's hosted page. Both names
 * are accepted so an existing .env keeps working either way.
 */
export function getPayPalCredentials() {
  const clientId =
    process.env.PAYPAL_CLIENT_ID ?? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

/** Exchanges the client credentials for a short-lived access token. */
export async function getAccessToken(credentials: {
  clientId: string;
  clientSecret: string;
}): Promise<string> {
  const basic = Buffer.from(
    `${credentials.clientId}:${credentials.clientSecret}`,
  ).toString("base64");

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    // Body can echo the client id; log the status only.
    throw new Error(`PayPal token request failed (${response.status})`);
  }

  const data: { access_token?: string } = await response.json();
  if (!data.access_token) throw new Error("PayPal token response had no token");

  return data.access_token;
}

/** Pulls the URL the buyer must be sent to in order to approve the order. */
export function findPayerActionUrl(
  links: Array<{ rel?: string; href?: string }> | undefined,
): string | null {
  const link = links?.find(
    (candidate) => candidate.rel === "payer-action" || candidate.rel === "approve",
  );
  return link?.href ?? null;
}
