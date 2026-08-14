"use client";

import { useState } from "react";

import AmountInput from "@/components/AmountInput";
import ZelleModal from "@/components/ZelleModal";
import {
  formatCents,
  isValidAmount,
  MAX_CENTS,
  MIN_CENTS,
  toCents,
} from "@/lib/amount";
import { createReference } from "@/lib/reference";
import { type Vendor } from "@/lib/vendors";

type Method = "card" | "venmo";

/** The two hosted redirect flows differ only by endpoint. */
const HOSTED: Record<Method, { endpoint: string; failure: string }> = {
  card: {
    endpoint: "/api/checkout",
    failure: "We couldn't start checkout. Please try again.",
  },
  venmo: {
    endpoint: "/api/paypal/create-order",
    failure: "We couldn't start Venmo checkout. Please try again.",
  },
};

export default function PaymentPanel({
  vendor,
  zelleIdentifier,
  initialError,
}: {
  vendor: Vendor;
  /** Resolved server-side; undefined hides the Zelle button entirely. */
  zelleIdentifier?: string;
  initialError?: string;
}) {
  const [raw, setRaw] = useState("");
  const [pending, setPending] = useState<Method | null>(null);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [zelleMemo, setZelleMemo] = useState<string | null>(null);

  const cents = toCents(raw);
  const ready = isValidAmount(cents);
  const busy = pending !== null;

  function handleAmountChange(next: string) {
    setRaw(next);
    setError(null);
  }

  async function startHostedCheckout(method: Method) {
    if (!ready || busy) return;
    setPending(method);
    setError(null);

    const { endpoint, failure } = HOSTED[method];

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId: vendor.id, amount: raw }),
      });

      const data: { url?: string; error?: string } = await response.json();

      if (!response.ok || !data.url) {
        setError(data.error ?? failure);
        setPending(null);
        return;
      }

      // Both Stripe Checkout and Venmo approval live on someone else's domain,
      // so this has to be a full-page navigation, not a client-side route push.
      // Leave `pending` set — the button stays busy until the browser leaves.
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(null);
    }
  }

  function openZelle() {
    if (!ready || busy) return;
    setError(null);
    // Generated on click, never during render: this must not change between
    // renders, and it must not differ between server and client.
    setZelleMemo(createReference());
  }

  return (
    <div>
      <AmountInput value={raw} onChange={handleAmountChange} disabled={busy} />

      <p className="font-display text-ink mt-8 text-lg font-semibold">
        Choose payment method:
      </p>

      <div className="mt-3 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => startHostedCheckout("card")}
          disabled={!ready || busy}
          className="bg-clay enabled:hover:bg-clay-dark disabled:bg-sand disabled:text-ink-soft h-14 w-full rounded-2xl text-lg font-bold text-white shadow-sm transition enabled:active:scale-[0.99] disabled:cursor-not-allowed"
        >
          {pending === "card"
            ? "Just a sec…"
            : ready
              ? `Card / Apple Pay · ${formatCents(cents)}`
              : "Card / Apple Pay"}
        </button>

        <button
          type="button"
          onClick={() => startHostedCheckout("venmo")}
          disabled={!ready || busy}
          className="border-sand hover:border-[#3D95CE]/60 disabled:text-ink-soft h-14 w-full rounded-2xl border-2 bg-white text-lg font-bold text-[#3D95CE] shadow-sm transition enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending === "venmo" ? "Just a sec…" : "Venmo"}
        </button>

        {zelleIdentifier && (
          <button
            type="button"
            onClick={openZelle}
            disabled={!ready || busy}
            className="border-sand hover:border-[#6D1ED4]/60 disabled:text-ink-soft h-14 w-full rounded-2xl border-2 bg-white text-lg font-bold text-[#6D1ED4] shadow-sm transition enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Zelle
          </button>
        )}
      </div>

      <p
        className="text-ink-soft mt-4 text-center text-sm"
        role={error ? "alert" : undefined}
      >
        {error ??
          `Any amount from ${formatCents(MIN_CENTS)} to ${formatCents(MAX_CENTS)}.`}
      </p>

      {zelleMemo && zelleIdentifier && isValidAmount(cents) && (
        <ZelleModal
          vendor={vendor}
          zelleIdentifier={zelleIdentifier}
          cents={cents}
          memo={zelleMemo}
          onClose={() => setZelleMemo(null)}
        />
      )}
    </div>
  );
}
