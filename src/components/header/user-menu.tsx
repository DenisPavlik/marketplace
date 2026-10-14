"use client";

import Link from "next/link";
import { Heart, LogOut, Store, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { signOut } from "@/app/actions/auth";
import type { Viewer } from "@/lib/auth";

export function UserMenu({ viewer }: { viewer: Viewer }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items = [
    { href: `/u/${viewer.id}`, label: "Your profile", icon: User },
    { href: "/selling", label: "Your listings", icon: Store },
    { href: "/saved", label: "Saved", icon: Heart },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="rounded-full ring-offset-2 transition-shadow hover:ring-2 hover:ring-line-strong"
      >
        <Avatar name={viewer.display_name} src={viewer.avatar_url} size={38} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 animate-fade-up overflow-hidden rounded-2xl bg-surface p-1.5 shadow-xl ring-1 ring-black/5"
        >
          <p className="truncate px-3 pb-2 pt-2.5 text-sm font-semibold">{viewer.display_name}</p>
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-paper"
            >
              <Icon className="size-4 text-ink-2" />
              {label}
            </Link>
          ))}
          <form action={signOut} className="mt-1 border-t border-line pt-1">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-paper"
            >
              <LogOut className="size-4 text-ink-2" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
