"use client";

import { MessageCircle } from "lucide-react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { PriceDot } from "@/components/price-dot";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Phones and tablets: once the contact box scrolls out of view, a slim bar keeps
 * the price and the way to reach the seller under the thumb.
 */
export function StickyContactBar({
  listing,
  label,
  href,
}: {
  listing: { id: string; title: string; price: number; category: string };
  label: string;
  /** Where the button goes. Without it, the button jumps back to the message box. */
  href?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("contact");
    if (!target) return;
    const io = new IntersectionObserver(([entry]) => {
      // Only after scrolling past it, not before reaching it.
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    io.observe(target);
    return () => io.disconnect();
  }, []);

  // Lets other floating UI (the assistant) step out of the bar's way.
  useEffect(() => {
    document.documentElement.toggleAttribute("data-contact-bar", visible);
    return () => document.documentElement.removeAttribute("data-contact-bar");
  }, [visible]);

  function jumpToMessage() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("contact")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    document.getElementById("first-message")?.focus({ preventScroll: true });
  }

  return (
    <div
      aria-hidden={!visible}
      inert={!visible}
      className={clsx(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md transition-transform duration-300 ease-out lg:hidden",
        visible ? "translate-y-0" : "translate-y-[calc(100%+1.5rem)]",
      )}
    >
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-2.5 sm:px-6">
        <PriceDot price={listing.price} category={listing.category} seed={listing.id} size="sm" />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{listing.title}</p>
        {href ? (
          <ButtonLink href={href} size="md" className="shrink-0">
            <MessageCircle className="size-4" /> {label}
          </ButtonLink>
        ) : (
          <Button size="md" className="shrink-0" onClick={jumpToMessage}>
            <MessageCircle className="size-4" /> {label}
          </Button>
        )}
      </div>
    </div>
  );
}
