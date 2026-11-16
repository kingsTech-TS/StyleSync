"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Wordmark } from "./brand";

export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Wordmark className="animate-pulse text-4xl" />
    </div>
  );
}

/** Pages under (app) need a session. The token is in memory, so this check runs on the client. */
export function RequireAuth({ children, admin }: { children: React.ReactNode; admin?: boolean }) {
  const { status, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (status === "authenticated" && admin && user?.role !== "admin") router.replace("/feed");
  }, [status, user, admin, router, pathname]);

  if (status !== "authenticated") return <Splash />;
  if (admin && user?.role !== "admin") return <Splash />;
  return <>{children}</>;
}

let afterAuth: string | null = null;

/** Lets a page choose where to go once it signs someone in (register → doll setup). */
export function setAfterAuthRedirect(path: string | null) {
  afterAuth = path;
}

/** Login/register pages send signed-in people into the app. */
export function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === "authenticated") {
      const next = afterAuth ?? new URLSearchParams(window.location.search).get("next");
      afterAuth = null;
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/feed");
    }
  }, [status, router]);
  if (status === "loading") return <Splash />;
  return <>{children}</>;
}
