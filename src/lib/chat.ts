import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { parseImages } from "@/lib/listing";
import { isUuid } from "@/lib/ids";
import type { ListingStatus } from "@/lib/categories";

const CONVERSATION_SELECT = `
  id, listing_id, buyer_id, seller_id, last_message_at, last_message_preview, last_message_sender_id,
  buyer_last_read_at, seller_last_read_at, created_at,
  listing:listings(id, title, price, category, status, images),
  buyer:profiles!conversations_buyer_id_fkey(id, display_name, avatar_url),
  seller:profiles!conversations_seller_id_fkey(id, display_name, avatar_url)
`;

type Row = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender_id: string | null;
  buyer_last_read_at: string;
  seller_last_read_at: string;
  created_at: string;
  listing: { id: string; title: string; price: number; category: string; status: string; images: unknown } | null;
  buyer: { id: string; display_name: string; avatar_url: string | null } | null;
  seller: { id: string; display_name: string; avatar_url: string | null } | null;
};

function shape(row: Row, userId: string) {
  const role = row.buyer_id === userId ? ("buyer" as const) : ("seller" as const);
  const other = role === "buyer" ? row.seller : row.buyer;
  const myLastRead = role === "buyer" ? row.buyer_last_read_at : row.seller_last_read_at;
  const otherLastRead = role === "buyer" ? row.seller_last_read_at : row.buyer_last_read_at;
  const unread =
    row.last_message_at != null &&
    row.last_message_sender_id !== userId &&
    new Date(row.last_message_at) > new Date(myLastRead);

  return {
    id: row.id,
    role,
    unread,
    otherLastReadAt: otherLastRead,
    lastMessageAt: row.last_message_at ?? row.created_at,
    lastMessagePreview: row.last_message_preview,
    lastMessageFromMe: row.last_message_sender_id === userId,
    other: other ?? { id: "", display_name: "Deleted user", avatar_url: null },
    listing: row.listing
      ? {
          id: row.listing.id,
          title: row.listing.title,
          price: Number(row.listing.price),
          category: row.listing.category,
          status: row.listing.status as ListingStatus,
          cover: parseImages(row.listing.images as never)[0] ?? null,
        }
      : null,
  };
}

export type ConversationSummary = ReturnType<typeof shape>;

export const getConversations = cache(async (userId: string): Promise<ConversationSummary[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("conversations")
    .select(CONVERSATION_SELECT)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(100);
  if (error) throw new Error(`Failed to load conversations: ${error.message}`);
  return (data as unknown as Row[]).map((row) => shape(row, userId));
});

export async function getConversation(id: string, userId: string) {
  if (!isUuid(id)) return null;
  const supabase = await createClient();
  const [{ data: row }, { data: messages }] = await Promise.all([
    supabase.from("conversations").select(CONVERSATION_SELECT).eq("id", id).maybeSingle(),
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  if (!row) return null;
  return {
    ...shape(row as unknown as Row, userId),
    messages: (messages ?? []).reverse(),
  };
}

export type ChatMessage = { id: number; sender_id: string; body: string; created_at: string };

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("unread_conversation_count");
  return data ?? 0;
}

/** The viewer's existing conversation about a listing, if any. */
export async function findConversationId(listingId: string, userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listingId)
    .eq("buyer_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}
