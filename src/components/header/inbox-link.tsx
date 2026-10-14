"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient, subscribeAuthed } from "@/lib/supabase/client";

export function InboxLink({ initialCount, userId }: { initialCount: number; userId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const { data } = await supabase.rpc("unread_conversation_count");
      if (!cancelled && typeof data === "number") setCount(data);
    };
    refresh();
    const unsubscribe = subscribeAuthed(supabase, () =>
      supabase
        .channel(`unread:${userId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, refresh),
    );
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [supabase, userId, pathname]);

  return (
    <Link
      href="/inbox"
      aria-label={count > 0 ? `Inbox, ${count} unread` : "Inbox"}
      className="relative grid size-10 place-items-center rounded-full hover:bg-ink/5"
    >
      <MessageCircle className="size-[22px]" strokeWidth={2} />
      {count > 0 && (
        <span className="absolute right-0.5 top-0.5 grid min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[11px] font-bold leading-[18px] text-white ring-2 ring-paper">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
