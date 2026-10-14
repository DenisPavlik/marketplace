"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";

const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Enter a name").max(60, "Keep it under 60 characters"),
  bio: z.string().trim().max(500, "Keep it under 500 characters"),
});

export async function updateProfile(
  input: z.input<typeof profileSchema>,
): Promise<{ ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> }> {
  const userId = await getUserId();
  if (!userId) return { ok: false, error: "Sign in to edit your profile." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Some fields need attention.", fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName, bio: parsed.data.bio || null })
    .eq("id", userId);

  if (error) {
    if (error.code === "42501" && error.message.startsWith("Demo")) {
      return { ok: false, error: "The demo profile can't be edited. Sign in with Google to set up your own." };
    }
    return { ok: false, error: "Couldn't save your profile. Try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
