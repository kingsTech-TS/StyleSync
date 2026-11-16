"use client";

import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/spinner";
import { errorMessage } from "@/lib/api/errors";
import type { SessionOut } from "@/lib/api/types";
import { useChatSessions, useDeleteSession } from "@/lib/queries/chat";
import { cn, timeAgo } from "@/lib/utils";

export function SessionList({ activeId, onNavigate }: { activeId?: string; onNavigate?: () => void }) {
  const { data, isLoading, isError } = useChatSessions();
  const [toDelete, setToDelete] = useState<SessionOut | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <h2 className="text-sm font-semibold">Chats</h2>
        <Button asChild size="sm" variant="secondary">
          <Link href="/chat" onClick={onNavigate}>
            <Plus />
            New chat
          </Link>
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {isLoading && (
          <div className="flex flex-col gap-2 px-2 pt-1">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        )}
        {isError && <p className="px-3 py-2 text-sm text-muted">Couldn&apos;t load your chats.</p>}
        {data && data.length === 0 && (
          <p className="px-3 py-2 text-sm text-muted">Your conversations with the stylist will show up here.</p>
        )}
        <ul className="flex flex-col gap-0.5">
          {data?.map((s) => (
            <li key={s.id} className="group relative">
              <Link
                href={`/chat/${s.id}`}
                onClick={onNavigate}
                aria-current={s.id === activeId ? "page" : undefined}
                className={cn(
                  "block rounded-2xl py-2.5 pr-10 pl-3 transition hover:bg-surface-2",
                  s.id === activeId && "bg-surface-2",
                )}
              >
                <span className="block truncate text-sm">{s.title}</span>
                <span className="block text-xs text-muted">{timeAgo(s.updated_at)}</span>
              </Link>
              <div className="absolute top-1/2 right-1.5 -translate-y-1/2">
                <Menu>
                  <MenuTrigger
                    aria-label={`Options for ${s.title}`}
                    className="grid size-8 place-items-center rounded-full text-muted opacity-100 transition hover:bg-surface-3 hover:text-ink lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100 lg:data-[state=open]:opacity-100"
                  >
                    <MoreHorizontal className="size-4" />
                  </MenuTrigger>
                  <MenuContent>
                    <MenuItem danger onSelect={() => setToDelete(s)}>
                      <Trash2 />
                      Delete chat
                    </MenuItem>
                  </MenuContent>
                </Menu>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <DeleteDialog session={toDelete} activeId={activeId} onClose={() => setToDelete(null)} />
    </div>
  );
}

function DeleteDialog({
  session,
  activeId,
  onClose,
}: {
  session: SessionOut | null;
  activeId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const del = useDeleteSession();
  return (
    <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
      <DialogContent title="Delete this chat?" description="The messages are removed. Outfits made in it stay in My outfits.">
        <div className="mt-4 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button
            variant="danger"
            loading={del.isPending}
            onClick={() =>
              session &&
              del.mutate(session.id, {
                onSuccess: () => {
                  onClose();
                  if (session.id === activeId) router.replace("/chat");
                },
                onError: (e) => toast.error(errorMessage(e)),
              })
            }
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
