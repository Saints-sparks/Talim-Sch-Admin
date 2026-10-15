"use client";

import React, { useState } from "react";
import { LogOut, RotateCcw } from "lucide-react";
import type { StudentStatus } from "@/app/services/student.service";
import type { LeaveReason } from "@/app/services/transit.service";
import { getAcademicYearLabel } from "@/app/services/academic.service";
import { useAcademicYears } from "@/hooks/queries/reference";
import { useClassOptions } from "@/hooks/transit/useTransitReference";
import {
  standingErrorMessage,
  useLeaveStudent,
  useReinstateStudent,
} from "@/hooks/users/useStudentStanding";
import { toast } from "@/components/CustomToast";
import { logger } from "@/lib/logger";
import {
  ChipGroup,
  Field,
  Sheet,
  dangerButton,
  dangerGhostButton,
  describedByFor,
  fieldControl,
  ghostButton,
  primaryButton,
  rowButton,
  textareaControl,
} from "@/components/tl";

/** The reasons a student leaves, with what each one means. */
export const LEAVE_REASONS: ReadonlyArray<{ value: LeaveReason; label: string; hint: string }> = [
  {
    value: "graduated",
    label: "Graduated",
    hint: "Finished the final year. Only a student in the top class can graduate.",
  },
  {
    value: "withdrawn",
    label: "Withdrawn",
    hint: "Left the school before finishing. They can be reinstated later.",
  },
  {
    value: "left_talim",
    label: "Left Talim",
    hint: "Moved to a school that isn't on Talim. For a Talim school, use a transfer instead.",
  },
];

/** The most a note may hold (`LeaveStudentDto.note`). */
const NOTE_MAX = 500;

/**
 * Whether a student can be reinstated: withdrawn or left Talim (a graduate
 * stays a graduate).
 *
 * @param status - The student's status.
 * @returns True when "Reinstate" applies.
 */
export function canReinstate(status: StudentStatus | undefined): boolean {
  return status === "withdrawn" || status === "left_talim";
}

/** Props for {@link StudentStandingActions}. */
export interface StudentStandingActionsProps {
  studentId: string;
  studentName: string;
  /** The student's status (from the transcript), or undefined while unknown. */
  status: StudentStatus | undefined;
}

/**
 * "Mark as left" for a student on the roster (graduated, withdrawn or left
 * Talim, in a session, with a note) and "Reinstate" for one who withdrew or
 * left Talim (into a class), through `POST /transit/students/:id/leave` and
 * `/reinstate`. The two 409s (`STUDENT_NOT_ACTIVE`, `STUDENT_NOT_WITHDRAWN`)
 * are explained in plain words. Gate it with `manage:transit`, as the API is.
 *
 * @param props - See {@link StudentStandingActionsProps}.
 * @param props.studentId - The student record id.
 * @param props.studentName - Their name, for the sheets.
 * @param props.status - Their status.
 * @returns The action button and its sheet, or nothing while the status is unknown.
 */
export function StudentStandingActions({
  studentId,
  studentName,
  status,
}: StudentStandingActionsProps) {
  const [open, setOpen] = useState<"leave" | "reinstate" | null>(null);
  if (!status) return null;
  return (
    <>
      {status === "active" ? (
        <button type="button" className={dangerGhostButton} onClick={() => setOpen("leave")}>
          <LogOut className="h-4 w-4" aria-hidden /> Mark as left
        </button>
      ) : canReinstate(status) ? (
        <button type="button" className={rowButton} onClick={() => setOpen("reinstate")}>
          <RotateCcw className="h-4 w-4" aria-hidden /> Reinstate
        </button>
      ) : null}
      {open === "leave" ? (
        <LeaveSheet studentId={studentId} studentName={studentName} onClose={() => setOpen(null)} />
      ) : null}
      {open === "reinstate" ? (
        <ReinstateSheet
          studentId={studentId}
          studentName={studentName}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </>
  );
}

/**
 * Reports the warnings a standing change came back with (e.g. the top level
 * could not be told).
 *
 * @param warnings - The server's warnings.
 */
function reportWarnings(warnings: string[] | undefined) {
  for (const warning of warnings ?? []) toast.warning(warning);
}

/**
 * The "Mark as left" sheet.
 *
 * @param props - The student and the close handler.
 * @param props.studentId - The student record id.
 * @param props.studentName - Their name.
 * @param props.onClose - Closes the sheet.
 * @returns The sheet.
 */
function LeaveSheet({
  studentId,
  studentName,
  onClose,
}: {
  studentId: string;
  studentName: string;
  onClose: () => void;
}) {
  const leave = useLeaveStudent();
  const years = useAcademicYears();
  const [reason, setReason] = useState<LeaveReason>("graduated");
  const [academicYearId, setAcademicYearId] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const chosen = LEAVE_REASONS.find((r) => r.value === reason) ?? LEAVE_REASONS[0];

  const submit = async () => {
    setError(null);
    try {
      const result = await leave.mutateAsync({
        studentId,
        payload: {
          reason,
          ...(academicYearId ? { academicYearId } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        },
      });
      toast.success(`${studentName} is marked as ${chosen.label.toLowerCase()}.`);
      reportWarnings(result.warnings);
      onClose();
    } catch (err) {
      logger.error("students/standing", "leave failed", err);
      setError(standingErrorMessage(err, "We couldn't mark this student as left."));
    }
  };

  return (
    <Sheet
      open
      onOpenChange={(next) => !next && onClose()}
      dismissible={!leave.isPending}
      eyebrowText={studentName}
      title="Mark as left"
      subtitle="The student goes off the roster and keeps a read-only sign-in to see their results and transcript."
      footer={
        <>
          <button
            type="button"
            className={`${ghostButton} flex-1`}
            onClick={onClose}
            disabled={leave.isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${dangerButton} flex-1`}
            onClick={() => void submit()}
            disabled={leave.isPending}
          >
            {leave.isPending ? "Saving…" : `Mark as ${chosen.label.toLowerCase()}`}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-1.5">
        <ChipGroup
          label="Reason"
          options={LEAVE_REASONS.map((r) => ({ value: r.value, label: r.label }))}
          value={reason}
          onChange={setReason}
        />
        <p className="text-[13px] text-tl-muted">{chosen.hint}</p>
      </div>
      <Field
        id="leave-session"
        label="Session"
        hint="Leave as is to use the student's current session."
      >
        <select
          id="leave-session"
          className={fieldControl}
          value={academicYearId}
          onChange={(event) => setAcademicYearId(event.target.value)}
          aria-describedby={describedByFor("leave-session", "hint")}
        >
          <option value="">Current session</option>
          {(years.data ?? []).map((year) => (
            <option key={year._id} value={year._id}>
              {getAcademicYearLabel(year)}
            </option>
          ))}
        </select>
      </Field>
      <Field
        id="leave-note"
        label="Note"
        hint={`Optional. Kept with the class record (${note.length}/${NOTE_MAX}).`}
      >
        <textarea
          id="leave-note"
          className={textareaControl}
          value={note}
          maxLength={NOTE_MAX}
          onChange={(event) => setNote(event.target.value)}
          aria-describedby={describedByFor("leave-note", "hint")}
        />
      </Field>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-tl-danger">
          {error}
        </p>
      ) : null}
    </Sheet>
  );
}

/**
 * The "Reinstate" sheet: the class the student rejoins.
 *
 * @param props - The student and the close handler.
 * @param props.studentId - The student record id.
 * @param props.studentName - Their name.
 * @param props.onClose - Closes the sheet.
 * @returns The sheet.
 */
function ReinstateSheet({
  studentId,
  studentName,
  onClose,
}: {
  studentId: string;
  studentName: string;
  onClose: () => void;
}) {
  const reinstate = useReinstateStudent();
  const { classes } = useClassOptions();
  const [classId, setClassId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    try {
      const result = await reinstate.mutateAsync({ studentId, payload: { classId } });
      toast.success(`${studentName} is back on the roster.`);
      reportWarnings(result.warnings);
      onClose();
    } catch (err) {
      logger.error("students/standing", "reinstate failed", err);
      setError(standingErrorMessage(err, "We couldn't reinstate this student."));
    }
  };

  return (
    <Sheet
      open
      onOpenChange={(next) => !next && onClose()}
      dismissible={!reinstate.isPending}
      eyebrowText={studentName}
      title="Reinstate"
      subtitle="The student rejoins the roster in the current session, in the class you choose."
      footer={
        <>
          <button
            type="button"
            className={`${ghostButton} flex-1`}
            onClick={onClose}
            disabled={reinstate.isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`${primaryButton} flex-1`}
            onClick={() => void submit()}
            disabled={reinstate.isPending || !classId}
          >
            {reinstate.isPending ? "Saving…" : "Reinstate"}
          </button>
        </>
      }
    >
      <Field id="reinstate-class" label="Class" required>
        <select
          id="reinstate-class"
          className={fieldControl}
          value={classId}
          onChange={(event) => setClassId(event.target.value)}
        >
          <option value="">Choose a class</option>
          {classes.map((option) => (
            <option key={option._id} value={option._id}>
              {option.name}
            </option>
          ))}
        </select>
      </Field>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-tl-danger">
          {error}
        </p>
      ) : null}
    </Sheet>
  );
}

export default StudentStandingActions;
