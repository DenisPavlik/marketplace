"use client";

import { useEffect } from "react";

/**
 * Publishes the visual viewport (the part of the screen above the on-screen keyboard)
 * as --vv-top and --vv-height on <html>. iOS Safari doesn't shrink the layout for the
 * keyboard, so full-screen sheets and chats size themselves from these instead.
 */
export function VisualViewportVars() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.style.setProperty("--vv-top", `${vv.offsetTop}px`);
        root.style.setProperty("--vv-height", `${vv.height}px`);
      });
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(frame);
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return null;
}

/** Calls `onResize` when the keyboard opens or closes, e.g. to keep a chat scrolled to the bottom. */
export function onVisualViewportResize(onResize: () => void): () => void {
  const vv = window.visualViewport;
  if (!vv) return () => {};
  vv.addEventListener("resize", onResize);
  return () => vv.removeEventListener("resize", onResize);
}
