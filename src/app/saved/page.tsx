import type { Metadata } from "next";
import { ListingCard, ListingGrid } from "@/components/listing-card";
import { EmptyState } from "@/components/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { getSavedListings } from "@/lib/listings";
import { requireUserId } from "@/lib/auth";

export const metadata: Metadata = { title: "Saved" };

export default async function SavedPage() {
  const userId = await requireUserId("/saved");
  const listings = await getSavedListings(userId);

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 sm:px-6">
      <h1 className="font-display text-[clamp(1.9rem,4vw,2.8rem)] leading-none">Saved</h1>
      <p className="mt-2 text-[15px] text-ink-2">Things you&apos;re keeping an eye on.</p>
      <div className="mt-8">
        {listings.length === 0 ? (
          <EmptyState title="No saved listings" action={<ButtonLink href="/">Start browsing</ButtonLink>}>
            Tap the heart on any listing to keep it here.
          </EmptyState>
        ) : (
          <ListingGrid>
            {listings.map((l, i) => (
              <ListingCard key={l.id} listing={l} saved signedIn index={i} />
            ))}
          </ListingGrid>
        )}
      </div>
    </div>
  );
}
