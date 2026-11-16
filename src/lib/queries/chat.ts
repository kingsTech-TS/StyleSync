"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { ChatMessageOut, SessionOut } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { qk } from "./keys";

export function useChatSessions() {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.chatSessions,
    queryFn: () => api<SessionOut[]>("/chat/sessions"),
    enabled: status === "authenticated",
  });
}

export function useChatMessages(sessionId: string | null | undefined) {
  return useQuery({
    queryKey: qk.chatMessages(sessionId ?? ""),
    queryFn: () => api<ChatMessageOut[]>(`/chat/sessions/${sessionId}/messages`),
    enabled: !!sessionId,
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/chat/sessions/${id}`, { method: "DELETE" }),
    onSuccess: (_, id) => {
      qc.setQueryData<SessionOut[]>(qk.chatSessions, (list) => list?.filter((s) => s.id !== id));
      qc.removeQueries({ queryKey: qk.chatMessages(id) });
      qc.invalidateQueries({ queryKey: qk.chatSessions });
    },
  });
}
