const KM_PER_MILE = 1.609344;

export function kmToMiles(km: number): number {
  return km / KM_PER_MILE;
}

export function milesToKm(mi: number): number {
  return mi * KM_PER_MILE;
}

const usdWhole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usdCents = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

/** Full price, e.g. "$1,250", "$19.50" or "Free". */
export function formatPrice(price: number): string {
  if (price === 0) return "Free";
  return Number.isInteger(price) ? usdWhole.format(price) : usdCents.format(price);
}

/** Short price for a sticker dot: "85", "1.2k", "18k", "FREE". */
export function formatDotPrice(price: number): string {
  if (price === 0) return "FREE";
  if (price < 1000) return Number.isInteger(price) ? String(price) : price.toFixed(2);
  // Round on integers (tenths of a thousand) to dodge float artifacts like 9.95 → "9.9".
  if (price < 10_000) return `${trimZero((Math.round(price / 100) / 10).toFixed(1))}k`;
  if (price < 1_000_000) return `${Math.round(price / 1000)}k`;
  return `${trimZero((Math.round(price / 100_000) / 10).toFixed(1))}m`;
}

function trimZero(s: string): string {
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

/** "0.3 mi", "4 mi", "120 mi" */
export function formatDistance(km: number | null | undefined): string | null {
  if (km == null || Number.isNaN(km)) return null;
  const mi = kmToMiles(km);
  if (mi < 0.1) return "< 0.1 mi";
  if (mi < 10) return `${trimZero(mi.toFixed(1))} mi`;
  return `${Math.round(mi)} mi`;
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

/** "3 days ago", "just now" */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export function formatMemberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Stable small rotation per id so each sticker looks hand-applied but never jumps between renders. */
export function stickerTilt(id: string, range = 8): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(hash) % (range * 2 * 10)) / 10) - range;
}
