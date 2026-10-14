"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ListingImage } from "@/components/listing-image";
import type { ListingImage as ListingImageData } from "@/lib/listing";

/**
 * Full-screen photo viewer: swipe, arrow keys or buttons to move between photos,
 * thumbnails along the bottom, and click-to-zoom that pans with the pointer on desktop.
 * Built on <dialog>, so focus, Escape and the top layer come from the browser.
 */
export function Lightbox({
  images,
  title,
  open,
  startIndex,
  onClose,
}: {
  images: ListingImageData[];
  title: string;
  open: boolean;
  startIndex: number;
  /** Called with the photo the viewer was on, so the page gallery can follow. */
  onClose: (index: number) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);
  const count = images.length;

  const scrollToIndex = useCallback((i: number, smooth: boolean) => {
    const track = trackRef.current;
    track?.scrollTo({ left: i * track.clientWidth, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const go = useCallback(
    (next: number) => {
      const i = (next + count) % count;
      setZoomed(false);
      setIndex(i);
      scrollToIndex(i, true);
    },
    [count, scrollToIndex],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Jump straight to the photo that was clicked, without sliding past the others.
      requestAnimationFrame(() => scrollToIndex(startIndex, false));
    }
    if (!open && dialog.open) dialog.close();
  }, [open, startIndex, scrollToIndex]);

  // Follow native swipes.
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

  function close() {
    setZoomed(false);
    onClose(index);
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Photos of ${title}`}
      onClose={close}
      onKeyDown={(e) => {
        // The dialog sits inside the page gallery; keep its arrow keys to ourselves.
        e.stopPropagation();
        if (e.key === "ArrowLeft") go(index - 1);
        if (e.key === "ArrowRight") go(index + 1);
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-[#0b0c0f] p-0 text-white backdrop:bg-black open:flex open:animate-fade-up open:flex-col"
    >
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-white/80">{title}</p>
        {count > 1 && (
          <span className="text-sm font-semibold tabular-nums text-white/70">
            {index + 1} / {count}
          </span>
        )}
        <button
          type="button"
          onClick={close}
          aria-label="Close photos"
          className="grid size-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
        >
          <X className="size-5" />
        </button>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={trackRef}
          className={clsx(
            "flex h-full snap-x snap-mandatory scrollbar-none",
            zoomed ? "overflow-hidden" : "overflow-x-auto",
          )}
        >
          {images.map((img, i) => (
            <ZoomSlide
              key={img.fileId}
              image={img}
              alt={i === 0 ? title : `${title}, photo ${i + 1}`}
              active={i === index}
              zoomed={zoomed && i === index}
              onToggleZoom={() => setZoomed((z) => !z)}
              label={`${i + 1} of ${count}`}
            />
          ))}
        </div>
        {count > 1 && !zoomed && (
          <>
            <LightboxNav side="left" onClick={() => go(index - 1)} />
            <LightboxNav side="right" onClick={() => go(index + 1)} />
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex justify-center gap-2 overflow-x-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 scrollbar-none">
          {images.map((img, i) => (
            <button
              key={img.fileId}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === index}
              className={clsx(
                "relative size-14 shrink-0 overflow-hidden rounded-lg transition-all sm:size-16",
                i === index ? "ring-2 ring-white ring-offset-2 ring-offset-[#0b0c0f]" : "opacity-50 hover:opacity-90",
              )}
            >
              <ListingImage
                src={img.path}
                alt=""
                fill
                sizes="64px"
                transformation={[{ aspectRatio: "1-1", focus: "auto" }]}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </dialog>
  );
}

function ZoomSlide({
  image,
  alt,
  active,
  zoomed,
  onToggleZoom,
  label,
}: {
  image: ListingImageData;
  alt: string;
  active: boolean;
  zoomed: boolean;
  onToggleZoom: () => void;
  label: string;
}) {
  const [origin, setOrigin] = useState("50% 50%");

  function originFrom(e: React.MouseEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    return `${(((e.clientX - box.left) / box.width) * 100).toFixed(1)}% ${(((e.clientY - box.top) / box.height) * 100).toFixed(1)}%`;
  }

  return (
    <div
      className={clsx(
        "relative h-full w-full shrink-0 snap-center overflow-hidden",
        // Zoom is for mouse users; on touch screens pinch-zoom does the job.
        "[@media(hover:hover)_and_(pointer:fine)]:cursor-zoom-in",
        zoomed && "[@media(hover:hover)_and_(pointer:fine)]:cursor-zoom-out",
      )}
      aria-roledescription="slide"
      aria-label={label}
      onClick={(e) => {
        if (!active || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
        setOrigin(originFrom(e));
        onToggleZoom();
      }}
      onMouseMove={(e) => zoomed && setOrigin(originFrom(e))}
    >
      <ListingImage
        src={image.path}
        alt={alt}
        fill
        sizes="100vw"
        className="object-contain transition-transform duration-300 ease-out"
        style={
          {
            transform: zoomed ? "scale(2.2)" : "scale(1)",
            transformOrigin: origin,
            // A blurred backdrop would fill the whole screen here; keep the stage dark.
            backgroundImage: "none",
          } as CSSProperties
        }
      />
    </div>
  );
}

function LightboxNav({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous photo" : "Next photo"}
      className={clsx(
        "absolute top-1/2 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 sm:grid",
        side === "left" ? "left-4" : "right-4",
      )}
    >
      <Icon className="size-6" />
    </button>
  );
}
