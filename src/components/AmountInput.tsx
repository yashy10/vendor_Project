"use client";

import { AMOUNT_PATTERN } from "@/lib/amount";

const PRESETS_IN_CENTS = [500, 1000, 2000];

/**
 * The dollar field and its presets. Controlled: PaymentPanel owns the value,
 * because every payment method needs to read the same amount.
 */
export default function AmountInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  // Reject anything that isn't a dollar amount at the keystroke, so the field
  // can never hold a value the buttons would have to reason about.
  function handleChange(next: string) {
    if (next !== "" && !AMOUNT_PATTERN.test(next)) return;
    onChange(next);
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
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          disabled={disabled}
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
            onClick={() => onChange((preset / 100).toFixed(2))}
            disabled={disabled}
            className="border-sand text-ink hover:border-clay/50 h-12 rounded-2xl border-2 bg-white font-bold transition active:scale-[0.98] disabled:opacity-50"
          >
            ${preset / 100}
          </button>
        ))}
      </div>
    </div>
  );
}
