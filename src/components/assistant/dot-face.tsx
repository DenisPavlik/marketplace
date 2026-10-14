"use client";

import clsx from "clsx";
import { useEffect, useId, useRef } from "react";

export type DotMood = "idle" | "curious" | "thinking" | "talking";

/**
 * Dot, Stoop's assistant: the brand's price sticker come to life. Pupils follow
 * the pointer, it blinks on its own, raises its brows when it has something to
 * say and moves its mouth while answering. All motion is CSS, keyed off data-mood.
 */
export function DotFace({
  mood = "idle",
  size = 64,
  track = true,
  className,
}: {
  mood?: DotMood;
  size?: number;
  /** Follow the pointer with the pupils. */
  track?: boolean;
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const gradient = useId();

  useEffect(() => {
    const svg = ref.current;
    if (!svg || !track || window.matchMedia("(hover: none)").matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = svg.getBoundingClientRect();
        const dx = e.clientX - (box.left + box.width / 2);
        const dy = e.clientY - (box.top + box.height / 2);
        const len = Math.hypot(dx, dy) || 1;
        // Ease toward the edge of the eye as the pointer gets farther away.
        const reach = Math.min(1, len / 240) * 4.5;
        svg.style.setProperty("--px", `${((dx / len) * reach).toFixed(2)}px`);
        svg.style.setProperty("--py", `${((dy / len) * reach).toFixed(2)}px`);
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, [track]);

  return (
    <svg
      ref={ref}
      viewBox="0 0 100 100"
      width={size}
      height={size}
      data-mood={mood}
      aria-hidden
      className={clsx("dot-face overflow-visible", className)}
    >
      <defs>
        <radialGradient id={gradient} cx="50%" cy="50%" r="50%">
          <stop offset="62%" stopColor="#FF6B4A" />
          <stop offset="100%" stopColor="#E9553A" />
        </radialGradient>
      </defs>

      {/* Sticker body with a glossy highlight. Its bottom-right edge is peeling: the body
          skips that segment and the flap folds back over it. */}
      <path d="M86.9 75.8 A45 45 0 1 0 72.5 89 Z" fill={`url(#${gradient})`} />
      <ellipse cx="19" cy="42" rx="5" ry="13" fill="#fff" opacity="0.35" transform="rotate(14 19 42)" />
      <path d="M86.9 75.8 Q75 75 72.5 89 Z" fill="#FFE3D8" stroke="#E9553A" strokeWidth="1" strokeLinejoin="round" />

      <g className="dot-brows" stroke="#15171c" strokeWidth="3.6" strokeLinecap="round" fill="none">
        <path className="dot-brow-l" d="M25 24 Q34 18 43 22" />
        <path className="dot-brow-r" d="M57 22 Q66 18 75 24" />
      </g>

      <g className="dot-eyes">
        {[34, 66].map((cx) => (
          <g key={cx}>
            <ellipse cx={cx} cy="41" rx="11" ry="13" fill="#fff" stroke="#15171c" strokeWidth="2.4" />
            <g className="dot-pupil">
              <circle cx={cx} cy="43" r="5.2" fill="#15171c" />
              <circle cx={cx + 1.8} cy="41" r="1.6" fill="#fff" />
            </g>
          </g>
        ))}
      </g>

      <path className="dot-smile" d="M41 66 Q50 74 59 66" fill="none" stroke="#15171c" strokeWidth="3.2" strokeLinecap="round" />
      <ellipse className="dot-mouth" cx="50" cy="68" rx="6" ry="5" fill="#15171c" />
    </svg>
  );
}
