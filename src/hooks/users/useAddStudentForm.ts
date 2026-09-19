/**
 * State and submit logic for the add-student wizard.
 *
 * The dialog components only render; everything that decides what is valid,
 * what is sent and what happens when the server says no lives here and in
 * `studentForm.ts`.
 */
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "@/components/CustomToast";
import { useSchoolId } from "@/hooks/useSchoolId";
import { usePermissions } from "@/hooks/usePermissions";
import {
  classSchoolId,
  useRosterClasses,
  type RosterClass,
  type RosterClassesResult,
} from "@/hooks/users/useRosterClasses";
import { useCreateStudent, type CreatedStudentAccount } from "@/hooks/users/useStudents";
import { logger } from "@/lib/logger";
import { Permission } from "@/lib/permissions";
import { describeCreateFailure } from "@/components/users/create/serverErrors";
import {
  INITIAL_STUDENT_FORM,
  STUDENT_LAST_STEP,
  buildStudentCreateInput,
  describeStudentErrors,
  firstStudentStepWithError,
  studentFieldFromServer,
  validateStudentStep,
  withClassChoice,
  type StudentField,
  type StudentFormErrors,
  type StudentFormState,
  type StudentStep,
} from "@/components/users/students/create/studentForm";

/** Options for {@link useAddStudentForm}. */
export interface UseAddStudentFormOptions {
  /** Closes the dialog. */
  onClose: () => void;
  /** Called after the student exists, so the caller can refresh. */
  onSuccess?: () => unknown;
}

/** Everything the add-student dialog renders from. */
export interface AddStudentFormApi {
  form: StudentFormState;
  /** Sets one field and clears its error. */
  setField: <K extends StudentField>(field: K, value: StudentFormState[K]) => void;
  /** Chooses a class and inherits its grade level. */
  selectClass: (classId: string) => void;
  /** The class the admin picked, if any. */
  selectedClass: RosterClass | undefined;
  step: StudentStep;
  errors: StudentFormErrors;
  /** The server's explanation of the last failed submit, or `null`. */
  formError: string | null;
  /** True from the first click of Create until the dialog has finished, blocking a second submit. */
  pending: boolean;
  /** The signed-in admin may add students. */
  canCreate: boolean;
  classes: RosterClassesResult;
  back: () => void;
  /** Validates the step, then advances or creates the student. */
  submit: () => Promise<void>;
}

/**
 * Drives the two-step add-student wizard.
 *
 * Nothing the admin typed is discarded when a submit fails: the form stays,
 * the server's message and field errors are shown, and the wizard jumps to the
 * step that holds the problem. If the login account was created but the
 * student record was rejected (say the parent's email belongs to another
 * kind of account), the next attempt reuses the account instead of registering
 * the email again. No password is sent — the server makes a temporary one.
 *
 * @param options - Close and success callbacks.
 * @returns Form state, per-step errors and the handlers the dialog binds to.
 */
export function useAddStudentForm({ onClose, onSuccess }: UseAddStudentFormOptions): AddStudentFormApi {
  const schoolId = useSchoolId();
  const { hasPermission } = usePermissions();
  const classes = useRosterClasses();
  const createStudent = useCreateStudent();
  const canCreate = hasPermission(Permission.MANAGE_STUDENTS);

  const [form, setForm] = useState<StudentFormState>(INITIAL_STUDENT_FORM);
  const [step, setStep] = useState<StudentStep>(0);
  const [errors, setErrors] = useState<StudentFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // A ref as well as state: two clicks in the same tick both see the state as false.
  const inFlight = useRef(false);
  // Set once the login account exists, so a retry only redoes the student record.
  const createdAccount = useRef<CreatedStudentAccount | null>(null);

  const selectedClass = useMemo(
    () => classes.classes.find((item) => item._id === form.classId),
    [classes.classes, form.classId],
  );

  const clearError = useCallback((field: StudentField) => {
    setErrors((current) => {
      if (!current[field]) return current;
      const { [field]: _cleared, ...rest } = current;
      return rest;
    });
  }, []);

  const setField = useCallback(
    <K extends StudentField>(field: K, value: StudentFormState[K]) => {
      setForm((current) => ({ ...current, [field]: value }));
      clearError(field);
    },
    [clearError],
  );

  const selectClass = useCallback(
    (classId: string) => {
      const chosen = classes.classes.find((item) => item._id === classId);
      setForm((current) => withClassChoice(current, classId, chosen?.gradeLevel));
      clearError("classId");
      if (chosen?.gradeLevel) clearError("gradeLevel");
    },
    [classes.classes, clearError],
  );

  const back = useCallback(() => {
    if (inFlight.current) return;
    setStep((current) => (current > 0 ? ((current - 1) as StudentStep) : current));
  }, []);

  const create = useCallback(async () => {
    if (!schoolId) {
      toast.error("We couldn't tell which school you're signed in to. Please sign in again.");
      return;
    }

    // A class carries its own school; prefer it so a class shared with another
    // campus is enrolled against the right school.
    const targetSchoolId = classSchoolId(selectedClass) || schoolId;

    inFlight.current = true;
    setPending(true);
    setFormError(null);
    try {
      await createStudent.mutateAsync({
        ...buildStudentCreateInput(form, targetSchoolId),
        existingAccount: createdAccount.current ?? undefined,
        onAccountCreated: (account) => {
          createdAccount.current = account;
        },
      });
    } catch (error) {
      logger.error("students", "Failed to create student", error);
      const accountCreated = createdAccount.current !== null;
      const failure = describeCreateFailure(error, { resource: "student", accountCreated });
      const serverErrors: StudentFormErrors = {};
      for (const [serverField, reason] of Object.entries(failure.fieldErrors)) {
        const field = studentFieldFromServer(serverField);
        if (field) serverErrors[field] = reason;
      }
      // The API refuses a parent email that belongs to a non-parent account with a
      // bare conflict; it is the parent email field that needs to change.
      if (accountCreated && failure.code === "CONFLICT" && /parent email/i.test(failure.message)) {
        serverErrors.parentEmail = "This email belongs to an account that cannot be a parent.";
      }
      setErrors(serverErrors);
      setFormError(failure.message);
      const target = firstStudentStepWithError(Object.keys(serverErrors) as StudentField[]);
      if (target !== null) setStep(target);
      toast.error(failure.message);
      inFlight.current = false;
      setPending(false);
      return;
    }

    toast.success("Student profile created successfully!");
    try {
      await onSuccess?.();
    } catch (error) {
      // The student exists; only the caller's refresh failed. Say nothing scary.
      logger.error("students", "Refresh after creating a student failed", error);
    }
    onClose();
  }, [schoolId, selectedClass, createStudent, form, onSuccess, onClose]);

  const submit = useCallback(async () => {
    if (inFlight.current) return;
    if (!canCreate) {
      toast.error("You don't have permission to add students.");
      return;
    }

    const stepErrors = validateStudentStep(step, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      setFormError(null);
      toast.error(describeStudentErrors(stepErrors));
      return;
    }
    setErrors({});

    if (step < STUDENT_LAST_STEP) {
      setStep((step + 1) as StudentStep);
      return;
    }
    await create();
  }, [canCreate, step, form, create]);

  return useMemo(
    () => ({ form, setField, selectClass, selectedClass, step, errors, formError, pending, canCreate, classes, back, submit }),
    [form, setField, selectClass, selectedClass, step, errors, formError, pending, canCreate, classes, back, submit],
  );
}
