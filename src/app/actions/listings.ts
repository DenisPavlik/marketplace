"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth";
import { deleteImageKitFiles } from "@/lib/imagekit-server";
import { isUuid } from "@/lib/ids";
import {
  listingInputSchema,
  parseImages,
  statusSchema,
  toListingRow,
  type ListingInput,
} from "@/lib/listing";

type Failure = { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export type ActionResult<T = void> = ([T] extends [void] ? { ok: true } : { ok: true; data: T }) | Failure;

const NOT_SIGNED_IN = { ok: false, error: "Sign in to continue." } as const;
const NOT_FOUND = { ok: false, error: "This listing no longer exists." } as const;

/** Seed listings are protected by a trigger; explain that instead of a generic failure. */
function demoGuard(error: { code?: string; message: string } | null): Failure | null {
  if (error?.code === "42501" && error.message.startsWith("Demo")) {
    return { ok: false, error: `${error.message}. Post a listing of your own to try editing and deleting.` };
  }
  return null;
}

function validationError(error: z.ZodError) {
  return {
    ok: false as const,
    error: "Some fields need attention.",
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[] | undefined>,
  };
}

export async function createListing(input: ListingInput): Promise<ActionResult<{ id: string }>> {
  const userId = await getUserId();
  if (!userId) return NOT_SIGNED_IN;

  const parsed = listingInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .insert({ ...toListingRow(parsed.data), seller_id: userId })
    .select("id")
    .single();

  if (error) {
    console.error("createListing", error);
    return { ok: false, error: "Couldn't publish your listing. Try again in a moment." };
  }

  revalidatePath("/");
  return { ok: true, data: { id: data.id } };
}

export async function updateListing(id: string, input: ListingInput): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return NOT_SIGNED_IN;
  if (!isUuid(id)) return NOT_FOUND;

  const parsed = listingInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("listings")
    .select("images")
    .eq("id", id)
    .eq("seller_id", userId)
    .maybeSingle();
  if (!existing) return NOT_FOUND;

  const { error } = await supabase
    .from("listings")
    .update(toListingRow(parsed.data))
    .eq("id", id)
    .eq("seller_id", userId);

  if (error) {
    const guarded = demoGuard(error);
    if (guarded) return guarded;
    console.error("updateListing", error);
    return { ok: false, error: "Couldn't save your changes. Try again in a moment." };
  }

  const kept = new Set(parsed.data.images.map((img) => img.fileId));
  const removed = parseImages(existing.images)
    .map((img) => img.fileId)
    .filter((fileId) => !kept.has(fileId));
  after(() => deleteImageKitFiles(removed));

  revalidatePath("/");
  revalidatePath(`/listings/${id}`);
  return { ok: true };
}

export async function setListingStatus(id: string, status: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return NOT_SIGNED_IN;
  const parsedStatus = statusSchema.safeParse(status);
  if (!isUuid(id) || !parsedStatus.success) return NOT_FOUND;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .update({ status: parsedStatus.data })
    .eq("id", id)
    .eq("seller_id", userId)
    .select("id");

  if (error) return { ok: false, error: "Couldn't update the status. Try again." };
  if (!data.length) return NOT_FOUND;

  revalidatePath("/");
  revalidatePath(`/listings/${id}`);
  revalidatePath("/selling");
  return { ok: true };
}

export async function deleteListing(id: string): Promise<ActionResult> {
  const userId = await getUserId();
  if (!userId) return NOT_SIGNED_IN;
  if (!isUuid(id)) return NOT_FOUND;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .delete()
    .eq("id", id)
    .eq("seller_id", userId)
    .select("images");

  if (error) return demoGuard(error) ?? { ok: false, error: "Couldn't delete the listing. Try again." };
  if (!data.length) return NOT_FOUND;

  const fileIds = parseImages(data[0].images).map((img) => img.fileId);
  after(() => deleteImageKitFiles(fileIds));

  revalidatePath("/");
  revalidatePath("/selling");
  return { ok: true };
}
