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
 * @param props.assigned - The assigned classes.
 * @param props.classTeacherOf - The classes they are class teacher of.
 * @param props.action - Extra wording.
 * @returns The note, or null.
 */
export function ClassTeacherHint({ assigned, classTeacherOf, action }: ClassTeacherHintProps) {
  const hint = classTeacherHint(assigned, classTeacherOf);
  if (!hint.text) return null;
  return (
    <div
      role="note"
      aria-label="Class teacher"
      className="flex items-start gap-2.5 rounded-2xl border border-tl-warning/25 bg-tl-warning-bg px-3.5 py-3 text-sm leading-relaxed text-tl-body"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-tl-warning" aria-hidden />
      <p>
        {hint.text}
        {action ? ` ${action}` : ""}
      </p>
    </div>
  );
}
