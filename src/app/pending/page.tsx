import Link from "next/link";

import { formatCents } from "@/lib/amount";
import { getVendor } from "@/lib/vendors";

/** Shape the reference generator produces. Anything else is not shown. */
const REFERENCE_PATTERN = /^SCF-[A-Z2-9]{5}$/;

/**
 * Where the Zelle flow ends. Deliberately says "submitted", never "successful":
 * the customer told us they sent a bank transfer, and we have no way to check.
 */
export default async function PendingPage({
  searchParams,
}: PageProps<"/pending">) {
  const {
    vendor: vendorParam,
    amount: amountParam,
    memo: memoParam,
  } = await searchParams;

  const vendor =
    typeof vendorParam === "string" ? getVendor(vendorParam) : undefined;

  const cents =
    typeof amountParam === "string" ? Number.parseInt(amountParam, 10) : NaN;
  const submitted = Number.isSafeInteger(cents) && cents > 0 ? cents : null;

  const memo =
    typeof memoParam === "string" && REFERENCE_PATTERN.test(memoParam)
      ? memoParam
      : null;

  return (
    <main className="flex flex-1 flex-col items-center justify-center text-center">
      <div className="bg-sun/15 text-sun grid size-24 place-items-center rounded-full">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-12"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </div>

      <h1 className="font-display text-ink mt-6 text-4xl font-bold">
        Payment Submitted
      </h1>

      <p className="text-ink-soft mt-4 text-sm font-bold tracking-wider uppercase">
        Status
      </p>
      <p className="font-display text-sun mt-1 text-2xl font-bold">
        Pending Confirmation
      </p>

      <p className="text-ink-soft mt-6 text-balance">
        {vendor && submitted !== null
          ? `${vendor.name} still needs to confirm your ${formatCents(submitted)} Zelle transfer.`
          : "The vendor still needs to confirm your Zelle transfer."}
      </p>

      {memo && (
        <div className="border-sand mt-6 w-full rounded-3xl border-2 border-dashed bg-white px-4 py-3">
          <p className="text-ink-soft text-sm font-bold tracking-wider uppercase">
            Your reference
          </p>
          <p className="text-clay mt-1 font-mono text-xl font-bold tracking-wider select-all">
            {memo}
          </p>
        </div>
      )}

      {vendor && (
        <p className="text-ink-soft mt-6 text-sm text-balance">
          Show this screen at the {vendor.emoji} {vendor.name} stand so they can
          check for your transfer.
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
