"use client";

import { Info } from "lucide-react";
import { classTeacherHint } from "./classTeacher";

/** Props of {@link ClassTeacherHint}. */
export interface ClassTeacherHintProps {
  /** The classes the teacher is assigned to. */
  assigned: ReadonlyArray<{ id: string; name: string }>;
  /** The class ids the teacher is the class teacher of (from `Class.classTeacherId`). */
  classTeacherOf: ReadonlySet<string>;
  /** Extra wording after the rule, e.g. where to set a class teacher. */
  action?: string;
}

/**
 * Says when a teacher is assigned to classes without being their class
 * teacher (A6): only a class's class teacher can take its register. Renders
 * nothing when every assigned class is one they are the class teacher of.
 *
 * @param props - See {@link ClassTeacherHintProps}.
 * @returns The note, or null.
 */
export function ClassTeacherHint({ assigned, classTeacherOf, action }: ClassTeacherHintProps) {
  const hint = classTeacherHint(assigned, classTeacherOf);
  if (!hint.text) return null;
  return (
    <div
      role="note"
      aria-label="Class teacher"
      className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 text-sm text-amber-900 dark:text-amber-200"
    >
      <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
      <p>
        {hint.text}
        {action ? ` ${action}` : ""}
      </p>
    </div>
  );
}
