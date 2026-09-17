/**
 * The timetable grid's own vocabulary: the days and hourly slots it draws, the
 * shape of a placed entry, and the pure functions that reconcile the several
 * time formats the API has used over the years.
 *
 * Kept free of React so the matching logic can be tested directly.
 */
import type {
  TimetableByDay,
  TimetableCourse,
  TimetableDay,
  TimetableEntryResponse,
  TeacherDirectoryEntry,
} from "@/app/services/timetable.service";

/** The five days the backend's `day` enum allows. */
export const WEEK_DAYS: TimetableDay[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

/** One hour of the school day. */
export interface TimeSlot {
  /** What the row header shows, e.g. "8:00 - 9:00". */
  label: string;
  /** Slot start in the grid's own loose form, e.g. "8:00". */
  start: string;
  /** Slot end in the grid's own loose form, e.g. "9:00". */
  end: string;
}

/** The school day the grid draws, 8am to 3pm. */
export const TIME_SLOTS: TimeSlot[] = [
  { label: "8:00 - 9:00", start: "8:00", end: "9:00" },
  { label: "9:00 - 10:00", start: "9:00", end: "10:00" },
  { label: "10:00 - 11:00", start: "10:00", end: "11:00" },
  { label: "11:00 - 12:00", start: "11:00", end: "12:00" },
  { label: "12:00 - 13:00", start: "12:00", end: "13:00" },
  { label: "13:00 - 14:00", start: "13:00", end: "14:00" },
  { label: "14:00 - 15:00", start: "14:00", end: "15:00" },
];

/** One lesson as the grid holds it, after the API's shapes are reconciled. */
export interface TimetableEntry {
  _id?: string;
  /** "08:00 - 09:00". */
  time: string;
  startTime: string;
  endTime: string;
  course: string;
  subject: string;
  /** The class id this entry belongs to. */
  class: string;
  courseId: string;
  subjectId: string;
  day: string;
  teacherName: string;
}

/** The grid, keyed by day name. */
export type TimetableGridData = Record<string, TimetableEntry[]>;

/** The dashed pastel a placed lesson is drawn in. */
export interface EntryColorScheme {
  bg: string;
  border: string;
  dash: string;
}

/** The palette a lesson card is coloured from, in order. */
export const ENTRY_COLORS: EntryColorScheme[] = [
  { bg: "bg-[#FAEBEB] dark:bg-[#CC3333]/15", border: "border-[#CC3333]", dash: "border-dashed" },
  { bg: "bg-[#FF9933]/15", border: "border-[#FF9933]", dash: "border-dashed" },
  { bg: "bg-[#D6EDE1] dark:bg-[#2E8B57]/15", border: "border-[#2E8B57]", dash: "border-dashed" },
  { bg: "bg-[#6A5ACD]/15", border: "border-[#6A5ACD]", dash: "border-dashed" },
  { bg: "bg-[#FFF7E5] dark:bg-[#FFB400]/15", border: "border-[#FFB400]", dash: "border-dashed" },
];

/**
 * The colour for a lesson card.
 *
 * Derived from the course id rather than drawn at random, so a card keeps its
 * colour across renders and every session of the same course matches.
 *
 * @param courseId - The course the lesson teaches.
 * @returns One of `ENTRY_COLORS`.
 */
export function colorForCourse(courseId: string | undefined): EntryColorScheme {
  if (!courseId) return ENTRY_COLORS[0];
  let hash = 0;
  for (let i = 0; i < courseId.length; i += 1) {
    hash = (hash * 31 + courseId.charCodeAt(i)) % 1_000_003;
  }
  return ENTRY_COLORS[hash % ENTRY_COLORS.length];
}

/**
 * Puts a time into the grid's comparison form, `H:mm` with no leading zero.
 *
 * The API has stored times as "08:00", "8:00" and "08:00 AM" at different
 * points, and the grid has to match a slot against all three.
 *
 * @param value - A time in any of those forms.
 * @returns The normalised time, or "" when there was none.
 */
export function normalizeTime(value: string | undefined): string {
  if (!value) return "";

  if (value.includes("AM") || value.includes("PM")) {
    const [time, modifier] = value.split(" ");
    const [rawHours, minutes = "00"] = time.split(":");
    let hours = rawHours;
    if (hours === "12") hours = "00";
    if (modifier === "PM" && hours !== "12") hours = String(parseInt(hours, 10) + 12);
    if (modifier === "AM" && hours === "12") hours = "00";
    return `${parseInt(hours, 10)}:${minutes}`;
  }

  const [hours, minutes = "00"] = value.split(":");
  return `${parseInt(hours, 10)}:${minutes}`;
}

/**
 * Puts a slot time into the `HH:mm` form the API stores.
 *
 * @param value - A slot time such as "8:00".
 * @returns The padded time, e.g. "08:00".
 */
export function toApiTime(value: string): string {
  const [hours, minutes = "00"] = value.split(":");
  return `${hours.padStart(2, "0")}:${minutes}`;
}

/**
 * Finds the lesson sitting in one cell of the grid.
 *
 * @param grid - The timetable by day.
 * @param day - Column to look in.
 * @param slot - Row to look in.
 * @returns The entry, or undefined when the cell is free.
 */
export function entryForSlot(
  grid: TimetableGridData,
  day: string,
  slot: TimeSlot
): TimetableEntry | undefined {
  return (grid[day] ?? []).find(
    (entry) =>
      normalizeTime(entry.startTime) === slot.start && normalizeTime(entry.endTime) === slot.end
  );
}

/**
 * The subject id on a course, whether the API populated it or not.
 *
 * @param course - The course.
 * @returns The subject id, or "" when there is none.
 */
export function courseSubjectId(course: TimetableCourse): string {
  return (typeof course.subjectId === "string" ? course.subjectId : course.subjectId?._id) ?? "";
}

/**
 * The subject name to show for a course.
 *
 * @param course - The course.
 * @returns The subject's name or code, else "Subject".
 */
export function courseSubjectName(course: TimetableCourse): string {
  if (typeof course.subjectId === "string") return "Subject";
  return course.subjectId?.name || course.subjectId?.code || "Subject";
}

/**
 * Builds the teacher-id → display-name map the grid needs when the API sends a
 * course's `teacherId` as a bare id.
 *
 * Both the teacher record's id and its inner user id are indexed, because
 * courses reference one or the other depending on how they were created.
 *
 * @param teachers - Rows from the teacher directory.
 * @returns The lookup map.
 */
export function buildTeacherNameMap(teachers: TeacherDirectoryEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  teachers.forEach((t) => {
    const id = t._id ?? t.id;
    const user = typeof t.userId === "object" ? t.userId : null;
    const name =
      `${user?.firstName ?? t.firstName ?? ""} ${user?.lastName ?? t.lastName ?? ""}`.trim() ||
      user?.email ||
      t.email ||
      "Teacher";
    if (id) map.set(id, name);
    if (user?._id) map.set(user._id, name);
  });
  return map;
}

/**
 * The teacher's name for a course.
 *
 * @param course - The course, or undefined when it could not be resolved.
 * @param teacherNames - Map from `buildTeacherNameMap`.
 * @returns The teacher's name, or "Unassigned".
 */
export function courseTeacherName(
  course: TimetableCourse | undefined,
  teacherNames: Map<string, string>
): string {
  if (!course?.teacherId) return "Unassigned";

  if (typeof course.teacherId === "string") {
    return teacherNames.get(course.teacherId) || "Unassigned";
  }

  const user = course.teacherId.userId;
  const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  return name || user?.email || "Unassigned";
}

/**
 * The course id on a timetable entry, whether populated or not.
 *
 * @param entry - The entry as the API returned it.
 * @returns The course id, or "".
 */
function entryCourseId(entry: TimetableEntryResponse): string {
  const raw = entry.courseId as unknown;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") return (raw as { _id?: string })._id ?? "";
  return "";
}

/**
 * Turns the API's day-keyed response into the grid's own shape, filling in the
 * course title, subject and teacher the API leaves blank or stubs out as
 * "Unassigned teacher".
 *
 * @param data - The API's timetable for a class.
 * @param courses - The class's courses, for the fields the API omits.
 * @param teacherNames - Map from `buildTeacherNameMap`.
 * @param classId - The class the grid is showing.
 * @returns The grid, ready to render.
 */
export function toGridData(
  data: TimetableByDay,
  courses: TimetableCourse[],
  teacherNames: Map<string, string>,
  classId: string
): TimetableGridData {
  const byId = new Map(courses.map((c) => [c._id, c]));

  return Object.entries(data).reduce<TimetableGridData>((grid, [day, entries]) => {
    grid[day] = (entries ?? []).map((entry) => {
      const courseId = entryCourseId(entry);
      const rawCourse = entry.courseId as unknown;
      const matched =
        rawCourse && typeof rawCourse === "object"
          ? (rawCourse as TimetableCourse)
          : byId.get(courseId);

      const apiTeacher = entry.teacherName;
      const teacherName =
        !apiTeacher || apiTeacher === "Unassigned teacher" || apiTeacher === "Unassigned"
          ? courseTeacherName(matched, teacherNames)
          : apiTeacher;

      return {
        _id: entry._id,
        time: entry.time,
        startTime: entry.startTime || entry.startTIme || "",
        endTime: entry.endTime,
        course: entry.course || matched?.title || "Course",
        subject: entry.subject || (matched ? courseSubjectName(matched) : "Subject"),
        class: classId,
        courseId,
        subjectId: entry.subjectId ?? (matched ? courseSubjectId(matched) : ""),
        day,
        teacherName: teacherName || "Unassigned",
      };
    });
    return grid;
  }, {});
}

/**
 * Whether the grid holds any lesson at all.
 *
 * @param grid - The timetable by day.
 * @returns True when every day is empty.
 */
export function isGridEmpty(grid: TimetableGridData): boolean {
  return Object.values(grid).every((entries) => entries.length === 0);
}
