"use client";

import { useEffect, useState } from "react";

/**
 * On phones the header (logo row + search) slides away while scrolling down
 * through listings and comes back the moment you scroll up.
 */
export function HeaderFrame({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;
        // Small jitters (and iOS rubber-banding) shouldn't toggle it.
        if (Math.abs(delta) < 8) return;
        setHidden(delta > 0 && y > 140 && !document.activeElement?.closest("header"));
        lastY = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      data-hidden={hidden}
      className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md transition-transform duration-300 ease-out max-md:data-[hidden=true]:-translate-y-full"
    >
      {children}
    </header>
  );
}
