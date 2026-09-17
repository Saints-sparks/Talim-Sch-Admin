/**
 * Reference data the transit pages put in dropdowns.
 *
 * Classes, academic years and terms come from the shared reference hooks, so
 * transit reuses the same cache as the rest of the app instead of refetching
 * them on every mount. Students are fetched once per school and shared between
 * the enrollment modals and the transfer wizards.
 */
"use client";

import { useMemo } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useClasses } from "@/hooks/queries/reference";
import { studentService } from "@/app/services/student.service";

/** A class as the transit dropdowns need it. */
export interface ClassOption {
  _id: string;
  name: string;
  gradeLevel?: string;
}

/** A student of this school, flattened to the fields the pickers show. */
export interface StudentOption {
  /** The id transit resolves a student by — their user id, which the API accepts. */
  _id: string;
  firstName: string;
  lastName: string;
  admissionNumber?: string;
  gradeLevel?: string;
  className?: string;
}

/** How many students one page of the directory holds. */
const STUDENT_PAGE_SIZE = 500;

/**
 * The school's classes, with grade levels, from the shared reference cache.
 *
 * @returns The class options and the underlying query's loading and error state.
 */
export function useClassOptions(): {
  classes: ClassOption[];
  isLoading: boolean;
  isError: boolean;
} {
  const query = useClasses();
  const classes = useMemo<ClassOption[]>(
    () =>
      (query.data ?? []).map((item) => {
        const withGrade = item as unknown as { gradeLevel?: string };
        return { _id: item._id, name: item.name, gradeLevel: withGrade.gradeLevel };
      }),
    [query.data]
  );
  return { classes, isLoading: query.isLoading, isError: query.isError };
}

/** Reads a student directory record into the shape the pickers render. */
function toStudentOption(raw: unknown): StudentOption {
  const record = raw as {
    _id?: string;
    admissionNumber?: string;
    gradeLevel?: string;
    userId?: { _id?: string; firstName?: string; lastName?: string };
    classId?: string | { name?: string };
    firstName?: string;
    lastName?: string;
  };
  return {
    // Transit resolves a student by their user id or student id; the user id is
    // what the rest of the app links to, so prefer it and fall back.
    _id: record.userId?._id ?? record._id ?? "",
    firstName: record.userId?.firstName ?? record.firstName ?? "",
    lastName: record.userId?.lastName ?? record.lastName ?? "",
    admissionNumber: record.admissionNumber,
    gradeLevel: record.gradeLevel,
    className: typeof record.classId === "string" ? undefined : record.classId?.name,
  };
}

/**
 * Every student of the signed-in school, for the enrollment and transfer pickers.
 *
 * @returns Query result; `data` is `[]` until it loads.
 */
export function useSchoolStudents(): UseQueryResult<StudentOption[]> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.students.list(schoolId ?? "none", { page: 1, limit: STUDENT_PAGE_SIZE }),
    queryFn: async () => {
      const response = await studentService.getStudents(1, STUDENT_PAGE_SIZE);
      const rows = Array.isArray(response) ? response : (response?.data ?? []);
      return rows.map(toStudentOption).filter((student) => student._id);
    },
    enabled: Boolean(schoolId),
    staleTime: staleTimes.reference,
  });
}

/**
 * Filters a student list by name or admission number.
 *
 * @param students - The loaded students.
 * @param search - What the admin typed.
 * @returns The matching students, in the order they arrived.
 */
export function filterStudents(students: StudentOption[], search: string): StudentOption[] {
  const query = search.trim().toLowerCase();
  if (!query) return students;
  return students.filter((student) => {
    const name = `${student.firstName} ${student.lastName}`.toLowerCase();
    return (
      name.includes(query) ||
      (student.admissionNumber ?? "").toLowerCase().includes(query) ||
      (student.gradeLevel ?? "").toLowerCase().includes(query)
    );
  });
}
