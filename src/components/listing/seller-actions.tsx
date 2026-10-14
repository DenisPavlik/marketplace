"use client";

import { Pencil, Trash2 } from "lucide-react";
import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { toast } from "sonner";
import { ButtonLink, Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { deleteListing, setListingStatus } from "@/app/actions/listings";
import type { ListingStatus } from "@/lib/categories";

const OPTIONS: { value: ListingStatus; label: string }[] = [
  { value: "active", label: "Available" },
  { value: "reserved", label: "On hold" },
  { value: "sold", label: "Sold" },
];

export function SellerActions({ listingId, status }: { listingId: string; status: ListingStatus }) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function changeStatus(next: ListingStatus) {
    startTransition(async () => {
      setOptimistic(next);
      const res = await setListingStatus(listingId, next);
      if (!res.ok) toast.error(res.error);
      else toast.success(`Marked as ${OPTIONS.find((o) => o.value === next)!.label.toLowerCase()}`);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteListing(listingId);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Listing deleted");
      router.push("/selling");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
      <p className="text-[13px] font-semibold uppercase tracking-wider text-ink-3">Your listing</p>
      <div role="radiogroup" aria-label="Listing status" className="mt-3 grid grid-cols-3 gap-1 rounded-full bg-paper p-1">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={optimistic === o.value}
            disabled={pending}
            onClick={() => optimistic !== o.value && changeStatus(o.value)}
            className={clsx(
              "h-9 rounded-full text-sm font-semibold transition-colors",
              optimistic === o.value ? "bg-ink text-on-ink shadow-sm" : "text-ink-2 hover:text-ink",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <ButtonLink href={`/listings/${listingId}/edit`} variant="secondary" className="flex-1">
          <Pencil className="size-4" /> Edit
        </ButtonLink>
        <Button variant="danger" onClick={() => setConfirmOpen(true)} disabled={pending}>
          <Trash2 className="size-4" /> Delete
        </Button>
      </div>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete this listing?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => {
                setConfirmOpen(false);
                remove();
              }}
            >
              Delete listing
            </Button>
          </div>
        }
      >
        <p className="text-[15px] text-ink-2">
          The listing and its photos are removed for good. If it sold, you can mark it as sold instead so buyers
          stop asking.
        </p>
      </Dialog>
    </div>
  );
}
