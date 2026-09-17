"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Info } from "lucide-react";
import type { SearchSchoolResult } from "@/app/services/transit.service";
import {
  dedupeAcademicYearsByName,
  getAcademicYearLabel,
  type AcademicYearResponse,
} from "@/app/services/academic.service";
import { useAcademicYears } from "@/hooks/queries/reference";
import { useCreateTransfer } from "@/hooks/transit/useTransfers";
import { useClassOptions, type ClassOption } from "@/hooks/transit/useTransitReference";
import { toast } from "@/components/CustomToast";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { SkeletonRows, surface, text } from "@/components/transit/ui";
import { TransferWizardShell } from "@/components/transit/TransferWizard";
import { SchoolPicker } from "@/components/transit/SchoolPicker";
import { ReviewRow } from "@/components/transit/ReviewRow";

/** The wizard's steps, in order. */
const STEPS = ["Find Current School", "Identify Student", "Class & Year", "Review", "Confirm"];

/** The API validates `studentId` with `@IsMongoId()`; mirror that before submitting. */
const TALIM_ID = /^[0-9a-fA-F]{24}$/;

/** A choice grid — one button per class or academic year. */
function OptionGrid<T extends { _id: string }>({
  label,
  options,
  selectedId,
  onSelect,
  renderOption,
  emptyMessage,
  loading,
}: {
  label: string;
  options: T[];
  selectedId?: string;
  onSelect: (option: T) => void;
  renderOption: (option: T) => React.ReactNode;
  emptyMessage: string;
  loading: boolean;
}) {
  return (
    <div>
      <span className={cn("mb-2 block text-xs font-medium", text.muted)}>
        {label} <span className="text-red-500">*</span>
      </span>
      {loading ? (
        <SkeletonRows count={2} height="h-11" />
      ) : options.length === 0 ? (
        <p className={cn("text-sm", text.muted)}>{emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {options.map((option) => (
            <button
              key={option._id}
              type="button"
              onClick={() => onSelect(option)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                selectedId === option._id
                  ? "border-[#003366] dark:border-sky-500 bg-[#003366]/5 dark:bg-sky-500/10 font-medium text-[#003366] dark:text-sky-300"
                  : cn(
                      "border-gray-200 dark:border-slate-700 hover:border-[#003366]/30 dark:hover:border-sky-500/40",
                      text.body
                    )
              )}
            >
              {renderOption(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Pull transfer: this school asks another Talim school to release one of its
 * students.
 *
 * The student is identified by their Talim ID rather than picked from a list:
 * the API deliberately exposes no way to browse another school's students, and
 * releases nothing about this one until the source school approves. So this
 * wizard collects the id the family or the current school provides, and shows
 * no academic detail until the transfer reaches the detail page released.
 */
export default function TargetTransferWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [sourceSchool, setSourceSchool] = useState<SearchSchoolResult | null>(null);
  const [studentId, setStudentId] = useState("");
  const [selectedClass, setSelectedClass] = useState<ClassOption | null>(null);
  const [selectedYear, setSelectedYear] = useState<AcademicYearResponse | null>(null);
  const [reason, setReason] = useState("");

  const { classes, isLoading: classesLoading } = useClassOptions();
  const years = useAcademicYears();
  const createTransfer = useCreateTransfer();

  const academicYears = useMemo(
    () => dedupeAcademicYearsByName(years.data ?? []),
    [years.data]
  );

  const trimmedId = studentId.trim();
  const idLooksValid = TALIM_ID.test(trimmedId);
  const idError = trimmedId && !idLooksValid ? "That doesn't look like a Talim student ID." : "";

  async function submit() {
    if (!idLooksValid || !selectedClass || !selectedYear) return;
    try {
      await createTransfer.mutateAsync({
        studentId: trimmedId,
        targetClassId: selectedClass._id,
        targetAcademicYearId: selectedYear._id,
        reason: reason.trim() || undefined,
        initiatedBy: "target",
      });
      toast.success("Pull request submitted");
      router.push("/transit/transfers");
    } catch (err) {
      logger.error("transit", "pull transfer submit failed", err);
      toast.error(getErrorMessage(err, "Couldn't submit the pull request"));
    }
  }

  const ready = Boolean(idLooksValid && selectedClass && selectedYear);
  const canContinue = [Boolean(sourceSchool), idLooksValid, ready, true, ready][step];

  return (
    <TransferWizardShell
      title="Pull Transfer"
      description="Request a student from another Talim school to join your school"
      steps={STEPS}
      step={step}
      onStepChange={setStep}
      canContinue={Boolean(canContinue)}
      submitting={createTransfer.isPending}
      submitLabel="Submit Pull Request"
      onSubmit={submit}
      onExit={() => router.push("/transit/transfers")}
    >
      {step === 0 && (
        <SchoolPicker
          placeholder="Search for the student's current school..."
          selected={sourceSchool}
          onSelect={setSourceSchool}
        />
      )}

      {step === 1 && (
        <div className="space-y-4">
          <p className={cn("flex items-start gap-2 rounded-lg p-3 text-sm", surface.inset, text.body)}>
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              A student&apos;s record stays private to {sourceSchool?.name ?? "their school"} until
              that school releases them, so we can&apos;t list their students here. Ask the family
              or the school for the student&apos;s Talim ID.
            </span>
          </p>
          <div>
            <label htmlFor="pull-student-id" className={cn("block text-xs font-medium mb-2", text.muted)}>
              Student&apos;s Talim ID <span className="text-red-500">*</span>
            </label>
            <input
              id="pull-student-id"
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              placeholder="e.g. 65f1c0a9b2d4e8f0a1b2c3d4"
              aria-invalid={Boolean(idError)}
              aria-describedby={idError ? "pull-student-id-error" : undefined}
              className={cn(
                "w-full px-3 py-2.5 text-sm rounded-lg font-mono",
                surface.input,
                idError && "border-red-400 dark:border-red-500"
              )}
            />
            {idError && (
              <p id="pull-student-id-error" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                {idError}
              </p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <OptionGrid
            label="Class to enrol the student in"
            options={classes}
            selectedId={selectedClass?._id}
            onSelect={setSelectedClass}
            loading={classesLoading}
            emptyMessage="No classes in this school yet."
            renderOption={(option) => (
              <>
                <span className="block font-medium">{option.name}</span>
                {option.gradeLevel && (
                  <span className="block text-xs opacity-70">{option.gradeLevel}</span>
                )}
              </>
            )}
          />
          <OptionGrid
            label="Academic Year"
            options={academicYears}
            selectedId={selectedYear?._id}
            onSelect={setSelectedYear}
            loading={years.isLoading}
            emptyMessage="No academic years set up yet."
            renderOption={(option) => getAcademicYearLabel(option)}
          />
          <div>
            <label htmlFor="pull-reason" className={cn("block text-xs font-medium mb-2", text.muted)}>
              Reason for Transfer <span className="font-normal">(optional)</span>
            </label>
            <textarea
              id="pull-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="Why are you requesting this student?"
              className={cn("w-full px-3 py-2.5 text-sm rounded-lg resize-none", surface.input)}
            />
          </div>
        </div>
      )}

      {step === 3 && sourceSchool && selectedClass && selectedYear && (
        <div className="space-y-4">
          <div className="rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-slate-800/50">
            <ReviewRow label="Student's Talim ID" value={<span className="font-mono">{trimmedId}</span>} />
            <ReviewRow label="Current School" value={sourceSchool.name} />
            <ReviewRow
              label="Enrol Into"
              value={
                selectedClass.gradeLevel
                  ? `${selectedClass.name} (${selectedClass.gradeLevel})`
                  : selectedClass.name
              }
            />
            <ReviewRow label="Academic Year" value={getAcademicYearLabel(selectedYear)} />
            <ReviewRow label="Transfer Type" value="Pull (target initiated)" />
            {reason && <ReviewRow label="Reason" value={reason} />}
          </div>
          <p className={cn("text-sm", text.muted)}>
            {sourceSchool.name} is asked to release the student. Their record reaches you only once
            that school approves; you then approve and accept to complete the transfer.
          </p>
        </div>
      )}

      {step === 4 && (
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-500/15">
            <Check className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className={cn("text-lg font-semibold", text.strong)}>Ready to Submit</h3>
            <p className={cn("text-sm mt-1", text.muted)}>
              This pull request goes to {sourceSchool?.name} for approval
            </p>
          </div>
        </div>
      )}
    </TransferWizardShell>
  );
}
