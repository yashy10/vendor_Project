import Link from "next/link";

import { formatCents } from "@/lib/amount";
import { getVendor } from "@/lib/vendors";

export default async function SuccessPage({
  searchParams,
}: PageProps<"/success">) {
  const { vendor: vendorParam, amount: amountParam } = await searchParams;

  const vendor =
    typeof vendorParam === "string" ? getVendor(vendorParam) : undefined;

  const cents =
    typeof amountParam === "string" ? Number.parseInt(amountParam, 10) : NaN;
  const paid = Number.isSafeInteger(cents) && cents > 0 ? cents : null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="bg-leaf/10 text-leaf grid size-24 place-items-center rounded-full">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-12"
          aria-hidden
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>

      <h1 className="font-display text-ink mt-6 text-4xl font-bold">
        Payment Successful
      </h1>

      <p className="text-ink-soft mt-3 text-lg text-balance">
        {vendor && paid !== null
          ? `You sent ${formatCents(paid)} to ${vendor.name}.`
          : vendor
            ? `Your payment to ${vendor.name} went through.`
            : "Thank you for your payment."}
      </p>

      {vendor && (
        <p className="text-ink-soft mt-1 text-sm">
          Show this screen at the {vendor.emoji} {vendor.name} stand.
        </p>
      )}

      <Link
        href="/"
        className="bg-clay hover:bg-clay-dark mt-10 flex h-14 w-full items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm transition active:scale-[0.99]"
      >
        Return to Vendors
      </Link>
    </main>
  );
}
