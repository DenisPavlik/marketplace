import type { CSSProperties } from "react";
import { DotFace } from "@/components/assistant/dot-face";
import { ListingImage } from "@/components/listing-image";
import { PriceDot } from "@/components/price-dot";

/*
 * A stoop sale, drawn: brownstone steps with neighbors' things set out on them,
 * each wearing its price sticker, a cardboard sign, and Dot on the top step
 * keeping an eye on you. Items land one by one with the site's entrance motion.
 */

// Step tops, as a share of the scene's height from the top. Step 0 is the top step.
const STEPS = [
  { top: 30, left: 46 },
  { top: 48, left: 31 },
  { top: 66, left: 16 },
  { top: 84, left: 0 },
];

const ITEMS = [
  { id: "seed-armchair", path: "/stoop/seed/orange-armchair-1.jpg", price: 180, category: "home", step: 1, x: 36, size: 21, tilt: -4 },
  { id: "seed-guitar", path: "/stoop/seed/parlor-guitar-1.jpg", price: 85, category: "hobbies", step: 2, x: 63, size: 18, tilt: 5 },
  { id: "seed-typewriter", path: "/stoop/seed/corona-typewriter-1.jpg", price: 160, category: "hobbies", step: 3, x: 5, size: 19, tilt: 3 },
  { id: "seed-tricycle", path: "/stoop/seed/red-tricycle-1.jpg", price: 25, category: "kids", step: 3, x: 74, size: 17, tilt: -6 },
];

export function StoopScene({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <div className="relative aspect-[5/4] w-full">
        {/* Brownstone steps: a lit tread on top of each riser. */}
        {STEPS.map((s, i) => (
          <div
            key={i}
            className="absolute right-0 rounded-t-[3px]"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              bottom: 0,
              background:
                "linear-gradient(#b8785a 0 3px, #a5654a 3px 8px, rgb(0 0 0 / 0.18) 8px 11px, transparent 11px), linear-gradient(90deg, #8e543b, #7c4630)",
              boxShadow: "-6px 0 0 -2px rgb(0 0 0 / 0.08)",
              zIndex: i,
            }}
          />
        ))}

        <div className="absolute inset-x-[-4%] bottom-[-3%] h-[3%] rounded-full bg-ink/10 blur-[2px]" />

        {ITEMS.map((item, i) => (
          <div
            key={item.id}
            className="reveal absolute"
            style={
              {
                "--i": i + 1,
                left: `${item.x}%`,
                width: `${item.size}%`,
                bottom: `${100 - STEPS[item.step].top + 1}%`,
                zIndex: 10 + item.step,
              } as CSSProperties
            }
          >
            <div
              className="relative rounded-md bg-white p-1.5 pb-4 shadow-[0_10px_20px_-8px_rgb(21_23_28/0.45)]"
              style={{ rotate: `${item.tilt}deg` }}
            >
              <div className="relative aspect-square overflow-hidden rounded-sm bg-line">
                <ListingImage
                  src={item.path}
                  alt=""
                  fill
                  sizes="180px"
                  transformation={[{ aspectRatio: "1-1", focus: "auto" }]}
                  className="object-cover"
                />
              </div>
              <PriceDot
                price={item.price}
                category={item.category}
                seed={item.id}
                size="sm"
                className="absolute -right-3 -top-3"
              />
            </div>
          </div>
        ))}

        {/* The hand-lettered sign, taped to the top riser. */}
        <div
          className="reveal absolute rounded-sm bg-[#d9b98c] px-3 py-1.5 text-center font-marker text-[clamp(0.8rem,2.4vw,1.15rem)] font-bold leading-tight text-sticker-ink shadow-[0_6px_14px_-6px_rgb(21_23_28/0.5)]"
          style={{ "--i": 5, left: "22%", top: "70%", rotate: "-5deg", zIndex: 20 } as CSSProperties}
        >
          STOOP SALE
          <span className="block text-[0.7em] font-bold opacity-80">everything must go</span>
        </div>

        {/* Dot, sitting on the top step. */}
        <div className="dot-arrive absolute" style={{ left: "76%", bottom: `${100 - STEPS[0].top - 1}%`, width: "17%", zIndex: 9 }}>
          <div className="dot-bob">
            <DotFace mood="curious" size={96} className="h-auto w-full drop-shadow-[0_8px_12px_rgb(21_23_28/0.3)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
