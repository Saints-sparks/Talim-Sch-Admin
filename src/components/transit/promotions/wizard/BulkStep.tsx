import { cn } from "@/lib/utils";
import type { ClassOption } from "@/hooks/transit/useTransitReference";
import { SelectField, text } from "@/components/transit/ui";
import { classNameById } from "@/components/transit/promotions/promotionUi";
import { DecisionEditor, type DecisionDraft } from "@/components/transit/promotions/DecisionEditor";
import { canGraduateFrom } from "@/components/transit/promotions/promotionActions";
import type { BulkAction } from "./promotionWizard";

interface BulkStepProps {
  classes: ClassOption[];
  sourceClassId: string;
  targetClassId: string;
  /** Move the class up, or graduate it (offered for the top level). */
  bulkAction?: BulkAction;
  decisions: DecisionDraft[];
  isLoading: boolean;
  onSourceChange: (classId: string) => void;
  onTargetChange: (classId: string) => void;
  onBulkActionChange?: (action: BulkAction) => void;
  onChange: (studentId: string, patch: Partial<DecisionDraft>) => void;
}

/**
 * Step 2 (bulk mode): pick a source class, then a target class or, for a
 * class at the school's top level, Graduate the whole class; preview the
 * decisions (each still editable).
 */
export function BulkStep({
  classes,
  sourceClassId,
  targetClassId,
  bulkAction = "promote",
  decisions,
  isLoading,
  onSourceChange,
  onTargetChange,
  onBulkActionChange,
  onChange,
}: BulkStepProps) {
  const graduateOffered = Boolean(sourceClassId) && canGraduateFrom(sourceClassId, classes);
  return (
    <div className="space-y-5">
      {graduateOffered && onBulkActionChange ? (
        <fieldset className="flex flex-wrap items-center gap-4">
          <legend className={cn("mb-2 text-sm font-semibold", text.strong)}>
            What happens to this class
          </legend>
          {(
            [
              ["promote", "Move up to a class"],
              ["graduate", "Graduate the class"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className={cn("flex items-center gap-2 text-sm", text.body)}>
              <input
                type="radio"
                name="bulk-action"
                value={value}
                checked={bulkAction === value}
                onChange={() => onBulkActionChange(value)}
                className="h-4 w-4"
              />
              {label}
            </label>
          ))}
        </fieldset>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="Source Class" required value={sourceClassId} onChange={onSourceChange}>
          <option value="">Select source class</option>
          {classes.map((option) => (
            <option key={option._id} value={option._id}>
              {classNameById(classes, option._id)}
            </option>
          ))}
        </SelectField>
        {bulkAction === "graduate" && graduateOffered ? (
          <p className={cn("self-end pb-2 text-sm", text.muted)}>
            Every student in this class graduates and leaves the roster when the run is committed.
          </p>
        ) : (
          <SelectField
            label="Target Class"
            required
            value={targetClassId}
            onChange={onTargetChange}
          >
            <option value="">Select target class</option>
            {classes.map((option) => (
              <option key={option._id} value={option._id}>
                {classNameById(classes, option._id)}
              </option>
            ))}
          </SelectField>
        )}
      </div>
      <div className="rounded-xl border border-tl-line-soft">
        <div className="flex items-center justify-between border-b border-tl-line-soft px-4 py-3">
          <p className={cn("text-sm font-semibold", text.strong)}>Preview decisions</p>
          <p className={cn("text-xs", text.muted)}>
            {isLoading ? "Loading students…" : `${decisions.length} students loaded`}
          </p>
        </div>
        <DecisionEditor decisions={decisions} classes={classes} onChange={onChange} compact />
      </div>
    </div>
  );
}
