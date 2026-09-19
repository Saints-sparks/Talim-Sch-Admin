/**
 * State and submit logic for the add-teacher wizard.
 *
 * The dialog components only render; everything that decides what is valid,
 * what is sent and what happens when the server says no lives here and in
 * `teacherForm.ts`.
 */
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/CustomToast";
import { useSchoolId } from "@/hooks/useSchoolId";
import { usePermissions } from "@/hooks/usePermissions";
import { useRosterClasses, type RosterClassesResult } from "@/hooks/users/useRosterClasses";
import { useCreateTeacher } from "@/hooks/users/useTeachers";
import { logger } from "@/lib/logger";
import { Permission } from "@/lib/permissions";
import { describeCreateFailure } from "@/components/users/create/serverErrors";
import {
  INITIAL_TEACHER_FORM,
  TEACHER_LAST_STEP,
  buildTeacherCreateInput,
  describeTeacherErrors,
  firstStepWithError,
  isTeacherField,
  validateTeacherStep,
  type TeacherField,
  type TeacherFormErrors,
  type TeacherFormState,
  type TeacherStep,
} from "@/components/users/teachers/create/teacherForm";

/** Options for {@link useAddTeacherForm}. */
export interface UseAddTeacherFormOptions {
  /** Closes the dialog. */
  onClose: () => void;
  /** Called after the teacher exists, so the caller can refresh. Falls back to opening the roster. */
  onSuccess?: () => void | Promise<void>;
}

/** Everything the add-teacher dialog renders from. */
export interface AddTeacherFormApi {
  form: TeacherFormState;
  /** Sets one field and clears its error. */
  setField: <K extends TeacherField>(field: K, value: TeacherFormState[K]) => void;
  /** Adds or removes an id from `assignedClasses`. */
  toggleClass: (classId: string) => void;
  /** Adds or removes a day from `availabilityDays`. */
  toggleDay: (day: string) => void;
  step: TeacherStep;
  errors: TeacherFormErrors;
  /** The server's explanation of the last failed submit, or `null`. */
  formError: string | null;
  /** True from the first click of Create until the dialog has finished, blocking a second submit. */
  pending: boolean;
  /** The signed-in admin may add teachers. */
  canCreate: boolean;
  classes: RosterClassesResult;
  back: () => void;
  /** Validates the step, then advances or creates the teacher. */
  submit: () => Promise<void>;
}

/**
 * Drives the three-step add-teacher wizard.
 *
 * Nothing the admin typed is discarded when a submit fails: the form stays,
 * the server's message and field errors are shown, and the wizard jumps to the
 * step that holds the problem. If the login account was created but the
 * profile was rejected, the next attempt reuses the account instead of
 * registering the email again. No password is ever sent — the server makes a
 * temporary one and forces a change at first sign-in.
 *
 * @param options - Close and success callbacks.
 * @returns Form state, per-step errors and the handlers the dialog binds to.
 */
export function useAddTeacherForm({ onClose, onSuccess }: UseAddTeacherFormOptions): AddTeacherFormApi {
  const router = useRouter();
  const schoolId = useSchoolId();
  const { hasPermission } = usePermissions();
  const classes = useRosterClasses();
  const createTeacher = useCreateTeacher();
  const canCreate = hasPermission(Permission.MANAGE_TEACHERS);

  const [form, setForm] = useState<TeacherFormState>(INITIAL_TEACHER_FORM);
  const [step, setStep] = useState<TeacherStep>(0);
  const [errors, setErrors] = useState<TeacherFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // A ref as well as state: two clicks in the same tick both see the state as false.
  const inFlight = useRef(false);
  // Set once the login account exists, so a retry only redoes the profile.
  const createdUserId = useRef<string | null>(null);

  const setField = useCallback(
    <K extends TeacherField>(field: K, value: TeacherFormState[K]) => {
      setForm((current) => ({ ...current, [field]: value }));
      setErrors((current) => {
        if (!current[field]) return current;
        const { [field]: _cleared, ...rest } = current;
        return rest;
      });
    },
    [],
  );

  const toggleIn = useCallback(
    (field: "assignedClasses" | "availabilityDays", value: string) => {
      setForm((current) => ({
        ...current,
        [field]: current[field].includes(value)
          ? current[field].filter((item) => item !== value)
          : [...current[field], value],
      }));
      setErrors((current) => {
        if (!current[field]) return current;
        const { [field]: _cleared, ...rest } = current;
        return rest;
      });
    },
    [],
  );

  const toggleClass = useCallback((classId: string) => toggleIn("assignedClasses", classId), [toggleIn]);
  const toggleDay = useCallback((day: string) => toggleIn("availabilityDays", day), [toggleIn]);

  const back = useCallback(() => {
    if (inFlight.current) return;
    setStep((current) => (current > 0 ? ((current - 1) as TeacherStep) : current));
  }, []);

  const create = useCallback(async () => {
    if (!schoolId) {
      toast.error("We couldn't tell which school you're signed in to. Please sign in again.");
      return;
    }

    inFlight.current = true;
    setPending(true);
    setFormError(null);
    try {
      await createTeacher.mutateAsync({
        ...buildTeacherCreateInput(form, schoolId),
        existingUserId: createdUserId.current ?? undefined,
        onAccountCreated: (userId) => {
          createdUserId.current = userId;
        },
      });
    } catch (error) {
      logger.error("teachers", "Failed to create teacher", error);
      const failure = describeCreateFailure(error, {
        resource: "teacher",
        accountCreated: createdUserId.current !== null,
      });
      const serverErrors: TeacherFormErrors = {};
      for (const [field, reason] of Object.entries(failure.fieldErrors)) {
        if (isTeacherField(field)) serverErrors[field] = reason;
      }
      setErrors(serverErrors);
      setFormError(failure.message);
      const target = firstStepWithError(Object.keys(serverErrors) as TeacherField[]);
      if (target !== null) setStep(target);
      toast.error(failure.message);
      inFlight.current = false;
      setPending(false);
      return;
    }

    toast.success("Teacher profile created successfully");
    try {
      if (onSuccess) await onSuccess();
      else router.push("/users/teachers");
    } catch (error) {
      // The teacher exists; only the caller's refresh failed. Say nothing scary.
      logger.error("teachers", "Refresh after creating a teacher failed", error);
    }
    onClose();
  }, [schoolId, createTeacher, form, onSuccess, router, onClose]);

  const submit = useCallback(async () => {
    if (inFlight.current) return;
    if (!canCreate) {
      toast.error("You don't have permission to add teachers.");
      return;
    }

    const stepErrors = validateTeacherStep(step, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      setFormError(null);
      toast.error(describeTeacherErrors(stepErrors));
      return;
    }
    setErrors({});

    if (step < TEACHER_LAST_STEP) {
      setStep((step + 1) as TeacherStep);
      return;
    }
    await create();
  }, [canCreate, step, form, create]);

  return useMemo(
    () => ({ form, setField, toggleClass, toggleDay, step, errors, formError, pending, canCreate, classes, back, submit }),
    [form, setField, toggleClass, toggleDay, step, errors, formError, pending, canCreate, classes, back, submit],
  );
}
