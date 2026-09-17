"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FiChevronRight } from "react-icons/fi";
import { RequirePermission } from "@/components/auth/PermissionGate";
import { toast } from "@/components/CustomToast";
import { ClassSelector } from "@/components/fees/ClassSelector";
import { FeeInformationSection } from "@/components/fees/FeeInformationSection";
import { FeeSummaryPanel } from "@/components/fees/FeeSummaryPanel";
import { FeeToggle } from "@/components/fees/FeeToggle";
import { FeesPanelState } from "@/components/fees/FeesPanelState";
import type { FeeClass } from "@/components/fees/types";
import {
  cardClass,
  headingClass,
  mutedTextClass,
  pageClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/fees/ui";
import { PageSkeleton } from "@/components/ui/loading";
import { useAssignFee, useSaveFeeItem } from "@/hooks/fees/mutations";
import { useFeeCategories, useFeeItem } from "@/hooks/fees/queries";
import { EMPTY_FEE_FORM, feeFormFromItem, feeFormToPayload, useFeeForm } from "@/hooks/fees/feeForm";
import { useAcademicYears, useClasses, useTerms } from "@/hooks/queries/reference";
import { Permission } from "@/lib/permissions";

/**
 * Create or edit a fee, optionally assigning it to classes in the same step.
 *
 * @returns The create/edit fee screen.
 */
function CreateFeeScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  const form = useFeeForm(EMPTY_FEE_FORM);
  const { reset } = form;
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());

  const categories = useFeeCategories();
  const classesQuery = useClasses();
  const academicYears = useAcademicYears();
  const terms = useTerms();
  const editing = useFeeItem(editId);

  const saveFee = useSaveFeeItem();
  const assignFee = useAssignFee();

  // Fill the form once the fee being edited arrives.
  useEffect(() => {
    if (editing.data) reset(feeFormFromItem(editing.data));
  }, [editing.data, reset]);

  const classes: FeeClass[] = useMemo(() => classesQuery.data ?? [], [classesQuery.data]);

  // Terms depend on the chosen academic year: no year, every term.
  const availableTerms = useMemo(() => {
    const all = terms.data ?? [];
    if (!form.values.academicYearId) return all;
    return all.filter((term) => term.academicYearId === form.values.academicYearId);
  }, [terms.data, form.values.academicYearId]);

  const toggleClass = (classId: string) => {
    setSelectedClasses((current) => {
      const next = new Set(current);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  };

  const submitting = saveFee.isPending || assignFee.isPending;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const assigningClasses = selectedClasses.size > 0;
    const errors = form.validate({ assigningClasses });
    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0] ?? "Check the highlighted fields.");
      return;
    }

    const payload = feeFormToPayload(form.values);

    let feeId = editId;
    try {
      const saved = await saveFee.mutateAsync({ id: editId ?? undefined, payload });
      feeId = saved._id ?? editId;
      toast.success(editId ? "Fee updated successfully" : "Fee created successfully");
    } catch {
      return; // the mutation already reported why
    }

    if (assigningClasses && feeId) {
      try {
        await assignFee.mutateAsync({
          feeItemId: feeId,
          academicYearId: form.values.academicYearId || undefined,
          termId: form.values.termId || undefined,
          classes: Array.from(selectedClasses).map((classId) => ({
            classId,
            amount: payload.defaultAmount,
            dueDate: form.values.defaultDueDate,
            lateFeeAmount: payload.lateFeeAmount ?? 0,
            isVisibleToParents: payload.isVisibleToParents,
          })),
        });
        toast.success(`Fee assigned to ${selectedClasses.size} class(es)`);
      } catch {
        toast.warning("The fee was saved, but assigning it to classes failed. Try again from Assign.");
        return;
      }
    }

    router.push("/fees-management");
  };

  if (editId && editing.isPending) {
    return (
      <div className={pageClass}>
        <div className="max-w-screen-xl mx-auto px-6 py-6">
          <PageSkeleton />
        </div>
      </div>
    );
  }

  if (editId && editing.isError) {
    return (
      <div className={pageClass}>
        <div className="max-w-screen-xl mx-auto px-6 py-6">
          <div className={`${cardClass} overflow-hidden`}>
            <FeesPanelState
              loading={false}
              error={editing.error}
              empty={false}
              subject="this fee"
              emptyMessage=""
              onRetry={() => editing.refetch()}
            />
          </div>
        </div>
      </div>
    );
  }

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
          <span className="text-gray-600 dark:text-gray-300">
            {editId ? "Edit Fee" : "Create New Fee"}
          </span>
        </div>

        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className={`text-2xl font-bold ${headingClass}`}>
              {editId ? "Edit Fee" : "Create New Fee"}
            </h1>
            <p className={`text-sm mt-0.5 ${mutedTextClass}`}>
              Add a new fee and assign it to one or more classes.
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
            <button
              type="submit"
              form="create-fee-form"
              disabled={submitting}
              className={`flex items-center gap-2 px-5 py-2 text-sm rounded-xl ${primaryButtonClass}`}
            >
              {submitting ? "Saving..." : editId ? "Update Fee" : "Save & Continue"}
              {!submitting && <FiChevronRight size={15} />}
            </button>
          </div>
        </div>

        <form id="create-fee-form" onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 min-w-0 space-y-6">
              <FeeInformationSection
                values={form.values}
                errors={form.errors}
                setField={form.setField}
                categories={categories.data ?? []}
                categoriesLoading={categories.isPending}
                academicYears={academicYears.data ?? []}
                terms={availableTerms}
                disabled={submitting}
              />

              <div className={`${cardClass} p-6 space-y-4`}>
                <div>
                  <h2 className={`text-base font-semibold ${headingClass}`}>2. Assign to Classes</h2>
                  <p className={`text-xs mt-0.5 ${mutedTextClass}`}>
                    Optional. Select one or more classes to assign this fee as soon as it is saved.
                  </p>
                </div>
                <ClassSelector
                  classes={classes}
                  loading={classesQuery.isPending}
                  error={classesQuery.error}
                  selected={selectedClasses}
                  disabled={submitting}
                  onToggle={toggleClass}
                  onSelectAll={() => setSelectedClasses(new Set(classes.map((entry) => entry._id)))}
                  onClear={() => setSelectedClasses(new Set())}
                />
              </div>

              <div className={`${cardClass} p-6 space-y-4`}>
                <div>
                  <h2 className={`text-base font-semibold ${headingClass}`}>
                    3. Additional Settings
                  </h2>
                  <p className={`text-xs mt-0.5 ${mutedTextClass}`}>
                    Configure other options for this fee.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FeeToggle
                    checked={form.values.isVisibleToParents}
                    onChange={(value) => form.setField("isVisibleToParents", value)}
                    label="Make fee visible to parents"
                    description="Parents will be able to view this fee in their portal."
                    disabled={submitting}
                  />
                  <FeeToggle
                    checked={form.values.includeInCollection}
                    onChange={(value) => form.setField("includeInCollection", value)}
                    label="Include in Fee Collection"
                    description="Include this fee in the fee collection process."
                    disabled={submitting}
                  />
                  <FeeToggle
                    checked={form.values.allowPartialPayment}
                    onChange={(value) => form.setField("allowPartialPayment", value)}
                    label="Allow Partial Payment"
                    description="Students can pay a portion of this fee."
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>

            <div className="w-full lg:w-72 shrink-0">
              <FeeSummaryPanel
                values={form.values}
                categories={categories.data ?? []}
                classes={classes}
                selectedClassIds={selectedClasses}
              />

              <div className={`mt-4 ${cardClass} p-4 space-y-2`}>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Tips</h3>
                <ul className={`space-y-2 text-xs ${mutedTextClass}`}>
                  <li>• You can always edit or reassign this fee after creating it.</li>
                  <li>• Parents see this fee in their portal once it is published.</li>
                  <li>• Use the Assign flow to give each class a different amount.</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Creating a fee changes what families are charged, so the page needs
 * `manage:fees` — the same permission the API requires.
 *
 * @returns The guarded create/edit fee page.
 */
export default function CreateFeePage() {
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
        <CreateFeeScreen />
      </Suspense>
    </RequirePermission>
  );
}
