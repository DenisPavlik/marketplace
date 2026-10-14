import clsx from "clsx";
import type { ListingStatus } from "@/lib/categories";

const LABELS: Partial<Record<ListingStatus, string>> = {
  reserved: "On hold",
  sold: "Sold",
};

export function StatusTape({
  status,
  size = "md",
  className,
}: {
  status: ListingStatus;
  size?: "md" | "lg";
  className?: string;
}) {
  const label = LABELS[status];
  if (!label) return null;
  return (
    <span
      className={clsx(
        "tape z-10",
        size === "lg" ? "text-lg" : "text-[13px]",
        "-left-3 top-4 -rotate-[8deg]",
        className,
      )}
    >
      {label}
    </span>
  );
}
