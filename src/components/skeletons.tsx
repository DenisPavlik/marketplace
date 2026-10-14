import clsx from "clsx";
import { ListingCardSkeleton, ListingGrid } from "@/components/listing-card";

/*
 * Loading placeholders shaped like the pages they stand in for, so content
 * lands where the eye already is. Each page's loading.tsx renders one of these.
 */

export function Bone({ className }: { className?: string }) {
  return <div aria-hidden className={clsx("skeleton rounded-md", className)} />;
}

/** Announces the wait to screen readers; the bones themselves are hidden. */
function Loading({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-label={label} className={className}>
      {children}
    </div>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ListingGrid>
      {Array.from({ length: count }, (_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </ListingGrid>
  );
}

function PageTitleSkeleton({ withSubtitle = true }: { withSubtitle?: boolean }) {
  return (
    <>
      <Bone className="h-10 w-48 rounded-lg sm:h-12 sm:w-64" />
      {withSubtitle && <Bone className="mt-3 h-4 w-60" />}
    </>
  );
}

export function GridPageSkeleton({ label }: { label: string }) {
  return (
    <Loading label={label} className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 sm:px-6">
      <PageTitleSkeleton />
      <div className="mt-8">
        <ListingGridSkeleton />
      </div>
    </Loading>
  );
}

export function ListingDetailSkeleton() {
  return (
    <Loading label="Loading listing" className="mx-auto max-w-[1280px] px-4 pb-24 pt-5 sm:px-6 sm:pt-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-12">
        <Bone className="aspect-[4/3] rounded-2xl" />
        <div className="flex min-w-0 flex-col gap-6">
          <div>
            <Bone className="h-4 w-44" />
            <div className="mt-4 flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2.5">
                <Bone className="h-8 w-full rounded-lg" />
                <Bone className="h-8 w-2/3 rounded-lg" />
              </div>
              {/* Blank price sticker. */}
              <div className="mr-1 size-28 shrink-0 rounded-full bg-line" />
            </div>
            <Bone className="mt-4 h-6 w-36" />
          </div>
          <Bone className="h-36 rounded-2xl" />
          <div className="space-y-2.5">
            <Bone className="h-3 w-24" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-3/4" />
          </div>
          <Bone className="aspect-[16/9] rounded-2xl" />
        </div>
      </div>
    </Loading>
  );
}

export function ProfileSkeleton() {
  return (
    <Loading label="Loading profile" className="mx-auto max-w-[1440px] px-4 pb-24 pt-10 sm:px-6">
      <div className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-center">
        <Bone className="size-24 rounded-full" />
        <div className="flex-1">
          <PageTitleSkeleton />
          <Bone className="mt-4 h-4 w-full max-w-xl" />
          <Bone className="mt-2 h-4 w-2/3 max-w-md" />
        </div>
      </div>
      <div className="mt-8">
        <ListingGridSkeleton />
      </div>
    </Loading>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 sm:p-4">
      <Bone className="size-16 shrink-0 rounded-xl sm:size-20" />
      <div className="min-w-0 flex-1 space-y-2">
        <Bone className="h-4 w-3/5" />
        <Bone className="h-3 w-2/5" />
      </div>
      <Bone className="h-6 w-20 rounded-full" />
    </div>
  );
}

export function SellingSkeleton() {
  return (
    <Loading label="Loading your listings" className="mx-auto max-w-4xl px-4 pb-24 pt-10 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <PageTitleSkeleton withSubtitle={false} />
        <Bone className="h-11 w-36 rounded-full" />
      </div>
      <div className="mt-8 divide-y divide-line rounded-2xl bg-surface ring-1 ring-line">
        {Array.from({ length: 5 }, (_, i) => (
          <RowSkeleton key={i} />
        ))}
      </div>
    </Loading>
  );
}

export function SettingsSkeleton() {
  return (
    <Loading label="Loading settings" className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-6">
      <PageTitleSkeleton withSubtitle={false} />
      {[0, 1].map((i) => (
        <div key={i} className="mt-8 rounded-2xl bg-surface p-5 ring-1 ring-line sm:p-6">
          <Bone className="h-6 w-28" />
          <Bone className="mt-2 h-4 w-56" />
          <Bone className="mt-6 h-11 w-full rounded-[10px]" />
          {i === 0 && <Bone className="mt-4 h-24 w-full rounded-[10px]" />}
        </div>
      ))}
    </Loading>
  );
}

export function ConversationListSkeleton() {
  return (
    <Loading label="Loading conversations">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex gap-3 border-b border-line px-4 py-3.5">
          <Bone className="size-14 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2 pt-0.5">
            <Bone className="h-4 w-2/5" />
            <Bone className="h-3 w-4/5" />
            <Bone className="h-3 w-3/5" />
          </div>
        </div>
      ))}
    </Loading>
  );
}

export function ThreadSkeleton() {
  const bubbles = ["w-48", "ml-auto w-28", "w-60", "ml-auto w-52", "w-40"];
  return (
    <Loading label="Loading conversation" className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <Bone className="size-9 rounded-full" />
        <div className="space-y-1.5">
          <Bone className="h-4 w-32" />
          <Bone className="h-3 w-20" />
        </div>
      </div>
      <div className="flex-1 space-y-3 px-4 py-6">
        {bubbles.map((w, i) => (
          <Bone key={i} className={clsx("h-10 rounded-[20px]", w)} />
        ))}
      </div>
      <div className="border-t border-line p-3">
        <Bone className="h-11 w-full rounded-[22px]" />
      </div>
    </Loading>
  );
}
