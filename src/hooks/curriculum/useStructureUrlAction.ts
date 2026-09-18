"use client";

/**
 * Turns the `?action=` query the curriculum dashboard links with into an open
 * modal on the structure screen.
 *
 * `add-subject` fires straight away; `add-course` and `edit-course` need the
 * subjects to be loaded first, because they have to find the subject or course
 * they refer to. Each action is honoured once — the ref stops a re-render or a
 * cache update from reopening a modal the user has just closed.
 */
import { useEffect, useRef } from "react";
import type { Course, Subject } from "@/app/services/subjects.service";

/** What the URL asked the structure screen to open. */
export type StructureAction =
  | { type: "add-subject" }
  | { type: "add-course"; subject: Subject }
  | { type: "edit-course"; course: Course }
  /** The URL named something that is not there (no subjects, unknown course). */
  | { type: "unavailable"; reason: string };

interface UseStructureUrlActionOptions {
  /** The `action` query parameter, or null. */
  action: string | null;
  /** The `courseId` query parameter, for `edit-course`. */
  courseId: string | null;
  subjects: Subject[];
  /** True while the subjects are still loading. */
  isLoading: boolean;
  /** Called once per action, when it can be resolved. */
  onAction: (action: StructureAction) => void;
}

/** Finds a course by id across every subject's course list. */
function findCourse(subjects: Subject[], courseId: string): Course | null {
  for (const subject of subjects) {
    const match = subject.courses?.find((course) => course._id === courseId);
    if (match) return match;
  }
  return null;
}

/**
 * Runs the URL's action once it can be resolved.
 *
 * @param options - See {@link UseStructureUrlActionOptions}.
 */
export function useStructureUrlAction({
  action,
  courseId,
  subjects,
  isLoading,
  onAction,
}: UseStructureUrlActionOptions): void {
  const handledRef = useRef<string | null>(null);
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  useEffect(() => {
    if (!action) {
      handledRef.current = null;
      return;
    }

    const key = `${action}:${courseId ?? ""}`;
    if (handledRef.current === key) return;

    if (action === "add-subject") {
      handledRef.current = key;
      onActionRef.current({ type: "add-subject" });
      return;
    }

    // The rest need the subject list.
    if (isLoading) return;

    if (action === "add-course") {
      handledRef.current = key;
      const [firstSubject] = subjects;
      onActionRef.current(
        firstSubject
          ? { type: "add-course", subject: firstSubject }
          : { type: "unavailable", reason: "No subjects available. Please create a subject first." },
      );
      return;
    }

    if (action === "edit-course" && courseId) {
      handledRef.current = key;
      const course = findCourse(subjects, courseId);
      onActionRef.current(
        course ? { type: "edit-course", course } : { type: "unavailable", reason: "Course not found." },
      );
    }
  }, [action, courseId, subjects, isLoading]);
}
