import type { Metadata } from "next";
import { ConversationList, InboxPanes } from "@/components/chat/conversation-list";
import { requireUserId } from "@/lib/auth";
import { getConversations } from "@/lib/chat";

export const metadata: Metadata = { title: "Inbox" };

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireUserId("/inbox");
  const conversations = await getConversations(userId);

  return (
    <InboxPanes list={<ConversationList conversations={conversations} userId={userId} />}>{children}</InboxPanes>
  );
}
