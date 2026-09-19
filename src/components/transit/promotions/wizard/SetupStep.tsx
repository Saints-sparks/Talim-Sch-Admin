import { cn } from "@/lib/utils";
import { getAcademicYearLabel, type AcademicYearResponse, type TermResponse } from "@/app/services/academic.service";
import { SelectField, text } from "@/components/transit/ui";
import type { Mode } from "./promotionWizard";

const MODES: ReadonlyArray<{ label: string; value: Mode }> = [
  { label: "Individual Students", value: "individual" },
  { label: "Bulk Class Promotion", value: "bulk" },
];

interface SetupStepProps {
  academicYears: AcademicYearResponse[];
  terms: TermResponse[];
  fromAcademicYearId: string;
  toAcademicYearId: string;
  targetTermId: string;
  mode: Mode;
  onFromChange: (id: string) => void;
  onToChange: (id: string) => void;
  onTermChange: (id: string) => void;
  onModeChange: (mode: Mode) => void;
}

/** Step 1: source year, target year, optional target term and the mode. */
export function SetupStep({
  academicYears,
  terms,
  fromAcademicYearId,
  toAcademicYearId,
  targetTermId,
  mode,
  onFromChange,
  onToChange,
  onTermChange,
  onModeChange,
}: SetupStepProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <SelectField label="From Academic Year" required value={fromAcademicYearId} onChange={onFromChange}>
        <option value="">Select source year</option>
        {academicYears.map((year) => (
          <option key={year._id} value={year._id}>
            {getAcademicYearLabel(year)}
          </option>
        ))}
      </SelectField>
      <SelectField label="To Academic Year" required value={toAcademicYearId} onChange={onToChange}>
        <option value="">Select target year</option>
        {academicYears
          .filter((year) => year._id !== fromAcademicYearId)
          .map((year) => (
            <option key={year._id} value={year._id}>
              {getAcademicYearLabel(year)}
            </option>
          ))}
      </SelectField>
      <SelectField
        label="Target Term (optional)"
        value={targetTermId}
        onChange={onTermChange}
        disabled={!toAcademicYearId}
      >
        <option value="">{toAcademicYearId ? "No specific term" : "Pick a target year first"}</option>
        {terms
          .filter((term) => term.academicYearId === toAcademicYearId)
          .map((term) => (
            <option key={term._id} value={term._id}>
              {term.name}
            </option>
          ))}
      </SelectField>
      <div>
        <span className={cn("mb-1.5 block text-xs font-semibold uppercase", text.muted)}>Mode</span>
        <div className="grid grid-cols-2 gap-3">
          {MODES.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onModeChange(item.value)}
              className={cn(
                "rounded-lg border px-4 py-3 text-left text-sm font-medium transition-colors",
                mode === item.value
                  ? "border-[#003366] dark:border-sky-500 bg-[#003366]/5 dark:bg-sky-500/10 text-[#003366] dark:text-sky-300"
                  : cn(
                      "border-gray-200 dark:border-slate-700 hover:border-[#003366]/40 dark:hover:border-sky-500/40",
                      text.strong,
                    ),
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
