import { z } from "zod";
import { CATEGORY_SLUGS, CONDITIONS, STATUSES, type ListingStatus } from "@/lib/categories";
import type { Json } from "@/lib/database.types";

export const MAX_IMAGES = 10;

export const listingImageSchema = z.object({
  fileId: z.string().min(1).max(100),
  path: z
    .string()
    .min(2)
    .max(300)
    .regex(/^\/[^\s?#]+$/, "Invalid image path"),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export type ListingImage = z.infer<typeof listingImageSchema>;

export const listingInputSchema = z.object({
  title: z.string().trim().min(3, "Give it a title of at least 3 characters").max(100),
  description: z.string().trim().max(5000, "Keep the description under 5,000 characters"),
  price: z.coerce
    .number({ error: "Enter a price" })
    .min(0, "Price can't be negative")
    .max(9_999_999, "Price is too high")
    .transform((n) => Math.round(n * 100) / 100),
  category: z.enum(CATEGORY_SLUGS, { error: "Pick a category" }),
  condition: z.enum(CONDITIONS.map((c) => c.value) as [string, ...string[]]).nullable(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  locationName: z.string().trim().max(120).nullable(),
  images: z
    .array(listingImageSchema)
    .min(1, "Add at least one photo")
    .max(MAX_IMAGES, `Up to ${MAX_IMAGES} photos`),
});

export type ListingInput = z.input<typeof listingInputSchema>;
export type ListingData = z.output<typeof listingInputSchema>;

export const statusSchema = z.enum(STATUSES);

/** Shape used by cards and grids. */
export type ListingSummary = {
  id: string;
  title: string;
  price: number;
  category: string;
  status: ListingStatus;
  images: ListingImage[];
  locationName: string | null;
  distanceKm: number | null;
};

export function parseImages(value: Json): ListingImage[] {
  const parsed = z.array(listingImageSchema).safeParse(value);
  return parsed.success ? parsed.data : [];
}

/**
 * Snaps a coordinate to a ~280 m grid. Only the approximate pickup area is ever
 * stored, so a seller's exact address can't leak through the public API.
 */
export function approximateCoordinate(value: number): number {
  return Math.round(value * 400) / 400;
}

export function toListingRow(data: ListingData) {
  return {
    title: data.title,
    description: data.description,
    price: data.price,
    category: data.category,
    condition: data.condition,
    lat: approximateCoordinate(data.lat),
    lng: approximateCoordinate(data.lng),
    location_name: data.locationName || null,
    images: data.images as unknown as Json,
  };
}
