export const CATEGORY_SLUGS = [
  "home",
  "electronics",
  "fashion",
  "kids",
  "sports",
  "hobbies",
  "vehicles",
  "property",
  "pets",
  "misc",
] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];

type Category = {
  slug: CategorySlug;
  label: string;
  /** Sticker dot color. Every dot carries ink text, so all of these stay light. */
  dot: string;
};

export const CATEGORIES: readonly Category[] = [
  { slug: "home", label: "Home & garden", dot: "#FFB547" },
  { slug: "electronics", label: "Electronics", dot: "#8F9BFF" },
  { slug: "fashion", label: "Clothing", dot: "#FF8AC2" },
  { slug: "kids", label: "Kids & baby", dot: "#FFE14D" },
  { slug: "sports", label: "Sports & bikes", dot: "#4FE0A5" },
  { slug: "hobbies", label: "Hobbies", dot: "#C49BFF" },
  { slug: "vehicles", label: "Vehicles", dot: "#FF7A5C" },
  { slug: "property", label: "Rentals", dot: "#5BC2FF" },
  { slug: "pets", label: "Pet supplies", dot: "#B8E05A" },
  { slug: "misc", label: "Everything else", dot: "#D5D9E0" },
];

const bySlug = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function getCategory(slug: string): Category {
  return bySlug.get(slug as CategorySlug) ?? bySlug.get("misc")!;
}

export function isCategorySlug(value: unknown): value is CategorySlug {
  return typeof value === "string" && bySlug.has(value as CategorySlug);
}

export const CONDITIONS = [
  { value: "new", label: "New" },
  { value: "like_new", label: "Like new" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
] as const;

export type Condition = (typeof CONDITIONS)[number]["value"];

export function conditionLabel(value: string | null | undefined): string | null {
  return CONDITIONS.find((c) => c.value === value)?.label ?? null;
}

export const STATUSES = ["active", "reserved", "sold"] as const;
export type ListingStatus = (typeof STATUSES)[number];
