"use server";

import { parseFilters } from "@/lib/filters";
import { getSavedIds, searchListings } from "@/lib/listings";
import { getUserId } from "@/lib/auth";

export async function loadMoreListings(query: string, offset: number) {
  const filters = parseFilters(Object.fromEntries(new URLSearchParams(query)));
  const safeOffset = Math.max(0, Math.min(Math.floor(offset) || 0, 2000));
  const [{ items, hasMore }, userId] = await Promise.all([
    searchListings(filters, safeOffset),
    getUserId(),
  ]);
  const saved = await getSavedIds(userId, items.map((i) => i.id));
  return { items, hasMore, savedIds: [...saved] };
}
