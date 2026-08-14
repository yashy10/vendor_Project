import Link from "next/link";

import type { Vendor } from "@/lib/vendors";

export default function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <Link
      href={`/vendor/${vendor.id}`}
      className="group border-sand hover:border-clay/50 flex items-center gap-4 rounded-3xl border-2 bg-white p-4 shadow-sm transition hover:shadow-md active:scale-[0.99]"
    >
      <span
        className="bg-sand grid size-14 shrink-0 place-items-center rounded-2xl text-3xl"
        aria-hidden
      >
        {vendor.emoji}
      </span>

      <span className="min-w-0 flex-1">
        <span className="font-display text-ink block text-xl font-semibold">
          {vendor.name}
        </span>
        <span className="text-ink-soft block text-sm">
          {vendor.description}
        </span>
      </span>

      <span
        className="text-clay/50 group-hover:text-clay text-2xl transition group-hover:translate-x-0.5"
        aria-hidden
      >
        ›
      </span>
    </Link>
  );
}
