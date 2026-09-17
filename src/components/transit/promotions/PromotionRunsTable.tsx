"use client";

import React from "react";
import { Eye, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { canCommit, isRunEditable, refLabel, type PromotionRun } from "@/app/services/transit.service";
import { Permission } from "@/lib/permissions";
import { usePermissions } from "@/hooks/usePermissions";
import { surface, text } from "@/components/transit/ui";
import { formatTransitDate } from "@/components/transit/transferStatus";
import {
  ActionButton,
  IconButton,
  RunStatusBadge,
} from "@/components/transit/promotions/promotionUi";

/** Which run, and which action, is currently in flight. */
export type RunActionKey = string;

/** Builds the key that marks one run's action as pending. */
export function runActionKey(action: string, runId: string): RunActionKey {
  return `${action}:${runId}`;
}

/**
 * The promotion runs table.
 *
 * Validate, commit and cancel are behind `manage:transit`; a run that cannot
 * take an action keeps the button disabled rather than hiding it, so the row's
 * shape stays stable as a run moves through its statuses.
 */
export function PromotionRunsTable({
  runs,
  pendingKey,
  onView,
  onValidate,
  onCommit,
  onCancel,
}: {
  runs: PromotionRun[];
  pendingKey: RunActionKey;
  onView: (run: PromotionRun) => void;
  onValidate: (run: PromotionRun) => void;
  onCommit: (run: PromotionRun) => void;
  onCancel: (run: PromotionRun) => void;
}) {
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(Permission.MANAGE_TRANSIT);
  const busy = Boolean(pendingKey);

  return (
    <div className={cn("overflow-hidden rounded-xl shadow-sm", surface.card)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className={cn("text-left text-xs uppercase", surface.tableHead, text.muted)}>
            <tr>
              <th className="px-4 py-3 font-semibold">Run</th>
              <th className="px-4 py-3 font-semibold">From Year</th>
              <th className="px-4 py-3 font-semibold">To Year</th>
              <th className="px-4 py-3 font-semibold">Students</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className={cn("divide-y", surface.divide)}>
            {runs.map((run) => {
              const editable = isRunEditable(run);
              return (
                <tr
                  key={run._id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60"
                >
                  <td className={cn("px-4 py-4 font-mono text-xs", text.strong)}>
                    {run._id.slice(-10)}
                  </td>
                  <td className={cn("px-4 py-4", text.body)}>{refLabel(run.fromAcademicYearId)}</td>
                  <td className={cn("px-4 py-4", text.body)}>{refLabel(run.toAcademicYearId)}</td>
                  <td className={cn("px-4 py-4", text.body)}>{run.decisions.length}</td>
                  <td className="px-4 py-4">
                    <RunStatusBadge status={run.status} />
                  </td>
                  <td className={cn("px-4 py-4", text.muted)}>{formatTransitDate(run.createdAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <IconButton label="View" onClick={() => onView(run)} disabled={busy}>
                        <Eye className="h-4 w-4" />
                      </IconButton>
                      {canManage && (
                        <>
                          <ActionButton
                            onClick={() => onValidate(run)}
                            disabled={!editable || busy}
                            loading={pendingKey === runActionKey("validate", run._id)}
                          >
                            Validate
                          </ActionButton>
                          <ActionButton
                            tone="green"
                            onClick={() => onCommit(run)}
                            disabled={!canCommit(run) || busy}
                            loading={pendingKey === runActionKey("commit", run._id)}
                          >
                            Commit
                          </ActionButton>
                          <IconButton
                            label="Cancel run"
                            danger
                            onClick={() => onCancel(run)}
                            disabled={!editable || busy}
                            loading={pendingKey === runActionKey("cancel", run._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
