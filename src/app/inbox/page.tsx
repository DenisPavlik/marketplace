import { MessageCircle } from "lucide-react";

export default function InboxIndex() {
  return (
    <div className="grid h-full place-items-center p-10 text-center">
      <div>
        <MessageCircle className="mx-auto size-10 text-ink-3" strokeWidth={1.5} />
        <p className="font-display mt-4 text-lg">Pick a conversation</p>
        <p className="mt-1 text-sm text-ink-2">Messages arrive here in real time.</p>
      </div>
    </div>
  );
}
