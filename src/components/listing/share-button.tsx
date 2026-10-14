"use client";

import { Share } from "lucide-react";
import { toast } from "sonner";

export function ShareButton({ title }: { title: string }) {
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* dismissed */
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-10 items-center gap-2 rounded-full bg-surface px-4 text-sm font-semibold ring-1 ring-inset ring-line-strong transition-colors hover:ring-ink-3"
    >
      <Share className="size-4" strokeWidth={2.25} />
      Share
    </button>
  );
}
