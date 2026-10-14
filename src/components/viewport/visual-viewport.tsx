"use client";

import { useEffect } from "react";

/*
 * iOS reports the keyboard's final size the moment it starts to move, then slides the
 * keyboard and pans the page over a few hundred milliseconds. Jumping straight to the
 * final size made full-screen sheets drop and bounce back, so they ease along on the
 * same curves instead (sampled frame by frame from an iPhone screen recording).
 */
const OPEN = {
  duration: "250ms",
  // The resize event lands about three frames into the animation.
  delay: "-50ms",
  ease: "linear(0, 0.006, 0.027, 0.067, 0.128, 0.208, 0.303, 0.41, 0.522, 0.641, 0.743, 0.832, 0.902, 0.954, 0.986, 1)",
};
const CLOSE = {
  duration: "383ms",
  delay: "0ms",
  ease: "linear(0, 0.052, 0.17, 0.313, 0.448, 0.569, 0.67, 0.75, 0.816, 0.862, 0.897, 0.925, 0.945, 0.96, 0.971, 0.98, 0.986, 0.989, 0.991, 0.994, 0.995, 0.997, 0.998, 1)",
};

function isEditable(el: Element | null): boolean {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return !["button", "checkbox", "radio", "range", "submit", "reset", "file", "color"].includes(el.type);
  return el instanceof HTMLElement && el.isContentEditable;
}

/**
 * Publishes the visual viewport (the part of the screen above the on-screen keyboard)
 * as --vv-top and --vv-height on <html>, plus --kb-duration, --kb-delay and --kb-ease
 * for elements that transition with the keyboard (see `.keyboard-follow`). iOS Safari
 * doesn't shrink the layout for the keyboard, so full-screen sheets and chats size
 * themselves from these instead.
 */
export function VisualViewportVars() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    let frame = 0;
    let shown = { top: vv.offsetTop, height: vv.height };
    // The viewport height without a keyboard, so closing can start before iOS reports it.
    let restingHeight = vv.height;

    const apply = (top: number, height: number, motion: typeof OPEN | null) => {
      if (top === shown.top && height === shown.height) return;
      root.style.setProperty("--kb-duration", motion ? motion.duration : "0ms");
      root.style.setProperty("--kb-delay", motion ? motion.delay : "0ms");
      if (motion) root.style.setProperty("--kb-ease", motion.ease);
      root.style.setProperty("--vv-top", `${top}px`);
      root.style.setProperty("--vv-height", `${height}px`);
      shown = { top, height };
    };

    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const typing = isEditable(document.activeElement);
        if (!typing) restingHeight = vv.height;
        // Only a keyboard changes the height by this much; toolbars and plain panning snap.
        const delta = vv.height - shown.height;
        const motion = Math.abs(delta) > 120 ? (delta < 0 ? OPEN : CLOSE) : null;
        apply(vv.offsetTop, vv.height, motion);
      });
    };

    // The keyboard starts closing on blur, a few frames before iOS says so.
    const onFocusOut = (e: FocusEvent) => {
      if (!isEditable(e.target as Element) || isEditable(e.relatedTarget as Element | null)) return;
      if (restingHeight - shown.height > 120) apply(0, restingHeight, CLOSE);
    };

    root.style.setProperty("--vv-top", `${shown.top}px`);
    root.style.setProperty("--vv-height", `${shown.height}px`);
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return null;
}

/**
 * Keeps a scrolling list pinned to its newest item while the list itself resizes,
 * e.g. as a sheet shrinks above the keyboard, unless the reader has scrolled up.
 */
export function pinToBottomOnResize(el: HTMLElement): () => void {
  let pinned = true;
  let height = el.clientHeight;
  const onScroll = () => {
    // Mid-resize the list hasn't been re-pinned yet; that isn't the reader scrolling up.
    if (el.clientHeight !== height) return;
    pinned = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  };
  const observer = new ResizeObserver(() => {
    height = el.clientHeight;
    if (pinned) el.scrollTop = el.scrollHeight;
  });
  el.addEventListener("scroll", onScroll, { passive: true });
  observer.observe(el);
  return () => {
    el.removeEventListener("scroll", onScroll);
    observer.disconnect();
  };
}

/**
 * Stops touch drags from moving the page behind a full-screen sheet. iOS ignores
 * `overflow: hidden` for touch, and with the keyboard up it lets you drag the whole
 * page around. Lists inside `sheet` that can scroll still do.
 */
export function lockTouchScroll(sheet: HTMLElement): () => void {
  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length > 1) return; // pinch-zoom stays available
    for (let el = e.target as Element | null; el && sheet.contains(el); el = el.parentElement) {
      const style = getComputedStyle(el);
      if (el.scrollHeight > el.clientHeight && /auto|scroll/.test(style.overflowY)) return;
      if (el.scrollWidth > el.clientWidth && /auto|scroll/.test(style.overflowX)) return;
    }
    e.preventDefault();
  };
  document.addEventListener("touchmove", onTouchMove, { passive: false });
  return () => document.removeEventListener("touchmove", onTouchMove);
}
