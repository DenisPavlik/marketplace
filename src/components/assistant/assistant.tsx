"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DotFace, type DotMood } from "@/components/assistant/dot-face";

const loadPanel = () => import("@/components/assistant/assistant-panel");
const AssistantPanel = dynamic(() => loadPanel().then((m) => m.AssistantPanel), { ssr: false });

export type PageKind = "browse" | "listing" | "sell" | "other";

export type AssistantContext = { kind: PageKind; path: string; listingId?: string };

// Where Dot stays out of the way: sign-in, and the inbox where the chat box lives at the bottom.
const HIDDEN = [/^\/login/, /^\/inbox/, /^\/auth/];

const TIPS: Partial<Record<PageKind, { text: string; prompt?: string }>> = {
  browse: { text: "It looks like you're hunting for something. Want me to dig through the stoop for you?" },
  listing: { text: "It looks like you're eyeing this one. Want to know if the price is fair?", prompt: "Is this a fair price?" },
  sell: { text: "It looks like you're selling something. Want help writing the listing?", prompt: "Help me write my listing." },
};

const TIP_DELAY = 7000;

function pageContext(path: string): AssistantContext {
  const listing = path.match(/^\/listings\/([0-9a-f-]{36})$/i);
  if (listing) return { kind: "listing", path, listingId: listing[1] };
  if (path === "/") return { kind: "browse", path };
  if (path === "/sell") return { kind: "sell", path };
  return { kind: "other", path };
}

function readFlag(key: string) {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setFlag(key: string) {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // Private mode: tips just reappear next time.
  }
}

/** Floating assistant: Dot in the corner, a Clippy-style tip now and then, and the chat panel. */
export function Assistant() {
  const path = usePathname();
  const context = useMemo(() => pageContext(path), [path]);
  const hidden = HIDDEN.some((r) => r.test(path));

  const [open, setOpen] = useState(false);
  // The panel stays mounted after the first open so the conversation survives closing it.
  const [mounted, setMounted] = useState(false);
  const [tip, setTip] = useState<PageKind | null>(null);
  const [panelMood, setPanelMood] = useState<DotMood>("idle");
  const [starter, setStarter] = useState<{ text: string; id: number } | null>(null);

  // Fetch the chat panel's code once the page has settled, so the first open animates right away.
  useEffect(() => {
    if (hidden) return;
    const timer = setTimeout(() => void loadPanel(), 1200);
    return () => clearTimeout(timer);
  }, [hidden]);

  // Offer one tip per kind of page per session, after the visitor has had a moment.
  useEffect(() => {
    const kind = context.kind;
    if (hidden || open || !TIPS[kind] || readFlag(`dot-tip:${kind}`)) return;
    const timer = setTimeout(() => setTip(kind), TIP_DELAY);
    return () => clearTimeout(timer);
  }, [context.kind, hidden, open]);

  const dismissTip = useCallback(() => {
    if (tip) setFlag(`dot-tip:${tip}`);
    setTip(null);
  }, [tip]);

  const openPanel = useCallback((prompt?: string) => {
    setMounted(true);
    setOpen(true);
    if (prompt) setStarter({ text: prompt, id: Date.now() });
  }, []);

  // On phones the panel is a full-screen sheet; keep the page behind it still.
  useEffect(() => {
    document.documentElement.toggleAttribute("data-dot-open", open);
    return () => document.documentElement.removeAttribute("data-dot-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (hidden) return null;

  // A tip only belongs to the kind of page it was offered on.
  const currentTip = tip && tip === context.kind ? TIPS[tip] : null;
  const mood: DotMood = open ? panelMood : currentTip ? "curious" : "idle";

  return (
    <>
      {mounted && (
        <AssistantPanel
          open={open}
          context={context}
          starter={starter}
          onClose={() => setOpen(false)}
          onMoodChange={setPanelMood}
        />
      )}

      <div
        className={clsx(
          "dot-dock fixed right-4 z-50 flex flex-col items-end transition-[bottom,opacity] duration-300 sm:right-6",
          open && "max-sm:pointer-events-none max-sm:opacity-0",
        )}
      >
        {currentTip && !open && (
          <div
            role="dialog"
            aria-label="Dot has a suggestion"
            className="relative mb-3 w-[min(17rem,calc(100vw-2rem))] animate-fade-up rounded-2xl border-2 border-sticker-ink bg-[#FFF8D6] p-3.5 text-[14px] leading-snug text-sticker-ink shadow-lg"
          >
            <button
              type="button"
              onClick={dismissTip}
              aria-label="Dismiss"
              className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full hover:bg-black/5"
            >
              <X className="size-4" />
            </button>
            <p className="pr-5">{currentTip.text}</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  dismissTip();
                  openPanel(currentTip.prompt);
                }}
                className="rounded-full bg-sticker-ink px-3.5 py-1.5 text-[13px] font-semibold text-white"
              >
                Yes, please
              </button>
              <button
                type="button"
                onClick={dismissTip}
                className="rounded-full px-3 py-1.5 text-[13px] font-semibold ring-1 ring-inset ring-sticker-ink/25 hover:bg-black/5"
              >
                No thanks
              </button>
            </div>
            {/* Speech-bubble tail pointing at Dot. */}
            <span
              aria-hidden
              className="absolute -bottom-[9px] right-8 size-4 rotate-45 border-b-2 border-r-2 border-sticker-ink bg-[#FFF8D6]"
            />
          </div>
        )}

        <div className="dot-arrive">
          <div className="dot-bob">
            <button
              type="button"
              onClick={() => (open ? setOpen(false) : openPanel())}
              aria-label={open ? "Close Dot, the shopping assistant" : "Ask Dot, the shopping assistant"}
              aria-expanded={open}
              className={clsx(
                "group block rounded-full outline-offset-4 drop-shadow-[0_8px_14px_rgb(21_23_28/0.28)] transition-transform hover:scale-105 active:scale-95",
                currentTip && "dot-hop",
              )}
            >
              <DotFace mood={mood} size={64} className="max-sm:size-14" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
