import type { Metadata } from "next";
import { Suspense } from "react";
import { ConversationList, InboxPanes } from "@/components/chat/conversation-list";
import { ConversationListSkeleton } from "@/components/skeletons";
import { requireUserId } from "@/lib/auth";
import { getConversations } from "@/lib/chat";

export const metadata: Metadata = { title: "Inbox" };

export default async function InboxLayout({ children }: { children: React.ReactNode }) {
  const userId = await requireUserId("/inbox");

  // The panes render right away; the conversation list streams in behind a skeleton.
  return (
    <InboxPanes
      list={
        <Suspense fallback={<ConversationListSkeleton />}>
          <Conversations userId={userId} />
        </Suspense>
      }
    >
      {children}
    </InboxPanes>
  );
}

async function Conversations({ userId }: { userId: string }) {
  const conversations = await getConversations(userId);
  return <ConversationList conversations={conversations} userId={userId} />;
}
