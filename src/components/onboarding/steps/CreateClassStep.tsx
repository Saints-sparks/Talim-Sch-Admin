/**
 * Setup step 2 — the school's first class.
 */
"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/CustomToast";
import { Tooltip } from "@/components/ui/Tooltip";
import { Field, PrimaryBtn, inputCls } from "@/components/onboarding/OnboardingAtoms";
import { StepCard } from "@/components/onboarding/steps/StepCard";
import { useInvalidateReference } from "@/hooks/queries/reference";
import { createClass } from "@/app/services/student.service";
import { getErrorMessage } from "@/lib/apiError";

/** The grade levels the class form offers. */
const GRADE_LEVELS = Array.from({ length: 15 }, (_, i) => `Grade ${i + 1}`);

/** The class form's fields, matching `CreateClassDto`. */
interface ClassForm {
  name: string;
  gradeLevel: string;
  classCapacity: string;
  classDescription: string;
}

/**
 * @param props.onComplete - Marks the step done and moves the checklist on.
 * @returns The create-class step.
 */
export default function CreateClassStep({ onComplete }: { onComplete: () => void }) {
  const invalidate = useInvalidateReference();
  const [form, setForm] = useState<ClassForm>({
    name: "",
    gradeLevel: "",
    classCapacity: "",
    classDescription: "",
  });

  const mutation = useMutation({
    mutationFn: createClass,
    onSuccess: () => {
      invalidate.classes();
      toast.success("Class created successfully!");
      onComplete();
    },
    onError: (err) => toast.error(getErrorMessage(err, "Failed to create the class.")),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.gradeLevel) {
      toast.error("Choose a grade level.");
      return;
    }
    if (!form.name.trim()) {
      toast.error("Give the class a name, e.g. Grade 7A.");
      return;
    }
    if (form.classCapacity && Number(form.classCapacity) <= 0) {
      toast.error("Capacity must be a positive number.");
      return;
    }
    mutation.mutate({
      name: form.name.trim(),
      gradeLevel: form.gradeLevel,
      classCapacity: form.classCapacity.trim(),
      classDescription: form.classDescription.trim(),
    });
  };

  return (
    <StepCard stepId="create-class">
      <p className="text-sm text-gray-500 mb-4 max-w-sm dark:text-slate-400">
        A class groups students of the same grade together. You can have multiple classes per grade —
        e.g. <span className="font-medium">Grade 7A</span> and{" "}
        <span className="font-medium">Grade 7B</span>.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <Field label="Grade level">
          <select
            value={form.gradeLevel}
            onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
            className={inputCls}
            required
          >
            <option value="">Select grade…</option>
            {GRADE_LEVELS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>
        <Tooltip
          content='The class name identifies this specific group within the grade — e.g. "Grade 7A" or "Grade 7 Gold".'
          side="right"
        >
          <Field label="Class name" hint="e.g. Grade 7A">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Grade 7A"
              className={inputCls}
              required
            />
          </Field>
        </Tooltip>
        <Tooltip content="Maximum number of students that can be enrolled in this class." side="right">
          <Field label="Capacity" hint="Maximum number of students">
            <input
              type="number"
              min={1}
              value={form.classCapacity}
              onChange={(e) => setForm({ ...form, classCapacity: e.target.value })}
              placeholder="30"
              className={inputCls}
            />
          </Field>
        </Tooltip>
        <Field label="Description (optional)">
          <textarea
            value={form.classDescription}
            onChange={(e) => setForm({ ...form, classDescription: e.target.value })}
            placeholder="Brief description…"
            rows={3}
            className={`${inputCls} h-auto`}
          />
        </Field>
        <PrimaryBtn loading={mutation.isPending}>
          <CheckCircle2 className="h-4 w-4" /> Create Class
        </PrimaryBtn>
      </form>
    </StepCard>
  );
}
