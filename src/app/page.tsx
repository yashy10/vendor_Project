import VendorCard from "@/components/VendorCard";
import { vendors } from "@/lib/vendors";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mb-8">
        <p className="text-clay flex items-center gap-2 text-sm font-bold tracking-[0.2em] uppercase">
          <span aria-hidden>☀</span> Santa Cruz Fair
        </p>
        <h1 className="font-display text-ink mt-3 text-4xl font-bold">
          Choose a vendor
        </h1>
        <p className="text-ink-soft mt-2">
          Pick who you&rsquo;re paying, then enter an amount.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {vendors.map((vendor) => (
          <VendorCard key={vendor.id} vendor={vendor} />
        ))}
      </div>
    </main>
  );
}
