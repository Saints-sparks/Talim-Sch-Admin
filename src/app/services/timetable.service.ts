/**
 * Class timetable API — the weekly lesson grid, plus the courses and teachers
 * the grid is built from.
 *
 * Payloads mirror `CreateTimetableDto` in
 * `talimBE-V2/src/modules/academic/data/dtos/timetable.dto.ts`: `classId`,
 * `courseId`, a `day` from the five-day enum and `startTime`/`endTime` as
 * strings. The school is stamped from the bearer token, and the API refuses a
 * class or course from another school with a 404.
 *
 * Reads are open to members of the school; every write requires
 * `manage:timetable` on the server as well as in the UI.
 *
 * Every function throws `ApiError` (`@/lib/apiError`). A class with no entries
 * yet answers `NOT_FOUND`, which the page treats as "no timetable" rather than
 * as a failure.
 */
import { API_ENDPOINTS } from "../lib/api/config";
import { api } from "@/lib/apiClient";
import type { TimetableByDay, TimetableDay, TimetableEntryResponse } from "./academic.service";

export type { TimetableByDay, TimetableDay, TimetableEntryResponse };

// ─── Types ────────────────────────────────────────────────────────────────────

/** A Mongo reference the API returns either as a bare id or a populated object. */
export type Ref<T> = string | T;

/** A subject as it arrives populated on a course. */
export interface PopulatedSubject {
  _id: string;
  name?: string;
  code?: string;
}

/** A teacher as it arrives populated on a course. */
export interface PopulatedTeacher {
  _id?: string;
  userId?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

/** A course offered to one class — what the palette drags onto the grid. */
export interface TimetableCourse {
  _id: string;
  title: string;
  description?: string;
  courseCode?: string;
  subjectId: Ref<PopulatedSubject>;
  teacherId?: Ref<PopulatedTeacher>;
}

/** One row of `GET /users/teachers`, used only to name a course's teacher. */
export interface TeacherDirectoryEntry {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userId?: string | { _id?: string; firstName?: string; lastName?: string; email?: string };
}

/** Body for `POST /timetable` (`CreateTimetableDto`). */
export interface CreateTimetableEntryPayload {
  classId: string;
  courseId: string;
  day: TimetableDay;
  /** 24-hour `HH:mm`, e.g. "08:00". */
  startTime: string;
  /** 24-hour `HH:mm`, e.g. "09:00". */
  endTime: string;
}

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * The weekly grid for one class, grouped by day.
 *
 * @param classId - Class whose timetable to read.
 * @returns The timetable, `{}` when the class has no entries yet.
 * @throws ApiError For anything but the 404 the API uses to mean "empty".
 */
export const getTimetableByClass = async (classId: string): Promise<TimetableByDay> => {
  try {
    return await api.get<TimetableByDay>(API_ENDPOINTS.GET_TIMETABLE_BY_CLASS(classId));
  } catch (err) {
    if (isEmptyTimetable(err)) return {};
    throw err;
  }
};

/**
 * Whether an error is the API's way of saying the class has no timetable yet.
 *
 * @param err - The thrown value.
 * @returns True when it is a 404 from the timetable read.
 */
export function isEmptyTimetable(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "NOT_FOUND"
  );
}

/**
 * The courses a class is taught, with subject and teacher populated where the
 * API fills them in.
 *
 * @param classId - Class to read courses for.
 * @returns The courses, or `[]` when the class has none.
 * @throws ApiError When the request fails.
 */
export const getCoursesForClass = async (classId: string): Promise<TimetableCourse[]> => {
  const raw = await api.get<TimetableCourse[] | { data?: TimetableCourse[] } | null>(
    API_ENDPOINTS.GET_COURSES_BY_CLASS(classId)
  );
  if (Array.isArray(raw)) return raw;
  return raw?.data ?? [];
};

/**
 * The school's teachers, used to name a course whose `teacherId` came back as
 * a bare id instead of a populated object.
 *
 * @returns The teacher rows, or `[]` when the API sends no list.
 * @throws ApiError When the request fails.
 */
export const getTeacherDirectory = async (): Promise<TeacherDirectoryEntry[]> => {
  const raw = await api.get<TeacherDirectoryEntry[] | { data?: TeacherDirectoryEntry[] } | null>(
    API_ENDPOINTS.GET_TEACHERS
  );
  if (Array.isArray(raw)) return raw;
  return raw?.data ?? [];
};

// ─── Writes ───────────────────────────────────────────────────────────────────

/**
 * Schedules a course for a class at one day and time.
 *
 * @param payload - Class, course, day and the 24-hour start and end times.
 * @returns The created entry as the API echoes it.
 * @throws ApiError `BAD_REQUEST` when the teacher is already booked at that
 *   time, `NOT_FOUND` when the class or course is not in this school.
 */
export const createTimetableEntry = async (
  payload: CreateTimetableEntryPayload
): Promise<TimetableEntryResponse> => {
  return api.post<TimetableEntryResponse>(API_ENDPOINTS.CREATE_TIMETABLE_ENTRY, payload);
};

/**
 * Removes one lesson slot.
 *
 * @param entryId - The timetable entry's id.
 * @returns Nothing; the API answers 204.
 * @throws ApiError When the entry is not in this school or no longer exists.
 */
export const deleteTimetableEntry = async (entryId: string): Promise<void> => {
  await api.delete<unknown>(API_ENDPOINTS.DELETE_TIMETABLE_ENTRY(entryId));
};
