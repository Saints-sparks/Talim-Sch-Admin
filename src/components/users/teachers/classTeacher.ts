/**
 * Class teachers after A6: register (and class-teacher) access comes only
 * from `Class.classTeacherId`. A teacher profile's `assignedClasses`, and its
 * `isFormTeacher` flag, no longer grant it. These pure helpers read the class
 * list (one cached `GET /classes`) to say which classes a teacher is the class
 * teacher of, and word the hint for the others.
 */

/** The rule every hint repeats. */
export const REGISTER_RULE = "Only a class's class teacher can take its morning register.";

/** A class as the list returns it: `classTeacherId` is a Teacher profile id, bare or populated. */
export interface ClassWithTeacher {
  _id: string;
  name: string;
  classTeacherId?: string | { _id?: string; userId?: unknown } | null;
}

/**
 * The Teacher profile id a class names as its class teacher.
 *
 * @param cls - A class from the list.
 * @returns The profile id, or "" when the class has none.
 */
export function classTeacherRef(cls: Pick<ClassWithTeacher, "classTeacherId">): string {
  const ref = cls.classTeacherId;
  if (!ref) return "";
  if (typeof ref === "string") return ref;
  return typeof ref._id === "string" ? ref._id : ref._id ? String(ref._id) : "";
}

/**
 * The classes whose class teacher is this teacher, in one pass over the list.
 *
 * @param classes - The school's classes.
 * @param teacherProfileId - The teacher's profile id (`Teacher._id`, not the user id).
 * @returns Their class ids.
 */
export function classTeacherClassIds(
  classes: readonly Pick<ClassWithTeacher, "_id" | "classTeacherId">[] | undefined,
  teacherProfileId: string | undefined
): Set<string> {
  const ids = new Set<string>();
  if (!teacherProfileId) return ids;
  for (const cls of classes ?? []) {
    if (classTeacherRef(cls) === teacherProfileId) ids.add(cls._id);
  }
  return ids;
}

/**
 * The name of a class's current class teacher, when the list populated it.
 *
 * @param cls - A class from the list.
 * @returns "First Last", or "" when not populated or none.
 */
export function classTeacherDisplayName(cls: Pick<ClassWithTeacher, "classTeacherId">): string {
  const ref = cls.classTeacherId;
  if (!ref || typeof ref === "string") return "";
  const user = ref.userId as { firstName?: string; lastName?: string } | string | undefined;
  if (!user || typeof user === "string") return "";
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
}

/**
 * Joins names as people write them: "A", "A and B", "A, B and C".
 *
 * @param names - The names.
 * @returns The phrase.
 */
function listNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** What the class-teacher hint says, and about which classes. */
export interface ClassTeacherHint {
  /** Assigned classes this teacher is not the class teacher of. */
  notClassTeacherOf: string[];
  /** The sentence to show, or null when there is nothing to say. */
  text: string | null;
}

/**
 * The hint for a teacher assigned to classes without being their class
 * teacher, e.g. "Assigned to JSS 2B, but not its class teacher. Only a
 * class's class teacher can take its morning register."
 *
 * @param assigned - The classes the teacher is assigned to (id and name).
 * @param classTeacherOf - The class ids the teacher is the class teacher of.
 * @returns The classes concerned and the sentence.
 */
export function classTeacherHint(
  assigned: ReadonlyArray<{ id: string; name: string }>,
  classTeacherOf: ReadonlySet<string>
): ClassTeacherHint {
  const seen = new Set<string>();
  const notClassTeacherOf = assigned
    .filter((cls) => {
      if (seen.has(cls.id) || classTeacherOf.has(cls.id)) return false;
      seen.add(cls.id);
      return true;
    })
    .map((cls) => cls.name || "a class");
  if (notClassTeacherOf.length === 0) return { notClassTeacherOf, text: null };
  const their = notClassTeacherOf.length === 1 ? "its" : "their";
  return {
    notClassTeacherOf,
    text: `Assigned to ${listNames(notClassTeacherOf)}, but not ${their} class teacher. ${REGISTER_RULE}`,
  };
}
