import type { Metadata } from "next";
import { ListingForm } from "@/components/sell/listing-form";
import { requireUserId } from "@/lib/auth";

export const metadata: Metadata = { title: "Sell something" };

export default async function SellPage() {
  await requireUserId("/sell");
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <h1 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] leading-[0.95]">Put it on the stoop.</h1>
      <p className="mt-3 max-w-lg text-[17px] text-ink-2">
        A few photos, a fair price, and a pickup area. Most listings take under two minutes.
      </p>
      <div className="mt-10">
        <ListingForm />
      </div>
    </div>
  );
}
