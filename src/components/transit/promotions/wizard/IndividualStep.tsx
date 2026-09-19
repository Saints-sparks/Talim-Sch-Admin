import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/apiError";
import { refId, type StudentEnrollment } from "@/app/services/transit.service";
import type { ClassOption } from "@/hooks/transit/useTransitReference";
import { SkeletonRows, surface, text } from "@/components/transit/ui";
import { classNameById } from "@/components/transit/promotions/promotionUi";
import { DecisionEditor, type DecisionDraft } from "@/components/transit/promotions/DecisionEditor";
import { enrollmentName } from "./promotionWizard";

interface IndividualStepProps {
  classes: ClassOption[];
  enrollments: StudentEnrollment[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  selectedIds: Set<string>;
  decisions: DecisionDraft[];
  onToggle: (enrollment: StudentEnrollment, checked: boolean) => void;
  onChange: (studentId: string, patch: Partial<DecisionDraft>) => void;
}

/** Step 2 (individual mode): tick students, then set each one's target class. */
export function IndividualStep({
  classes,
  enrollments,
  isLoading,
  isError,
  error,
  selectedIds,
  decisions,
  onToggle,
  onChange,
}: IndividualStepProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <div className="rounded-xl border border-gray-100 dark:border-slate-800">
        <div
          className={cn(
            "border-b border-gray-100 dark:border-slate-800 px-4 py-3 text-sm font-semibold",
            text.strong,
          )}
        >
          Active enrollments
        </div>
        <div className={cn("max-h-[430px] overflow-y-auto divide-y", surface.divide)}>
          {isLoading ? (
            <div className="p-4">
              <SkeletonRows count={3} height="h-10" />
            </div>
          ) : isError ? (
            <p className="p-4 text-sm text-rose-600 dark:text-rose-400">
              {getErrorMessage(error, "Couldn't load enrollments.")}
            </p>
          ) : enrollments.length === 0 ? (
            <p className={cn("p-4 text-sm", text.muted)}>No active enrollments in the source academic year.</p>
          ) : (
            enrollments.map((enrollment) => {
              const studentId = refId(enrollment.studentId);
              return (
                <label
                  key={enrollment._id}
                  className="flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(studentId)}
                    onChange={(event) => onToggle(enrollment, event.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>
                    <span className={cn("block text-sm font-medium", text.strong)}>
                      {enrollmentName(enrollment)}
                    </span>
                    <span className={cn("text-xs", text.muted)}>
                      {classNameById(classes, refId(enrollment.classId))}
                    </span>
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>
      <DecisionEditor decisions={decisions} classes={classes} onChange={onChange} />
    </div>
  );
}
