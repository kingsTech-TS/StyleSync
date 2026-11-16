"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, CSRF_HEADER, refreshOnce } from "@/lib/api/client";
import type { TokenOut, UserOut } from "@/lib/api/types";
import { onSessionChange, setSession } from "./token-store";

type Status = "loading" | "authenticated" | "anonymous";

export interface RegisterInput {
  full_name: string;
  username: string;
  email: string;
  age_range: string;
  sex: string;
  password: string;
  confirm_password: string;
}

interface AuthContextValue {
  status: Status;
  user: UserOut | null;
  login: (identifier: string, password: string) => Promise<UserOut>;
  register: (input: RegisterInput) => Promise<UserOut>;
  logout: () => Promise<void>;
  /** Replace the cached user after a profile change. */
  setUser: (user: UserOut) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUserState] = useState<UserOut | null>(null);

  useEffect(() => {
    const off = onSessionChange((u) => {
      setUserState(u);
      setStatus(u ? "authenticated" : "anonymous");
    });
    refreshOnce();
    return () => {
      off();
    };
  }, []);

  // Renew the access token a minute before it expires, so most requests never see a 401.
  useEffect(() => {
    if (status !== "authenticated") return;
    const id = window.setInterval(() => refreshOnce(), 13 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [status]);

  const login = useCallback(async (identifier: string, password: string) => {
    const token = await api<TokenOut>("/auth/login", { body: { identifier, password } });
    setSession(token);
    return token.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const token = await api<TokenOut>("/auth/register", { body: input });
    setSession(token);
    return token.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST", headers: CSRF_HEADER });
    } catch {
      // the session is cleared locally either way
    }
    setSession(null);
    queryClient.clear();
  }, [queryClient]);

  const setUser = useCallback(
    (u: UserOut) => {
      setUserState(u);
      queryClient.setQueryData(["me"], u);
    },
    [queryClient],
  );

  const value = useMemo(
    () => ({ status, user, login, register, logout, setUser }),
    [status, user, login, register, logout, setUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
