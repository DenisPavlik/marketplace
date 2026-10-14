"use client";

import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ButtonLink, Button } from "@/components/ui/button";
import { startConversation } from "@/app/actions/chat";

const QUICK_REPLIES = ["Is this still available?", "Would you take less?", "When could I pick it up?"];

export function ContactSeller({
  listingId,
  sellerFirstName,
  signedIn,
  existingConversationId,
}: {
  listingId: string;
  sellerFirstName: string;
  signedIn: boolean;
  existingConversationId: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(`Hi ${sellerFirstName}, is this still available?`);
  const [pending, startTransition] = useTransition();

  if (existingConversationId) {
    return (
      <ButtonLink href={`/inbox/${existingConversationId}`} size="lg" className="w-full">
        <MessageCircle className="size-[18px]" /> Open your conversation
      </ButtonLink>
    );
  }

  if (!signedIn) {
    return (
      <ButtonLink href={`/login?next=${encodeURIComponent(`/listings/${listingId}`)}`} size="lg" className="w-full">
        <MessageCircle className="size-[18px]" /> Sign in to message {sellerFirstName}
      </ButtonLink>
    );
  }

  function send() {
    startTransition(async () => {
      const res = await startConversation(listingId, message);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Message sent");
      router.push(`/inbox/${res.conversationId}`);
    });
  }

  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-line">
      <label htmlFor="first-message" className="flex items-center gap-2 text-[15px] font-semibold">
        <MessageCircle className="size-[18px]" /> Message {sellerFirstName}
      </label>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setMessage(q)}
            className="rounded-full bg-paper px-3 py-1.5 text-[13px] font-medium ring-1 ring-inset ring-line hover:ring-line-strong"
          >
            {q}
          </button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          id="first-message"
          value={message}
          maxLength={2000}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !pending && send()}
          className="field-input flex-1"
        />
        <Button onClick={send} disabled={pending || !message.trim()}>
          {pending ? "Sending…" : "Send"}
        </Button>
      </div>
    </div>
  );
}
