import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { CATEGORIES, CATEGORY_SLUGS, CONDITIONS, conditionLabel, getCategory } from "@/lib/categories";
import { DEFAULT_LOCATION, defaultSort, filtersToSearchParams, type Filters } from "@/lib/filters";
import { formatPrice, formatRelativeTime } from "@/lib/format";
import { getListing, searchListings } from "@/lib/listings";

/*
 * Tools the shopping assistant can call. Everything reads public data through the
 * same functions the pages use, so the assistant can't see more than a visitor can.
 */

const NYC_BBOX = "-74.30,40.45,-73.65,40.95";

/** Geocodes a neighborhood name with Photon, kept inside New York City. */
async function geocode(place: string): Promise<{ lat: number; lng: number; name: string } | null> {
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(place)}&limit=1&lang=en&bbox=${NYC_BBOX}`,
      { signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { features: { geometry: { coordinates: [number, number] } }[] };
    const hit = data.features[0];
    if (!hit) return null;
    const [lng, lat] = hit.geometry.coordinates;
    return { lat, lng, name: place.slice(0, 60) };
  } catch {
    return null;
  }
}

export type AssistantCard = {
  id: string;
  title: string;
  price: number;
  category: string;
  status: string;
  cover: string | null;
  place: string | null;
};

const categoryEnum = z.enum(CATEGORY_SLUGS);

export const assistantTools = {
  searchListings: tool({
    description:
      "Search Stoop's listings. Use it whenever the user wants to find, buy or browse something. " +
      "Results are shown to the user as cards, so don't repeat every title back; summarize and point out good picks.",
    inputSchema: z.object({
      query: z.string().max(80).optional().describe("Keywords, e.g. 'armchair' or 'road bike'. Short nouns work best."),
      category: categoryEnum.optional().describe(
        `One of: ${CATEGORIES.map((c) => `${c.slug} (${c.label})`).join(", ")}`,
      ),
      minPrice: z.number().min(0).optional(),
      maxPrice: z.number().min(0).optional(),
      near: z.string().max(60).optional().describe("A New York neighborhood or borough, e.g. 'Park Slope' or 'Queens'."),
      radiusMiles: z.number().min(0.5).max(50).optional(),
      sort: z.enum(["relevance", "newest", "nearest", "price_asc", "price_desc"]).optional(),
    }),
    execute: async ({ query, category, minPrice, maxPrice, near, radiusMiles, sort }) => {
      const place = near ? await geocode(near) : null;
      const filters: Filters = {
        q: query?.trim() || null,
        category: category ?? null,
        minPrice: minPrice ?? null,
        maxPrice: maxPrice ?? null,
        sort: sort ?? (place ? "nearest" : defaultSort(query?.trim())),
        lat: place?.lat ?? DEFAULT_LOCATION.lat,
        lng: place?.lng ?? DEFAULT_LOCATION.lng,
        locationName: place?.name ?? DEFAULT_LOCATION.name,
        radius: place ? (radiusMiles ?? 3) : null,
      };
      const { items, hasMore } = await searchListings(filters);
      const qs = filtersToSearchParams(filters).toString();
      return {
        feedUrl: qs ? `/?${qs}` : "/",
        moreAvailable: hasMore || items.length > 6,
        placeFound: near ? Boolean(place) : undefined,
        listings: items.slice(0, 6).map(
          (l): AssistantCard => ({
            id: l.id,
            title: l.title,
            price: l.price,
            category: l.category,
            status: l.status,
            cover: l.images[0]?.path ?? null,
            place: l.locationName,
          }),
        ),
      };
    },
  }),

  getListing: tool({
    description: "Get the full details of one listing: description, condition, status, area, seller, age.",
    inputSchema: z.object({ id: z.string().uuid() }),
    execute: async ({ id }) => {
      const l = await getListing(id);
      if (!l) return { found: false as const };
      return {
        found: true as const,
        title: l.title,
        price: formatPrice(l.price),
        category: getCategory(l.category).label,
        condition: conditionLabel(l.condition),
        status: l.status,
        area: l.location_name,
        listed: formatRelativeTime(l.created_at),
        seller: l.seller?.display_name.split(" ")[0] ?? null,
        photos: l.images.length,
        description: l.description.slice(0, 1500),
      };
    },
  }),

  priceCheck: tool({
    description:
      "Compare a listing's price with similar listings on Stoop. Pass a short keyword for the kind of item " +
      "(e.g. 'armchair', 'turntable') so comparables match. Base the verdict only on what this returns.",
    inputSchema: z.object({
      id: z.string().uuid(),
      keyword: z.string().max(40).describe("What the item is, in one or two words."),
    }),
    execute: async ({ id, keyword }) => {
      const l = await getListing(id);
      if (!l) return { found: false as const };
      const base: Filters = {
        q: keyword,
        category: null,
        minPrice: null,
        maxPrice: null,
        sort: "relevance",
        lat: DEFAULT_LOCATION.lat,
        lng: DEFAULT_LOCATION.lng,
        locationName: DEFAULT_LOCATION.name,
        radius: null,
      };
      let { items } = await searchListings(base);
      // Too few keyword matches: fall back to the same category.
      if (items.filter((i) => i.id !== id).length < 3) {
        ({ items } = await searchListings({ ...base, q: null, sort: "newest", category: getCategory(l.category).slug }));
      }
      const comps = items.filter((i) => i.id !== id && i.price > 0).slice(0, 10);
      const prices = comps.map((c) => c.price).sort((a, b) => a - b);
      const median = prices.length ? prices[Math.floor(prices.length / 2)] : null;
      return {
        found: true as const,
        listing: { title: l.title, price: l.price, condition: conditionLabel(l.condition) },
        comparables: comps.map((c) => ({ title: c.title, price: c.price })),
        low: prices[0] ?? null,
        high: prices.at(-1) ?? null,
        median,
      };
    },
  }),

  draftListing: tool({
    description:
      "Draft a listing for someone who wants to sell something, from what they told you. " +
      "The user sees the draft as a card with a button that fills in the sell form. " +
      "Only include details the user gave you; never invent brands, sizes or flaws.",
    inputSchema: z.object({
      title: z.string().min(3).max(100).describe("Plain and specific, like 'Mid-century walnut armchair'."),
      description: z
        .string()
        .max(1200)
        .describe("2–5 short sentences: what it is, condition and flaws, size, pickup notes. Friendly, no hype."),
      category: categoryEnum,
      condition: z.enum(CONDITIONS.map((c) => c.value) as [string, ...string[]]).optional(),
      price: z.number().min(0).max(1_000_000).optional().describe("Suggested price in USD; 0 means free."),
    }),
    execute: async (draft) => draft,
  }),
};

export type AssistantTools = typeof assistantTools;
