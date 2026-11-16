"use client";

import { useParams } from "next/navigation";
import { ChatThread } from "@/components/chat/chat-thread";

export default function ChatSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  // key: a fresh composer and scroll position per chat
  return <ChatThread key={sessionId} sessionId={sessionId} />;
}
