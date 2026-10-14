import { Suspense, type CSSProperties } from "react";
import { CategoryBar } from "@/components/browse/category-bar";
import { BrowseFilters, MobileFiltersButton } from "@/components/browse/browse-filters";
import { InfiniteListings } from "@/components/browse/infinite-listings";
import { ListingCardSkeleton, ListingGrid } from "@/components/listing-card";
import { EmptyState } from "@/components/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { getCategory } from "@/lib/categories";
import { filtersToSearchParams, hasActiveFilters, parseFilters, type Filters } from "@/lib/filters";
import { getSavedIds, searchListings } from "@/lib/listings";
import { getUserId } from "@/lib/auth";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);
  const query = filtersToSearchParams(filters).toString();
  const filtered = hasActiveFilters(filters);

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-24 sm:px-6">
      {!filtered && <Hero locationName={filters.locationName} />}
      <div className={filtered ? "pt-5" : ""}>
        <CategoryBar filters={filters} />
      </div>

      <div className="mt-7 lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-24">
            <BrowseFilters filters={filters} />
          </div>
        </aside>

        <section aria-labelledby="results-heading">
          <div className="mb-5 flex items-center justify-between gap-4">
            <ResultsHeading filters={filters} />
            <div className="lg:hidden">
              <MobileFiltersButton filters={filters} />
            </div>
          </div>
          <Suspense key={query} fallback={<GridSkeleton />}>
            <Results filters={filters} query={query} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

async function Results({ filters, query }: { filters: Filters; query: string }) {
  const [{ items, hasMore }, userId] = await Promise.all([searchListings(filters), getUserId()]);

  if (items.length === 0) {
    return hasActiveFilters(filters) ? (
      <EmptyState
        title="Nothing matches yet"
        action={
          <ButtonLink href="/" variant="secondary">
            Clear filters
          </ButtonLink>
        }
      >
        Try a wider distance, a different price range, or fewer words in your search.
      </EmptyState>
    ) : (
      <EmptyState title="The stoop is empty" action={<ButtonLink href="/sell">List something</ButtonLink>}>
        Nobody has listed anything around here yet. Be the first.
      </EmptyState>
    );
  }

  const saved = await getSavedIds(userId, items.map((i) => i.id));

  return (
    <InfiniteListings
      key={query}
      initialItems={items}
      initialHasMore={hasMore}
      initialSavedIds={[...saved]}
      query={query}
      signedIn={Boolean(userId)}
    />
  );
}

function ResultsHeading({ filters }: { filters: Filters }) {
  const parts: string[] = [];
  if (filters.category) parts.push(getCategory(filters.category).label);
  const where = filters.radius
    ? `within ${filters.radius} mi of ${filters.locationName}`
    : `near ${filters.locationName}`;

  return (
    <h2 id="results-heading" className="min-w-0 text-[15px] text-ink-2">
      {filters.q ? (
        <>
          Results for <span className="font-semibold text-ink">“{filters.q}”</span>{" "}
        </>
      ) : (
        <span className="font-semibold text-ink">{parts[0] ?? "Today's picks"} </span>
      )}
      <span className="max-sm:block">{where}</span>
    </h2>
  );
}

function GridSkeleton() {
  return (
    <ListingGrid>
      {Array.from({ length: 8 }, (_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </ListingGrid>
  );
}

const HERO_STICKERS = [
  // x is a fraction of the free horizontal space, so stickers never overflow the column.
  { label: "5", dot: "#FFE14D", tilt: -10, size: "4.5rem", x: 0, y: "18%", delay: 80 },
  { label: "40", dot: "#8F9BFF", tilt: 8, size: "5.5rem", x: 0.3, y: "0%", delay: 160 },
  { label: "FREE", dot: "#4FE0A5", tilt: -5, size: "5rem", x: 0.62, y: "28%", delay: 240 },
  { label: "120", dot: "#FF8AC2", tilt: 12, size: "6rem", x: 1, y: "-2%", delay: 320 },
];

function Hero({ locationName }: { locationName: string }) {
  return (
    <section className="grid items-end gap-8 pb-8 pt-8 sm:pt-12 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div>
        <h1 className="font-display text-[clamp(2.4rem,6.2vw,4.75rem)] leading-[0.92]">
          Stuff your neighbors
          <br />
          are done with.
        </h1>
        <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink-2">
          Secondhand finds around {locationName}. Message the seller, then meet them on the stoop.
        </p>
      </div>
      <div className="relative hidden h-36 md:block" aria-hidden>
        {HERO_STICKERS.map((s) => (
          <span
            key={s.label}
            className="sticker absolute animate-peel-in"
            style={
              {
                "--dot": s.dot,
                "--tilt": `${s.tilt}deg`,
                "--size": s.size,
                left: `calc((100% - ${s.size}) * ${s.x})`,
                top: s.y,
                fontSize: s.label === "FREE" ? "1.15rem" : "1.9rem",
                animationDelay: `${s.delay}ms`,
              } as CSSProperties
            }
          >
            {s.label === "FREE" ? (
              "FREE"
            ) : (
              <span className="sticker-price">
                <span className="sticker-currency">$</span>
                {s.label}
              </span>
            )}
          </span>
        ))}
      </div>
    </section>
  );
}
