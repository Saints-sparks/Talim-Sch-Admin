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
import { PartPaymentHint } from "@/components/fees/PartPaymentHint";
import { FeesPanelState } from "@/components/fees/FeesPanelState";
import type { FeeClass } from "@/components/fees/types";
import { FeesBreadcrumb } from "@/components/fees/FeesBreadcrumb";
import {
  CardHeader,
  Page,
  PageHeader,
  PageSkeleton,
  card,
  cardFrame,
  ghostButton,
  primaryButton,
  sectionTitle,
} from "@/components/tl";
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

  /**
   * Ticks or unticks one class for the assignment.
   *
   * @param classId - The class.
   */
  const toggleClass = (classId: string) => {
    setSelectedClasses((current) => {
      const next = new Set(current);
      if (next.has(classId)) next.delete(classId);
      else next.add(classId);
      return next;
    });
  };

  const submitting = saveFee.isPending || assignFee.isPending;

  /**
   * Validates, saves the fee and, when classes are ticked, assigns it.
   *
   * @param event - The form's submit event.
   */
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
    return <PageSkeleton label="Loading the fee" blocks={[360, 220]} />;
  }

  if (editId && editing.isError) {
    return (
      <Page>
        <FeesBreadcrumb current="Edit Fee" />
        <div className={cardFrame}>
          <FeesPanelState
            loading={false}
            error={editing.error}
            empty={false}
            subject="this fee"
            emptyMessage=""
            onRetry={() => editing.refetch()}
          />
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <FeesBreadcrumb current={editId ? "Edit Fee" : "Create New Fee"} />

      <PageHeader
        title={editId ? "Edit Fee" : "Create New Fee"}
        subtitle="Add a new fee and assign it to one or more classes."
        actions={
          <>
            <button
              type="button"
              onClick={() => router.push("/fees-management")}
              className={ghostButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-fee-form"
              disabled={submitting}
              className={primaryButton}
            >
              {submitting ? "Saving..." : editId ? "Update Fee" : "Save & Continue"}
              {!submitting && <FiChevronRight size={16} aria-hidden />}
            </button>
          </>
        }
      />

      <form id="create-fee-form" onSubmit={handleSubmit}>
        <div className="flex flex-col items-start gap-[18px] lg:flex-row">
          <div className="flex w-full min-w-0 flex-1 flex-col gap-[18px]">
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

            <section className={`${card} flex flex-col gap-4`}>
              <CardHeader
                title="2. Assign to Classes"
                subtitle="Optional. Select one or more classes to assign this fee as soon as it is saved."
              />
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
            </section>

            <section className={`${card} flex flex-col gap-4`}>
              <CardHeader
                title="3. Additional Settings"
                subtitle="Configure other options for this fee."
              />
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
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
                <div className="flex flex-col gap-2">
                  <FeeToggle
                    checked={form.values.allowPartialPayment}
                    onChange={(value) => form.setField("allowPartialPayment", value)}
                    label="Allow Partial Payment"
                    description="Parents can pay this fee in parts."
                    disabled={submitting}
                    describedBy="fee-part-payment-hint"
                  />
                  <PartPaymentHint
                    id="fee-part-payment-hint"
                    allowPartialPayment={form.values.allowPartialPayment}
                    defaultAmount={form.values.defaultAmount}
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-[18px] lg:w-80">
            <FeeSummaryPanel
              values={form.values}
              categories={categories.data ?? []}
              classes={classes}
              selectedClassIds={selectedClasses}
            />

            <section className={`${card} flex flex-col gap-2`}>
              <h2 className={sectionTitle}>Tips</h2>
              <ul className="flex list-disc flex-col gap-2 pl-4 text-[13px] text-tl-muted">
                <li>You can always edit or reassign this fee after creating it.</li>
                <li>Parents see this fee in their portal once it is published.</li>
                <li>Use the Assign flow to give each class a different amount.</li>
              </ul>
            </section>
          </div>
        </div>
      </form>
    </Page>
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
      <Suspense fallback={<PageSkeleton label="Loading the fee form" blocks={[360, 220]} />}>
        <CreateFeeScreen />
      </Suspense>
    </RequirePermission>
  );
}
