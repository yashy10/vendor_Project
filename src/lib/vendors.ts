export type Vendor = {
  id: string;
  name: string;
  description: string;
  emoji: string;
};

export const vendors: Vendor[] = [
  {
    id: "taco-bros",
    name: "Taco Bros",
    description: "Mexican Food",
    emoji: "🌮",
  },
  {
    id: "coast-coffee",
    name: "Coast Coffee",
    description: "Coffee & Drinks",
    emoji: "☕",
  },
  {
    id: "sunny-scoops",
    name: "Sunny Scoops",
    description: "Ice Cream",
    emoji: "🍦",
  },
];

export function getVendor(id: string): Vendor | undefined {
  return vendors.find((vendor) => vendor.id === id);
}
