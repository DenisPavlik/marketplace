import { notFound } from "next/navigation";
import { ChatThread } from "@/components/chat/chat-thread";
import { requireUserId } from "@/lib/auth";
import { getConversation } from "@/lib/chat";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await requireUserId(`/inbox/${id}`);
  const conversation = await getConversation(id, userId);
  if (!conversation) notFound();

  return <ChatThread key={conversation.id} conversation={conversation} userId={userId} />;
}
