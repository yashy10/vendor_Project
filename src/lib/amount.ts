export const MIN_CENTS = 50;
export const MAX_CENTS = 50_000;

/** Matches a plain dollar string: digits, at most one dot, at most two decimals. */
export const AMOUNT_PATTERN = /^\d*\.?\d{0,2}$/;

/**
 * Parse a user-typed dollar string into whole cents.
 * Returns null when the string isn't a usable amount.
 * The checkout API re-runs this server-side, so keep it dependency-free.
 */
export function toCents(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed || !AMOUNT_PATTERN.test(trimmed)) return null;

  const dollars = Number(trimmed);
  if (!Number.isFinite(dollars)) return null;

  return Math.round(dollars * 100);
}

export function isValidAmount(cents: number | null): cents is number {
  return cents !== null && cents >= MIN_CENTS && cents <= MAX_CENTS;
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}
