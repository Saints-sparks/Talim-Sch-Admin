"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { PromotionAction, PromotionDecision } from "@/app/services/transit.service";
import type { ClassOption } from "@/hooks/transit/useTransitReference";
import { surface, text } from "@/components/transit/ui";
import { classNameById } from "@/components/transit/promotions/promotionUi";
import { actionTakesClass, actionsFor } from "@/components/transit/promotions/promotionActions";

/**
 * A decision as the wizard edits it: the student's name (the run does not
 * carry it), an action always set, and the target class as `""` when none.
 */
export interface DecisionDraft extends Omit<PromotionDecision, "toClassId" | "action"> {
  studentName: string;
  toClassId: string;
  action: PromotionAction;
}

/**
 * The editable table of promotion decisions: per student the action (Promote,
 * Repeat, Withdraw, and Graduate for a class at the school's top level), the
 * target class when the action moves them into one, and the target grade.
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
        "overflow-hidden rounded-xl border border-tl-line-soft",
        compact && "rounded-none border-0"
      )}
    >
      <div className="max-h-[430px] overflow-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className={cn("sticky top-0 z-10", surface.tableHead)}>
            <tr
              className={cn("border-b border-tl-line-soft text-left text-xs uppercase", text.muted)}
            >
              <th className="px-4 py-3 font-semibold">Student</th>
              <th className="px-4 py-3 font-semibold">From Class</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Target Class</th>
              <th className="px-4 py-3 font-semibold">Target Grade</th>
            </tr>
          </thead>
          <tbody className={cn("divide-y bg-tl-surface", surface.divide)}>
            {decisions.map((decision) => {
              const takesClass = actionTakesClass(decision.action);
              return (
                <tr key={decision.studentId}>
                  <td className={cn("px-4 py-3 font-medium", text.strong)}>
                    {decision.studentName}
                  </td>
                  <td className={cn("px-4 py-3", text.body)}>
                    {classNameById(classes, decision.fromClassId)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      aria-label={`Action for ${decision.studentName}`}
                      value={decision.action}
                      onChange={(event) => {
                        const action = event.target.value as PromotionAction;
                        onChange(decision.studentId, {
                          action,
                          repeatClass: action === "repeat",
                          ...(actionTakesClass(action)
                            ? {}
                            : { toClassId: "", targetGradeLevel: undefined }),
                        });
                      }}
                      className={cn("h-9 w-full rounded-lg px-2 text-sm", surface.input)}
                    >
                      {actionsFor(decision.fromClassId, classes).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {takesClass ? (
                      <select
                        aria-label={`Target class for ${decision.studentName}`}
                        value={decision.toClassId}
                        onChange={(event) =>
                          onChange(decision.studentId, { toClassId: event.target.value })
                        }
                        className={cn("h-9 w-full rounded-lg px-2 text-sm", surface.input)}
                      >
                        <option value="">
                          {decision.action === "repeat" ? "Same class" : "Select class"}
                        </option>
                        {classes.map((option) => (
                          <option key={option._id} value={option._id}>
                            {classNameById(classes, option._id)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={cn("text-sm", text.muted)}>
                        {decision.action === "graduate"
                          ? "Leaves as a graduate"
                          : "Leaves the school"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {takesClass ? (
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
                    ) : (
                      <span className={cn("text-sm", text.muted)}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
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
