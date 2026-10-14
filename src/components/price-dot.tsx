import clsx from "clsx";
import type { CSSProperties } from "react";
import { getCategory } from "@/lib/categories";
import { formatDotPrice, formatPrice, stickerTilt } from "@/lib/format";

type Size = "sm" | "md" | "lg" | "xl";

const SIZES: Record<Size, { box: string; font: (len: number) => string }> = {
  sm: { box: "2.75rem", font: (n) => (n <= 3 ? "1.05rem" : n <= 4 ? "0.9rem" : "0.78rem") },
  md: { box: "3.75rem", font: (n) => (n <= 3 ? "1.45rem" : n <= 4 ? "1.2rem" : "1.02rem") },
  lg: { box: "5rem", font: (n) => (n <= 3 ? "1.95rem" : n <= 4 ? "1.6rem" : "1.35rem") },
  xl: { box: "7rem", font: (n) => (n <= 3 ? "2.7rem" : n <= 4 ? "2.2rem" : "1.85rem") },
};

/** Round garage-sale price sticker. Color = category, tilt = stable per listing. */
export function PriceDot({
  price,
  category,
  seed,
  size = "md",
  animate = false,
  className,
}: {
  price: number;
  category: string;
  seed: string;
  size?: Size;
  animate?: boolean;
  className?: string;
}) {
  const label = formatDotPrice(price);
  const isFree = price === 0;
  const digits = isFree ? 3 : label.length + 1;
  const s = SIZES[size];

  return (
    <span
      className={clsx("sticker shrink-0", animate && "animate-peel-in", className)}
      style={
        {
          "--size": s.box,
          "--dot": isFree ? "#4FE0A5" : getCategory(category).dot,
          "--tilt": `${stickerTilt(seed)}deg`,
          fontSize: s.font(digits),
        } as CSSProperties
      }
      aria-label={formatPrice(price)}
      role="img"
    >
      {isFree ? (
        <span className="text-[0.8em] tracking-wide">FREE</span>
      ) : (
        <span className="sticker-price" aria-hidden>
          <span className="sticker-currency">$</span>
          {label}
        </span>
      )}
    </span>
  );
}

/** Small colored dot used to key categories in chips and labels. */
export function CategoryDot({ category, className }: { category: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={clsx("inline-block size-2.5 shrink-0 rounded-full ring-1 ring-black/10", className)}
      style={{ background: getCategory(category).dot }}
    />
  );
}
