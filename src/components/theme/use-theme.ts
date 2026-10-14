"use client";

import { useCallback, useSyncExternalStore } from "react";
import { parseThemePref, THEME_COOKIE, type ResolvedTheme, type ThemePref } from "@/lib/theme";

const EVENT = "stoop-theme-change";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

function readPref(): ThemePref {
  return parseThemePref(document.documentElement.dataset.theme);
}

function readResolved(): ResolvedTheme {
  const pref = readPref();
  if (pref !== "system") return pref;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** The user's stored preference ("system" | "light" | "dark") and a setter. */
export function useThemePref() {
  const pref = useSyncExternalStore(subscribe, readPref, () => "system" as ThemePref);

  const setPref = useCallback((next: ThemePref) => {
    document.documentElement.dataset.theme = next;
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return [pref, setPref] as const;
}

/** What is actually on screen right now: "light" or "dark". */
export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribe, readResolved, () => "light");
}
