import { describe, expect, it } from "vitest";
import { DEFAULT_LOCATION, filtersToSearchParams, hasActiveFilters, parseFilters } from "@/lib/filters";

describe("parseFilters", () => {
  it("falls back to defaults for empty params", () => {
    const f = parseFilters({});
    expect(f).toMatchObject({
      q: null,
      category: null,
      minPrice: null,
      maxPrice: null,
      sort: "newest",
      lat: DEFAULT_LOCATION.lat,
      lng: DEFAULT_LOCATION.lng,
      radius: null,
    });
    expect(hasActiveFilters(f)).toBe(false);
  });

  it("ignores unknown categories, sorts and garbage numbers", () => {
    const f = parseFilters({ cat: "weapons", sort: "random", min: "abc", lat: "999", lng: "1", r: "-5" });
    expect(f.category).toBeNull();
    expect(f.sort).toBe("newest");
    expect(f.minPrice).toBeNull();
    expect(f.lat).toBe(DEFAULT_LOCATION.lat);
    expect(f.radius).toBeNull();
  });

  it("swaps an inverted price range", () => {
    const f = parseFilters({ min: "500", max: "50" });
    expect([f.minPrice, f.maxPrice]).toEqual([50, 500]);
  });

  it("takes the first value of repeated params and trims search", () => {
    const f = parseFilters({ q: ["  bike  ", "couch"], cat: "sports" });
    expect(f.q).toBe("bike");
    expect(f.category).toBe("sports");
    expect(hasActiveFilters(f)).toBe(true);
  });
});

describe("filtersToSearchParams", () => {
  it("omits defaults so the home URL stays clean", () => {
    expect(filtersToSearchParams(parseFilters({})).toString()).toBe("");
  });

  it("round-trips through parseFilters", () => {
    const original = parseFilters({
      q: "lamp",
      cat: "home",
      min: "10",
      max: "80",
      sort: "price_asc",
      lat: "40.7081",
      lng: "-73.9571",
      loc: "Williamsburg, Brooklyn",
      r: "5",
    });
    const again = parseFilters(Object.fromEntries(filtersToSearchParams(original)));
    expect(again).toEqual(original);
  });
});
