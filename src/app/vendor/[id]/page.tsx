import Link from "next/link";
import { notFound } from "next/navigation";

import PaymentPanel from "@/components/PaymentPanel";
import { getVendor, type Vendor, vendors } from "@/lib/vendors";

export function generateStaticParams() {
  return vendors.map((vendor) => ({ id: vendor.id }));
}

/**
 * Where the customer sends their Zelle transfer. Needs both the flag and an
 * actual destination — either missing means no Zelle button.
 */
function resolveZelleIdentifier(vendor: Vendor): string | undefined {
  return vendor.zelleEnabled ? vendor.zelleIdentifier : undefined;
}

export default async function VendorPage({
  params,
  searchParams,
}: PageProps<"/vendor/[id]">) {
  const { id } = await params;
  const vendor = getVendor(id);

  if (!vendor) notFound();

  // Set when a Venmo capture came back unfinished, so the customer is not
  // dropped back here with no explanation.
  const { error } = await searchParams;
  const initialError =
    error === "venmo"
      ? "Venmo checkout didn't complete. Please try again or use another method."
      : undefined;

  return (
    <main className="flex flex-1 flex-col">
      <Link
        href="/"
        className="text-ink-soft hover:text-clay -ml-1 inline-flex w-fit items-center gap-1 py-2 text-sm font-bold transition"
      >
        <span aria-hidden>‹</span> All vendors
      </Link>

      <header className="mt-4 mb-8 flex items-center gap-4">
        <span
          className="bg-sand grid size-16 shrink-0 place-items-center rounded-2xl text-4xl"
          aria-hidden
        >
          {vendor.emoji}
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-ink text-3xl font-bold">
            {vendor.name}
          </h1>
          <p className="text-ink-soft">{vendor.description}</p>
        </div>
      </header>

      <PaymentPanel
        vendor={vendor}
        zelleIdentifier={resolveZelleIdentifier(vendor)}
        initialError={initialError}
      />

      {/* Placeholder for the stretch-goal QR code. Desktop only — scanning a
          code on the phone you are already holding makes no sense. */}
      <div className="border-sand mt-10 hidden items-center gap-4 rounded-3xl border-2 border-dashed p-4 md:flex">
        <div className="border-sand text-ink-soft/60 grid size-24 shrink-0 place-items-center rounded-2xl border-2 border-dashed text-xs font-bold">
          QR
        </div>
        <div>
          <p className="font-display text-ink font-semibold">
            Scan to pay on your phone
          </p>
          <p className="text-ink-soft text-sm">
            Point your camera here to finish paying {vendor.name} on mobile.
          </p>
        </div>
      </div>
    </main>
  );
}
