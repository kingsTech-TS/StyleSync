"use client";

import { BadgeCheck, LogOut, Pencil } from "lucide-react";
import Link from "next/link";
import { DollStage } from "@/components/doll/doll-stage";
import { ThemeSwitcher } from "@/components/layout/theme-toggle";
import {
  CommentSettings,
  NameForm,
  PasswordForm,
  Section,
  UsageCard,
  WeatherSettings,
} from "@/components/profile/sections";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { useAuth } from "@/lib/auth/auth-context";
import { useAvatar, useMe, useQuota } from "@/lib/queries/shared";

export default function ProfilePage() {
  const { user: sessionUser, logout } = useAuth();
  const me = useMe();
  const user = me.data ?? sessionUser;
  const avatar = useAvatar();
  const quota = useQuota();
  if (!user) return null;

  return (
    <>
      <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end">
        <Link href="/avatar" className="group relative block w-32 shrink-0 sm:w-36" aria-label="Edit my doll">
          <DollStage
            svg={avatar.data?.svg}
            url={avatar.data?.image_url ?? user.avatar_image_url}
            alt="Your doll"
            size="card"
            className="aspect-[3/4]"
          />
          <span className="absolute right-2 bottom-2 grid size-8 place-items-center rounded-full bg-surface text-ink shadow-sm ring-1 ring-line transition group-hover:bg-ink group-hover:text-bg">
            <Pencil className="size-3.5" />
          </span>
        </Link>
        <div className="min-w-0">
          <p className="mb-2 text-xs font-medium tracking-[0.14em] text-muted uppercase">Profile</p>
          <h1 className="font-display text-4xl leading-none tracking-tight sm:text-5xl">{user.full_name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] text-muted">
            <span>@{user.username}</span>
            <span className="flex items-center gap-1.5">
              {user.email}
              {user.email_verified ? (
                <BadgeCheck className="size-4 text-success" aria-label="Verified" />
              ) : (
                <Badge tone="warn">Unverified</Badge>
              )}
            </span>
            {user.role === "admin" && <Badge tone="ink">Admin</Badge>}
          </div>
          <div className="mt-4 flex gap-5 text-sm">
            <Link href={`/u/${user.username}`} className="hover:underline">
              <span className="font-semibold">{user.follower_count.toLocaleString()}</span>{" "}
              <span className="text-muted">{user.follower_count === 1 ? "follower" : "followers"}</span>
            </Link>
            <Link href={`/u/${user.username}`} className="hover:underline">
              <span className="font-semibold">{user.following_count.toLocaleString()}</span>{" "}
              <span className="text-muted">following</span>
            </Link>
          </div>
        </div>
      </header>

      <Section title="Account" description="Your name shows on your public profile.">
        <NameForm user={user} />
      </Section>

      <Section title="Password" description="You'll stay logged in on this device.">
        <PasswordForm />
      </Section>

      <Section title="Weather" description="Used to suggest outfits for the day you're actually having.">
        <WeatherSettings user={user} />
      </Section>

      <Section
        title="Comments"
        description={
          user.age_range === "13-17"
            ? "Who can comment on outfits you publish. Accounts under 18 start at followers only."
            : "Who can comment on outfits you publish."
        }
      >
        <CommentSettings user={user} />
      </Section>

      <Section id="ai-usage" title="AI usage" description="What the stylist can still do for you today.">
        <UsageCard usage={quota.data} />
      </Section>

      <Section title="Appearance">
        <div className="flex items-center justify-between rounded-[var(--radius-card)] border border-line bg-surface p-4">
          <span className="text-sm">Theme</span>
          <ThemeSwitcher />
        </div>
      </Section>

      <Section title="Session">
        <Button variant="secondary" onClick={() => logout()}>
          <LogOut />
          Log out
        </Button>
      </Section>
    </>
  );
}
