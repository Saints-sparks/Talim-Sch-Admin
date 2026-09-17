"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { PromotionDecision } from "@/app/services/transit.service";
import type { ClassOption } from "@/hooks/transit/useTransitReference";
import { surface, text } from "@/components/transit/ui";
import { classNameById } from "@/components/transit/promotions/promotionUi";

/** A decision plus the student's name, which the run itself does not carry. */
export interface DecisionDraft extends PromotionDecision {
  studentName: string;
}

/**
 * The editable table of promotion decisions.
 *
 * Scrolls inside its own box with a sticky head, so a class of forty students
 * never pushes the wizard's footer off the screen.
 */
export function DecisionEditor({
  decisions,
  classes,
  onChange,
  compact,
}: {
  decisions: DecisionDraft[];
  classes: ClassOption[];
  onChange: (studentId: string, patch: Partial<DecisionDraft>) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-gray-100 dark:border-slate-800",
        compact && "rounded-none border-0"
      )}
    >
      <div className="max-h-[430px] overflow-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className={cn("sticky top-0 z-10", surface.tableHead)}>
            <tr
              className={cn(
                "border-b border-gray-100 dark:border-slate-800 text-left text-xs uppercase",
                text.muted
              )}
            >
              <th className="px-4 py-3 font-semibold">Student</th>
              <th className="px-4 py-3 font-semibold">From Class</th>
              <th className="px-4 py-3 font-semibold">Target Class</th>
              <th className="px-4 py-3 font-semibold">Target Grade</th>
              <th className="px-4 py-3 text-center font-semibold">Repeat</th>
            </tr>
          </thead>
          <tbody
            className={cn("divide-y bg-white dark:bg-slate-900", surface.divide)}
          >
            {decisions.map((decision) => (
              <tr key={decision.studentId}>
                <td className={cn("px-4 py-3 font-medium", text.strong)}>{decision.studentName}</td>
                <td className={cn("px-4 py-3", text.body)}>
                  {classNameById(classes, decision.fromClassId)}
                </td>
                <td className="px-4 py-3">
                  <select
                    aria-label={`Target class for ${decision.studentName}`}
                    value={decision.toClassId}
                    onChange={(event) =>
                      onChange(decision.studentId, { toClassId: event.target.value })
                    }
                    className={cn("h-9 w-full rounded-lg px-2 text-sm", surface.input)}
                  >
                    <option value="">Select class</option>
                    {classes.map((option) => (
                      <option key={option._id} value={option._id}>
                        {classNameById(classes, option._id)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    aria-label={`Target grade level for ${decision.studentName}`}
                    value={decision.targetGradeLevel ?? ""}
                    onChange={(event) =>
                      onChange(decision.studentId, {
                        targetGradeLevel: event.target.value || undefined,
                      })
                    }
                    placeholder="Optional"
                    className={cn("h-9 w-full rounded-lg px-2 text-sm", surface.input)}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    aria-label={`${decision.studentName} repeats their class`}
                    checked={Boolean(decision.repeatClass)}
                    onChange={(event) =>
                      onChange(decision.studentId, { repeatClass: event.target.checked })
                    }
                    className="h-4 w-4"
                  />
                </td>
              </tr>
            ))}
            {!decisions.length && (
              <tr>
                <td colSpan={5} className={cn("px-4 py-10 text-center text-sm", text.muted)}>
                  No student decisions selected yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
