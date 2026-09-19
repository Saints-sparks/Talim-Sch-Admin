import { cn } from "@/lib/utils";
import { getAcademicYearLabel, type AcademicYearResponse } from "@/app/services/academic.service";
import type { ClassOption } from "@/hooks/transit/useTransitReference";
import { surface, text } from "@/components/transit/ui";
import { DecisionEditor, type DecisionDraft } from "@/components/transit/promotions/DecisionEditor";

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
  academicYears,
  fromAcademicYearId,
  toAcademicYearId,
}: {
  decisionCount: number;
  academicYears: AcademicYearResponse[];
  fromAcademicYearId: string;
  toAcademicYearId: string;
}) {
  return (
    <div className="space-y-4">
      <div className={cn("rounded-xl p-5", surface.inset)}>
        <p className={cn("text-lg font-semibold", text.strong)}>Submit promotion run</p>
        <p className={cn("mt-1 text-sm", text.muted)}>
          {decisionCount} decisions, from {yearLabel(academicYears, fromAcademicYearId)} to{" "}
          {yearLabel(academicYears, toAcademicYearId)}
        </p>
      </div>
      <p className={cn("text-sm", text.body)}>
        The run is validated as it is created, and nothing moves until you commit it. Existing
        enrollment records are kept as history.
      </p>
    </div>
  );
}
