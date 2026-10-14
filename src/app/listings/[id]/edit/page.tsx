import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingForm } from "@/components/sell/listing-form";
import { requireUserId } from "@/lib/auth";
import { getListing } from "@/lib/listings";

export const metadata: Metadata = { title: "Edit listing" };

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId(`/listings/${id}/edit`);
  const listing = await getListing(id);
  if (!listing || listing.seller_id !== userId) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
      <h1 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] leading-[0.95]">Edit listing</h1>
      <div className="mt-10">
        <ListingForm
          listingId={listing.id}
          initial={{
            title: listing.title,
            description: listing.description,
            price: String(listing.price),
            category: listing.category,
            condition: listing.condition,
            location: { lat: listing.lat, lng: listing.lng, name: listing.location_name ?? "" },
            images: listing.images,
          }}
        />
      </div>
    </div>
  );
}
