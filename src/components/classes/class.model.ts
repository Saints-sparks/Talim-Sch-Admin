/**
 * The class shapes the `/classes` screens read, and the pure helpers that turn
 * them into something renderable.
 *
 * `GET /classes/:id` populates the class teacher and the courses; the list
 * route and the fallback inside `getClass` do not, so every reference here is
 * allowed to arrive either populated or as a bare id and the helpers cope with
 * both rather than each screen guessing.
 */

/** A person as the class routes populate them. */
export interface ClassUser {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

/** The teacher record a class points at, when the route populated it. */
export interface ClassTeacher {
  _id?: string;
  userId?: ClassUser | string;
  specialization?: string;
  isFormTeacher?: boolean;
}

/** A course as the class detail route returns it. */
export interface ClassCourse {
  _id: string;
  title?: string;
  description?: string;
  courseCode?: string;
  teacherId?: string | ClassTeacher;
  subjectId?: string | { _id: string; name?: string; code?: string };
  classId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** A student as the class list route embeds them, for the avatar stack. */
export interface ClassStudent {
  _id?: string;
  userId?: { firstName?: string; userAvatar?: string } | string;
  firstName?: string;
  userAvatar?: string;
}

/** One class, as the class screens use it. */
export interface ClassDetail {
  _id: string;
  name: string;
  gradeLevel?: string;
  classDescription?: string;
  /** The backend stores capacity as a string. */
  classCapacity?: string;
  schoolId?: string | { _id: string; name?: string };
  classTeacherId?: string | ClassTeacher | null;
  courses?: ClassCourse[];
  students?: ClassStudent[];
  /** How many students are enrolled; `GET /classes` sends it, the embedded list may be empty. */
  studentCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Body for `POST /classes` and `PUT /classes/:id`, mirroring `CreateClassDto`.
 *
 * Every field is required and a string on the backend — the update route takes
 * the same DTO as create, so a partial update would be rejected.
 */
export interface ClassPayload {
  name: string;
  gradeLevel: string;
  classDescription: string;
  classCapacity: string;
}

/** The grade levels the class forms offer. */
export const GRADE_OPTIONS: readonly string[] = Array.from(
  { length: 12 },
  (_, index) => `Grade ${index + 1}`,
);

/** The capacities the create form offers. */
export const CAPACITY_OPTIONS: readonly string[] = ["10", "20", "30", "45", "50"];

/** The teacher record on a class, or null when it is only an id (or absent). */
export function classTeacherRecord(classData: ClassDetail | null | undefined): ClassTeacher | null {
  const teacher = classData?.classTeacherId;
  if (!teacher || typeof teacher === "string") return null;
  return teacher;
}

/** The populated user account of a class's teacher, when there is one. */
export function classTeacherUser(classData: ClassDetail | null | undefined): ClassUser | null {
  const user = classTeacherRecord(classData)?.userId;
  return user && typeof user === "object" ? user : null;
}

/**
 * The class teacher's display name.
 *
 * @param classData - The class.
 * @returns The teacher's name, or "No teacher assigned".
 */
export function classTeacherName(classData: ClassDetail | null | undefined): string {
  const user = classTeacherUser(classData);
  const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  return name || "No teacher assigned";
}

/**
 * The class teacher's email address.
 *
 * @param classData - The class.
 * @returns The email, or `""`.
 */
export function classTeacherEmail(classData: ClassDetail | null | undefined): string {
  return classTeacherUser(classData)?.email ?? "";
}

/** What is wrong with a class form, keyed by field; empty when it is valid. */
export type ClassFormErrors = Partial<Record<keyof ClassPayload, string>>;

/**
 * Mirrors `CreateClassDto` so the form refuses before the request does.
 *
 * The backend requires name, grade level and capacity on both create and
 * update; capacity is stored as a string but has to read as a positive number.
 *
 * @param form - The form's current values.
 * @returns The problems found, keyed by field.
 */
export function validateClassForm(form: ClassPayload): ClassFormErrors {
  const errors: ClassFormErrors = {};

  if (!form.name.trim()) errors.name = "Class name is required";
  else if (form.name.trim().length < 2) errors.name = "Class name must be at least 2 characters";

  if (!form.gradeLevel) errors.gradeLevel = "Please select a grade level";

  const capacity = Number(form.classCapacity);
  if (!form.classCapacity.trim()) errors.classCapacity = "Class capacity is required";
  else if (!Number.isFinite(capacity) || capacity <= 0)
    errors.classCapacity = "Class capacity must be greater than 0";

  return errors;
}
