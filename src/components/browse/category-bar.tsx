import Link from "next/link";
import clsx from "clsx";
import { CATEGORIES } from "@/lib/categories";
import { filtersToSearchParams, type Filters } from "@/lib/filters";
import { CategoryDot } from "@/components/price-dot";

export function CategoryBar({ filters }: { filters: Filters }) {
  const href = (category: Filters["category"]) => {
    const qs = filtersToSearchParams({ ...filters, category }).toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <nav aria-label="Categories" className="-mx-4 overflow-x-auto px-4 scrollbar-none sm:-mx-6 sm:px-6">
      <ul className="flex w-max gap-2 pb-1">
        <li>
          <Chip href={href(null)} active={!filters.category}>
            All
          </Chip>
        </li>
        {CATEGORIES.map((c) => (
          <li key={c.slug}>
            <Chip href={href(c.slug)} active={filters.category === c.slug}>
              <CategoryDot category={c.slug} />
              {c.label}
            </Chip>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold transition-colors",
        active
          ? "bg-ink text-on-ink"
          : "bg-surface text-ink ring-1 ring-inset ring-line hover:ring-line-strong hover:bg-surface",
      )}
    >
      {children}
    </Link>
  );
}
