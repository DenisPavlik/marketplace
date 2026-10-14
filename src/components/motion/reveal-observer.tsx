"use client";

import { useEffect } from "react";

const RISE_EASE = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const PEEL_EASE = "cubic-bezier(0.2, 0.9, 0.3, 1.25)";
const STAGGER = 55;

/**
 * Holds back `.reveal` blocks that start below the fold and plays their entrance
 * when they scroll into view, staggered within each batch. Blocks already on
 * screen keep their CSS load animation, so server-rendered content never flickers.
 *
 * Everything runs through the Web Animations API rather than attributes or
 * classes, so the DOM React hydrates stays exactly as the server sent it.
 */
export function RevealObserver() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const holds = new WeakMap<Element, Animation>();

    const play = (el: Element, delay: number) => {
      holds.get(el)?.cancel();
      el.animate([{ opacity: 0, translate: "0 18px" }, { opacity: 1, translate: "0 0" }], {
        duration: 560,
        delay,
        easing: RISE_EASE,
        fill: "backwards",
      });
      // The price sticker slaps on a beat after the photo lands.
      for (const sticker of el.querySelectorAll<HTMLElement>(".sticker")) {
        const tilt = getComputedStyle(sticker).getPropertyValue("--tilt").trim() || "0deg";
        sticker.animate(
          [
            { opacity: 0, transform: `scale(0.6) rotate(calc(${tilt} - 18deg))` },
            { opacity: 1, transform: `scale(1) rotate(${tilt})` },
          ],
          { duration: 480, delay: delay + 240, easing: PEEL_EASE, fill: "backwards" },
        );
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        let batch = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.unobserve(entry.target);
          play(entry.target, Math.min(batch++, 8) * STAGGER);
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );

    const seen = new WeakSet<Element>();
    const track = (el: Element) => {
      if (seen.has(el)) return;
      const rect = el.getBoundingClientRect();
      // Streamed Suspense content arrives in a hidden container first; wait until it's placed.
      if (rect.width === 0 && rect.height === 0) return;
      seen.add(el);
      if (rect.top > window.innerHeight) {
        holds.set(el, el.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: "forwards" }));
        io.observe(el);
      }
    };
    const scan = (node: Node) => {
      if (!(node instanceof Element)) return;
      if (node.classList.contains("reveal")) track(node);
      node.querySelectorAll(".reveal").forEach(track);
    };

    scan(document.body);
    // Infinite scroll, streamed Suspense content and client navigations add blocks later.
    // Mutation callbacks run before the next paint, so held blocks never flash.
    const mo = new MutationObserver((records) => records.forEach((r) => r.addedNodes.forEach(scan)));
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);

  return null;
}
