"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal, Search, ShieldCheck, ShieldOff, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge, EmptyState, ErrorNote, Menu, MenuContent, MenuItem, MenuTrigger, PageHeader } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/spinner";
import { errorMessage } from "@/lib/api/errors";
import type { AdminUserRow } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-context";
import { USERS_PAGE_SIZE, useAdminUsers, useUpdateUser } from "@/lib/queries/admin";
import { cn, timeAgo } from "@/lib/utils";

export default function AdminUsers() {
  const [input, setInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setQ(input.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(t);
  }, [input]);

  const { data, isLoading, error, isPlaceholderData } = useAdminUsers(q, page);
  const total = data?.total ?? 0;
  const pages = Math.max(Math.ceil(total / USERS_PAGE_SIZE), 1);

  return (
    <>
      <PageHeader title="Users" description={data ? `${total.toLocaleString()} accounts` : undefined} />
      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search username or email"
          className="pl-10"
          aria-label="Search users"
        />
      </div>

      {error && <ErrorNote>{errorMessage(error)}</ErrorNote>}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <EmptyState icon={<Search />} title={q ? `No users match “${q}”` : "No users yet"} />
      ) : (
        <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
          {/* table on wider screens */}
          <div className="hidden overflow-x-auto rounded-[var(--radius-card)] border border-line bg-surface md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Items</th>
                  <th className="px-4 py-3 text-right font-medium">Outfits</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Last login</th>
                  <th className="w-12 px-2 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/u/${u.username}`} className="font-medium hover:underline">
                        @{u.username}
                      </Link>
                      <p className="text-xs text-muted">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadges u={u} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{u.item_count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{u.outfit_count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted">{timeAgo(u.created_at)}</td>
                    <td className="px-4 py-3 text-muted">{u.last_login_at ? timeAgo(u.last_login_at) : "Never"}</td>
                    <td className="px-2 py-3">
                      <UserActions u={u} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* cards on phones */}
          <ul className="flex flex-col gap-2 md:hidden">
            {data.items.map((u) => (
              <li key={u.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/u/${u.username}`} className="font-medium">
                      @{u.username}
                    </Link>
                    <p className="truncate text-xs text-muted">{u.email}</p>
                  </div>
                  <UserActions u={u} />
                </div>
                <div className="mt-3">
                  <StatusBadges u={u} />
                </div>
                <p className="mt-3 text-xs text-muted tabular-nums">
                  {u.item_count} items · {u.outfit_count} outfits · joined {timeAgo(u.created_at)}
                </p>
              </li>
            ))}
          </ul>

          {pages > 1 && (
            <div className="mt-5 flex items-center justify-between text-sm">
              <span className="text-muted tabular-nums">
                Page {page + 1} of {pages}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="icon-sm" aria-label="Previous page" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft />
                </Button>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  aria-label="Next page"
                  disabled={page + 1 >= pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function StatusBadges({ u }: { u: AdminUserRow }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {u.role === "admin" && <Badge tone="ink">Admin</Badge>}
      {u.is_active ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Deactivated</Badge>}
      {!u.email_verified && <Badge tone="warn">Unverified</Badge>}
      {u.age_range === "13-17" && <Badge>13–17</Badge>}
    </div>
  );
}

function UserActions({ u }: { u: AdminUserRow }) {
  const { user: me } = useAuth();
  const update = useUpdateUser();
  const isMe = me?.id === u.id;
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${u.username}`} loading={update.isPending}>
          {!update.isPending && <MoreHorizontal />}
        </Button>
      </MenuTrigger>
      <MenuContent>
        {isMe && <p className="px-3 py-1.5 text-xs text-muted">This is your account</p>}
        {u.is_active ? (
          <MenuItem danger onSelect={() => update.mutate({ id: u.id, is_active: false })}>
            <UserX />
            Deactivate
          </MenuItem>
        ) : (
          <MenuItem onSelect={() => update.mutate({ id: u.id, is_active: true })}>
            <UserCheck />
            Activate
          </MenuItem>
        )}
        {u.role === "admin" ? (
          <MenuItem onSelect={() => update.mutate({ id: u.id, role: "user" })}>
            <ShieldOff />
            Remove admin
          </MenuItem>
        ) : (
          <MenuItem onSelect={() => update.mutate({ id: u.id, role: "admin" })}>
            <ShieldCheck />
            Make admin
          </MenuItem>
        )}
      </MenuContent>
    </Menu>
  );
}
