"use client";

import { AnimatePresence } from "framer-motion";
import { useAcademicSetup, useAcademicSetupActions } from "@/hooks/settings/useAcademicSetup";
import { SectionError, SectionHeader, SectionSkeleton } from "@/components/settings/ui";
import { AcademicYearsCard } from "./academic/AcademicYearsCard";
import { ChangeTermModal } from "./academic/ChangeTermModal";
import { SetupSummary } from "./academic/SetupSummary";
import { TermsCard } from "./academic/TermsCard";
import { useAcademicSetupForms } from "./academic/useAcademicSetupForms";

const TITLE = "Academic Setup";
const DESC = "Manage academic years, terms and grading periods";

/**
 * Settings → Academic Setup: the school's academic years and terms, which
 * term is current, and how far through the year the school is.
 *
 * @param props.canManage - False for a role without `manage:settings`: the
 *   tables stay readable, the create forms and "Set Current" disappear.
 */
export function AcademicSetupSection({ canManage }: { canManage: boolean }) {
  const { years, terms, currentYear, currentTerm, progress, isLoading, isError, error, refetch } =
    useAcademicSetup();
  const { addYear, addTerm, makeTermCurrent, submitting } = useAcademicSetupActions();
  const forms = useAcademicSetupForms(years, { addYear, addTerm, makeTermCurrent });

  if (isLoading) return <SectionSkeleton title={TITLE} desc={DESC} rows={3} />;
  if (isError) {
    return (
      <SectionError
        title={TITLE}
        desc={DESC}
        error={error}
        fallback="Failed to load academic years and terms."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader title={TITLE} desc={DESC} />

      <SetupSummary currentYear={currentYear} currentTerm={currentTerm} progress={progress} />

      <AcademicYearsCard
        years={years}
        canManage={canManage}
        showForm={forms.showYearForm}
        form={forms.yearForm}
        submitting={submitting}
        onToggleForm={forms.toggleYearForm}
        onCloseForm={forms.closeYearForm}
        onChange={forms.setYearForm}
        onSubmit={forms.submitYear}
      />

      <TermsCard
        years={years}
        terms={terms}
        canManage={canManage}
        showForm={forms.showTermForm}
        form={forms.termForm}
        submitting={submitting}
        onToggleForm={forms.toggleTermForm}
        onCloseForm={forms.closeTermForm}
        onChange={forms.setTermForm}
        onSubmit={forms.submitTerm}
        onSetCurrent={forms.askToChangeTerm}
      />

      <AnimatePresence>
        {forms.pendingTermId && (
          <ChangeTermModal
            nextName={terms.find((t) => t._id === forms.pendingTermId)?.name}
            currentName={currentTerm?.name}
            submitting={submitting}
            onCancel={forms.cancelTermChange}
            onConfirm={forms.confirmTermChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
