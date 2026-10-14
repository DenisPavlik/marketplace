import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { milesToKm } from "@/lib/format";
import type { Filters } from "@/lib/filters";
import { parseImages, type ListingSummary } from "@/lib/listing";
import type { ListingStatus } from "@/lib/categories";
import { isUuid } from "@/lib/ids";

export const PAGE_SIZE = 24;

export async function searchListings(
  filters: Filters,
  offset = 0,
): Promise<{ items: ListingSummary[]; hasMore: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_listings", {
    q: filters.q ?? undefined,
    cat: filters.category ?? undefined,
    min_price: filters.minPrice ?? undefined,
    max_price: filters.maxPrice ?? undefined,
    near_lat: filters.lat,
    near_lng: filters.lng,
    radius_km: filters.radius != null ? milesToKm(filters.radius) : undefined,
    sort: filters.sort,
    // Ask for one extra row to know whether another page exists.
    page_limit: PAGE_SIZE + 1,
    page_offset: offset,
  });

  if (error) throw new Error(`Failed to load listings: ${error.message}`);

  const items = data.slice(0, PAGE_SIZE).map((row) => ({
    id: row.id,
    title: row.title,
    price: Number(row.price),
    category: row.category,
    status: row.status as ListingStatus,
    images: parseImages(row.images),
    locationName: row.location_name,
    distanceKm: row.distance_km,
  }));

  return { items, hasMore: data.length > PAGE_SIZE };
}

const LISTING_COLUMNS =
  "id, title, description, price, category, condition, status, images, lat, lng, location_name, created_at, updated_at, seller_id";

export const getListing = cache(async (id: string) => {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(`${LISTING_COLUMNS}, seller:profiles!listings_seller_id_fkey(id, display_name, avatar_url, created_at)`)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load listing: ${error.message}`);
  if (!data) return null;
  return {
    ...data,
    price: Number(data.price),
    status: data.status as ListingStatus,
    images: parseImages(data.images),
  };
});

export type ListingDetail = NonNullable<Awaited<ReturnType<typeof getListing>>>;

export async function getSellerListings(
  sellerId: string,
  opts: { excludeId?: string; includeSold?: boolean; limit?: number } = {},
): Promise<ListingSummary[]> {
  const supabase = await createClient();
  let query = supabase
    .from("listings")
    .select("id, title, price, category, status, images, location_name")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 48);
  if (opts.excludeId) query = query.neq("id", opts.excludeId);
  if (!opts.includeSold) query = query.neq("status", "sold");

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load seller listings: ${error.message}`);
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    price: Number(row.price),
    category: row.category,
    status: row.status as ListingStatus,
    images: parseImages(row.images),
    locationName: row.location_name,
    distanceKm: null,
  }));
}

export async function getSavedListings(userId: string): Promise<ListingSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("favorites")
    .select("created_at, listing:listings(id, title, price, category, status, images, location_name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load saved listings: ${error.message}`);
  return data.flatMap(({ listing }) =>
    listing
      ? [
          {
            id: listing.id,
            title: listing.title,
            price: Number(listing.price),
            category: listing.category,
            status: listing.status as ListingStatus,
            images: parseImages(listing.images),
            locationName: listing.location_name,
            distanceKm: null,
          },
        ]
      : [],
  );
}

/** Ids of the given listings that the user has saved. */
export async function getSavedIds(userId: string | null, listingIds?: string[]): Promise<Set<string>> {
  if (!userId) return new Set();
  const supabase = await createClient();
  let query = supabase.from("favorites").select("listing_id").eq("user_id", userId);
  if (listingIds) {
    if (listingIds.length === 0) return new Set();
    query = query.in("listing_id", listingIds);
  }
  const { data } = await query;
  return new Set(data?.map((f) => f.listing_id));
}

export async function getProfile(id: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, created_at")
    .eq("id", id)
    .maybeSingle();
  return data;
}
