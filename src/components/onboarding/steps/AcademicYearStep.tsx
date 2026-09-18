/**
 * Setup step 1 — the academic year and its first term.
 *
 * The step reads the school's existing years and terms first: a school that
 * already set them up in Settings is ticked off rather than asked again, and a
 * school with a year but no term starts at the term form.
 */
"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/CustomToast";
import { Tooltip } from "@/components/ui/Tooltip";
import { Field, PrimaryBtn, SubStepBadge, inputCls } from "@/components/onboarding/OnboardingAtoms";
import { StepCard, StepCheckingCard } from "@/components/onboarding/steps/StepCard";
import { useAcademicYears, useInvalidateReference, useTerms } from "@/hooks/queries/reference";
import { createAcademicYear, createTerm } from "@/app/services/academic.service";
import { getErrorMessage } from "@/lib/apiError";

/** The academic-year form's fields, matching `CreateAcademicYearDto`. */
interface YearForm {
  year: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

/** The term form's fields, matching `CreateTermDto` minus the school and year. */
interface TermForm {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

/**
 * Rejects a date range the API would reject, before it is sent.
 *
 * @param startDate - ISO start date.
 * @param endDate - ISO end date.
 * @returns The problem, or `null` when the range is valid.
 */
function rangeProblem(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) return "Both start and end dates are required.";
  if (new Date(startDate) >= new Date(endDate)) return "The end date must be after the start date.";
  return null;
}

/**
 * @param props.onComplete - Marks the step done and moves the checklist on.
 * @returns The academic year and term step.
 */
export default function AcademicYearStep({ onComplete }: { onComplete: () => void }) {
  const years = useAcademicYears();
  const terms = useTerms();
  const invalidate = useInvalidateReference();

  const [subStep, setSubStep] = useState<"year" | "term">("year");
  const [yearId, setYearId] = useState<string | null>(null);
  const [yearForm, setYearForm] = useState<YearForm>({
    year: "",
    startDate: "",
    endDate: "",
    isCurrent: true,
  });
  const [termForm, setTermForm] = useState<TermForm>({
    name: "",
    startDate: "",
    endDate: "",
    isCurrent: true,
  });

  const detecting = years.isLoading || terms.isLoading;

  // A school that already has a term has done this step; one with only a year
  // picks up at the term form.
  useEffect(() => {
    if (detecting) return;
    if ((terms.data?.length ?? 0) > 0) {
      onComplete();
      return;
    }
    const existing = years.data?.find((y) => y.isCurrent) ?? years.data?.[0];
    if (existing) {
      setYearId(existing._id);
      setSubStep("term");
    }
  }, [detecting, terms.data, years.data, onComplete]);

  const yearMutation = useMutation({
    mutationFn: createAcademicYear,
    onSuccess: (created) => {
      if (!created?._id) {
        toast.error("The server didn't return an id for the academic year. Please try again.");
        return;
      }
      invalidate.academicYears();
      setYearId(created._id);
      setSubStep("term");
      toast.success("Academic year created! Now add your first term.");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to create the academic year.")),
  });

  const termMutation = useMutation({
    mutationFn: createTerm,
    onSuccess: () => {
      invalidate.terms();
      toast.success("Term created! Academic year setup complete.");
      onComplete();
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to create the term.")),
  });

  const handleYearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearForm.year.trim()) {
      toast.error("Give the academic year a name, e.g. 2024/2025.");
      return;
    }
    const problem = rangeProblem(yearForm.startDate, yearForm.endDate);
    if (problem) {
      toast.error(problem);
      return;
    }
    yearMutation.mutate({ ...yearForm, year: yearForm.year.trim() });
  };

  const handleTermSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termForm.name.trim()) {
      toast.error("Give the term a name, e.g. First Term.");
      return;
    }
    const problem = rangeProblem(termForm.startDate, termForm.endDate);
    if (problem) {
      toast.error(problem);
      return;
    }
    if (!yearId) {
      toast.error("Go back to step 1 and create the academic year first.");
      return;
    }
    termMutation.mutate({ ...termForm, name: termForm.name.trim(), academicYearId: yearId });
  };

  if (detecting) {
    return <StepCheckingCard stepId="academic-year" message="Checking existing data…" />;
  }

  return (
    <StepCard stepId="academic-year">
      <div className="flex items-center gap-2 mb-6">
        <SubStepBadge num={1} active={subStep === "year"} done={subStep === "term"} label="Academic Year" />
        <div className="flex-1 h-0.5 bg-gray-200 dark:bg-slate-700">
          <div
            className={`h-full bg-[#003366] transition-all duration-500 ${subStep === "term" ? "w-full" : "w-0"}`}
          />
        </div>
        <SubStepBadge num={2} active={subStep === "term"} done={false} label="First Term" />
      </div>

      {subStep === "year" ? (
        <form onSubmit={handleYearSubmit} className="space-y-4 max-w-sm">
          <Tooltip
            content='Example: "2025/2026". This groups all your terms, assessments, and timetables for the school year.'
            side="right"
          >
            <Field label="Academic year name" hint="e.g. 2024/2025">
              <input
                value={yearForm.year}
                onChange={(e) => setYearForm({ ...yearForm, year: e.target.value })}
                placeholder="2024/2025"
                className={inputCls}
                required
              />
            </Field>
          </Tooltip>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <input
                type="date"
                value={yearForm.startDate}
                onChange={(e) => setYearForm({ ...yearForm, startDate: e.target.value })}
                className={inputCls}
                required
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                value={yearForm.endDate}
                onChange={(e) => setYearForm({ ...yearForm, endDate: e.target.value })}
                className={inputCls}
                required
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer dark:text-slate-300">
            <input
              type="checkbox"
              checked={yearForm.isCurrent}
              onChange={(e) => setYearForm({ ...yearForm, isCurrent: e.target.checked })}
              className="rounded"
            />
            Set as current academic year
          </label>
          <PrimaryBtn loading={yearMutation.isPending}>
            Create Academic Year <ArrowRight className="h-4 w-4" />
          </PrimaryBtn>
        </form>
      ) : (
        <form onSubmit={handleTermSubmit} className="space-y-4 max-w-sm">
          <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2 dark:bg-green-900/20 dark:text-green-300">
            Academic year ready. Now add your first term.
          </p>
          <Tooltip
            content='Example: "First Term" or "Spring Term". Set it as the current term once created.'
            side="right"
          >
            <Field label="Term name" hint="e.g. First Term">
              <input
                value={termForm.name}
                onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                placeholder="First Term"
                className={inputCls}
                required
              />
            </Field>
          </Tooltip>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              <input
                type="date"
                value={termForm.startDate}
                onChange={(e) => setTermForm({ ...termForm, startDate: e.target.value })}
                className={inputCls}
                required
              />
            </Field>
            <Field label="End date">
              <input
                type="date"
                value={termForm.endDate}
                onChange={(e) => setTermForm({ ...termForm, endDate: e.target.value })}
                className={inputCls}
                required
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer dark:text-slate-300">
            <input
              type="checkbox"
              checked={termForm.isCurrent}
              onChange={(e) => setTermForm({ ...termForm, isCurrent: e.target.checked })}
              className="rounded"
            />
            Set as current term
          </label>
          <PrimaryBtn loading={termMutation.isPending}>
            <CheckCircle2 className="h-4 w-4" /> Create Term &amp; Finish
          </PrimaryBtn>
        </form>
      )}
    </StepCard>
  );
}
