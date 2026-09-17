"use client";

import React, { useMemo, useState } from "react";
import { AlertCircle, Check, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { getAcademicYearLabel, type AcademicYearResponse, type TermResponse } from "@/app/services/academic.service";
import { filterStudents, type ClassOption, type StudentOption } from "@/hooks/transit/useTransitReference";
import { useBulkEnroll, type BulkEnrollResult } from "@/hooks/transit/useEnrollments";
import { toast } from "@/components/CustomToast";
import { getErrorMessage } from "@/lib/apiError";
import {
  PrimaryButton,
  SecondaryButton,
  SkeletonRows,
  surface,
  text,
  TransitModal,
} from "@/components/transit/ui";
import {
  EnrollmentFields,
  isEnrollmentDraftComplete,
  type EnrollmentDraft,
} from "@/components/transit/EnrollmentFields";

/** Which pane of the bulk flow is showing. */
type Step = "select" | "preview" | "result";

const EMPTY_DRAFT: EnrollmentDraft = { classId: "", academicYearId: "", termId: "" };

/** Enrols a set of students into one class and academic year, with a preview first. */
export function BulkEnrollModal({
  onClose,
  students,
  studentsLoading,
  classes,
  academicYears,
  terms,
  referenceLoading,
}: {
  onClose: () => void;
  students: StudentOption[];
  studentsLoading: boolean;
  classes: ClassOption[];
  academicYears: AcademicYearResponse[];
  terms: TermResponse[];
  referenceLoading: boolean;
}) {
  const [step, setStep] = useState<Step>("select");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [draft, setDraft] = useState<EnrollmentDraft>(EMPTY_DRAFT);
  const [result, setResult] = useState<BulkEnrollResult | null>(null);
  const bulkEnroll = useBulkEnroll();

  const filtered = useMemo(() => filterStudents(students, search), [students, search]);
  const selected = useMemo(
    () => students.filter((student) => selectedIds.has(student._id)),
    [students, selectedIds]
  );
  const chosenClass = classes.find((item) => item._id === draft.classId);
  const chosenYear = academicYears.find((item) => item._id === draft.academicYearId);
  const canPreview = selectedIds.size > 0 && isEnrollmentDraftComplete(draft);

  function toggle(studentId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  function toggleAll() {
    const everyVisibleSelected =
      filtered.length > 0 && filtered.every((student) => selectedIds.has(student._id));
    setSelectedIds(everyVisibleSelected ? new Set() : new Set(filtered.map((s) => s._id)));
  }

  function nameOf(studentId: string): string {
    const student = students.find((item) => item._id === studentId);
    if (!student) return studentId;
    return `${student.firstName} ${student.lastName}`.trim() || student.admissionNumber || studentId;
  }

  async function submit() {
    try {
      const tally = await bulkEnroll.mutateAsync({
        studentIds: Array.from(selectedIds),
        classId: draft.classId,
        academicYearId: draft.academicYearId,
        termId: draft.termId || undefined,
        nameOf,
      });
      setResult(tally);
      setStep("result");
    } catch (err) {
      logger.error("transit", "bulk enrollment failed", err);
      toast.error(getErrorMessage(err, "Couldn't enrol these students"));
    }
  }

  const footer =
    step === "select" ? (
      <>
        <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
        <PrimaryButton onClick={() => setStep("preview")} disabled={!canPreview}>
          Preview ({selectedIds.size})
        </PrimaryButton>
      </>
    ) : step === "preview" ? (
      <>
        <SecondaryButton onClick={() => setStep("select")} disabled={bulkEnroll.isPending}>
          Back
        </SecondaryButton>
        <PrimaryButton onClick={submit} disabled={bulkEnroll.isPending}>
          {bulkEnroll.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {bulkEnroll.isPending ? "Enrolling..." : `Confirm & Enrol ${selectedIds.size}`}
        </PrimaryButton>
      </>
    ) : (
      <PrimaryButton onClick={onClose}>Done</PrimaryButton>
    );

  return (
    <TransitModal title="Bulk Enrol Students" onClose={onClose} footer={footer} width="max-w-2xl">
      {step === "select" && (
        <div className="space-y-4">
          <EnrollmentFields
            draft={draft}
            onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
            classes={classes}
            academicYears={academicYears}
            terms={terms}
            loading={referenceLoading}
            layout="row"
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-sm font-medium", text.strong)}>
                Students ({selectedIds.size} selected)
              </span>
              <button
                type="button"
                onClick={toggleAll}
                className={cn("text-xs hover:underline", text.brand)}
              >
                {filtered.length > 0 && filtered.every((s) => selectedIds.has(s._id))
                  ? "Deselect all"
                  : "Select all"}
              </button>
            </div>

            <div className="relative mb-2">
              <Search
                className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4", text.muted)}
              />
              <input
                type="search"
                aria-label="Search students"
                placeholder="Search students..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={cn("w-full pl-9 pr-4 py-2 text-sm rounded-lg", surface.input)}
              />
            </div>

            {studentsLoading ? (
              <SkeletonRows count={4} height="h-10" />
            ) : (
              <div
                className={cn(
                  "max-h-64 overflow-y-auto rounded-lg divide-y",
                  surface.card,
                  surface.divide
                )}
              >
                {filtered.map((student) => (
                  <label
                    key={student._id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-slate-800/60"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(student._id)}
                      onChange={() => toggle(student._id)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-[#003366] focus:ring-[#003366]"
                    />
                    <span className={cn("text-sm", text.strong)}>
                      {`${student.firstName} ${student.lastName}`.trim() ||
                        student.admissionNumber ||
                        "Unnamed student"}
                    </span>
                    {student.className && (
                      <span className={cn("text-xs ml-auto", text.muted)}>{student.className}</span>
                    )}
                  </label>
                ))}
                {filtered.length === 0 && (
                  <p className={cn("text-sm text-center py-4", text.muted)}>No students found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-3">
          <p className={cn("text-sm", text.muted)}>
            Enrolling <span className={cn("font-semibold", text.strong)}>{selected.length}</span>{" "}
            students into{" "}
            <span className={cn("font-semibold", text.strong)}>{chosenClass?.name ?? "—"}</span>
            {chosenYear ? ` · ${getAcademicYearLabel(chosenYear)}` : ""}
          </p>
          <div className={cn("rounded-xl overflow-hidden", surface.card)}>
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className={cn("sticky top-0", surface.tableHead)}>
                  <tr>
                    <th className={cn("px-4 py-2.5 text-left font-medium", text.muted)}>Student</th>
                    <th className={cn("px-4 py-2.5 text-left font-medium", text.muted)}>Class</th>
                    <th className={cn("px-4 py-2.5 text-left font-medium", text.muted)}>Year</th>
                  </tr>
                </thead>
                <tbody className={cn("divide-y", surface.divide)}>
                  {selected.map((student) => (
                    <tr key={student._id}>
                      <td className={cn("px-4 py-2.5", text.strong)}>
                        {`${student.firstName} ${student.lastName}`.trim() ||
                          student.admissionNumber}
                      </td>
                      <td className={cn("px-4 py-2.5", text.body)}>{chosenClass?.name ?? "—"}</td>
                      <td className={cn("px-4 py-2.5", text.body)}>
                        {chosenYear ? getAcademicYearLabel(chosenYear) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {step === "result" && result && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-green-100 dark:border-green-500/30 bg-green-50 dark:bg-green-500/10 p-4">
            <Check className="w-5 h-5 shrink-0 text-green-600 dark:text-green-400" />
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              {result.enrolled} enrolled, {result.skipped} skipped (already enrolled)
              {result.errors.length > 0 ? `, ${result.errors.length} failed` : ""}
            </p>
          </div>
          {result.errors.length > 0 && (
            <div className="space-y-1.5 rounded-xl border border-red-100 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4">
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4" />
                Failed enrolments
              </p>
              {result.errors.map((message) => (
                <p key={message} className="text-xs text-red-600 dark:text-red-400">
                  {message}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </TransitModal>
  );
}
