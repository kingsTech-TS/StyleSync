"use client";

import { useParams } from "next/navigation";
import { ChatStreamProvider } from "@/components/chat/chat-stream";
import { SessionList } from "@/components/chat/session-list";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ sessionId?: string }>();
  return (
    <ChatStreamProvider>
      {/* Fills the screen between the app's top bar and bottom nav (mobile) or the page padding (desktop). */}
      <div className="flex h-[calc(100dvh-10.5rem)] overflow-hidden bg-bg lg:h-[calc(100dvh-4.5rem)] lg:rounded-[28px] lg:border lg:border-line lg:bg-surface">
        <aside className="hidden w-72 shrink-0 border-r border-line lg:block">
          <SessionList activeId={params.sessionId} />
        </aside>
        <section className="flex min-w-0 flex-1 flex-col">{children}</section>
      </div>
    </ChatStreamProvider>
  );
}
