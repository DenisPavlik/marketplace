"use client";

import Link from "next/link";
import { ArrowLeft, ArrowUp, RotateCcw } from "lucide-react";
import clsx from "clsx";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Avatar } from "@/components/avatar";
import { ListingImage } from "@/components/listing-image";
import { PriceDot } from "@/components/price-dot";
import { closeThreadSheet } from "@/components/chat/conversation-list";
import { pinToBottomOnResize } from "@/components/viewport/visual-viewport";
import { createClient, subscribeAuthed } from "@/lib/supabase/client";
import { markConversationRead, sendMessage } from "@/app/actions/chat";
import type { ChatMessage, ConversationSummary } from "@/lib/chat";

type LocalMessage = ChatMessage & { state?: "sending" | "failed"; tempKey?: string };

const TYPING_TIMEOUT = 3500;

export function ChatThread({
  conversation,
  userId,
}: {
  conversation: ConversationSummary & { messages: ChatMessage[] };
  userId: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState<LocalMessage[]>(conversation.messages);
  const [otherLastReadAt, setOtherLastReadAt] = useState(conversation.otherLastReadAt);
  const [otherTyping, setOtherTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastTypingSent = useRef(0);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const markRead = useCallback(() => {
    if (document.visibilityState === "visible") markConversationRead(conversation.id);
  }, [conversation.id]);

  useEffect(() => {
    markRead();
    document.addEventListener("visibilitychange", markRead);
    return () => document.removeEventListener("visibilitychange", markRead);
  }, [markRead]);

  useEffect(() => {
    const unsubscribe = subscribeAuthed(
      supabase,
      () =>
        supabase
          .channel(`conversation:${conversation.id}`, { config: { broadcast: { self: false } } })
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversation.id}` },
            (payload) => {
              const msg = payload.new as ChatMessage;
              setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
              if (msg.sender_id !== userId) {
                setOtherTyping(false);
                markRead();
              }
            },
          )
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "conversations", filter: `id=eq.${conversation.id}` },
            (payload) => {
              const row = payload.new as { buyer_last_read_at: string; seller_last_read_at: string };
              setOtherLastReadAt(conversation.role === "buyer" ? row.seller_last_read_at : row.buyer_last_read_at);
            },
          )
          .on("broadcast", { event: "typing" }, ({ payload }) => {
            if (payload?.userId === userId) return;
            setOtherTyping(true);
            clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => setOtherTyping(false), TYPING_TIMEOUT);
          }),
      (channel) => {
        channelRef.current = channel;
      },
    );

    return () => {
      clearTimeout(typingTimer.current);
      unsubscribe();
      channelRef.current = null;
    };
  }, [supabase, conversation.id, conversation.role, userId, markRead]);

  // Stick to the bottom whenever the conversation grows.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, otherTyping]);

  // The phone keyboard shrinks the chat; keep the latest message in view.
  useEffect(() => (scrollRef.current ? pinToBottomOnResize(scrollRef.current) : undefined), []);

  function notifyTyping() {
    const now = Date.now();
    if (now - lastTypingSent.current < 2000) return;
    lastTypingSent.current = now;
    channelRef.current?.send({ type: "broadcast", event: "typing", payload: { userId } });
  }

  async function deliver(body: string, tempKey: string) {
    const res = await sendMessage(conversation.id, body);
    setMessages((prev) => {
      if (!res.ok) return prev.map((m) => (m.tempKey === tempKey ? { ...m, state: "failed" as const } : m));
      // Realtime may have delivered the real row already; drop the placeholder either way.
      const withoutTemp = prev.filter((m) => m.tempKey !== tempKey);
      return withoutTemp.some((m) => m.id === res.message.id) ? withoutTemp : [...withoutTemp, res.message];
    });
  }

  function send() {
    const body = draft.trim();
    if (!body) return;
    const tempKey = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      { id: -Date.now(), tempKey, sender_id: userId, body, created_at: new Date().toISOString(), state: "sending" },
    ]);
    setDraft("");
    deliver(body, tempKey);
  }

  function retry(message: LocalMessage) {
    if (!message.tempKey) return;
    setMessages((prev) => prev.map((m) => (m.tempKey === message.tempKey ? { ...m, state: "sending" } : m)));
    deliver(message.body, message.tempKey);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  const lastMineSeen = [...messages]
    .reverse()
    .find((m) => m.sender_id === userId && !m.state && new Date(m.created_at) <= new Date(otherLastReadAt));
  const listing = conversation.listing;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-line px-3 py-3 sm:px-4">
        <Link href="/inbox" aria-label="Back to inbox" onClick={closeThreadSheet} className="grid size-9 place-items-center rounded-full hover:bg-ink/5 md:hidden">
          <ArrowLeft className="size-5" />
        </Link>
        <Avatar name={conversation.other.display_name} src={conversation.other.avatar_url} size={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold">{conversation.other.display_name}</p>
          <p className="truncate text-xs text-ink-3">
            {otherTyping ? "typing…" : conversation.role === "buyer" ? "Seller" : "Interested buyer"}
          </p>
        </div>
      </header>

      {listing && (
        <Link
          href={`/listings/${listing.id}`}
          className="flex items-center gap-3 border-b border-line bg-paper/60 px-4 py-2.5 hover:bg-paper"
        >
          <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-line">
            {listing.cover && (
              <ListingImage
                src={listing.cover.path}
                alt=""
                fill
                sizes="44px"
                transformation={[{ aspectRatio: "1-1", focus: "auto" }]}
                className="object-cover"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{listing.title}</p>
            <p className="text-xs text-ink-3">
              {listing.status === "sold" ? "Sold" : listing.status === "reserved" ? "On hold" : "Available"}
            </p>
          </div>
          <PriceDot price={listing.price} category={listing.category} seed={listing.id} size="sm" />
        </Link>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 sm:px-5" aria-live="polite">
        <ol className="flex flex-col gap-1.5">
          {messages.map((m, i) => {
            const mine = m.sender_id === userId;
            const prev = messages[i - 1];
            const newDay = !prev || dayKey(prev.created_at) !== dayKey(m.created_at);
            const grouped = !newDay && prev?.sender_id === m.sender_id;
            return (
              <li key={m.tempKey ?? m.id} className="contents">
                {newDay && (
                  <p suppressHydrationWarning className="my-3 self-center text-xs font-semibold text-ink-3">
                    {formatDay(m.created_at)}
                  </p>
                )}
                <div
                  className={clsx(
                    "flex max-w-[82%] flex-col animate-fade-up",
                    mine ? "items-end self-end" : "items-start self-start",
                    !grouped && "mt-2",
                  )}
                >
                  <p
                    // Server and browser format times in different zones; the browser's wins.
                    suppressHydrationWarning
                    title={new Date(m.created_at).toLocaleString()}
                    className={clsx(
                      "whitespace-pre-wrap rounded-[20px] px-3.5 py-2 text-[15px] leading-snug [overflow-wrap:anywhere]",
                      mine ? "bg-ink text-on-ink" : "bg-paper text-ink ring-1 ring-inset ring-line",
                      mine ? "rounded-br-md" : "rounded-bl-md",
                      m.state === "sending" && "opacity-60",
                      m.state === "failed" && "bg-danger",
                    )}
                  >
                    {m.body}
                  </p>
                  {m.state === "failed" && (
                    <button
                      type="button"
                      onClick={() => retry(m)}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-danger"
                    >
                      <RotateCcw className="size-3" /> Not sent. Tap to retry
                    </button>
                  )}
                  {lastMineSeen?.id === m.id && <span className="mt-1 text-xs text-ink-3">Seen</span>}
                </div>
              </li>
            );
          })}
        </ol>
        {otherTyping && (
          <div className="mt-3 flex w-fit items-center gap-1 rounded-[20px] rounded-bl-md bg-paper px-4 py-3 ring-1 ring-inset ring-line" aria-label={`${conversation.other.display_name} is typing`}>
            {[0, 150, 300].map((d) => (
              <span key={d} className="size-1.5 animate-bounce rounded-full bg-ink-3" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-end gap-2 border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <label htmlFor="chat-input" className="sr-only">
          Message
        </label>
        <textarea
          id="chat-input"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            notifyTyping();
          }}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={2000}
          placeholder="Write a message"
          className="field-input max-h-40 min-h-11 flex-1 resize-none rounded-[22px] py-2.5 [field-sizing:content]"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="Send message"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-on-ink transition-opacity disabled:opacity-30"
        >
          <ArrowUp className="size-5" strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}

function dayKey(iso: string) {
  return new Date(iso).toDateString();
}

function formatDay(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}
