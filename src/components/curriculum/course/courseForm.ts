import { teacherUserId } from "@/app/services/teacher.service";
import type { CreateCoursePayload, Teacher, UpdateCoursePayload } from "@/app/services/subjects.service";
import type { SearchOption } from "@/components/curriculum/SearchSelect";

/**
 * A course as the pages that open the course modal hold it: the same fields the
 * API returns, except that `teacherId`, `subjectId` and `classId` arrive either
 * as ids or as populated objects depending on the route it came from.
 */
export interface CourseForModal {
  _id: string;
  title: string;
  description: string;
  courseCode: string;
  teacherId?: string | { _id: string; userId?: string | { _id?: string } };
  subjectId?: string | { _id: string; name?: string; code?: string };
  classId?: string | { _id?: string };
  schoolId?: string;
}

/** The form's own state: every field a plain string, as the inputs hold it. */
export interface CourseForm {
  title: string;
  description: string;
  courseCode: string;
  teacherId: string;
  classId: string;
  subjectId: string;
}

/** A blank form. */
export const EMPTY_FORM: CourseForm = {
  title: "",
  description: "",
  courseCode: "",
  teacherId: "",
  classId: "",
  subjectId: "",
};

/**
 * Reads an id out of a field the API returns either populated or as a string.
 *
 * @param value - An id, a populated object, or nothing.
 * @returns The id, or "" when there is none.
 */
export function idOf(value: string | { _id?: string } | undefined | null): string {
  if (!value) return "";
  return typeof value === "string" ? value : (value._id ?? "");
}

/**
 * The user id a course's teacher is addressed by, populated or not.
 *
 * @param teacherId - The course's `teacherId` as the route returned it.
 * @returns The teacher's user id, else their own id, else "".
 */
export function courseTeacherId(teacherId: CourseForModal["teacherId"]): string {
  if (!teacherId) return "";
  if (typeof teacherId === "string") return teacherId;
  if (typeof teacherId.userId === "string") return teacherId.userId;
  return teacherId.userId?._id || teacherId._id || "";
}

/**
 * A teacher's display name, tolerating the accounts with no profile yet.
 *
 * @param teacher - The teacher.
 * @returns First and last name, else the email, else "Unnamed teacher".
 */
export function teacherName(teacher: Teacher): string {
  return `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`.trim() || (teacher.email ?? "Unnamed teacher");
}

/**
 * The form a modal opens with.
 *
 * @param mode - Adding a new course or editing one.
 * @param course - The course being edited.
 * @param subjectId - The subject the modal was opened from.
 * @param initialClassId - A class to preselect.
 * @returns The course's own values when editing (falling back to the page's
 *   subject and class), else a blank form seeded with the subject and class.
 */
export function initialCourseForm(
  mode: "add" | "edit",
  course: CourseForModal | null | undefined,
  subjectId?: string,
  initialClassId?: string,
): CourseForm {
  if (mode === "edit" && course) {
    return {
      title: course.title,
      description: course.description,
      courseCode: course.courseCode,
      teacherId: courseTeacherId(course.teacherId),
      classId: idOf(course.classId) || initialClassId || "",
      subjectId: idOf(course.subjectId) || subjectId || "",
    };
  }
  return { ...EMPTY_FORM, classId: initialClassId || "", subjectId: subjectId || "" };
}

/**
 * The labels of the required fields still empty.
 *
 * @param form - The form as typed.
 * @returns Field labels in form order; empty when the form is complete.
 */
export function missingCourseFields(form: CourseForm): string[] {
  return [
    !form.title.trim() && "Course Title",
    !form.courseCode.trim() && "Course Code",
    !form.description.trim() && "Description",
    !form.teacherId && "Assigned Teacher",
    !form.classId && "Class",
    !form.subjectId && "Subject",
  ].filter(Boolean) as string[];
}

/**
 * The create request for a complete form.
 *
 * @param form - The validated form.
 * @returns The payload with text fields trimmed.
 */
export function toCreatePayload(form: CourseForm): CreateCoursePayload {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    courseCode: form.courseCode.trim(),
    subjectId: form.subjectId,
    teacherId: form.teacherId,
    classId: form.classId,
  };
}

/**
 * The update request for a complete form (the subject is fixed once created).
 *
 * @param form - The validated form.
 * @returns The payload with text fields trimmed.
 */
export function toUpdatePayload(form: CourseForm): UpdateCoursePayload {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    courseCode: form.courseCode.trim(),
    teacherId: form.teacherId,
    classId: form.classId,
  };
}

/**
 * The teacher picker's rows, keyed by user id.
 *
 * @param teachers - The school's teachers.
 * @returns One option per teacher, with their email as the hint.
 */
export function teacherSearchOptions(teachers: Teacher[]): SearchOption[] {
  return teachers.map((teacher) => ({
    id: teacherUserId(teacher),
    label: teacherName(teacher),
    hint: teacher.email ?? "",
  }));
}

/**
 * The class picker's rows.
 *
 * @param classes - The school's classes.
 * @returns One option per class, with its grade level as the hint.
 */
export function classSearchOptions(classes: Array<{ _id: string; name: string; gradeLevel?: string }>): SearchOption[] {
  return classes.map((cls) => ({
    id: cls._id,
    label: cls.name,
    hint: cls.gradeLevel ? `Grade level: ${cls.gradeLevel}` : "",
  }));
}
