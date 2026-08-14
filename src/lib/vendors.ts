export type Vendor = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /** Hides the Zelle button when false — Zelle is per-vendor, unlike card and Venmo. */
  zelleEnabled?: boolean;
  /**
   * Per-vendor Zelle destination — the phone or email the customer sends the
   * transfer to. Published on purpose: this is a payment address customers are
   * meant to read off the screen, so it lives in source rather than in an env
   * var. Unset means no Zelle button for that vendor.
   */
  zelleIdentifier?: string;
  /**
   * Path to the vendor's *official* Zelle QR image in /public, if they have one.
   * Leave unset otherwise: there is no supported way to build a Zelle payment
   * link ourselves, so a generated code would not be scannable.
   */
  zelleQrSrc?: string;
};

/**
 * Every vendor collects Zelle at the same number for this demo, so the memo is
 * the only thing distinguishing which stand a given transfer was meant for.
 * Give a vendor its own `zelleIdentifier` to split them apart.
 */
const ZELLE_PHONE = "408-444-5454";

export const vendors: Vendor[] = [
  {
    id: "taco-bros",
    name: "Taco Bros",
    description: "Mexican Food",
    emoji: "🌮",
    zelleEnabled: true,
    zelleIdentifier: ZELLE_PHONE,
  },
  {
    id: "coast-coffee",
    name: "Coast Coffee",
    description: "Coffee & Drinks",
    emoji: "☕",
    zelleEnabled: true,
    zelleIdentifier: ZELLE_PHONE,
  },
  {
    id: "sunny-scoops",
    name: "Sunny Scoops",
    description: "Ice Cream",
    emoji: "🍦",
    zelleEnabled: true,
    zelleIdentifier: ZELLE_PHONE,
  },
];

export function getVendor(id: string): Vendor | undefined {
  return vendors.find((vendor) => vendor.id === id);
}
