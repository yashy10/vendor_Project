"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { formatCents } from "@/lib/amount";
import type { Vendor } from "@/lib/vendors";

/**
 * Zelle is not integrated — it is a bank transfer the customer makes on their
 * own, in their own banking app. This screen only tells them where to send it
 * and what to write in the memo, then records that they say they sent it.
 *
 * Nothing here can confirm a transfer, so nothing here claims one happened.
 */
export default function ZelleModal({
  vendor,
  zelleIdentifier,
  cents,
  memo,
  onClose,
}: {
  vendor: Vendor;
  zelleIdentifier: string;
  cents: number;
  memo: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);

    // Stop the page behind the sheet from scrolling under it.
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  function handleSent() {
    setSubmitting(true);
    router.push(
      `/pending?vendor=${encodeURIComponent(vendor.id)}&amount=${cents}&memo=${encodeURIComponent(memo)}`,
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="zelle-title"
        onClick={(event) => event.stopPropagation()}
        className="bg-cream max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="zelle-title"
            className="font-display text-ink text-2xl font-bold"
          >
            Pay {vendor.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-ink-soft hover:text-ink -mt-1 -mr-1 shrink-0 rounded-full p-2 text-xl leading-none transition"
          >
            ✕
          </button>
        </div>

        <dl className="mt-6 space-y-5">
          <div>
            <dt className="text-ink-soft text-sm font-bold tracking-wider uppercase">
              Amount
            </dt>
            <dd className="font-display text-ink mt-1 text-4xl font-bold">
              {formatCents(cents)}
            </dd>
          </div>

          <div>
            <dt className="text-ink-soft text-sm font-bold tracking-wider uppercase">
              Send through Zelle to
            </dt>
            <dd className="border-sand text-ink mt-1 rounded-2xl border-2 bg-white px-4 py-3 font-bold break-all select-all">
              {zelleIdentifier}
            </dd>
          </div>

          <div>
            <dt className="text-ink-soft text-sm font-bold tracking-wider uppercase">
              Memo
            </dt>
            <dd className="border-clay/40 text-clay mt-1 rounded-2xl border-2 border-dashed bg-white px-4 py-3 font-mono text-xl font-bold tracking-wider select-all">
              {memo}
            </dd>
            <p className="text-ink-soft mt-2 text-sm">
              Include this code so {vendor.name} can match your transfer.
            </p>
          </div>

          {/* Only ever the vendor's own official code — we cannot generate one. */}
          {vendor.zelleQrSrc && (
            <div>
              <dt className="text-ink-soft text-sm font-bold tracking-wider uppercase">
                Or scan in your banking app
              </dt>
              <dd className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={vendor.zelleQrSrc}
                  alt={`Zelle QR code for ${vendor.name}`}
                  className="border-sand size-40 rounded-2xl border-2 bg-white p-2"
                />
              </dd>
            </div>
          )}
        </dl>

        <button
          type="button"
          onClick={handleSent}
          disabled={submitting}
          className="bg-clay enabled:hover:bg-clay-dark disabled:bg-sand disabled:text-ink-soft mt-8 h-14 w-full rounded-2xl text-lg font-bold text-white shadow-sm transition enabled:active:scale-[0.99]"
        >
          {submitting ? "Just a sec…" : "I've Sent the Payment"}
        </button>

        <p className="text-ink-soft mt-3 text-center text-sm">
          Send the transfer in your banking app first — we can&rsquo;t confirm
          Zelle payments automatically.
        </p>
      </div>
    </div>
  );
}
