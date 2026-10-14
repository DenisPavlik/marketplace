"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ListingCard, ListingCardSkeleton, ListingGrid } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { loadMoreListings } from "@/app/actions/browse";
import type { ListingSummary } from "@/lib/listing";

export function InfiniteListings({
  initialItems,
  initialHasMore,
  initialSavedIds,
  query,
  signedIn,
}: {
  initialItems: ListingSummary[];
  initialHasMore: boolean;
  initialSavedIds: string[];
  query: string;
  signedIn: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [savedIds, setSavedIds] = useState(() => new Set(initialSavedIds));
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  function loadMore() {
    if (pending || !hasMore) return;
    setFailed(false);
    startTransition(async () => {
      try {
        const next = await loadMoreListings(query, items.length);
        setItems((prev) => {
          const seen = new Set(prev.map((i) => i.id));
          return [...prev, ...next.items.filter((i) => !seen.has(i.id))];
        });
        setSavedIds((prev) => new Set([...prev, ...next.savedIds]));
        setHasMore(next.hasMore);
      } catch {
        setFailed(true);
      }
    });
  }

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || failed) return;
    const observer = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && loadMore(),
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, failed, items.length]);

  return (
    <>
      <ListingGrid>
        {items.map((listing, i) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            saved={savedIds.has(listing.id)}
            signedIn={signedIn}
            priority={i < 4}
          />
        ))}
        {pending && Array.from({ length: 4 }, (_, i) => <ListingCardSkeleton key={`s${i}`} />)}
      </ListingGrid>
      {hasMore && <div ref={sentinelRef} className="h-px" />}
      {failed && (
        <div className="mt-10 flex flex-col items-center gap-3 text-sm text-ink-2">
          <p>Couldn&apos;t load more listings.</p>
          <Button variant="secondary" onClick={loadMore}>
            Try again
          </Button>
        </div>
      )}
      {!hasMore && items.length > 12 && (
        <p className="mt-14 text-center font-marker text-lg text-ink-3">That&apos;s everything on the stoop for now.</p>
      )}
    </>
  );
}
