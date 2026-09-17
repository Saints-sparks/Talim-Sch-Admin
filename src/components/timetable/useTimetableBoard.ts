/**
 * The timetable page's data.
 *
 * Classes and terms come from the shared reference hooks, so opening the
 * timetable after any other page costs nothing. The class's courses, its
 * teachers and its grid are three cached queries keyed by school and class —
 * switching back to a class you were just looking at is instant, and every
 * write invalidates exactly that class's grid rather than refetching the page.
 */
"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useAcademicYears, useClasses, useTerms } from "@/hooks/queries/reference";
import type { Class } from "@/app/services/school.service";
import {
  createTimetableEntry,
  deleteTimetableEntry,
  getCoursesForClass,
  getTeacherDirectory,
  getTimetableByClass,
  type CreateTimetableEntryPayload,
  type TimetableCourse,
} from "@/app/services/timetable.service";
import {
  buildTeacherNameMap,
  isGridEmpty,
  toGridData,
  type TimetableGridData,
} from "./timetable.model";

/** One entry of the Session/Term picker. */
export interface TermOption {
  id: string;
  label: string;
  isCurrent: boolean;
}

/** Everything the timetable page renders and acts on. */
export interface TimetableBoard {
  classes: Class[];
  isLoadingClasses: boolean;
  selectedClassId: string;
  setSelectedClassId: (classId: string) => void;
  /** The class's name, for the export file. */
  selectedClassName: string;

  termOptions: TermOption[];
  selectedTermId: string;
  setSelectedTermId: (termId: string) => void;

  courses: TimetableCourse[];
  isLoadingCourses: boolean;
  teacherNames: Map<string, string>;

  grid: TimetableGridData;
  isLoadingGrid: boolean;
  /** Set only when the grid read failed for a real reason, never for "empty". */
  gridError: unknown;
  /** True when the class simply has no entries yet. */
  isEmpty: boolean;

  createEntry: UseMutationResult<unknown, Error, CreateTimetableEntryPayload>;
  deleteEntry: UseMutationResult<void, Error, string>;
  applyTemplate: UseMutationResult<number, Error, CreateTimetableEntryPayload[]>;

  /** Refetches classes, courses, teachers and the selected class's grid. */
  refresh: () => Promise<void>;
  isRefreshing: boolean;
}

/**
 * Loads and writes the timetable for one class.
 *
 * @returns The board: reference lists, the grid, and the three write actions.
 */
export function useTimetableBoard(): TimetableBoard {
  const schoolId = useSchoolId();
  const client = useQueryClient();
  const scope = schoolId ?? "none";

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");

  const classesQuery = useClasses();
  const termsQuery = useTerms();
  const yearsQuery = useAcademicYears();

  const classes = useMemo(() => classesQuery.data ?? [], [classesQuery.data]);

  // Land on the first class as soon as the list arrives, the way the page
  // always has, without an effect that fights the user's own choice.
  const activeClassId =
    selectedClassId || (classes.length > 0 ? classes[0]._id : "");

  const termOptions = useMemo<TermOption[]>(() => {
    const years = new Map((yearsQuery.data ?? []).map((y) => [y._id, y.year]));
    return (termsQuery.data ?? []).map((term) => ({
      id: term._id,
      label: years.has(term.academicYearId)
        ? `${years.get(term.academicYearId)} · ${term.name}`
        : term.name,
      isCurrent: term.isCurrent,
    }));
  }, [termsQuery.data, yearsQuery.data]);

  const activeTermId =
    selectedTermId || termOptions.find((t) => t.isCurrent)?.id || termOptions[0]?.id || "";

  const coursesQuery = useQuery({
    queryKey: queryKeys.courses.byClass(scope, activeClassId || "none"),
    queryFn: () => getCoursesForClass(activeClassId),
    enabled: Boolean(schoolId && activeClassId),
    staleTime: staleTimes.reference,
  });

  const teachersQuery = useQuery({
    queryKey: queryKeys.teachers.list(scope, { scope: "timetable-directory" }),
    queryFn: getTeacherDirectory,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.reference,
  });

  const timetableQuery = useQuery({
    queryKey: queryKeys.timetable.byClass(scope, activeClassId || "none"),
    queryFn: () => getTimetableByClass(activeClassId),
    enabled: Boolean(schoolId && activeClassId),
    staleTime: staleTimes.list,
  });

  const courses = useMemo(() => coursesQuery.data ?? [], [coursesQuery.data]);

  const teacherNames = useMemo(
    () => buildTeacherNameMap(teachersQuery.data ?? []),
    [teachersQuery.data]
  );

  const grid = useMemo(
    () => toGridData(timetableQuery.data ?? {}, courses, teacherNames, activeClassId),
    [timetableQuery.data, courses, teacherNames, activeClassId]
  );

  const invalidateGrid = useCallback(
    () =>
      client.invalidateQueries({
        queryKey: queryKeys.timetable.byClass(scope, activeClassId || "none"),
      }),
    [client, scope, activeClassId]
  );

  const createEntry = useMutation({
    mutationFn: (payload: CreateTimetableEntryPayload) => createTimetableEntry(payload),
    onSuccess: () => invalidateGrid(),
  });

  const deleteEntry = useMutation({
    mutationFn: (entryId: string) => deleteTimetableEntry(entryId),
    onSuccess: () => invalidateGrid(),
  });

  // The API takes one entry at a time and rejects conflicts individually, so
  // the template is applied in sequence and reports how many slots it filled.
  const applyTemplate = useMutation({
    mutationFn: async (entries: CreateTimetableEntryPayload[]) => {
      let created = 0;
      for (const entry of entries) {
        try {
          await createTimetableEntry(entry);
          created += 1;
        } catch {
          // A clash with an existing lesson is expected; keep going.
        }
      }
      return created;
    },
    onSettled: () => invalidateGrid(),
  });

  const refresh = useCallback(async () => {
    await Promise.all([
      classesQuery.refetch(),
      coursesQuery.refetch(),
      teachersQuery.refetch(),
      timetableQuery.refetch(),
    ]);
  }, [classesQuery, coursesQuery, teachersQuery, timetableQuery]);

  return {
    classes,
    isLoadingClasses: classesQuery.isLoading,
    selectedClassId: activeClassId,
    setSelectedClassId,
    selectedClassName: classes.find((c) => c._id === activeClassId)?.name ?? "Unknown Class",

    termOptions,
    selectedTermId: activeTermId,
    setSelectedTermId,

    courses,
    isLoadingCourses: coursesQuery.isLoading,
    teacherNames,

    grid,
    isLoadingGrid: timetableQuery.isLoading,
    gridError: timetableQuery.error,
    isEmpty: !timetableQuery.isLoading && !timetableQuery.error && isGridEmpty(grid),

    createEntry,
    deleteEntry,
    applyTemplate,

    refresh,
    isRefreshing:
      classesQuery.isFetching ||
      coursesQuery.isFetching ||
      teachersQuery.isFetching ||
      timetableQuery.isFetching,
  };
}
