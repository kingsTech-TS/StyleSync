"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type { AIUsage, AvatarOut, OptionsOut, OutfitOut, UserOut } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { qk } from "./keys";

export function useMe() {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.me,
    queryFn: () => api<UserOut>("/users/me"),
    enabled: status === "authenticated",
  });
}

export function useQuota() {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.quota,
    queryFn: () => api<AIUsage>("/users/me/ai-usage"),
    enabled: status === "authenticated",
    staleTime: 30_000,
  });
}

export function useOptions() {
  return useQuery({
    queryKey: qk.options,
    queryFn: () => api<OptionsOut>("/outfits/options"),
    staleTime: 10 * 60_000,
  });
}

/** The user's doll. Polls while a selfie is being turned into a doll. */
export function useAvatar() {
  const { status } = useAuth();
  return useQuery({
    queryKey: qk.avatar,
    queryFn: () => api<AvatarOut>("/avatar"),
    enabled: status === "authenticated",
    refetchInterval: (q) => (q.state.data?.status === "pending" ? 2500 : false),
  });
}

/** One outfit with its full SVG. Polls while the render is pending (up to ~2 minutes). */
export function useOutfit(id: string | null | undefined) {
  return useQuery({
    queryKey: qk.outfit(id ?? ""),
    queryFn: () => api<OutfitOut>(`/outfits/${id}`),
    enabled: !!id,
    refetchInterval: (q) => {
      const data = q.state.data;
      if (!data || data.render.status !== "pending") return false;
      return q.state.dataUpdateCount > 40 ? false : q.state.dataUpdateCount > 10 ? 5000 : 2000;
    },
  });
}
