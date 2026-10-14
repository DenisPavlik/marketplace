import Link from "next/link";
import { MapPin } from "lucide-react";
import { ListingImage } from "@/components/listing-image";
import { PriceDot } from "@/components/price-dot";
import { StatusTape } from "@/components/status-tape";
import { FavoriteButton } from "@/components/favorite-button";
import { formatDistance } from "@/lib/format";
import type { ListingSummary } from "@/lib/listing";

export function ListingCard({
  listing,
  saved,
  signedIn,
  priority = false,
  showFavorite = true,
}: {
  listing: ListingSummary;
  saved: boolean;
  signedIn: boolean;
  priority?: boolean;
  showFavorite?: boolean;
}) {
  const cover = listing.images[0];
  const distance = formatDistance(listing.distanceKm);
  const place = [listing.locationName, distance].filter(Boolean).join(" · ");

  return (
    <article className="relative">
      <Link href={`/listings/${listing.id}`} className="group block rounded-card outline-offset-4">
        <div className="relative">
          <div className="relative aspect-square overflow-hidden rounded-card bg-line">
            {cover && (
              <ListingImage
                src={cover.path}
                alt={listing.title}
                fill
                priority={priority}
                sizes="(min-width: 1536px) 18vw, (min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 640px) 31vw, 48vw"
                transformation={[{ aspectRatio: "1-1", focus: "auto" }]}
                className={
                  "object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] " +
                  (listing.status === "sold" ? "grayscale-[0.6]" : "")
                }
              />
            )}
            <StatusTape status={listing.status} />
          </div>
          <PriceDot
            price={listing.price}
            category={listing.category}
            seed={listing.id}
            size="md"
            className="absolute -bottom-5 right-2 sm:right-3"
          />
        </div>
        <div className="mt-2.5 pr-16">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink group-hover:underline group-hover:decoration-2 group-hover:underline-offset-2">
            {listing.title}
          </h3>
          {place && (
            <p className="mt-1 flex items-center gap-1 truncate text-[13px] text-ink-3">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{place}</span>
            </p>
          )}
        </div>
      </Link>
      {showFavorite && (
        <FavoriteButton
          listingId={listing.id}
          saved={saved}
          signedIn={signedIn}
          className="absolute right-2.5 top-2.5"
        />
      )}
    </article>
  );
}

export function ListingGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-9 xl:grid-cols-4 2xl:grid-cols-5">
      {children}
    </div>
  );
}

export function ListingCardSkeleton() {
  return (
    <div aria-hidden>
      <div className="aspect-square animate-pulse rounded-card bg-line" />
      <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-line" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-line" />
    </div>
  );
}
