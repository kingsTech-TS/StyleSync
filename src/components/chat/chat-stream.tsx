"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, apiRaw } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { readSSE } from "@/lib/api/sse";
import type { SessionOut } from "@/lib/api/types";
import { qk } from "@/lib/queries/keys";

/** The message being sent right now, shown until the saved history replaces it. */
export interface Turn {
  key: number;
  /** "" until a new chat's session has been created. */
  sessionId: string;
  userText: string;
  previews: string[];
  assistantText: string;
  tool: string | null;
  outfitIds: string[];
  error: string | null;
  status: "sending" | "streaming" | "done" | "error" | "stopped";
}

interface ChatStreamValue {
  turn: Turn | null;
  busy: boolean;
  send: (sessionId: string | null, text: string, files: File[]) => Promise<void>;
  stop: () => void;
  dismiss: () => void;
}

const Ctx = createContext<ChatStreamValue | null>(null);

function toolLabel(name: string): string {
  if (name === "create_outfit") return "Putting an outfit together";
  if (name === "search_wardrobe" || name === "get_item") return "Searching your wardrobe";
  if (name.includes("search")) return "Looking up styling sources";
  return "Thinking";
}

/**
 * Lives in the chat layout, so a stream keeps going when a new chat moves
 * from /chat to /chat/[id] after its session is created.
 */
export function ChatStreamProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const router = useRouter();
  const [turn, setTurn] = useState<Turn | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const turnRef = useRef<Turn | null>(null);
  turnRef.current = turn;

  const revoke = (t: Turn | null) => t?.previews.forEach((u) => URL.revokeObjectURL(u));

  useEffect(
    () => () => {
      abortRef.current?.abort();
      revoke(turnRef.current);
    },
    [],
  );

  const dismiss = useCallback(() => {
    setTurn((t) => {
      revoke(t);
      return null;
    });
  }, []);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const send = useCallback(
    async (sessionId: string | null, text: string, files: File[]) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);

      const key = Date.now();
      const update = (patch: Partial<Turn> | ((t: Turn) => Partial<Turn>)) =>
        setTurn((t) => (t && t.key === key ? { ...t, ...(typeof patch === "function" ? patch(t) : patch) } : t));

      setTurn((old) => {
        revoke(old);
        return {
          key,
          sessionId: sessionId ?? "",
          userText: text,
          previews: files.map((f) => URL.createObjectURL(f)),
          assistantText: "",
          tool: null,
          outfitIds: [],
          error: null,
          status: "sending",
        };
      });

      const controller = new AbortController();
      abortRef.current = controller;
      let id = sessionId;
      try {
        if (!id) {
          const session = await api<SessionOut>("/chat/sessions", { method: "POST" });
          id = session.id;
          qc.setQueryData<SessionOut[]>(qk.chatSessions, (list) => [session, ...(list ?? [])]);
          update({ sessionId: id });
          router.replace(`/chat/${id}`);
        }

        const form = new FormData();
        form.append("text", text);
        for (const f of files) form.append("images", f);
        const res = await apiRaw(`/chat/sessions/${id}/messages`, {
          method: "POST",
          form,
          signal: controller.signal,
        });
        update({ status: "streaming" });
        if (!res.body) throw new Error("The stylist didn't answer. Try again.");

        let finished = false;
        for await (const ev of readSSE(res.body)) {
          const data = (ev.data ?? {}) as Record<string, unknown>;
          if (ev.event === "tool") {
            update({ tool: toolLabel(String(data.name ?? "")) });
          } else if (ev.event === "outfit") {
            const outfitId = String(data.outfit_id ?? "");
            if (outfitId) update((t) => ({ outfitIds: t.outfitIds.includes(outfitId) ? t.outfitIds : [...t.outfitIds, outfitId] }));
            qc.invalidateQueries({ queryKey: ["outfits"] });
          } else if (ev.event === "delta") {
            const piece = String(data.text ?? "");
            update((t) => ({ assistantText: t.assistantText + piece, tool: null }));
          } else if (ev.event === "error") {
            finished = true;
            update({ status: "error", tool: null, error: String(data.detail ?? "The stylist couldn't answer that.") });
          } else if (ev.event === "done") {
            finished = true;
            const ids = Array.isArray(data.outfit_ids) ? (data.outfit_ids as string[]) : [];
            update((t) => ({
              status: "done",
              tool: null,
              outfitIds: [...t.outfitIds, ...ids.filter((o) => !t.outfitIds.includes(o))],
            }));
            qc.invalidateQueries({ queryKey: qk.chatSessions });
            qc.invalidateQueries({ queryKey: qk.quota });
            qc.invalidateQueries({ queryKey: ["outfits"] });
            // Swap the live turn for the saved messages once they're loaded.
            await qc.invalidateQueries({ queryKey: qk.chatMessages(id) });
            setTurn((t) => {
              if (t && t.key === key) {
                revoke(t);
                return null;
              }
              return t;
            });
          }
        }
        if (!finished) update({ status: "error", tool: null, error: "The connection closed early. Try sending again." });
      } catch (e) {
        if (controller.signal.aborted) update({ status: "stopped", tool: null });
        else update({ status: "error", tool: null, error: errorMessage(e) });
        qc.invalidateQueries({ queryKey: qk.quota });
      } finally {
        busyRef.current = false;
        setBusy(false);
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [qc, router],
  );

  const value = useMemo(() => ({ turn, busy, send, stop, dismiss }), [turn, busy, send, stop, dismiss]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChatStream(): ChatStreamValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useChatStream must be used inside <ChatStreamProvider>");
  return ctx;
}
