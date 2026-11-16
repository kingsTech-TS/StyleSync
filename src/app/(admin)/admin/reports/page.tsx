"use client";

import { Check, Flag, MessageSquareOff, MessageSquareText, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/input";
import { Badge, EmptyState, ErrorNote, PageHeader, Tabs, TabsList, TabsTrigger } from "@/components/ui/misc";
import { Skeleton } from "@/components/ui/spinner";
import { errorMessage } from "@/lib/api/errors";
import type { AdminReport } from "@/lib/api/types";
import { useModerateComment, useReports, useResolveReport } from "@/lib/queries/admin";
import { timeAgo } from "@/lib/utils";

type Status = "open" | "resolved";

export default function AdminReports() {
  const [status, setStatus] = useState<Status>("open");
  const { data, isLoading, error } = useReports(status);
  const [resolving, setResolving] = useState<AdminReport | null>(null);

  return (
    <>
      <PageHeader
        title="Reports"
        description="Reports on teen accounts' content are listed first, then oldest first."
        actions={
          <Tabs value={status} onValueChange={(v) => setStatus(v as Status)}>
            <TabsList>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />
      {error && <ErrorNote>{errorMessage(error)}</ErrorNote>}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState
          icon={<Flag />}
          title={status === "open" ? "No open reports" : "No resolved reports yet"}
          description={status === "open" ? "New reports on outfits, comments and users show up here." : undefined}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((r) => (
            <ReportRow key={r.id} report={r} onResolve={() => setResolving(r)} />
          ))}
        </ul>
      )}
      <ResolveDialog report={resolving} onClose={() => setResolving(null)} />
    </>
  );
}

function ReportRow({ report: r, onResolve }: { report: AdminReport; onResolve: () => void }) {
  const minor = r.involves_minor === true;
  const note = typeof r.resolution_note === "string" ? r.resolution_note : null;
  return (
    <li className="rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={r.target_type === "user" ? "accent" : "neutral"}>{targetLabel(r.target_type)}</Badge>
        {minor && <Badge tone="warn">Teen account</Badge>}
        <span className="text-xs text-muted">{timeAgo(r.created_at)}</span>
        <span className="ml-auto font-mono text-[11px] text-faint">{r.target_id}</span>
      </div>
      <p className="mt-3 text-[15px]">&ldquo;{r.reason}&rdquo;</p>
      {note && <p className="mt-2 text-sm text-muted">Resolution note: {note}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {r.target_type === "outfit" && (
          <Button asChild variant="secondary" size="sm">
            <Link href={`/outfits/${r.target_id}`}>Open outfit</Link>
          </Button>
        )}
        {r.target_type === "comment" && <CommentActions commentId={r.target_id} />}
        {r.status === "open" && (
          <Button size="sm" onClick={onResolve} className="sm:ml-auto">
            <Check />
            Resolve
          </Button>
        )}
      </div>
    </li>
  );
}

function targetLabel(t: string) {
  if (t === "outfit") return "Outfit";
  if (t === "comment") return "Comment";
  if (t === "user") return "User";
  return t;
}

function CommentActions({ commentId }: { commentId: string }) {
  const moderate = useModerateComment();
  const pending = moderate.isPending ? moderate.variables?.status : null;
  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        loading={pending === "hidden"}
        onClick={() => moderate.mutate({ id: commentId, status: "hidden" })}
      >
        <MessageSquareOff />
        Hide comment
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="text-danger"
        loading={pending === "removed"}
        onClick={() => moderate.mutate({ id: commentId, status: "removed" })}
      >
        <Trash2 />
        Remove
      </Button>
      <Button
        variant="ghost"
        size="sm"
        loading={pending === "visible"}
        onClick={() => moderate.mutate({ id: commentId, status: "visible" })}
      >
        <MessageSquareText />
        Restore
      </Button>
    </>
  );
}

function ResolveDialog({ report, onClose }: { report: AdminReport | null; onClose: () => void }) {
  const [note, setNote] = useState("");
  const resolve = useResolveReport();
  return (
    <Dialog
      open={!!report}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setNote("");
        }
      }}
    >
      {report && (
        <DialogContent title="Resolve report" description="Add a note for other admins if it helps. It's optional.">
          <Field label="Note" hint={`${note.length}/300`}>
            {(id, d) => (
              <Textarea id={id} aria-describedby={d} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
            )}
          </Field>
          <div className="flex justify-end gap-2 pt-5">
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              loading={resolve.isPending}
              onClick={() =>
                resolve.mutate(
                  { id: report.id, note: note.trim() },
                  {
                    onSuccess: () => {
                      setNote("");
                      onClose();
                    },
                  },
                )
              }
            >
              Resolve
            </Button>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
