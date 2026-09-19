import { cn } from "@/lib/utils";
import type { ClassOption } from "@/hooks/transit/useTransitReference";
import { SelectField, text } from "@/components/transit/ui";
import { classNameById } from "@/components/transit/promotions/promotionUi";
import { DecisionEditor, type DecisionDraft } from "@/components/transit/promotions/DecisionEditor";

interface BulkStepProps {
  classes: ClassOption[];
  sourceClassId: string;
  targetClassId: string;
  decisions: DecisionDraft[];
  isLoading: boolean;
  onSourceChange: (classId: string) => void;
  onTargetChange: (classId: string) => void;
  onChange: (studentId: string, patch: Partial<DecisionDraft>) => void;
}

/** Step 2 (bulk mode): pick a source and a target class and preview the decisions. */
export function BulkStep({
  classes,
  sourceClassId,
  targetClassId,
  decisions,
  isLoading,
  onSourceChange,
  onTargetChange,
  onChange,
}: BulkStepProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="Source Class" required value={sourceClassId} onChange={onSourceChange}>
          <option value="">Select source class</option>
          {classes.map((option) => (
            <option key={option._id} value={option._id}>
              {classNameById(classes, option._id)}
            </option>
          ))}
        </SelectField>
        <SelectField label="Target Class" required value={targetClassId} onChange={onTargetChange}>
          <option value="">Select target class</option>
          {classes.map((option) => (
            <option key={option._id} value={option._id}>
              {classNameById(classes, option._id)}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="rounded-xl border border-gray-100 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 px-4 py-3">
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
