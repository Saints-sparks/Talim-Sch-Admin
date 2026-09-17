"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiCheck, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { toast } from "@/components/CustomToast";
import { ReviewStep } from "@/components/fees/assign/ReviewStep";
import { SelectClassesStep } from "@/components/fees/assign/SelectClassesStep";
import { SelectFeeStep } from "@/components/fees/assign/SelectFeeStep";
import { SetAmountStep } from "@/components/fees/assign/SetAmountStep";
import { StepIndicator } from "@/components/fees/assign/StepIndicator";
import { SuccessStep } from "@/components/fees/assign/SuccessStep";
import { refId, refName, totalCapacity } from "@/components/fees/formatters";
import type { FeeClass } from "@/components/fees/types";
import {
  headingClass,
  mutedTextClass,
  pageClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/fees/ui";
import { PageSkeleton } from "@/components/ui/loading";
import { ASSIGN_STEPS, buildAssignPayload, useAssignFeeWizard, validateOverrides } from "@/hooks/fees/assignWizard";
import { useAssignFee } from "@/hooks/fees/mutations";
import { useFeeItem } from "@/hooks/fees/queries";
import { useAcademicYears, useClasses, useTerms } from "@/hooks/queries/reference";
import { Permission } from "@/lib/permissions";

const LAST_STEP = ASSIGN_STEPS.length - 1;

/**
 * The four-step wizard that attaches an existing fee to classes, each with its
 * own amount and due date.
 *
 * @returns The assign fee screen.
 */
function AssignFeeScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedFeeId = searchParams.get("feeId");

  const wizard = useAssignFeeWizard();
  const { selectFee, setStep } = wizard;
  const classesQuery = useClasses();
  const academicYears = useAcademicYears();
  const terms = useTerms();
  const assign = useAssignFee();
  const preselected = useFeeItem(preselectedFeeId);

  const [result, setResult] = useState<{ assigned: number; skipped: number } | null>(null);

  // Arriving from "Assign to Classes" on a fee row: start at step 2.
  useEffect(() => {
    if (preselected.data) {
      selectFee(preselected.data);
      setStep(1);
    }
  }, [preselected.data, selectFee, setStep]);

  const classes: FeeClass[] = useMemo(() => classesQuery.data ?? [], [classesQuery.data]);
  const fee = wizard.selectedFee;

  // The period the assignments are recorded against: the fee's own, when it
  // carries one, otherwise the school's current academic year.
  const currentYear = (academicYears.data ?? []).find((year) => year.isCurrent);
  const academicYearId = (fee && refId(fee.academicYearId)) || currentYear?._id || "";
  const academicYearLabel =
    (fee && refName(fee.academicYearId, "")) ||
    (academicYears.data ?? []).find((year) => year._id === academicYearId)?.year ||
    "Not set";
  const termId = fee ? refId(fee.termId) : "";
  const termLabel =
    (fee && refName(fee.termId, "")) ||
    (terms.data ?? []).find((term) => term._id === termId)?.name ||
    "All terms";

  const selectedIds = Array.from(wizard.selectedClassIds);
  const students = totalCapacity(classes.filter((entry) => wizard.selectedClassIds.has(entry._id)));

  const handleNext = () => {
    if (wizard.step === 0 && !fee) {
      toast.error("Please select a fee");
      return;
    }
    if (wizard.step === 1 && selectedIds.length === 0) {
      toast.error("Please select at least one class");
      return;
    }
    if (wizard.step === 2 && fee) {
      const problem = validateOverrides(fee, selectedIds, wizard.overrides);
      if (problem) {
        toast.error(problem);
        return;
      }
    }
    setStep(wizard.step + 1);
  };

  const handleAssign = async () => {
    if (!fee) return;
    const problem = validateOverrides(fee, selectedIds, wizard.overrides);
    if (problem) {
      toast.error(problem);
      setStep(2);
      return;
    }

    try {
      const assigned = await assign.mutateAsync(
        buildAssignPayload(fee, selectedIds, wizard.overrides, { academicYearId, termId })
      );
      toast.success(`Fee assigned to ${assigned.assigned} class(es)`);
      setResult({ assigned: assigned.assigned, skipped: assigned.skipped });
    } catch {
      /* the mutation already reported why */
    }
  };

  if (result && fee) {
    return (
      <div className={pageClass}>
        <div className="max-w-screen-lg mx-auto px-6 py-6">
          <SuccessStep
            feeName={fee.name}
            assigned={result.assigned}
            skipped={result.skipped}
            studentCount={students}
            totalAmount={wizard.totalAmount}
            onGoBack={() => router.push("/fees-management")}
            onAssignAnother={() => {
              setResult(null);
              wizard.reset();
            }}
          />
        </div>
      </div>
    );
  }

  const actionButton =
    wizard.step < LAST_STEP ? (
      <button
        type="button"
        onClick={handleNext}
        className={`flex items-center gap-2 px-5 py-2 text-sm rounded-xl ${primaryButtonClass}`}
      >
        Next <FiChevronRight size={15} />
      </button>
    ) : (
      <button
        type="button"
        onClick={handleAssign}
        disabled={assign.isPending}
        className="flex items-center gap-2 px-5 py-2 text-sm bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:opacity-60"
      >
        <FiCheck size={15} /> {assign.isPending ? "Assigning..." : "Assign Fee"}
      </button>
    );

  return (
    <div className={pageClass}>
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <div className={`flex items-center gap-2 text-sm mb-4 ${mutedTextClass}`}>
          <button
            type="button"
            onClick={() => router.push("/fees-management")}
            className="hover:text-[#003366] dark:hover:text-blue-300"
          >
            Fees Management
          </button>
          <FiChevronRight size={14} />
          <span className="text-gray-600 dark:text-gray-300">Add Existing Fee to Classes</span>
        </div>

        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className={`text-2xl font-bold ${headingClass}`}>Add Existing Fee to Classes</h1>
            <p className={`text-sm mt-0.5 max-w-2xl ${mutedTextClass}`}>
              Assign an existing fee to one or more classes. You can set a different amount and due
              date for each class if needed.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push("/fees-management")}
              className={`px-4 py-2 text-sm rounded-xl ${secondaryButtonClass}`}
            >
              Cancel
            </button>
            {actionButton}
          </div>
        </div>

        <StepIndicator current={wizard.step} />

        {wizard.step === 0 && (
          <SelectFeeStep
            selectedFee={fee}
            onSelect={selectFee}
            academicYearLabel={academicYearLabel}
          />
        )}

        {wizard.step === 1 && (
          <SelectClassesStep
            classes={classes}
            loading={classesQuery.isPending}
            error={classesQuery.error}
            selected={wizard.selectedClassIds}
            onToggle={wizard.toggleClass}
            onSelectAll={() => wizard.selectClasses(classes.map((entry) => entry._id))}
            onClear={wizard.clearClasses}
          />
        )}

        {wizard.step === 2 && fee && (
          <SetAmountStep
            fee={fee}
            classes={classes}
            selectedClassIds={wizard.selectedClassIds}
            overrides={wizard.overrides}
            onChange={wizard.setOverrideField}
            onApplyFirstToAll={wizard.applyFirstToAll}
          />
        )}

        {wizard.step === LAST_STEP && fee && (
          <ReviewStep
            fee={fee}
            classes={classes}
            selectedClassIds={wizard.selectedClassIds}
            overrides={wizard.overrides}
            totalAmount={wizard.totalAmount}
            academicYearLabel={academicYearLabel}
            termLabel={termLabel}
          />
        )}

        {wizard.step > 0 && (
          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(wizard.step - 1)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl ${secondaryButtonClass}`}
            >
              <FiChevronLeft size={15} /> Back
            </button>
            {actionButton}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Assigning a fee is what makes it payable, so the page needs `manage:fees` —
 * the same permission the API requires.
 *
 * @returns The guarded assign fee page.
 */
export default function AssignFeePage() {
  return (
    <RequirePermission permission={Permission.MANAGE_FEES}>
      <Suspense
        fallback={
          <div className={pageClass}>
            <div className="max-w-screen-xl mx-auto px-6 py-6">
              <PageSkeleton />
            </div>
          </div>
        }
      >
        <AssignFeeScreen />
      </Suspense>
    </RequirePermission>
  );
}
