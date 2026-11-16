"use client";

import { ArrowLeft, History, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api/errors";
import { useChatMessages, useChatSessions } from "@/lib/queries/chat";
import { useQuota } from "@/lib/queries/shared";
import { useChatStream } from "./chat-stream";
import { Composer } from "./composer";
import { AssistantMessage, UserMessage } from "./messages";
import { SessionList } from "./session-list";

const STARTERS = [
  { label: "Recreate this look from my wardrobe", text: "Recreate this look using clothes from my wardrobe.", photo: true },
  { label: "What goes with my navy chinos?", text: "What goes with my navy chinos?" },
  { label: "What should I wear to a beach wedding?", text: "What should I wear to a beach wedding?" },
];

export function ChatThread({ sessionId }: { sessionId: string | null }) {
  const messages = useChatMessages(sessionId);
  const sessions = useChatSessions();
  const { turn, busy, send, stop } = useChatStream();
  const { data: quota } = useQuota();

  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  const activeTurn = turn && turn.sessionId === (sessionId ?? "") ? turn : null;
  const history = messages.data ?? [];
  const title = sessionId ? (sessions.data?.find((s) => s.id === sessionId)?.title ?? "Chat") : "New chat";

  const chatQuota = quota?.quotas.chat;
  const disabledReason =
    quota?.mode === "offline"
      ? "The stylist is resting until the free AI credit refreshes."
      : chatQuota && chatQuota.remaining === 0
        ? "You've used today's chat messages. They reset tomorrow."
        : null;

  // Follow new content unless the reader has scrolled up.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [history.length, activeTurn?.assistantText, activeTurn?.tool, activeTurn?.outfitIds.length, activeTurn?.status, activeTurn?.key]);

  function submit() {
    const text = draft.trim();
    if ((!text && !files.length) || busy || disabledReason) return;
    stickRef.current = true;
    send(sessionId, text, files);
    setDraft("");
    setFiles([]);
  }

  // The backend saves the user's message before the reply streams, so a refetch can already include it.
  const last = history[history.length - 1];
  const userAlreadySaved = !!activeTurn && last?.role === "user" && last.text === activeTurn.userText;

  const notFound = messages.error instanceof ApiError && messages.error.status === 404;
  const empty = !messages.isLoading && history.length === 0 && !activeTurn;

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 sm:px-5">
        {sessionId ? (
          <Link
            href="/chat"
            aria-label="All chats"
            className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink lg:hidden"
          >
            <ArrowLeft className="size-5" />
          </Link>
        ) : (
          <MobileHistory />
        )}
        <h1 className="min-w-0 flex-1 truncate text-[15px] font-medium">{title}</h1>
        {sessionId && <MobileHistory />}
      </header>

      <div
        ref={scrollerRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {notFound ? (
          <div className="mx-auto max-w-md px-4 py-16">
            <EmptyState
              icon={<MessageCircle />}
              title="This chat doesn't exist"
              description="It may have been deleted."
              action={
                <Link href="/chat" className="text-sm font-medium underline underline-offset-4">
                  Start a new chat
                </Link>
              }
            />
          </div>
        ) : empty ? (
          <div className="mx-auto flex min-h-full max-w-xl flex-col justify-center px-5 py-10">
            <p className="font-display text-4xl tracking-tight sm:text-5xl">Ask your stylist</p>
            <p className="mt-3 text-[15px] text-muted">
              It builds outfits only from what you own, and tells you when something isn&apos;t in your wardrobe.
              Attach a photo to recreate a look, or ask for advice.
            </p>
            <div className="mt-8 flex flex-col items-start gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  disabled={!!disabledReason}
                  onClick={() => {
                    setDraft(s.text);
                    if (s.photo) fileInputRef.current?.click();
                    else textareaRef.current?.focus();
                  }}
                  className="rounded-full border border-line bg-surface px-4 py-2 text-left text-sm transition hover:border-ink/40 disabled:opacity-50"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-7 px-4 py-8 sm:px-6">
            {messages.isLoading &&
              [0, 1].map((i) => (
                <div key={i} className="flex flex-col gap-3">
                  <Skeleton className="ml-auto h-10 w-2/5 rounded-3xl" />
                  <Skeleton className="h-16 w-4/5" />
                </div>
              ))}
            {history.map((m) =>
              m.role === "user" ? (
                <UserMessage key={m.id} text={m.text} images={m.image_urls} />
              ) : (
                <AssistantMessage key={m.id} text={m.text} outfitIds={m.outfit_ids} />
              ),
            )}
            {activeTurn && (
              <>
                {!userAlreadySaved && <UserMessage text={activeTurn.userText} images={activeTurn.previews} />}
                <AssistantMessage
                  live
                  text={activeTurn.assistantText}
                  outfitIds={activeTurn.outfitIds}
                  status={
                    activeTurn.tool ??
                    ((activeTurn.status === "sending" || activeTurn.status === "streaming") && !activeTurn.assistantText
                      ? "Thinking"
                      : null)
                  }
                  error={activeTurn.error}
                  stopped={activeTurn.status === "stopped"}
                />
              </>
            )}
          </div>
        )}
      </div>

      {!notFound && (
        <Composer
          value={draft}
          onChange={setDraft}
          files={files}
          onFilesChange={setFiles}
          onSend={submit}
          onStop={stop}
          busy={busy}
          disabledReason={disabledReason}
          remaining={chatQuota ? chatQuota.remaining : null}
          textareaRef={textareaRef}
          fileInputRef={fileInputRef}
        />
      )}
    </>
  );
}

/** On phones the chat list lives in a sheet. */
function MobileHistory() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        aria-label="Chat history"
        className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink lg:hidden"
      >
        <History className="size-5" />
      </DialogTrigger>
      <DialogContent title="Chats" side="bottom" hideTitle className="h-[70dvh]">
        <div className="-mx-6 -mt-2 -mb-6 h-[calc(70dvh-1rem)]">
          <SessionList onNavigate={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
