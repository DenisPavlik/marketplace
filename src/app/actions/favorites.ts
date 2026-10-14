"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";
import { isUuid } from "@/lib/ids";

export async function setFavorite(
  listingId: string,
  saved: boolean,
): Promise<{ ok: boolean; saved: boolean; error?: string }> {
  const userId = await getUserId();
  if (!userId) return { ok: false, saved: !saved, error: "Sign in to save listings." };
  if (!isUuid(listingId)) return { ok: false, saved: !saved, error: "Listing not found." };

  const supabase = await createClient();
  const { error } = saved
    ? await supabase
        .from("favorites")
        .upsert({ user_id: userId, listing_id: listingId }, { ignoreDuplicates: true })
    : await supabase.from("favorites").delete().eq("user_id", userId).eq("listing_id", listingId);

  if (error) return { ok: false, saved: !saved, error: "Couldn't update your saved items." };

  revalidatePath("/saved");
  return { ok: true, saved };
}
