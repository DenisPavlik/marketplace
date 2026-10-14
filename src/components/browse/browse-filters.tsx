"use client";

import { MapPin, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/field";
import { LocationDialog } from "@/components/browse/location-dialog";
import { filtersToSearchParams, hasActiveFilters, SORTS, type Filters, type Sort } from "@/lib/filters";

function useApplyFilters(filters: Filters) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const apply = (patch: Partial<Filters>) => {
    const qs = filtersToSearchParams({ ...filters, ...patch }).toString();
    startTransition(() => router.push(qs ? `/?${qs}` : "/", { scroll: false }));
  };
  return { apply, pending };
}

export function BrowseFilters({ filters }: { filters: Filters }) {
  const { apply, pending } = useApplyFilters(filters);
  return <FiltersBody filters={filters} apply={apply} pending={pending} />;
}

function FiltersBody({
  filters,
  apply,
  pending,
}: {
  filters: Filters;
  apply: (patch: Partial<Filters>) => void;
  pending: boolean;
}) {
  const [locationOpen, setLocationOpen] = useState(false);

  function submitPrice(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const toNum = (v: FormDataEntryValue | null) => {
      const s = String(v ?? "").trim();
      if (!s) return null;
      const n = Number(s);
      return Number.isFinite(n) && n >= 0 ? n : null;
    };
    let min = toNum(data.get("min"));
    let max = toNum(data.get("max"));
    if (min != null && max != null && min > max) [min, max] = [max, min];
    apply({ minPrice: min, maxPrice: max });
  }

  return (
    <div className="flex flex-col gap-7" aria-busy={pending}>
      <section>
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-3">Location</h2>
        <button
          type="button"
          onClick={() => setLocationOpen(true)}
          className="mt-2.5 flex w-full items-start gap-2.5 rounded-xl bg-surface p-3 text-left ring-1 ring-inset ring-line hover:ring-line-strong"
        >
          <MapPin className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{filters.locationName}</span>
            <span className="block text-[13px] text-ink-3">
              {filters.radius ? `Within ${filters.radius} mi` : "Any distance"} · Change
            </span>
          </span>
        </button>
        <LocationDialog
          open={locationOpen}
          onClose={() => setLocationOpen(false)}
          value={{ lat: filters.lat, lng: filters.lng, name: filters.locationName, radius: filters.radius }}
          onApply={(v) => apply({ lat: v.lat, lng: v.lng, locationName: v.name, radius: v.radius })}
        />
      </section>

      <section>
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-ink-3">Price</h2>
        <form
          key={`${filters.minPrice}-${filters.maxPrice}`}
          onSubmit={submitPrice}
          className="mt-2.5 flex items-center gap-2"
        >
          <label className="flex-1">
            <span className="sr-only">Minimum price</span>
            <input
              name="min"
              inputMode="decimal"
              defaultValue={filters.minPrice ?? ""}
              placeholder="$ Min"
              className="field-input"
            />
          </label>
          <span className="text-ink-3" aria-hidden>
            –
          </span>
          <label className="flex-1">
            <span className="sr-only">Maximum price</span>
            <input
              name="max"
              inputMode="decimal"
              defaultValue={filters.maxPrice ?? ""}
              placeholder="$ Max"
              className="field-input"
            />
          </label>
          <Button type="submit" variant="secondary" className="px-3">
            Go
          </Button>
        </form>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[
            { label: "Free", min: 0, max: 0 },
            { label: "Under $25", min: null, max: 25 },
            { label: "Under $100", min: null, max: 100 },
          ].map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => apply({ minPrice: p.min, maxPrice: p.max })}
              className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ring-line hover:ring-line-strong"
            >
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <label htmlFor="sort" className="text-[13px] font-semibold uppercase tracking-wider text-ink-3">
          Sort by
        </label>
        <Select
          id="sort"
          className="mt-2.5"
          value={filters.sort}
          onChange={(e) => apply({ sort: e.target.value as Sort })}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </section>

      {hasActiveFilters(filters) && (
        <button
          type="button"
          onClick={() =>
            apply({ q: null, category: null, minPrice: null, maxPrice: null, radius: null, sort: "newest" })
          }
          className="self-start text-sm font-semibold underline underline-offset-4"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

export function MobileFiltersButton({ filters }: { filters: Filters }) {
  const [open, setOpen] = useState(false);
  const { apply, pending } = useApplyFilters(filters);
  const count =
    (filters.minPrice != null || filters.maxPrice != null ? 1 : 0) + (filters.radius != null ? 1 : 0);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="size-4" />
        Filters{count > 0 && ` · ${count}`}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Filters">
        <FiltersBody
          filters={filters}
          pending={pending}
          apply={(patch) => {
            apply(patch);
            if (!("lat" in patch)) setOpen(false);
          }}
        />
      </Dialog>
    </>
  );
}
