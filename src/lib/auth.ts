import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

export type Viewer = Pick<Tables<"profiles">, "id" | "display_name" | "avatar_url">;

/** Verified user id from the session JWT, or null for guests. */
export const getUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
});

/** The signed-in user's public profile, or null for guests. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const userId = await getUserId();
  if (!userId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  return data;
});

export async function requireUserId(next = "/"): Promise<string> {
  const userId = await getUserId();
  if (!userId) redirect(`/login?next=${encodeURIComponent(next)}`);
  return userId;
}
