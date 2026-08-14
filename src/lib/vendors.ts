export type Vendor = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  /** Hides the Zelle button when false — Zelle is per-vendor, unlike card and Venmo. */
  zelleEnabled?: boolean;
  /**
   * Per-vendor Zelle destination. Deliberately unset here: real identifiers are
   * personal contact details and do not belong in a public repo. When a vendor
   * has none, the page falls back to the ZELLE_PHONE env var — see
   * `resolveZelleIdentifier` in src/app/vendor/[id]/page.tsx and .env.example.
   */
  zelleIdentifier?: string;
  /**
   * Path to the vendor's *official* Zelle QR image in /public, if they have one.
   * Leave unset otherwise: there is no supported way to build a Zelle payment
   * link ourselves, so a generated code would not be scannable.
   */
  zelleQrSrc?: string;
};

export const vendors: Vendor[] = [
  {
    id: "taco-bros",
    name: "Taco Bros",
    description: "Mexican Food",
    emoji: "🌮",
    zelleEnabled: true,
  },
  {
    id: "coast-coffee",
    name: "Coast Coffee",
    description: "Coffee & Drinks",
    emoji: "☕",
    zelleEnabled: true,
  },
  {
    id: "sunny-scoops",
    name: "Sunny Scoops",
    description: "Ice Cream",
    emoji: "🍦",
    zelleEnabled: true,
  },
];

export function getVendor(id: string): Vendor | undefined {
  return vendors.find((vendor) => vendor.id === id);
}
