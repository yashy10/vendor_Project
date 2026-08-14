import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center text-center">
      <span className="text-6xl" aria-hidden>
        🎪
      </span>
      <h1 className="font-display text-ink mt-6 text-3xl font-bold">
        Nothing at this stand
      </h1>
      <p className="text-ink-soft mt-3 text-balance">
        We couldn&rsquo;t find that vendor. Head back and pick another one.
      </p>
      <Link
        href="/"
        className="bg-clay hover:bg-clay-dark mt-8 flex h-14 w-full items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm transition active:scale-[0.99]"
      >
        Return to Vendors
      </Link>
    </main>
  );
}
