import { describe, expect, it } from "vitest";
import { approximateCoordinate, listingInputSchema, parseImages, toListingRow } from "@/lib/listing";
import { isUuid } from "@/lib/ids";

const valid = {
  title: "Walnut armchair",
  description: "Solid frame, a few scuffs.",
  price: "140",
  category: "home",
  condition: "good",
  lat: 40.67123,
  lng: -73.98141,
  locationName: "Park Slope, Brooklyn",
  images: [{ fileId: "abc123", path: "/stoop/u/chair.jpg", width: 1200, height: 1200 }],
};

describe("listingInputSchema", () => {
  it("accepts a valid listing and coerces the price", () => {
    const parsed = listingInputSchema.parse(valid);
    expect(parsed.price).toBe(140);
  });

  it("rounds prices to cents", () => {
    expect(listingInputSchema.parse({ ...valid, price: 19.999 }).price).toBe(20);
  });

  it.each([
    ["short title", { title: "ab" }],
    ["negative price", { price: -1 }],
    ["unknown category", { category: "weapons" }],
    ["no photos", { images: [] }],
    ["too many photos", { images: Array.from({ length: 11 }, (_, i) => ({ fileId: `f${i}`, path: `/p/${i}.jpg` })) }],
    ["absolute image URL", { images: [{ fileId: "x", path: "https://evil.example/x.jpg" }] }],
    ["image path with query", { images: [{ fileId: "x", path: "/a.jpg?tr=w-1" }] }],
    ["latitude out of range", { lat: 91 }],
  ])("rejects %s", (_, patch) => {
    expect(listingInputSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});

describe("toListingRow", () => {
  it("stores only an approximate location", () => {
    const row = toListingRow(listingInputSchema.parse(valid));
    expect(row.lat).toBe(approximateCoordinate(valid.lat));
    expect(Math.abs(row.lat - valid.lat)).toBeLessThan(0.0013);
    expect(row.lat * 400).toBeCloseTo(Math.round(row.lat * 400));
  });
});

describe("parseImages", () => {
  it("drops malformed data instead of throwing", () => {
    expect(parseImages(null)).toEqual([]);
    expect(parseImages([{ nope: true }])).toEqual([]);
    expect(parseImages([{ fileId: "a", path: "/a.jpg" }])).toHaveLength(1);
  });
});

describe("isUuid", () => {
  it("validates ids before they reach the database", () => {
    expect(isUuid("0f2e6a1c-1d2e-4b6f-9a1b-2c3d4e5f6a7b")).toBe(true);
    expect(isUuid("1; drop table listings")).toBe(false);
  });
});
