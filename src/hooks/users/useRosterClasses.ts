/**
 * Classes as the people forms need them.
 *
 * `useClasses()` is the shared cached source, but the `Class` type in
 * `school.service` describes fewer fields than `/classes` actually returns —
 * the add-student form needs `gradeLevel` (it auto-fills from the chosen class)
 * and the class's own `schoolId`. This widens the row once, in one place, so no
 * form has to cast inline. Remove it when `school.service.Class` gains the
 * fields (see the track report).
 */
"use client";

import { useMemo } from "react";
import { useClasses } from "@/hooks/queries/reference";

/** A class row with the extra fields the people forms read. */
export interface RosterClass {
  _id: string;
  name: string;
  /** Grade level of the class; auto-fills the student's grade level. */
  gradeLevel?: string;
  /** Populated or raw school reference. */
  schoolId?: string | { _id?: string; id?: string };
}

/** What `useRosterClasses` returns. */
export interface RosterClassesResult {
  /** The school's classes; `[]` until they load. */
  classes: RosterClass[];
  /** True while the first load is in flight. */
  isPending: boolean;
  /** True when the classes could not be loaded. */
  isError: boolean;
  /** Whatever the query threw. */
  error: unknown;
  /** Reloads the classes after a failure. */
  refetch: () => void;
}

/**
 * The school's classes, widened for the people forms.
 *
 * @returns The classes plus the query's loading and error flags.
 */
export function useRosterClasses(): RosterClassesResult {
  const query = useClasses();
  const classes = useMemo(() => (query.data ?? []) as unknown as RosterClass[], [query.data]);

  return {
    classes,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

/**
 * The school id a class belongs to, whichever shape the API populated.
 *
 * @param cls - The selected class, if any.
 * @returns The class's school id, or `null` when it is not populated.
 */
export function classSchoolId(cls: RosterClass | undefined): string | null {
  const schoolId = cls?.schoolId;
  if (typeof schoolId === "string") return schoolId;
  if (schoolId && typeof schoolId === "object") return schoolId._id ?? schoolId.id ?? null;
  return null;
}
