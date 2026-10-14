import { describe, expect, it } from "vitest";
import {
  formatDistance,
  formatDotPrice,
  formatPrice,
  formatRelativeTime,
  kmToMiles,
  milesToKm,
  stickerTilt,
} from "@/lib/format";

describe("formatPrice", () => {
  it("shows Free for zero", () => expect(formatPrice(0)).toBe("Free"));
  it("formats whole and fractional dollars", () => {
    expect(formatPrice(1250)).toBe("$1,250");
    expect(formatPrice(19.5)).toBe("$19.50");
  });
});

describe("formatDotPrice", () => {
  it.each([
    [0, "FREE"],
    [5, "5"],
    [999, "999"],
    [12.5, "12.50"],
    [1000, "1k"],
    [1250, "1.3k"],
    [9_950, "10k"],
    [18_000, "18k"],
    [1_200_000, "1.2m"],
  ])("%d → %s", (price, expected) => expect(formatDotPrice(price)).toBe(expected));
});

describe("formatDistance", () => {
  it("returns null without a distance", () => {
    expect(formatDistance(null)).toBeNull();
    expect(formatDistance(Number.NaN)).toBeNull();
  });
  it("uses miles with sensible precision", () => {
    expect(formatDistance(0.05)).toBe("< 0.1 mi");
    expect(formatDistance(milesToKm(2.34))).toBe("2.3 mi");
    expect(formatDistance(milesToKm(3))).toBe("3 mi");
    expect(formatDistance(milesToKm(42.4))).toBe("42 mi");
  });
  it("converts units symmetrically", () => expect(kmToMiles(milesToKm(7))).toBeCloseTo(7));
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-10-14T12:00:00Z");
  it("handles recent and older timestamps", () => {
    expect(formatRelativeTime("2026-10-14T11:59:50Z", now)).toBe("just now");
    expect(formatRelativeTime("2026-10-14T09:00:00Z", now)).toBe("3 hours ago");
    expect(formatRelativeTime("2026-10-13T12:00:00Z", now)).toBe("yesterday");
  });
});

describe("stickerTilt", () => {
  it("is stable for the same id and stays in range", () => {
    const ids = ["a", "b4c1", "0f2e6a1c-1d2e-4b6f-9a1b-2c3d4e5f6a7b", "listing-42"];
    for (const id of ids) {
      expect(stickerTilt(id)).toBe(stickerTilt(id));
      expect(Math.abs(stickerTilt(id))).toBeLessThanOrEqual(8);
    }
  });
});
