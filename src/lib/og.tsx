import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCategory } from "@/lib/categories";
import { formatDotPrice } from "@/lib/format";

/*
 * Building blocks for Open Graph images rendered with next/og (Satori).
 * Satori takes inline styles only and doesn't read variable fonts, so the
 * fonts are static latin subsets checked in under assets/og.
 */

export const OG_SIZE = { width: 1200, height: 630 };

export const OG = {
  paper: "#f4f5f7",
  surface: "#ffffff",
  ink: "#15171c",
  ink2: "#4a505c",
  ink3: "#6b7180",
  line: "#e2e4e9",
  sunken: "#e9ebef",
  tape: "#efe3c2",
  free: "#4FE0A5",
} as const;

const fontFile = (name: string) => readFile(join(process.cwd(), "assets/og", name));

export async function loadOgFonts() {
  const [expanded, medium, bold, marker] = await Promise.all([
    fontFile("archivo-expanded-800.woff"),
    fontFile("archivo-500.woff"),
    fontFile("archivo-700.woff"),
    fontFile("kalam-700.woff"),
  ]);
  return [
    { name: "Archivo Expanded", data: expanded, weight: 800 as const, style: "normal" as const },
    { name: "Archivo", data: medium, weight: 500 as const, style: "normal" as const },
    { name: "Archivo", data: bold, weight: 700 as const, style: "normal" as const },
    { name: "Kalam", data: marker, weight: 700 as const, style: "normal" as const },
  ];
}

/** Mixes a hex color toward black, like the sticker's color-mix() edge in globals.css. */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const channel = (shift: number) => Math.round(((n >> shift) & 255) * (1 - amount));
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
}

/** The round price sticker from the app, redrawn for Satori. */
export function OgSticker({
  price,
  category,
  size,
  tilt = 0,
  exact = false,
  style,
}: {
  price: number;
  category: string;
  size: number;
  tilt?: number;
  /** Print "1,350" instead of the app's short "1.4k" when it still fits. */
  exact?: boolean;
  style?: React.CSSProperties;
}) {
  const isFree = price === 0;
  const label =
    exact && Number.isInteger(price) && price < 100_000 ? price.toLocaleString("en-US") : formatDotPrice(price);
  const dot = isFree ? OG.free : getCategory(category).dot;
  const digits = label.length + 1;
  const fontSize = size * (isFree ? 0.3 : digits <= 3 ? 0.39 : digits <= 4 ? 0.32 : 0.27);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size,
        backgroundImage: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), rgba(255,255,255,0) 42%), radial-gradient(circle at 50% 50%, ${dot} 62%, ${shade(dot, 0.09)} 100%)`,
        boxShadow: `0 ${size * 0.04}px ${size * 0.1}px ${-size * 0.02}px rgba(21,23,28,0.32), 0 1px 2px rgba(21,23,28,0.15)`,
        color: OG.ink,
        fontFamily: "Kalam",
        fontWeight: 700,
        fontSize,
        lineHeight: 1,
        letterSpacing: "-0.02em",
        transform: `rotate(${tilt}deg)`,
        ...style,
      }}
    >
      {isFree ? (
        <span style={{ letterSpacing: "0.03em", marginTop: fontSize * 0.12 }}>FREE</span>
      ) : (
        <div style={{ display: "flex", alignItems: "flex-start", marginTop: fontSize * 0.14 }}>
          <span style={{ fontSize: fontSize * 0.55, marginTop: fontSize * 0.06, marginRight: fontSize * 0.04 }}>$</span>
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}

/** "st●●p": the two o's are price stickers. */
export function OgWordmark({ size }: { size: number }) {
  const dot = (color: string) => (
    <div
      style={{
        width: size * 0.56,
        height: size * 0.56,
        borderRadius: size,
        background: color,
        boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.12)",
        margin: `${size * 0.14}px ${size * 0.02}px 0`,
      }}
    />
  );
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        fontFamily: "Archivo Expanded",
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.04em",
        color: OG.ink,
      }}
    >
      <span>st</span>
      {dot("#FF6B4A")}
      {dot("#FFE14D")}
      <span>p</span>
    </div>
  );
}

/** Masking-tape strip with a handwritten note, for reserved and sold listings. */
export function OgTape({ label, style }: { label: string; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "10px 44px 6px",
        background: OG.tape,
        color: OG.ink,
        fontFamily: "Kalam",
        fontWeight: 700,
        fontSize: 40,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        boxShadow: "0 2px 6px rgba(21,23,28,0.2)",
        ...style,
      }}
    >
      {label}
    </div>
  );
}

/** Fetches an image and inlines it, so a CDN hiccup degrades the card instead of failing the render. */
export async function fetchImageDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    const bytes = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}
