import { isCategorySlug, type CategorySlug } from "@/lib/categories";

export const SORTS = [
  { value: "relevance", label: "Best match" },
  { value: "newest", label: "Newest first" },
  { value: "nearest", label: "Closest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

export type Sort = (typeof SORTS)[number]["value"];

/** Searches default to the best matches; plain browsing to the newest listings. */
export function defaultSort(q: string | null | undefined): Sort {
  return q ? "relevance" : "newest";
}

export const RADIUS_OPTIONS = [1, 2, 5, 10, 25, 50] as const;

/** Prospect Heights, Brooklyn — the demo neighborhood. */
export const DEFAULT_LOCATION = { lat: 40.6775, lng: -73.9692, name: "Brooklyn, NY" };

export type Filters = {
  q: string | null;
  category: CategorySlug | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: Sort;
  lat: number;
  lng: number;
  locationName: string;
  /** Search radius in miles; null means anywhere. */
  radius: number | null;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function num(value: string | undefined, min: number, max: number): number | null {
  if (value == null || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

export function parseFilters(params: RawParams): Filters {
  const q = first(params.q)?.trim().slice(0, 100) || null;
  const cat = first(params.cat);
  let minPrice = num(first(params.min), 0, 10_000_000);
  let maxPrice = num(first(params.max), 0, 10_000_000);
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }
  const sortParam = first(params.sort);
  const known = SORTS.find((s) => s.value === sortParam)?.value as Sort | undefined;
  // "Best match" only means something when there's a search term.
  const sort = known && !(known === "relevance" && !q) ? known : defaultSort(q);
  const lat = num(first(params.lat), -90, 90);
  const lng = num(first(params.lng), -180, 180);
  const hasLocation = lat != null && lng != null;
  const radius = num(first(params.r), 0.5, 500);

  return {
    q,
    category: isCategorySlug(cat) ? cat : null,
    minPrice,
    maxPrice,
    sort,
    lat: hasLocation ? lat : DEFAULT_LOCATION.lat,
    lng: hasLocation ? lng : DEFAULT_LOCATION.lng,
    locationName: (hasLocation && first(params.loc)?.slice(0, 80)) || DEFAULT_LOCATION.name,
    radius,
  };
}

/** Serializes filters back to a query string, omitting defaults. */
export function filtersToSearchParams(f: Partial<Filters>): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.category) p.set("cat", f.category);
  if (f.minPrice != null) p.set("min", String(f.minPrice));
  if (f.maxPrice != null) p.set("max", String(f.maxPrice));
  if (f.sort && f.sort !== defaultSort(f.q)) p.set("sort", f.sort);
  if (
    f.lat != null &&
    f.lng != null &&
    (f.lat !== DEFAULT_LOCATION.lat || f.lng !== DEFAULT_LOCATION.lng)
  ) {
    p.set("lat", f.lat.toFixed(5));
    p.set("lng", f.lng.toFixed(5));
    if (f.locationName) p.set("loc", f.locationName);
  }
  if (f.radius != null) p.set("r", String(f.radius));
  return p;
}

export function hasActiveFilters(f: Filters): boolean {
  return Boolean(
    f.q || f.category || f.minPrice != null || f.maxPrice != null || f.radius != null,
  );
}
