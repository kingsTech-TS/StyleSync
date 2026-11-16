"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { FeedPage, OutfitOut } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { qk } from "./keys";
import { patchOutfitEverywhere, restoreSnapshot } from "./outfits";

export type FeedTab = "for-you" | "following";

/** "For you", "Following", or one person's published outfits (profile pages). */
export function useFeed({ tab = "for-you", theme, author }: { tab?: FeedTab; theme?: string; author?: string }) {
  const { status } = useAuth();
  const following = tab === "following";
  return useInfiniteQuery({
    queryKey: qk.feed({ tab, theme, author }),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api<FeedPage>(following ? "/feed/following" : "/feed", {
        query: { cursor: pageParam, theme: following ? undefined : theme, author, limit: 20 },
      }),
    getNextPageParam: (last) => last.next_cursor ?? null,
    enabled: !following || status === "authenticated",
  });
}

export function useSaved() {
  return useQuery({ queryKey: qk.saved, queryFn: () => api<OutfitOut[]>("/feed/saved") });
}

/** Like / unlike with an optimistic update everywhere the outfit is cached. */
export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, like }: { id: string; like: boolean }) =>
      api(`/social/outfits/${id}/like`, { method: like ? "POST" : "DELETE" }),
    onMutate: ({ id, like }) =>
      patchOutfitEverywhere(qc, id, (o) =>
        o.liked_by_me === like ? o : { ...o, liked_by_me: like, like_count: Math.max(o.like_count + (like ? 1 : -1), 0) },
      ),
    onError: (e, _v, snapshot) => {
      if (snapshot) restoreSnapshot(qc, snapshot);
      toast.error(errorMessage(e));
    },
  });
}

/** Save / unsave with an optimistic update. */
export function useToggleSave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, save }: { id: string; save: boolean }) =>
      api(`/feed/outfits/${id}/save`, { method: save ? "POST" : "DELETE" }),
    onMutate: ({ id, save }) =>
      patchOutfitEverywhere(qc, id, (o) =>
        o.saved_by_me === save ? o : { ...o, saved_by_me: save, save_count: Math.max(o.save_count + (save ? 1 : -1), 0) },
      ),
    onError: (e, _v, snapshot) => {
      if (snapshot) restoreSnapshot(qc, snapshot);
      toast.error(errorMessage(e));
    },
    onSuccess: (_d, { save }) => {
      qc.invalidateQueries({ queryKey: qk.saved });
      if (save) toast.success("Saved", { action: { label: "View", onClick: () => window.location.assign("/saved") } });
    },
  });
}
