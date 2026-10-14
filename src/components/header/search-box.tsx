"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import clsx from "clsx";

export function SearchBox({ className }: { className?: string }) {
  const id = useId();
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("q") ?? "";
  const [value, setValue] = useState(current);
  const [prev, setPrev] = useState(current);

  // Keep the box in sync when the URL changes (back/forward, chip clicks).
  if (current !== prev) {
    setPrev(current);
    setValue(current);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const next = new URLSearchParams(params);
    const q = value.trim();
    if (q) next.set("q", q);
    else next.delete("q");
    const qs = next.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <form role="search" onSubmit={submit} className={clsx("relative", className)}>
      <label htmlFor={id} className="sr-only">
        Search listings
      </label>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-3" aria-hidden />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search bikes, couches, cribs…"
        autoComplete="off"
        enterKeyHint="search"
        className="h-11 w-full rounded-full bg-surface pl-10 pr-10 text-base ring-1 sm:text-[15px] ring-inset ring-line outline-none transition-shadow placeholder:text-ink-3 hover:ring-line-strong focus:ring-2 focus:ring-ink [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-ink-3 hover:bg-ink/5 hover:text-ink"
        >
          <X className="size-4" />
        </button>
      )}
    </form>
  );
}
