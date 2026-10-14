"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, ArrowUp, RotateCcw, Square, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { DotFace, type DotMood } from "@/components/assistant/dot-face";
import type { AssistantContext, PageKind } from "@/components/assistant/assistant";
import { ListingImage } from "@/components/listing-image";
import { CategoryDot, PriceDot } from "@/components/price-dot";
import { conditionLabel, getCategory } from "@/lib/categories";
import { formatPrice } from "@/lib/format";
import { DRAFT_EVENT, DRAFT_STORAGE_KEY, type DotMessage, type ListingDraft } from "@/lib/assistant/types";
import type { AssistantCard } from "@/lib/assistant/tools";

const SUGGESTIONS: Record<PageKind, string[]> = {
  browse: ["A comfy armchair under $200", "Anything free near Bushwick?", "A bike for commuting"],
  listing: ["Is this a fair price?", "Show me similar things", "Any tips for the pickup?"],
  sell: ["Help me write my listing", "What should I charge?"],
  other: ["Find me a desk lamp", "How does Stoop work?"],
};

const MAX_CHARS = 600;

/** Server errors arrive as JSON ({ error }) inside the thrown message. */
function errorText(error: Error) {
  try {
    const parsed = JSON.parse(error.message) as { error?: string };
    if (parsed.error) return parsed.error;
  } catch {
    // Not JSON: a network problem.
  }
  return "I couldn't reach the stoop just now. Check your connection and try again.";
}

export function AssistantPanel({
  open,
  context,
  starter,
  onClose,
  onMoodChange,
}: {
  open: boolean;
  context: AssistantContext;
  starter: { text: string; id: number } | null;
  onClose: () => void;
  onMoodChange: (mood: DotMood) => void;
}) {
  const [transport] = useState(() => new DefaultChatTransport<DotMessage>({ api: "/api/assistant" }));
  // Every request carries the page the visitor is on, so "this" can mean the open listing.
  const requestBody = { body: { context: { path: context.path, listingId: context.listingId } } };
  const { messages, sendMessage, status, error, stop, regenerate, clearError } = useChat<DotMessage>({ transport });
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    onMoodChange(status === "submitted" ? "thinking" : status === "streaming" ? "talking" : "idle");
  }, [status, onMoodChange]);

  // A tip's "Yes, please" sends its question straight away.
  const lastStarter = useRef<number | null>(null);
  useEffect(() => {
    if (!starter || lastStarter.current === starter.id) return;
    lastStarter.current = starter.id;
    void sendMessage({ text: starter.text }, requestBody);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per starter
  }, [starter, sendMessage]);

  useEffect(() => {
    if (open) inputRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function send(text: string) {
    const clean = text.trim().slice(0, MAX_CHARS);
    if (!clean || busy) return;
    clearError();
    void sendMessage({ text: clean }, requestBody);
    setInput("");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <section
      aria-label="Dot, the shopping assistant"
      aria-hidden={!open}
      inert={!open}
      className={clsx(
        "fixed z-50 flex flex-col overflow-hidden bg-surface text-ink shadow-2xl ring-1 ring-line transition-[opacity,translate,scale] duration-300 ease-out",
        "inset-x-0 bottom-0 top-[8dvh] rounded-t-3xl",
        "sm:inset-auto sm:bottom-28 sm:right-6 sm:h-[min(620px,calc(100dvh-9rem))] sm:w-[400px] sm:origin-bottom-right sm:rounded-3xl",
        open ? "opacity-100" : "pointer-events-none translate-y-6 opacity-0 sm:scale-95",
      )}
    >
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        <DotFace mood={busy ? (status === "submitted" ? "thinking" : "talking") : "idle"} size={40} track={false} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[17px] leading-tight">Dot</p>
          <p className="text-xs text-ink-3">{busy ? (status === "submitted" ? "Thinking…" : "Typing…") : "Stoop's shopping helper"}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-9 place-items-center rounded-full hover:bg-ink/5"
        >
          <X className="size-5" />
        </button>
      </header>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-end gap-4">
            <div className="max-w-[88%] rounded-[20px] rounded-bl-md bg-paper px-4 py-3 text-[15px] leading-relaxed ring-1 ring-inset ring-line">
              Hi! I&apos;m Dot. Tell me what you&apos;re after and I&apos;ll dig through the stoop. I can also check
              whether a price is fair, or help you write a listing.
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS[context.kind].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full bg-surface px-3.5 py-2 text-[13px] font-semibold ring-1 ring-inset ring-line-strong hover:ring-ink-3"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ol className="flex flex-col gap-3">
            {messages.map((m) => (
              <li key={m.id} className={clsx("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}>
                {m.parts.map((part, i) => (
                  <MessagePart key={i} part={part} role={m.role} context={context} onNavigate={onClose} />
                ))}
              </li>
            ))}
            {status === "submitted" && (
              <li className="flex w-fit items-center gap-1 rounded-[20px] rounded-bl-md bg-paper px-4 py-3 ring-1 ring-inset ring-line" aria-label="Dot is thinking">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="size-1.5 animate-bounce rounded-full bg-ink-3" style={{ animationDelay: `${d}ms` }} />
                ))}
              </li>
            )}
          </ol>
        )}

        {error && (
          <div className="mt-3 flex max-w-[88%] flex-col items-start gap-2 rounded-[20px] rounded-bl-md bg-paper px-4 py-3 text-[14px] ring-1 ring-inset ring-line">
            <p>{errorText(error)}</p>
            <button
              type="button"
              onClick={() => {
                clearError();
                void regenerate(requestBody);
              }}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold underline-offset-4 hover:underline"
            >
              <RotateCcw className="size-3.5" /> Try again
            </button>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2">
          <label htmlFor="dot-input" className="sr-only">
            Ask Dot
          </label>
          <textarea
            ref={inputRef}
            id="dot-input"
            rows={1}
            value={input}
            maxLength={MAX_CHARS}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Ask Dot anything about Stoop"
            className="field-input max-h-32 min-h-11 flex-1 resize-none rounded-[22px] py-2.5 [field-sizing:content]"
          />
          {busy ? (
            <button
              type="button"
              onClick={() => void stop()}
              aria-label="Stop"
              className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-on-ink"
            >
              <Square className="size-4 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              aria-label="Send"
              disabled={!input.trim()}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-on-ink transition-opacity disabled:opacity-30"
            >
              <ArrowUp className="size-5" strokeWidth={2.5} />
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[11px] text-ink-3">Dot is an AI and can get things wrong. Check the listing before you buy.</p>
      </form>
    </section>
  );
}

type Part = DotMessage["parts"][number];

function MessagePart({
  part,
  role,
  context,
  onNavigate,
}: {
  part: Part;
  role: DotMessage["role"];
  context: AssistantContext;
  onNavigate: () => void;
}) {
  switch (part.type) {
    case "text":
      if (!part.text.trim()) return null;
      return (
        <div
          className={clsx(
            "max-w-[88%] whitespace-pre-wrap px-4 py-2.5 text-[15px] leading-relaxed",
            role === "user"
              ? "rounded-[20px] rounded-br-md bg-ink text-on-ink"
              : "rounded-[20px] rounded-bl-md bg-paper ring-1 ring-inset ring-line",
          )}
        >
          {part.text}
        </div>
      );

    case "tool-searchListings":
      if (part.state === "output-available") return <SearchResults result={part.output} onNavigate={onNavigate} />;
      if (part.state === "output-error") return <ToolNote>Search didn&apos;t work this time.</ToolNote>;
      return <ToolNote busy>Looking through the stoop…</ToolNote>;

    case "tool-getListing":
      return part.state === "output-available" ? null : <ToolNote busy>Reading the listing…</ToolNote>;

    case "tool-priceCheck":
      if (part.state === "output-available") return part.output.found ? <PriceRange result={part.output} /> : null;
      if (part.state === "output-error") return null;
      return <ToolNote busy>Comparing prices…</ToolNote>;

    case "tool-draftListing":
      if (part.state === "output-available") return <DraftCard draft={part.output} onSell={context.kind === "sell"} onNavigate={onNavigate} />;
      if (part.state === "output-error") return null;
      return <ToolNote busy>Writing a draft…</ToolNote>;

    default:
      return null;
  }
}

function ToolNote({ children, busy = false }: { children: React.ReactNode; busy?: boolean }) {
  return (
    <p className={clsx("flex items-center gap-2 text-[13px] font-semibold text-ink-3", busy && "animate-pulse")}>
      {children}
    </p>
  );
}

function closeOnPhone(onNavigate: () => void) {
  if (window.matchMedia("(max-width: 639px)").matches) onNavigate();
}

function SearchResults({
  result,
  onNavigate,
}: {
  result: { listings: AssistantCard[]; feedUrl: string; moreAvailable: boolean };
  onNavigate: () => void;
}) {
  if (result.listings.length === 0) return <ToolNote>No matches on the stoop.</ToolNote>;
  return (
    <div className="w-full">
      <ul className="scroll-fade -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 pt-1 scrollbar-none">
        {result.listings.map((l) => (
          <li key={l.id} className="w-32 shrink-0 snap-start">
            <Link href={`/listings/${l.id}`} onClick={() => closeOnPhone(onNavigate)} className="group block">
              <div className="relative">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-line">
                  {l.cover && (
                    <ListingImage
                      src={l.cover}
                      alt=""
                      fill
                      sizes="128px"
                      transformation={[{ aspectRatio: "1-1", focus: "auto" }]}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  {l.status !== "active" && (
                    <span className="absolute left-1.5 top-1.5 rounded bg-tape px-1.5 py-0.5 font-marker text-[11px] uppercase text-sticker-ink">
                      {l.status === "sold" ? "Sold" : "On hold"}
                    </span>
                  )}
                </div>
                <PriceDot price={l.price} category={l.category} seed={l.id} size="sm" className="absolute -bottom-3 right-1" />
              </div>
              <p className="mt-2 line-clamp-2 pr-2 text-[13px] font-semibold leading-snug group-hover:underline">{l.title}</p>
              {l.place && <p className="truncate text-[11px] text-ink-3">{l.place}</p>}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={result.feedUrl}
        onClick={() => closeOnPhone(onNavigate)}
        className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold underline-offset-4 hover:underline"
      >
        {result.moreAvailable ? "See all in the feed" : "Open these in the feed"} <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

/** Low–high bar of comparable prices with this listing's price marked on it. */
function PriceRange({
  result,
}: {
  result: { listing: { price: number }; low: number | null; high: number | null; median: number | null; comparables: unknown[] };
}) {
  const { low, high, median } = result;
  if (low == null || high == null || result.comparables.length < 2) return null;
  const min = Math.min(low, result.listing.price);
  const max = Math.max(high, result.listing.price);
  const at = (v: number) => (max === min ? 50 : ((v - min) / (max - min)) * 100);
  return (
    <div className="w-full max-w-[88%] rounded-2xl bg-paper px-4 pb-3 pt-4 ring-1 ring-inset ring-line">
      <div className="relative h-2 rounded-full bg-gradient-to-r from-[#4FE0A5] via-[#FFE14D] to-[#FF7A5C]">
        {median != null && (
          <span className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded bg-ink/40" style={{ left: `${at(median)}%` }} title="Median" />
        )}
        <span
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface bg-ink shadow"
          style={{ left: `${at(result.listing.price)}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[11px] font-semibold text-ink-3">
        <span>{formatPrice(min)}</span>
        {median != null && <span>median {formatPrice(median)}</span>}
        <span>{formatPrice(max)}</span>
      </div>
      <p className="mt-1 text-[11px] text-ink-3">{result.comparables.length} similar listings on Stoop</p>
    </div>
  );
}

function DraftCard({ draft, onSell, onNavigate }: { draft: ListingDraft; onSell: boolean; onNavigate: () => void }) {
  const router = useRouter();
  const condition = conditionLabel(draft.condition ?? null);

  function useDraft() {
    if (onSell) {
      window.dispatchEvent(new CustomEvent<ListingDraft>(DRAFT_EVENT, { detail: draft }));
      closeOnPhone(onNavigate);
      return;
    }
    try {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Without storage the form just opens empty.
    }
    closeOnPhone(onNavigate);
    router.push("/sell");
  }

  return (
    <div className="w-full max-w-[92%] rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-line">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Draft listing</p>
      <p className="mt-1.5 text-[15px] font-semibold leading-snug">{draft.title}</p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-2">
        <span className="inline-flex items-center gap-1.5">
          <CategoryDot category={draft.category} className="size-2" />
          {getCategory(draft.category).label}
        </span>
        {condition && <span>· {condition}</span>}
        {draft.price != null && <span className="font-semibold text-ink">· {formatPrice(draft.price)}</span>}
      </p>
      <p className="mt-2 line-clamp-5 whitespace-pre-line text-[13px] leading-relaxed text-ink-2">{draft.description}</p>
      <button
        type="button"
        onClick={useDraft}
        className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-semibold text-on-ink"
      >
        {onSell ? "Fill in the form" : "Start a listing with this"} <ArrowRight className="size-3.5" />
      </button>
    </div>
  );
}
