import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Clock, MapPin } from "lucide-react";
import { Gallery } from "@/components/listing/gallery";
import { SellerActions } from "@/components/listing/seller-actions";
import { ShareButton } from "@/components/listing/share-button";
import { ContactSeller } from "@/components/listing/contact-seller";
import { StickyContactBar } from "@/components/listing/sticky-contact-bar";
import { findConversationId } from "@/lib/chat";
import { AreaMap } from "@/components/listing/area-map";
import { FavoriteButton } from "@/components/favorite-button";
import { PriceDot, CategoryDot } from "@/components/price-dot";
import { StatusTape } from "@/components/status-tape";
import { Avatar } from "@/components/avatar";
import { ListingCard, ListingGrid } from "@/components/listing-card";
import { conditionLabel, getCategory } from "@/lib/categories";
import { formatMemberSince, formatPrice, formatRelativeTime } from "@/lib/format";
import { getListing, getSavedIds, getSellerListings } from "@/lib/listings";
import { getUserId } from "@/lib/auth";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "Listing not found" };

  const description =
    `${formatPrice(listing.price)} · ${listing.location_name ?? "Brooklyn"}. ` +
    listing.description.slice(0, 140);
  // The share image comes from ./opengraph-image.tsx.
  return {
    title: listing.title,
    description,
    openGraph: {
      title: `${listing.title} — ${formatPrice(listing.price)}`,
      description,
      siteName: "Stoop",
      type: "website",
    },
  };
}

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  const [listing, userId] = await Promise.all([getListing(id), getUserId()]);
  if (!listing) notFound();

  const isOwner = userId === listing.seller_id;
  const [savedIds, conversationId] = await Promise.all([
    getSavedIds(userId, [listing.id]),
    userId && !isOwner ? findConversationId(listing.id, userId) : null,
  ]);
  const saved = savedIds.has(listing.id);
  const category = getCategory(listing.category);
  const condition = conditionLabel(listing.condition);
  const seller = listing.seller;

  return (
    <div className="mx-auto max-w-[1280px] px-4 pb-24 pt-5 sm:px-6 sm:pt-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-12">
        <div className="reveal relative lg:sticky lg:top-24 lg:self-start">
          <Gallery images={listing.images} title={listing.title} />
          <StatusTape status={listing.status} size="lg" className="!left-2 !top-6" />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="reveal [--i:1]">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
              <Link
                href={`/?cat=${category.slug}`}
                className="inline-flex items-center gap-1.5 font-semibold text-ink-2 hover:text-ink hover:underline"
              >
                <CategoryDot category={category.slug} />
                {category.label}
              </Link>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden />
                Listed {formatRelativeTime(listing.created_at)}
              </span>
            </div>

            <div className="mt-3 flex items-start justify-between gap-4">
              <h1 className="font-display text-[clamp(1.6rem,2.7vw,2.2rem)] leading-[1.04] [overflow-wrap:anywhere]">
                {listing.title}
              </h1>
              <PriceDot
                price={listing.price}
                category={listing.category}
                seed={listing.id}
                size="xl"
                animate
                className="-mt-1 mr-1"
              />
            </div>

            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px]">
              <span className="text-xl font-bold">{formatPrice(listing.price)}</span>
              {condition && (
                <span className="rounded-full bg-surface px-2.5 py-0.5 text-[13px] font-semibold ring-1 ring-inset ring-line">
                  {condition}
                </span>
              )}
              {listing.status !== "active" && (
                <span className="text-[13px] font-semibold text-ink-2">
                  {listing.status === "sold" ? "This item has sold" : "Someone has this on hold"}
                </span>
              )}
            </p>
          </div>

          {isOwner ? (
            <div className="reveal [--i:2]">
              <SellerActions listingId={listing.id} status={listing.status} />
            </div>
          ) : (
            <div id="contact" className="reveal flex scroll-mt-24 flex-col gap-3 [--i:2]">
              {seller && (
                <ContactSeller
                  listingId={listing.id}
                  sellerFirstName={seller.display_name.split(" ")[0]}
                  signedIn={Boolean(userId)}
                  existingConversationId={conversationId}
                />
              )}
              <div className="flex flex-wrap gap-2">
                <FavoriteButton listingId={listing.id} saved={saved} signedIn={Boolean(userId)} variant="inline" />
                <ShareButton title={listing.title} />
              </div>
            </div>
          )}

          {listing.description && (
            <section className="reveal [--i:3]">
              <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-3">Description</h2>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink [overflow-wrap:anywhere]">
                {listing.description}
              </p>
            </section>
          )}

          <section className="reveal [--i:4]">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-3">Pickup area</h2>
            <p className="mt-2 flex items-center gap-1.5 text-[15px] font-medium">
              <MapPin className="size-4" aria-hidden />
              {listing.location_name ?? "Approximate location"}
            </p>
            <div className="mt-3">
              <AreaMap lat={listing.lat} lng={listing.lng} />
            </div>
          </section>

          {seller && (
            <section className="reveal flex items-center gap-4 rounded-2xl bg-surface p-4 ring-1 ring-line [--i:5]">
              <Avatar name={seller.display_name} src={seller.avatar_url} size={52} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{seller.display_name}</p>
                <p className="text-[13px] text-ink-3">On Stoop since {formatMemberSince(seller.created_at)}</p>
              </div>
              <Link
                href={`/u/${seller.id}`}
                className="shrink-0 text-sm font-semibold underline-offset-4 hover:underline"
              >
                {isOwner ? "Your profile" : "See profile"}
              </Link>
            </section>
          )}
        </div>
      </div>

      {seller && !isOwner && (
        <StickyContactBar
          listing={{ id: listing.id, title: listing.title, price: listing.price, category: listing.category }}
          label={conversationId ? "Open chat" : `Message ${seller.display_name.split(" ")[0]}`}
          href={
            conversationId
              ? `/inbox/${conversationId}`
              : userId
                ? undefined
                : `/login?next=${encodeURIComponent(`/listings/${listing.id}`)}`
          }
        />
      )}

      {seller && (
        <Suspense>
          <MoreFromSeller sellerId={seller.id} sellerName={seller.display_name} excludeId={listing.id} userId={userId} />
        </Suspense>
      )}
    </div>
  );
}

async function MoreFromSeller({
  sellerId,
  sellerName,
  excludeId,
  userId,
}: {
  sellerId: string;
  sellerName: string;
  excludeId: string;
  userId: string | null;
}) {
  const items = await getSellerListings(sellerId, { excludeId, limit: 5 });
  if (items.length === 0) return null;
  const saved = await getSavedIds(userId, items.map((i) => i.id));

  return (
    <section className="mt-20">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl">More from {sellerName.split(" ")[0]}</h2>
        <Link href={`/u/${sellerId}`} className="text-sm font-semibold underline-offset-4 hover:underline">
          See all
        </Link>
      </div>
      <ListingGrid>
        {items.map((item, i) => (
          <ListingCard key={item.id} listing={item} saved={saved.has(item.id)} signedIn={Boolean(userId)} index={i} />
        ))}
      </ListingGrid>
    </section>
  );
}
