"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import { toast } from "@/components/CustomToast";
import type { AcademicYearResponse, TermResponse } from "@/app/services/academic.service";
import type { ClassOption, StudentOption } from "@/hooks/transit/useTransitReference";
import { useCreateEnrollment } from "@/hooks/transit/useEnrollments";
import { PrimaryButton, SecondaryButton, text, TransitModal } from "@/components/transit/ui";
import {
  EnrollmentFields,
  isEnrollmentDraftComplete,
  type EnrollmentDraft,
} from "@/components/transit/EnrollmentFields";
import { StudentPicker } from "@/components/transit/StudentPicker";

const EMPTY_DRAFT: EnrollmentDraft = { classId: "", academicYearId: "", termId: "" };

/**
 * Enrols one student into a class and academic year.
 *
 * With `student` fixed the picker is skipped — that is how the history page
 * opens it. A student who already has an active enrollment comes back as a
 * `CONFLICT`, which is shown as the plain sentence it is.
 */
export function EnrollStudentModal({
  onClose,
  student,
  students,
  studentsLoading,
  studentsError,
  onRetryStudents,
  classes,
  academicYears,
  terms,
  referenceLoading,
}: {
  onClose: () => void;
  /** Fixes the student, hiding the picker. */
  student?: { id: string; name: string };
  students?: StudentOption[];
  studentsLoading?: boolean;
  studentsError?: unknown;
  onRetryStudents?: () => void;
  classes: ClassOption[];
  academicYears: AcademicYearResponse[];
  terms: TermResponse[];
  referenceLoading: boolean;
}) {
  const [selected, setSelected] = useState<StudentOption | null>(null);
  const [draft, setDraft] = useState<EnrollmentDraft>(EMPTY_DRAFT);
  const enroll = useCreateEnrollment();

  const studentId = student?.id ?? selected?._id ?? "";
  const studentName =
    student?.name ?? (selected ? `${selected.firstName} ${selected.lastName}`.trim() : "");
  const ready = Boolean(studentId) && isEnrollmentDraftComplete(draft);

  async function submit() {
    if (!ready) return;
    try {
      await enroll.mutateAsync({
        studentId,
        classId: draft.classId,
        academicYearId: draft.academicYearId,
        termId: draft.termId || undefined,
        source: "manual",
      });
      toast.success(studentName ? `${studentName} enrolled` : "Student enrolled");
      onClose();
    } catch (err) {
      logger.error("transit", "enrollment failed", err);
      toast.error(getErrorMessage(err, "Couldn't enrol this student"));
    }
  }

  return (
    <TransitModal
      title={student ? "Enrol in New Class" : "Enrol Student"}
      onClose={onClose}
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={enroll.isPending}>
            Cancel
          </SecondaryButton>
          <PrimaryButton onClick={submit} disabled={!ready || enroll.isPending}>
            {enroll.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {enroll.isPending ? "Enrolling..." : "Enrol Student"}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        {student ? (
          <p className={cn("text-sm", text.muted)}>
            Enrolling <span className={cn("font-medium", text.strong)}>{student.name}</span>
          </p>
        ) : selected ? (
          <div className="flex items-center justify-between rounded-lg border border-[#003366] dark:border-sky-500 bg-[#003366]/5 dark:bg-sky-500/10 p-3">
            <span className={cn("text-sm font-medium", text.strong)}>{studentName}</span>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className={cn("text-xs transition-colors hover:underline", text.muted)}
            >
              Change
            </button>
          </div>
        ) : (
          <StudentPicker
            students={students ?? []}
            isLoading={Boolean(studentsLoading)}
            isError={Boolean(studentsError)}
            error={studentsError}
            onRetry={onRetryStudents}
            onSelect={setSelected}
          />
        )}

        <EnrollmentFields
          draft={draft}
          onChange={(patch) => setDraft((current) => ({ ...current, ...patch }))}
          classes={classes}
          academicYears={academicYears}
          terms={terms}
          loading={referenceLoading}
        />
      </div>
    </TransitModal>
  );
}
