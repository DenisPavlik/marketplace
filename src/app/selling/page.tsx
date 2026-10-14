import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ListingImage } from "@/components/listing-image";
import { PriceDot } from "@/components/price-dot";
import { EmptyState } from "@/components/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { getSellerListings } from "@/lib/listings";
import { requireUserId } from "@/lib/auth";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Your listings" };

const STATUS_LABEL = { active: "Available", reserved: "On hold", sold: "Sold" } as const;

export default async function SellingPage() {
  const userId = await requireUserId("/selling");
  const listings = await getSellerListings(userId, { includeSold: true, limit: 200 });

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-display text-[clamp(1.9rem,4vw,2.8rem)] leading-none">Your listings</h1>
        <ButtonLink href="/sell">
          <Plus className="size-4" strokeWidth={2.5} /> New listing
        </ButtonLink>
      </div>

      {listings.length === 0 ? (
        <EmptyState title="Nothing on your stoop yet" action={<ButtonLink href="/sell">List something</ButtonLink>}>
          Clear out a closet. Neighbors are looking.
        </EmptyState>
      ) : (
        <ul className="mt-8 divide-y divide-line rounded-2xl bg-surface ring-1 ring-line">
          {listings.map((l, i) => (
            <li key={l.id} className="reveal" style={{ "--i": Math.min(i, 10) } as CSSProperties}>
              <Link href={`/listings/${l.id}`} className="group flex items-center gap-4 p-3 sm:p-4 hover:bg-paper/60">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-line sm:size-20">
                  {l.images[0] && (
                    <ListingImage
                      src={l.images[0].path}
                      alt=""
                      fill
                      sizes="80px"
                      transformation={[{ aspectRatio: "1-1", focus: "auto" }]}
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold group-hover:underline">{l.title}</p>
                  <p className="mt-0.5 text-[13px] text-ink-3">
                    {formatPrice(l.price)} · {l.locationName ?? "No area set"}
                  </p>
                </div>
                <span
                  className={
                    "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold " +
                    (l.status === "active"
                      ? "bg-success/10 text-success"
                      : l.status === "reserved"
                        ? "bg-tape text-ink"
                        : "bg-line text-ink-2")
                  }
                >
                  {STATUS_LABEL[l.status]}
                </span>
                <PriceDot price={l.price} category={l.category} seed={l.id} size="sm" className="max-sm:hidden" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
