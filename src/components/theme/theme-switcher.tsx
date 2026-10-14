"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import clsx from "clsx";
import { useThemePref } from "@/components/theme/use-theme";
import type { ThemePref } from "@/lib/theme";

const OPTIONS: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export function ThemeSwitcher({ compact = false, className }: { compact?: boolean; className?: string }) {
  const [pref, setPref] = useThemePref();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={clsx("grid grid-cols-3 gap-1 rounded-full bg-paper p-1 ring-1 ring-inset ring-line", className)}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={pref === value}
          aria-label={compact ? label : undefined}
          title={compact ? label : undefined}
          onClick={() => setPref(value)}
          className={clsx(
            "flex items-center justify-center gap-2 rounded-full font-semibold transition-colors",
            compact ? "h-8 text-xs" : "h-10 text-sm",
            pref === value ? "bg-ink text-on-ink shadow-sm" : "text-ink-2 hover:text-ink",
          )}
        >
          <Icon className="size-4" />
          {!compact && label}
        </button>
      ))}
    </div>
  );
}
