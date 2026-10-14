export const THEME_COOKIE = "stoop-theme";

export const THEME_PREFS = ["system", "light", "dark"] as const;
export type ThemePref = (typeof THEME_PREFS)[number];
export type ResolvedTheme = "light" | "dark";

export function parseThemePref(value: string | undefined | null): ThemePref {
  return THEME_PREFS.includes(value as ThemePref) ? (value as ThemePref) : "system";
}
