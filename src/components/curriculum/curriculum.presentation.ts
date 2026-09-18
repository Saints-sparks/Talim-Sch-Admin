/**
 * Display helpers shared by the curriculum screens.
 *
 * The curriculum endpoints return the same reference — a course, a term, a
 * teacher — in several shapes depending on which route populated it, so every
 * screen used to carry its own copy of these fallbacks. They live here once,
 * are pure, and are unit tested.
 */
import type { CurriculumContent, Teacher } from "@/app/services/subjects.service";

/** A person as any of the teacher-shaped payloads carries them. */
export interface PersonLike {
  firstName?: string;
  lastName?: string;
  email?: string;
}

/** A teacher reference: an id, a Teacher document, or a populated user. */
export type TeacherRef =
  | string
  | null
  | undefined
  | (PersonLike & {
      _id?: string;
      userId?: string | (PersonLike & { _id?: string });
    });

/**
 * A person's display name, falling back to their email address.
 *
 * @param person - Any object carrying `firstName` / `lastName` / `email`.
 * @returns The name, the email, or `""` when neither is present.
 */
export function personName(person?: PersonLike | null): string {
  const first = person?.firstName ?? "";
  const last = person?.lastName ?? "";
  const full = `${first} ${last}`.trim();
  return full || person?.email || "";
}

/**
 * How a curriculum entry's course reads in a list: `CODE - Title`.
 *
 * @param course - The entry's course, which the API may leave null.
 * @returns The label to render.
 */
export function courseDisplay(course: CurriculumContent["course"]): string {
  if (!course) return "No course";
  const code = course.courseCode || course.code;
  const name = course.title || course.name || course.description || "No course name";
  return code ? `${code} - ${name}` : name;
}

/**
 * How a curriculum entry's term reads: the name, with its year when known.
 *
 * @param term - The entry's term, which the API may leave null.
 * @returns The label to render.
 */
export function termDisplay(term: CurriculumContent["term"]): string {
  if (!term) return "No term";
  if (term.year) return `${term.name} (${term.year})`;
  if (term.startDate) return `${term.name} (${new Date(term.startDate).getFullYear()})`;
  return term.name;
}

/**
 * The teacher who published a curriculum entry.
 *
 * @param content - The entry; `teacherName` wins over the populated `teacherId`.
 * @returns The teacher's name, or a placeholder.
 */
export function contentTeacherDisplay(content: CurriculumContent): string {
  if (content.teacherName) return content.teacherName;
  const name = personName(content.teacherId);
  return name || "No teacher assigned";
}

/** The id a teacher reference points at, whichever shape it arrived in. */
function teacherRefId(ref: TeacherRef): string {
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  if (typeof ref.userId === "string") return ref.userId;
  return ref.userId?._id || ref._id || "";
}

/**
 * The name of the teacher a course points at.
 *
 * A course's `teacherId` comes back as a bare id on some routes and as a
 * populated teacher (sometimes nested under `userId`) on others. The populated
 * name is used when present; otherwise the id is looked up in the roster.
 *
 * @param ref - The course's teacher reference.
 * @param teachers - The school's teachers, for the id-only case.
 * @returns The teacher's name, or "No teacher".
 */
export function resolveTeacherName(ref: TeacherRef, teachers: Teacher[]): string {
  if (!ref) return "No teacher";

  if (typeof ref === "object") {
    const direct = personName(ref);
    if (direct) return direct;
    if (typeof ref.userId === "object") {
      const nested = personName(ref.userId);
      if (nested) return nested;
    }
  }

  const id = teacherRefId(ref);
  if (!id) return "No teacher";

  const match = teachers.find((teacher) => {
    const userId = typeof teacher.userId === "object" ? teacher.userId?._id : teacher.userId;
    return teacher._id === id || userId === id;
  });
  if (!match) return "No teacher";

  // A roster row carries the name at the top level on the list endpoint and
  // under `userId` when the account came back populated.
  const nested = typeof match.userId === "object" ? personName(match.userId) : "";
  return personName(match) || nested || "No teacher";
}
