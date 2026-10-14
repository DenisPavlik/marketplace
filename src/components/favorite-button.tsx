"use client";

import { Heart } from "lucide-react";
import clsx from "clsx";
import { usePathname, useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition, type CSSProperties } from "react";
import { toast } from "sonner";
import { setFavorite } from "@/app/actions/favorites";

export function FavoriteButton({
  listingId,
  saved,
  signedIn,
  variant = "overlay",
  className,
}: {
  listingId: string;
  saved: boolean;
  signedIn: boolean;
  variant?: "overlay" | "inline";
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [, startTransition] = useTransition();
  // Bumped on every save so the confetti remounts and plays again.
  const [burst, setBurst] = useState(0);

  function toggle() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    const next = !optimistic;
    if (next) setBurst((n) => n + 1);
    startTransition(async () => {
      setOptimistic(next);
      const res = await setFavorite(listingId, next);
      if (!res.ok) toast.error(res.error);
      else if (next) toast.success("Saved", { description: "Find it under Saved in your menu." });
      router.refresh();
    });
  }

  const label = optimistic ? "Remove from saved" : "Save";

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={optimistic}
        className={clsx(
          "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 ring-inset transition-colors",
          optimistic ? "bg-[#FF8AC2]/25 ring-[#FF8AC2] text-ink" : "bg-surface ring-line-strong hover:ring-ink-3",
          className,
        )}
      >
        <HeartIcon burst={burst} className={clsx("size-4", optimistic && "fill-ink")} />
        {optimistic ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={optimistic}
      aria-label={label}
      title={label}
      className={clsx(
        "grid size-9 place-items-center rounded-full bg-surface/90 text-ink shadow-sm backdrop-blur transition-transform hover:scale-110 active:scale-95",
        className,
      )}
    >
      <HeartIcon
        burst={burst}
        className={clsx("size-[18px] transition-colors", optimistic && "fill-[#FF4F9A] text-[#FF4F9A]")}
      />
    </button>
  );
}

// Sticker colors, so a save throws a little handful of price dots.
const CONFETTI = ["#FF8AC2", "#FFE14D", "#4FE0A5", "#8F9BFF", "#FFB547", "#5BC2FF", "#FF7A5C"];

function HeartIcon({ burst, className }: { burst: number; className: string }) {
  return (
    <span key={burst} className="relative grid place-items-center">
      <Heart className={clsx(className, burst > 0 && "animate-heart-pop")} strokeWidth={2.25} />
      {burst > 0 && (
        <span aria-hidden className="pointer-events-none absolute inset-0">
          {CONFETTI.map((color, i) => (
            <span
              key={color}
              className="confetti-dot"
              style={{ "--c": color, "--a": `${(360 / CONFETTI.length) * i + 12}deg` } as CSSProperties}
            />
          ))}
        </span>
      )}
    </span>
  );
}
