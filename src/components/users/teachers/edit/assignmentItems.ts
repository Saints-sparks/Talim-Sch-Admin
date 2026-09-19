import type { RosterClass } from "@/hooks/users/useRosterClasses";

/** A course as the assignment picker needs it. */
export interface AssignableCourse {
  _id: string;
  title?: string;
  courseCode?: string;
  name?: string;
  code?: string;
}

/** One tick-box row. */
export interface PickerItem {
  id: string;
  label: string;
}

/**
 * The label of a course row: its code then its title, whichever spelling the API
 * used (`courseCode`/`code`, `title`/`name`).
 *
 * @param course - The course.
 * @returns e.g. "MTH101 Algebra"; blank parts are dropped.
 */
export function courseLabel(course: AssignableCourse): string {
  return `${course.courseCode ?? course.code ?? ""} ${course.title ?? course.name ?? ""}`.trim();
}

/**
 * The class rows of the assignment picker.
 *
 * @param classes - The school's classes.
 * @returns One row per class, labelled with its name.
 */
export function classItems(classes: ReadonlyArray<Pick<RosterClass, "_id" | "name">>): PickerItem[] {
  return classes.map((cls) => ({ id: cls._id, label: cls.name }));
}

/**
 * The course rows of the assignment picker.
 *
 * @param courses - The school's courses.
 * @returns One row per course, labelled by {@link courseLabel}.
 */
export function courseItems(courses: ReadonlyArray<AssignableCourse>): PickerItem[] {
  return courses.map((course) => ({ id: course._id, label: courseLabel(course) }));
}
