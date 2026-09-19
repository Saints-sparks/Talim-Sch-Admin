/**
 * Curriculum structure — subjects, the courses that sit inside them, and the
 * curriculum content teachers publish against a course and term.
 *
 * A *subject* is a broad area of study ("Mathematics"); a *course* is a unit of
 * that subject taught to one class by one teacher ("MTH101 — Algebra, Grade 1A").
 *
 * The school is never sent in the URL: every endpoint here scopes itself to the
 * caller's token, so nothing in this file reads or compares a school id.
 */
import { API_URLS } from "../lib/api/config";
import { api } from "@/lib/apiClient";
import { logger } from "@/lib/logger";
import type { CreateSubjectContractPayload, UpdateSubjectContractPayload } from "@/types/apiPayloads";
import { getClasses as getSchoolClasses, type Class as SchoolClass } from "./school.service";
import { teacherService, type Teacher } from "./teacher.service";

/** A teacher account, as the staff directory returns it. */
export type { Teacher };

/**
 * A class, as the curriculum screens use it.
 *
 * Identical to the shared `Class` except that `gradeLevel` is non-optional:
 * the backend's `CreateClassDto` requires it, so every class the API returns
 * carries one, and the curriculum dropdowns label rows with it.
 */
export type Class = SchoolClass & { gradeLevel: string };

/**
 * The school's classes.
 *
 * Delegates to `school.service` — the class list has a single owner, and this
 * is only the curriculum-side import of it, narrowed to `Class` above.
 *
 * @returns The classes, or `[]` when the school has none.
 */
export const getClasses = (): Promise<Class[]> => getSchoolClasses() as Promise<Class[]>;

/** A subject, optionally with the courses that belong to it attached. */
export interface Subject {
  _id: string;
  name: string;
  code: string;
  schoolId: string;
  classId?: string;
  courses?: Course[];
  /** Present on list endpoints that count instead of embedding courses. */
  courseCount?: number;
  createdAt?: string;
}

/** A course inside a subject, taught to one class. */
export interface Course {
  _id: string;
  title: string;
  description: string;
  courseCode: string;
  subjectId: string;
  teacherId?: string;
  classId?: string;
  schoolId?: string;
  /** Legacy aliases some endpoints still return alongside the canonical fields. */
  code?: string;
  name?: string;
  subjectName?: string;
  teacherRole?: string;
  createdAt?: string;
}

/**
 * Body for `POST /subjects-courses/courses`, mirroring `CreateCourseDto`.
 * `schoolId` is accepted but ignored by the API — the token decides the school.
 *
 * Hand-typed on purpose: the generated contract for this endpoint is wrong (its
 * `@ApiBody` documents `subjectName` and `teacherRole`, while the validated DTO
 * needs `subjectId`), and `UpdateCourseDto` is generated as an empty object.
 * Both are read from `talimBE-V2/src/modules/academic/data/dtos/courses.ts`.
 */
export interface CreateCoursePayload {
  title: string;
  description: string;
  courseCode: string;
  subjectId: string;
  teacherId: string;
  classId: string;
  schoolId?: string;
}

/** Body for `PUT /subjects-courses/courses/:id`, mirroring `UpdateCourseDto`. */
export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  courseCode?: string;
  teacherId?: string;
  classId?: string;
}

/**
 * Body of `POST` / `PUT /subjects-courses/subjects` (the backend DTOs). The
 * contract types `schoolId` as an object (a raw ObjectId), which no string
 * satisfies, so it is restated as a string. The API accepts and ignores it.
 */
export type SubjectPayload = Omit<CreateSubjectContractPayload, "schoolId"> & { schoolId?: string };

/** A curriculum entry: what a teacher published for one course in one term. */
export interface CurriculumContent {
  _id: string;
  course: {
    _id: string;
    name?: string;
    code?: string;
    courseCode?: string;
    title?: string;
    description?: string;
    className?: string;
    schoolName?: string;
    teacherName?: string;
  } | null;
  term: {
    _id: string;
    name: string;
    year?: string;
    startDate?: string;
    endDate?: string;
  } | null;
  content: string;
  attachments: string[];
  teacherId?: { _id: string; firstName: string; lastName: string } | null;
  teacherName?: string;
  createdAt: string;
  updatedAt?: string;
}

/** Curriculum headline numbers, mirroring the backend `CurriculumKpiDto`. */
export interface CurriculumKpis {
  totalSubjects: number;
  totalCourses: number;
  activeTeachers: number;
  totalClasses: number;
  totalStudents: number;
  totalCurriculumItems: number;
  averageCoursesPerClass: number;
  subjectDistribution: Array<{ className: string; subjectCount: number }>;
  popularSubjects: Array<{ subjectName: string; courseCount: number }>;
  teacherDistribution: Array<{ teacherName: string; subjectsCount: number }>;
}

/** The shapes these list endpoints have returned over time. */
type ListEnvelope<T> = T[] | { data?: T[]; courses?: T[]; subjects?: T[] } | null;

/**
 * Normalises a list response to an array, tolerating the bare-array,
 * `{ data }` and `{ courses } / { subjects }` shapes the API mixes.
 */
function toList<T>(raw: ListEnvelope<T>): T[] {
  if (Array.isArray(raw)) return raw;
  const data = raw?.data ?? raw?.courses ?? raw?.subjects;
  return Array.isArray(data) ? data : [];
}

/**
 * Creates a course inside a subject.
 *
 * @param payload - The course to create; the teacher and class must belong to
 *   the caller's school or the API answers `NOT_FOUND`.
 * @returns The created course.
 */
export const createCourse = async (payload: CreateCoursePayload): Promise<Course> =>
  api.post<Course>(API_URLS.COURSES.CREATE_COURSE, payload);

/**
 * Renames or reassigns a course.
 *
 * @param courseId - Course to update.
 * @param payload - Fields to change; every field is optional.
 * @returns The updated course.
 */
export const updateCourseService = async (courseId: string, payload: UpdateCoursePayload): Promise<Course> =>
  api.put<Course>(`${API_URLS.COURSES.CREATE_COURSE}/${encodeURIComponent(courseId)}`, payload);

/**
 * Deletes a course.
 *
 * @param courseId - Course to delete.
 */
export const deleteCourseService = async (courseId: string): Promise<void> => {
  await api.delete<void>(`${API_URLS.COURSES.CREATE_COURSE}/${encodeURIComponent(courseId)}`);
};

/**
 * Creates a subject.
 *
 * @param payload - Name and code; a clashing code answers `CONFLICT`.
 * @returns The created subject.
 */
export const createSubject = async (payload: SubjectPayload): Promise<Subject> =>
  api.post<Subject>(API_URLS.SUBJECTS.CREATE_SUBJECT, payload);

/**
 * Renames a subject or changes its code.
 *
 * @param subjectId - Subject to update.
 * @param payload - New name and code.
 * @returns The updated subject.
 */
export const updateSubject = async (subjectId: string, payload: SubjectPayload): Promise<Subject> =>
  api.put<Subject>(API_URLS.SUBJECTS.UPDATE_SUBJECT.replace(":subjectId", encodeURIComponent(subjectId)), payload satisfies UpdateSubjectContractPayload);

/**
 * Deletes a subject.
 *
 * @param subjectId - Subject to delete.
 */
export const deleteSubject = async (subjectId: string): Promise<void> => {
  await api.delete<void>(API_URLS.SUBJECTS.DELETE_SUBJECT.replace(":subjectId", encodeURIComponent(subjectId)));
};

/**
 * Every subject in the school, without their courses.
 *
 * @returns The subjects, or `[]` when the school has none.
 */
export const getSubjectsBySchool = async (): Promise<Subject[]> =>
  toList(await api.get<ListEnvelope<Subject>>(API_URLS.SUBJECTS.GET_SUBJECTS_BY_SCHOOL));

/**
 * The courses that belong to one subject.
 *
 * @param subjectId - Subject to list courses for.
 * @returns The courses, or `[]` when the subject has none.
 */
export const getCoursesBySubject = async (subjectId: string): Promise<Course[]> =>
  toList(
    await api.get<ListEnvelope<Course>>(
      `${API_URLS.COURSES.GET_COURSES_BY_SUBJECT}/${encodeURIComponent(subjectId)}`,
    ),
  );

/**
 * Every course in the school, across all subjects.
 *
 * @returns The courses, or `[]` when the school has none.
 */
export const getCoursesBySchool = async (): Promise<Course[]> =>
  toList(await api.get<ListEnvelope<Course>>(API_URLS.COURSES.GET_COURSES_BY_SCHOOL));

/**
 * Every subject with its courses attached.
 *
 * Issues one request per subject, so it is cached as reference data
 * (`useSubjects`) rather than refetched per page. A subject whose courses fail
 * to load keeps its row with an empty course list instead of failing the page.
 *
 * @returns The subjects, each with a `courses` array.
 */
export const getSubjectsWithCourses = async (): Promise<Subject[]> => {
  const subjects = await getSubjectsBySchool();
  const results = await Promise.allSettled(subjects.map((subject) => getCoursesBySubject(subject._id)));

  return subjects.map((subject, index) => {
    const settled = results[index];
    if (settled.status === "fulfilled") return { ...subject, courses: settled.value };
    logger.error("curriculum", `Failed to load courses for subject ${subject.name}`, settled.reason);
    return { ...subject, courses: [] };
  });
};

/**
 * Every teacher account in the school, for the "assign a teacher" dropdowns.
 *
 * Delegates to the staff directory so there is one teacher list in the app —
 * and so the dropdown is not silently truncated to the API's default page.
 *
 * @returns The teacher accounts.
 */
export const getTeachers = (): Promise<Teacher[]> => teacherService.getAllTeachers();

/**
 * Curriculum content published across the school, newest first as the API
 * returns it.
 *
 * @param filters - Optional course / term / teacher narrowing.
 * @returns The curriculum entries.
 */
export const getCurriculumContents = async (
  filters: { course?: string; term?: string; teacherId?: string } = {},
): Promise<CurriculumContent[]> => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  const suffix = query.toString() ? `?${query}` : "";
  return toList(await api.get<ListEnvelope<CurriculumContent>>(`/curriculum${suffix}`));
};

/**
 * Curriculum headline numbers for the dashboard.
 *
 * Requires `manage:curriculum`; a sub-admin without it gets `FORBIDDEN`, and
 * the page falls back to counting what it already has.
 *
 * @returns The KPI totals and distributions.
 */
export const getCurriculumKpis = async (): Promise<CurriculumKpis> =>
  api.get<CurriculumKpis>("/curriculum/kpis");
