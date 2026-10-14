"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";
import { isUuid } from "@/lib/ids";

const bodySchema = z.string().trim().min(1, "Write a message first.").max(2000, "Keep it under 2,000 characters.");

export async function startConversation(
  listingId: string,
  message: string,
): Promise<{ ok: true; conversationId: string } | { ok: false; error: string }> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Sign in to message the seller." };
  if (!isUuid(listingId)) return { ok: false, error: "This listing no longer exists." };
  const body = bodySchema.safeParse(message);
  if (!body.success) return { ok: false, error: body.error.issues[0].message };

  const supabase = await createClient();
  const { data: conversationId, error } = await supabase.rpc("start_conversation", { p_listing_id: listingId });
  if (error || !conversationId) {
    return { ok: false, error: error?.message.includes("yourself") ? "This is your own listing." : "Couldn't start the conversation." };
  }

  const { error: sendError } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: userId, body: body.data });
  if (sendError) return { ok: false, error: "Couldn't send your message. Try again." };

  revalidatePath("/inbox", "layout");
  return { ok: true, conversationId };
}

export async function sendMessage(
  conversationId: string,
  message: string,
): Promise<{ ok: true; message: { id: number; sender_id: string; body: string; created_at: string } } | { ok: false; error: string }> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Sign in to send messages." };
  if (!isUuid(conversationId)) return { ok: false, error: "Conversation not found." };
  const body = bodySchema.safeParse(message);
  if (!body.success) return { ok: false, error: body.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: userId, body: body.data })
    .select("id, sender_id, body, created_at")
    .single();
  if (error) return { ok: false, error: "Message not sent. Check your connection and try again." };
  return { ok: true, message: data };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  if (!isUuid(conversationId)) return;
  const supabase = await createClient();
  await supabase.rpc("mark_conversation_read", { p_conversation_id: conversationId });
}
