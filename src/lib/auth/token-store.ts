import type { TokenOut, UserOut } from "@/lib/api/types";

/** The access token lives in memory only. The refresh token is an httpOnly cookie. */
let accessToken: string | null = null;
type Listener = (user: UserOut | null) => void;
const listeners = new Set<Listener>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setSession(token: TokenOut | null): void {
  accessToken = token?.access_token ?? null;
  for (const l of listeners) l(token?.user ?? null);
}

export function onSessionChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
