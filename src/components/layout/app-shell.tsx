"use client";

import { useMutation } from "@tanstack/react-query";
import {
  Bookmark,
  Compass,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Shield,
  Shirt,
  Sparkles,
  SwatchBook,
  UserRound,
  WandSparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";
import { useQuota } from "@/lib/queries/shared";
import { cn } from "@/lib/utils";
import { UserAvatar, Wordmark } from "./brand";
import { ThemeSwitcher } from "./theme-toggle";

const NAV = [
  { href: "/feed", label: "Feed", icon: Compass },
  { href: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { href: "/creation-room", label: "Creation Room", icon: SwatchBook },
  { href: "/generate", label: "Style me", icon: WandSparkles },
  { href: "/chat", label: "Stylist chat", icon: MessageCircle },
  { href: "/outfits", label: "My outfits", icon: LayoutGrid },
  { href: "/saved", label: "Saved", icon: Bookmark },
];

const MOBILE_NAV = [
  { href: "/feed", label: "Feed", icon: Compass },
  { href: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { href: "/creation-room", label: "Create", icon: SwatchBook, primary: true },
  { href: "/generate", label: "Style me", icon: WandSparkles },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  // The Creation Room and chat use the full height; everything else scrolls normally.
  const fullBleed = pathname.startsWith("/creation-room") || pathname.startsWith("/chat");

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-bg px-4 py-6 lg:flex">
        <Wordmark href="/feed" className="px-3" />
        <nav className="mt-10 flex flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-full px-3 text-[14px] text-muted transition hover:text-ink",
                isActive(pathname, href) && "bg-surface font-medium text-ink shadow-sm ring-1 ring-line",
              )}
            >
              <Icon className="size-[18px]" />
              {label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className={cn(
                "mt-4 flex h-10 items-center gap-3 rounded-full px-3 text-[14px] text-muted transition hover:text-ink",
                isActive(pathname, "/admin") && "bg-surface font-medium text-ink shadow-sm ring-1 ring-line",
              )}
            >
              <Shield className="size-[18px]" />
              Admin
            </Link>
          )}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <QuotaCard />
          <UserMenu align="start" full />
        </div>
      </aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/85 px-4 backdrop-blur-md lg:hidden">
        <Wordmark href="/feed" className="text-[22px]" />
        <UserMenu align="end" />
      </header>

      <StatusBanners />

      <main
        className={cn(
          "mx-auto w-full pb-28 lg:pb-12",
          fullBleed ? "max-w-[1400px] px-0 sm:px-4 lg:px-6 lg:pt-6" : "max-w-6xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-12",
        )}
      >
        {children}
      </main>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-md items-end justify-around px-2 pt-1.5 pb-2">
          {MOBILE_NAV.map(({ href, label, icon: Icon, primary }) => {
            const active = isActive(pathname, href);
            return (
              <Link key={href} href={href} className="flex w-16 flex-col items-center gap-1">
                <span
                  className={cn(
                    "grid place-items-center rounded-full transition",
                    primary ? "size-11 -translate-y-1 bg-ink text-bg shadow-lg" : "size-8",
                    !primary && (active ? "text-ink" : "text-faint"),
                  )}
                >
                  <Icon className={primary ? "size-5" : "size-[21px]"} strokeWidth={active ? 2.2 : 1.8} />
                </span>
                <span className={cn("text-[10.5px]", active ? "font-medium text-ink" : "text-faint")}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function UserMenu({ align, full }: { align: "start" | "end"; full?: boolean }) {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <Menu>
      <MenuTrigger
        className={cn(
          "flex items-center gap-3 rounded-full text-left transition outline-none",
          full ? "w-full p-1.5 pr-3 hover:bg-surface" : "p-0.5",
        )}
      >
        <UserAvatar url={user.avatar_image_url} username={user.username} />
        {full && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{user.full_name}</span>
            <span className="block truncate text-xs text-muted">@{user.username}</span>
          </span>
        )}
      </MenuTrigger>
      <MenuContent align={align}>
        <MenuItem href="/profile">
          <UserRound />
          Profile & settings
        </MenuItem>
        <MenuItem href="/avatar">
          <Sparkles />
          Edit my doll
        </MenuItem>
        <MenuItem href={`/u/${user.username}`}>
          <Compass />
          Public profile
        </MenuItem>
        <MenuItem href="/outfits">
          <LayoutGrid />
          My outfits
        </MenuItem>
        <MenuItem href="/saved">
          <Bookmark />
          Saved
        </MenuItem>
        {user.role === "admin" && (
          <MenuItem href="/admin">
            <Shield />
            Admin
          </MenuItem>
        )}
        <MenuSeparator />
        <div className="flex items-center justify-between px-3 py-1.5 text-muted">
          <span>Theme</span>
          <ThemeSwitcher />
        </div>
        <MenuSeparator />
        <MenuItem onSelect={() => logout()}>
          <LogOut />
          Log out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

function QuotaCard() {
  const { data } = useQuota();
  if (!data) return null;
  const rows = [
    { key: "generate", label: "Outfits" },
    { key: "chat", label: "Chat" },
    { key: "tag", label: "Scans" },
  ] as const;
  return (
    <Link href="/profile#ai-usage" className="block rounded-2xl border border-line bg-surface p-3.5 transition hover:border-ink/30">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs font-medium text-muted">AI today</span>
        {data.mode !== "normal" && (
          <span className={cn("text-[11px] font-medium", data.mode === "offline" ? "text-danger" : "text-warn")}>
            {data.mode === "offline" ? "Resting" : "Saver mode"}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {rows.map(({ key, label }) => {
          const q = data.quotas[key];
          if (!q) return null;
          const pct = q.limit ? Math.min(q.used / q.limit, 1) : 1;
          return (
            <div key={key} className="flex items-center gap-2.5 text-xs">
              <span className="w-12 text-muted">{label}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <span
                  className={cn("block h-full rounded-full", q.remaining === 0 ? "bg-danger" : "bg-ink")}
                  style={{ width: `${pct * 100}%` }}
                />
              </span>
              <span className="w-8 text-right tabular-nums">{q.remaining}</span>
            </div>
          );
        })}
      </div>
    </Link>
  );
}

function StatusBanners() {
  const { user } = useAuth();
  const { data: quota } = useQuota();
  const [hideVerify, setHideVerify] = useState(false);
  const resend = useMutation({
    mutationFn: () => api("/auth/resend-verification", { method: "POST" }),
    onSuccess: () => toast.success("Verification email sent"),
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <>
      {quota?.mode === "offline" && (
        <div className="border-b border-line bg-danger-soft px-4 py-2.5 text-center text-[13px] text-danger">
          The AI stylist is resting until the free credit refreshes. Your wardrobe, Creation Room and feed still work.
        </div>
      )}
      {quota?.mode === "saver" && (
        <div className="border-b border-line bg-warn-soft px-4 py-2.5 text-center text-[13px] text-warn">
          Saver mode: the stylist uses cached styling knowledge and quicker doll renders for now.
        </div>
      )}
      {user && !user.email_verified && !hideVerify && (
        <div className="flex items-center justify-center gap-3 border-b border-line bg-surface px-4 py-2.5 text-[13px]">
          <span className="text-muted">Check your inbox to verify {user.email}.</span>
          <button
            type="button"
            className="font-medium underline underline-offset-4"
            disabled={resend.isPending}
            onClick={() => resend.mutate()}
          >
            Resend
          </button>
          <button type="button" aria-label="Dismiss" className="text-muted" onClick={() => setHideVerify(true)}>
            <X className="size-4" />
          </button>
        </div>
      )}
    </>
  );
}
