import { cn } from "@/lib/utils";
import { getAcademicYearLabel, type AcademicYearResponse } from "@/app/services/academic.service";
import type { ClassOption } from "@/hooks/transit/useTransitReference";
import { surface, text } from "@/components/transit/ui";
import { DecisionEditor, type DecisionDraft } from "@/components/transit/promotions/DecisionEditor";
import { actionCounts } from "@/components/transit/promotions/promotionActions";

/**
 * How many students each action covers ("12 promote · 2 repeat · 30 graduate").
 *
 * @param props - The decisions.
 * @param props.decisions - The drafts.
 * @returns The counts.
 */
export function ActionCounts({ decisions }: { decisions: DecisionDraft[] }) {
  const counts = actionCounts(decisions);
  if (!counts.length) return null;
  return (
    <ul aria-label="Decisions per action" className="mt-2 flex flex-wrap gap-2">
      {counts.map((entry) => (
        <li
          key={entry.action}
          className="inline-flex items-center gap-1.5 rounded-full bg-tl-surface px-3 py-1 text-xs font-bold text-tl-ink"
        >
          <span className="tabular-nums">{entry.count}</span> {entry.label}
        </li>
      ))}
    </ul>
  );
}

/** Step 3: the decisions, editable once more before submitting. */
export function ReviewStep({
  decisions,
  classes,
  onChange,
}: {
  decisions: DecisionDraft[];
  classes: ClassOption[];
  onChange: (studentId: string, patch: Partial<DecisionDraft>) => void;
}) {
  return (
    <div className="space-y-4">
      <div className={cn("rounded-xl px-4 py-3", surface.inset)}>
        <p className={cn("text-sm font-semibold", text.strong)}>Review Decisions</p>
        <p className={cn("text-sm", text.muted)}>{decisions.length} total student decisions</p>
        <ActionCounts decisions={decisions} />
      </div>
      <DecisionEditor decisions={decisions} classes={classes} onChange={onChange} />
    </div>
  );
}

/** The label of a year picked by id; falls back to the id when it is not in the list. */
function yearLabel(years: AcademicYearResponse[], id: string): string {
  return getAcademicYearLabel(years.find((year) => year._id === id) ?? { _id: id });
}

/** Step 4: the last look before the run is created. */
export function SubmitStep({
  decisionCount,
  decisions,
  academicYears,
  fromAcademicYearId,
  toAcademicYearId,
}: {
  decisionCount: number;
  /** The decisions, for the per-action counts. */
  decisions?: DecisionDraft[];
  academicYears: AcademicYearResponse[];
  fromAcademicYearId: string;
  toAcademicYearId: string;
}) {
  return (
    <div className="space-y-4">
      <div className={cn("rounded-[22px] p-5", surface.inset)}>
        <p className={cn("text-lg font-semibold", text.strong)}>Submit promotion run</p>
        <p className={cn("mt-1 text-sm", text.muted)}>
          {decisionCount} decisions, from {yearLabel(academicYears, fromAcademicYearId)} to{" "}
          {yearLabel(academicYears, toAcademicYearId)}
        </p>
        {decisions ? <ActionCounts decisions={decisions} /> : null}
      </div>
      <p className={cn("text-sm", text.body)}>
        The run is validated as it is created, and nothing moves until you commit it. Existing
        enrollment records are kept as history. Graduates and withdrawn students leave the roster
        when the run is committed and keep a read-only sign-in to their results.
      </p>
    </div>
  );
}
