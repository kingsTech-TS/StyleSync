"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/input";
import { Chip } from "@/components/ui/misc";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { ReportTarget } from "@/lib/api/types";

const REASONS = ["Spam", "Harassment or hate", "Nudity or sexual content", "Stolen content", "Something else"];

const LABEL: Record<ReportTarget, string> = { outfit: "outfit", comment: "comment", user: "account" };

/** Controlled report dialog for an outfit, comment or user. */
export function ReportDialog({
  open,
  onOpenChange,
  targetType,
  targetId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: ReportTarget;
  targetId: string;
}) {
  const [preset, setPreset] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const reason = [preset, details.trim()].filter(Boolean).join(": ");

  const report = useMutation({
    mutationFn: () => api("/social/reports", { body: { target_type: targetType, target_id: targetId, reason } }),
    onSuccess: () => {
      toast.success("Thanks. A moderator will take a look.");
      onOpenChange(false);
      setPreset(null);
      setDetails("");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const valid = reason.length >= 3 && reason.length <= 300;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={`Report this ${LABEL[targetType]}`} description="Reports are private. The person isn't told who sent it.">
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) report.mutate();
          }}
        >
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <Chip key={r} selected={preset === r} onClick={() => setPreset(preset === r ? null : r)}>
                {r}
              </Chip>
            ))}
          </div>
          <Field label="Details" hint={`${details.length}/250`}>
            {(id, d) => (
              <Textarea
                id={id}
                aria-describedby={d}
                maxLength={250}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Anything that helps us understand"
              />
            )}
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" disabled={!valid} loading={report.isPending}>
              Send report
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
