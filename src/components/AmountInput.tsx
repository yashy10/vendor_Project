"use client";

import { useState } from "react";

import {
  AMOUNT_PATTERN,
  formatCents,
  isValidAmount,
  MAX_CENTS,
  MIN_CENTS,
  toCents,
} from "@/lib/amount";

const PRESETS_IN_CENTS = [500, 1000, 2000];

export default function AmountInput({ vendorId }: { vendorId: string }) {
  const [raw, setRaw] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cents = toCents(raw);

  // Reject anything that isn't a dollar amount at the keystroke, so the field
  // can never hold a value the button would have to reason about.
  function handleChange(next: string) {
    if (next !== "" && !AMOUNT_PATTERN.test(next)) return;
    setRaw(next);
    setError(null);
  }

  async function handlePay() {
    if (!isValidAmount(cents) || pending) return;
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, amount: raw }),
      });

      const data: { url?: string; error?: string } = await response.json();

      if (!response.ok || !data.url) {
        setError(data.error ?? "We couldn't start checkout. Please try again.");
        setPending(false);
        return;
      }

      // Stripe Checkout is on Stripe's own domain, so this has to be a
      // full-page navigation, not a client-side route push. Leave `pending`
      // set — the button stays busy until the browser leaves the page.
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <div>
      <label
        htmlFor="amount"
        className="font-display text-ink block text-lg font-semibold"
      >
        How much?
      </label>

      <div className="border-sand focus-within:border-clay mt-3 flex items-center gap-2 rounded-3xl border-2 bg-white px-5 py-4 transition-colors">
        <span
          className="font-display text-ink-soft text-4xl font-semibold"
          aria-hidden
        >
          $
        </span>
        <input
          id="amount"
          value={raw}
          onChange={(event) => handleChange(event.target.value)}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          aria-label="Amount in dollars"
          className="font-display text-ink placeholder:text-ink-soft/40 w-full min-w-0 bg-transparent text-4xl font-semibold outline-none"
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {PRESETS_IN_CENTS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setRaw((preset / 100).toFixed(2));
              setError(null);
            }}
            className="border-sand text-ink hover:border-clay/50 h-12 rounded-2xl border-2 bg-white font-bold transition active:scale-[0.98]"
          >
            ${preset / 100}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handlePay}
        disabled={!isValidAmount(cents) || pending}
        className="bg-clay enabled:hover:bg-clay-dark disabled:bg-sand disabled:text-ink-soft mt-6 h-14 w-full rounded-2xl text-lg font-bold text-white shadow-sm transition enabled:active:scale-[0.99] disabled:cursor-not-allowed"
      >
        {pending
          ? "Just a sec…"
          : isValidAmount(cents)
            ? `Pay ${formatCents(cents)}`
            : "Pay Now"}
      </button>

      <p
        className="text-ink-soft mt-3 text-center text-sm"
        role={error ? "alert" : undefined}
      >
        {error ?? `Any amount from ${formatCents(MIN_CENTS)} to ${formatCents(MAX_CENTS)}.`}
      </p>
    </div>
  );
}
