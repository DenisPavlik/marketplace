"use client";

import Link from "next/link";
import clsx from "clsx";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Avatar } from "@/components/avatar";
import { ListingImage } from "@/components/listing-image";
import { createClient, subscribeAuthed } from "@/lib/supabase/client";
import { formatRelativeTime } from "@/lib/format";
import { lockTouchScroll } from "@/components/viewport/visual-viewport";
import type { ConversationSummary } from "@/lib/chat";

export function ConversationList({ conversations, userId }: { conversations: ConversationSummary[]; userId: string }) {
  const router = useRouter();
  const activeId = useSelectedLayoutSegment();
  const supabase = useMemo(() => createClient(), []);

  // Any change to my conversations (new message, read receipt) refreshes the list.
  useEffect(
    () =>
      subscribeAuthed(supabase, () =>
        supabase
          .channel(`inbox:${userId}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => router.refresh()),
      ),
    [supabase, router, userId],
  );

  if (conversations.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <p className="font-display text-lg">No messages yet</p>
        <p className="mt-2 text-sm text-ink-2">
          When you message a seller, or a buyer messages you, the conversation shows up here.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {conversations.map((c, i) => (
        <li key={c.id} className="reveal" style={{ "--i": Math.min(i, 10) } as CSSProperties}>
          <Link
            href={`/inbox/${c.id}`}
            aria-current={activeId === c.id ? "page" : undefined}
            className={clsx(
              "flex gap-3 px-4 py-3.5 transition-colors",
              activeId === c.id
                ? "bg-paper"
                : c.unread
                  ? // Unread threads are tinted with the brand color and keyed by a bar on the left.
                    "bg-brand/[0.08] shadow-[inset_3px_0_0_var(--color-brand)] hover:bg-brand/[0.13]"
                  : "hover:bg-paper/60",
            )}
          >
            <div className="relative shrink-0">
              <div className="relative size-14 overflow-hidden rounded-xl bg-line">
                {c.listing?.cover && (
                  <ListingImage
                    src={c.listing.cover.path}
                    alt=""
                    fill
                    sizes="56px"
                    transformation={[{ aspectRatio: "1-1", focus: "auto" }]}
                    className="object-cover"
                  />
                )}
              </div>
              {/* Avatar is position: relative itself, so a wrapper pins it to the photo's corner. */}
              <span className="absolute -bottom-1.5 -right-1.5 flex rounded-full ring-2 ring-surface">
                <Avatar name={c.other.display_name} src={c.other.avatar_url} size={26} />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className={clsx("truncate text-[15px]", c.unread ? "font-bold" : "font-semibold")}>
                  {c.other.display_name}
                </p>
                <time suppressHydrationWarning className="shrink-0 text-xs text-ink-3" dateTime={c.lastMessageAt}>
                  {formatRelativeTime(c.lastMessageAt)}
                </time>
              </div>
              <p className="truncate text-[13px] text-ink-3">{c.listing?.title ?? "Listing removed"}</p>
              <p className={clsx("mt-0.5 flex items-center gap-2 text-[13px]", c.unread ? "font-semibold text-ink" : "text-ink-2")}>
                <span className="truncate">
                  {c.lastMessageFromMe && "You: "}
                  {c.lastMessagePreview ?? "No messages yet"}
                </span>
                {c.unread && <span className="size-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

const CLOSE_THREAD_EVENT = "stoop:close-thread";

/** The thread's back link: on phones the chat slides away first, then the inbox route loads. */
export function closeThreadSheet(e: React.MouseEvent<HTMLAnchorElement>) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (!window.matchMedia("(max-width: 767px)").matches) return;
  e.preventDefault();
  window.dispatchEvent(new Event(CLOSE_THREAD_EVENT));
}

/**
 * Inbox panes: list and thread side by side on wide screens. On phones the open
 * thread is a full-screen sheet that slides in over the list.
 */
export function InboxPanes({ list, children }: { list: React.ReactNode; children: React.ReactNode }) {
  const router = useRouter();
  const activeId = useSelectedLayoutSegment();
  const sheetRef = useRef<HTMLElement>(null);
  // Which thread is sliding out; once the route moves on, nothing is.
  const [closingId, setClosingId] = useState<string | null>(null);
  const closing = activeId !== null && closingId === activeId;

  useEffect(() => {
    document.documentElement.toggleAttribute("data-thread-open", Boolean(activeId));
    return () => document.documentElement.removeAttribute("data-thread-open");
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const onClose = () => setClosingId(activeId);
    window.addEventListener(CLOSE_THREAD_EVENT, onClose);
    const unlock =
      sheetRef.current && window.matchMedia("(max-width: 767px)").matches
        ? lockTouchScroll(sheetRef.current)
        : undefined;
    return () => {
      window.removeEventListener(CLOSE_THREAD_EVENT, onClose);
      unlock?.();
    };
  }, [activeId]);

  return (
    <div className="mx-auto grid h-[calc(100dvh-7.5rem)] max-w-[1280px] md:h-[calc(100dvh-4rem)] md:grid-cols-[360px_minmax(0,1fr)] md:px-6 md:py-6">
      <aside className="flex min-h-0 flex-col overflow-hidden bg-surface md:rounded-l-2xl md:ring-1 md:ring-line">
        <h1 className="font-display border-b border-line px-4 py-4 text-2xl">Inbox</h1>
        <div className="min-h-0 flex-1 overflow-y-auto">{list}</div>
      </aside>
      <section
        ref={sheetRef}
        data-closing={closing || undefined}
        onAnimationEnd={(e) => {
          if (e.target === e.currentTarget && e.animationName === "thread-out") router.push("/inbox");
        }}
        className={clsx(
          "min-h-0 flex-col overflow-hidden bg-surface md:flex md:rounded-r-2xl md:border-l-0 md:ring-1 md:ring-line",
          activeId ? "flex" : "hidden",
          // Phones: an open chat takes the whole visible screen, like a messaging app,
          // and shrinks to the space above the keyboard while typing. Its background
          // runs on under the keyboard, which is see-through on iOS.
          "thread-sheet max-md:keyboard-follow max-md:fixed max-md:inset-x-0 max-md:top-[var(--vv-top,0px)] max-md:z-50",
          "max-md:h-[calc(var(--vv-height,100dvh)+100lvh)] max-md:pb-[100lvh] max-md:shadow-[-16px_0_32px_-16px_rgb(0_0_0/0.35)]",
        )}
      >
        {children}
      </section>
    </div>
  );
}
