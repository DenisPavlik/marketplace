"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { ListingImage } from "@/components/listing-image";
import type { ListingImage as ListingImageData } from "@/lib/listing";

export function Gallery({ images, title }: { images: ListingImageData[]; title: string }) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const count = images.length;

  const go = useCallback(
    (next: number) => {
      const i = (next + count) % count;
      setIndex(i);
      const track = trackRef.current;
      track?.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
    },
    [count],
  );

  // Keep index in sync with native swipe/scroll on touch devices.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setIndex(Math.round(track.scrollLeft / track.clientWidth)));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      className="flex flex-col gap-3"
      role="region"
      aria-roledescription="carousel"
      aria-label={`Photos of ${title}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(index - 1);
        if (e.key === "ArrowRight") go(index + 1);
      }}
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#e9ebef]">
        <div ref={trackRef} className="flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto scrollbar-none">
          {images.map((img, i) => (
            <div
              key={img.fileId}
              className="relative h-full w-full shrink-0 snap-center"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
            >
              <ListingImage
                src={img.path}
                alt={i === 0 ? title : `${title}, photo ${i + 1}`}
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-contain"
              />
            </div>
          ))}
        </div>
        {count > 1 && (
          <>
            <NavButton side="left" onClick={() => go(index - 1)} />
            <NavButton side="right" onClick={() => go(index + 1)} />
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/75 px-2.5 py-1 text-xs font-semibold text-white tabular-nums">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {images.map((img, i) => (
            <button
              key={img.fileId}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={clsx(
                "relative size-16 shrink-0 overflow-hidden rounded-lg transition-all sm:size-20",
                i === index ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : "opacity-70 hover:opacity-100",
              )}
            >
              <ListingImage
                src={img.path}
                alt=""
                fill
                sizes="80px"
                transformation={[{ aspectRatio: "1-1", focus: "auto" }]}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={clsx(
        "absolute top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition-transform hover:scale-105 sm:grid",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
