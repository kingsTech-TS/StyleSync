"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { PublicProfileOut } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { qk } from "@/lib/queries/keys";

export function useProfile(username: string) {
  return useQuery({
    queryKey: qk.profile(username),
    queryFn: () => api<PublicProfileOut>(`/users/${encodeURIComponent(username)}`),
    enabled: !!username,
  });
}

/** Follow / Requested / Following. Teen accounts may turn a follow into a request. */
export function FollowButton({ username, size = "md" }: { username: string; size?: "sm" | "md" }) {
  const qc = useQueryClient();
  const router = useRouter();
  const { status, user } = useAuth();
  const { data: profile } = useProfile(username);

  const toggle = useMutation({
    mutationFn: (follow: boolean) =>
      api(`/social/users/${encodeURIComponent(username)}/follow`, { method: follow ? "POST" : "DELETE" }),
    onSuccess: async (_d, follow) => {
      const next = await qc.fetchQuery({
        queryKey: qk.profile(username),
        queryFn: () => api<PublicProfileOut>(`/users/${encodeURIComponent(username)}`),
      });
      if (follow && next.follow_pending) toast("Follow request sent");
      qc.invalidateQueries({ queryKey: qk.followers(username) });
      qc.invalidateQueries({ queryKey: qk.feed({ tab: "following" }) });
      qc.invalidateQueries({ queryKey: qk.me });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (user?.username === username || profile?.is_self) return null;
  if (status === "authenticated" && !profile) return null;

  const following = !!profile?.is_following;
  const pending = !!profile?.follow_pending;

  return (
    <Button
      size={size}
      variant={following || pending ? "secondary" : "primary"}
      loading={toggle.isPending}
      aria-pressed={following || pending}
      onClick={() => {
        if (status !== "authenticated") {
          router.push(`/login?next=${encodeURIComponent(`/u/${username}`)}`);
          return;
        }
        toggle.mutate(!(following || pending));
      }}
    >
      {following ? "Following" : pending ? "Requested" : "Follow"}
    </Button>
  );
}
