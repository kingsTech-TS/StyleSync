import { getAccessToken, setSession } from "@/lib/auth/token-store";
import { ApiError, toApiError } from "./errors";
import type { TokenOut } from "./types";

export const API_BASE = "/api/v1";
export const CSRF_HEADER = { "X-StyleSync-CSRF": "1" };

type Query = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Query;
  /** JSON body. Use `form` for multipart uploads. */
  body?: unknown;
  form?: FormData;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Return the raw Response (used for SSE). */
  raw?: boolean;
}

function buildUrl(path: string, query?: Query): string {
  const url = `${API_BASE}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

let refreshing: Promise<TokenOut | null> | null = null;

/**
 * Refresh tokens rotate and reusing an old one revokes the whole family,
 * so only one refresh may be in flight at a time.
 */
export function refreshOnce(): Promise<TokenOut | null> {
  if (!refreshing) {
    refreshing = fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: CSRF_HEADER,
    })
      .then(async (res) => {
        if (!res.ok) {
          setSession(null);
          return null;
        }
        const token = (await res.json()) as TokenOut;
        setSession(token);
        return token;
      })
      .catch(() => {
        setSession(null);
        return null;
      })
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

async function send(path: string, opts: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { ...opts.headers };
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  return fetch(buildUrl(path, opts.query), {
    method: opts.method ?? (body ? "POST" : "GET"),
    headers,
    body,
    credentials: "include",
    signal: opts.signal,
  });
}

export async function apiRaw(path: string, opts: RequestOptions = {}): Promise<Response> {
  let res = await send(path, opts);
  if (res.status === 401 && !path.startsWith("/auth/") && getAccessToken() !== null) {
    const token = await refreshOnce();
    if (token) res = await send(path, opts);
  }
  if (!res.ok) throw await toApiError(res);
  return res;
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await apiRaw(path, opts);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export { ApiError };
