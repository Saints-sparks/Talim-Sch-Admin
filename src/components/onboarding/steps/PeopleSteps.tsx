/**
 * Setup steps 3 and 4 — the first teacher and the first student.
 *
 * Both open the modal the rest of the portal uses, so there is one add-teacher
 * and one add-student form in the app. The step is only ticked off when the
 * modal reports a successful save; closing it changes nothing.
 */
"use client";

import { useState } from "react";
import { UserRound, Users } from "lucide-react";
import { toast } from "@/components/CustomToast";
import AddTeacherModal from "@/components/AddTeacherModal";
import AddStudentModal from "@/components/AddStudentModal";
import { StepCard } from "@/components/onboarding/steps/StepCard";
import { useInvalidateReference } from "@/hooks/queries/reference";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

/**
 * @param props.onComplete - Marks the step done and moves the checklist on.
 * @returns The add-teacher step.
 */
export function AddTeacherStep({ onComplete }: { onComplete: () => void }) {
  const [open, setOpen] = useState(false);
  useBodyScrollLock(open);

  return (
    <StepCard stepId="add-teacher">
      <p className="text-sm text-gray-600 mb-6 max-w-sm dark:text-slate-300">
        Register a teacher account. They will receive a login email and can be assigned to classes
        and courses.
      </p>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-11 px-6 bg-[#003366] hover:bg-[#002244] text-white text-sm font-semibold rounded-lg transition-colors"
      >
        <UserRound className="h-4 w-4" /> Add Teacher
      </button>
      {open && (
        <AddTeacherModal
          onClose={() => setOpen(false)}
          onSuccess={() => {
            setOpen(false);
            toast.success("Teacher added!");
            onComplete();
          }}
        />
      )}
    </StepCard>
  );
}

/**
 * @param props.onComplete - Marks the step done and moves the checklist on.
 * @returns The add-student step.
 */
export function AddStudentStep({ onComplete }: { onComplete: () => void }) {
  const [open, setOpen] = useState(false);
  const invalidate = useInvalidateReference();
  useBodyScrollLock(open);

  return (
    <StepCard stepId="add-student">
      <p className="text-sm text-gray-600 mb-6 max-w-sm dark:text-slate-300">
        Enrol your first student and assign them to a class. You can always add more from the
        Students section.
      </p>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-11 px-6 bg-[#003366] hover:bg-[#002244] text-white text-sm font-semibold rounded-lg transition-colors"
      >
        <Users className="h-4 w-4" /> Add Student
      </button>
      {open && (
        <AddStudentModal
          onClose={() => setOpen(false)}
          onSuccess={() => {
            // The class roster counts change with a new enrolment.
            invalidate.classes();
            onComplete();
          }}
        />
      )}
    </StepCard>
  );
}
