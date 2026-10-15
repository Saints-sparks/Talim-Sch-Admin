/**
 * A student's standing as the roster and profile show it: on the roster
 * (active), deactivated, or a former student (graduated, withdrawn, left
 * Talim), and the roster's status filter.
 *
 * `Student.status` (contract history-records-and-transcripts §1) says why a
 * student is off the roster; `isActive` is the roster switch. A missing
 * status reads as `active`, as on the backend.
 */
import type { StudentStatus } from "@/app/services/student.service";
import type { Tone } from "@/components/tl";

/** What the roster shows for a student. */
export type RosterStanding = "active" | "deactivated" | Exclude<StudentStatus, "active">;

/** The students roster's status filter: `""` is every student. */
export type StudentStatusFilter = "" | RosterStanding;

/** The filter's choices, in order. */
export const STUDENT_STATUS_FILTERS: ReadonlyArray<{ value: StudentStatusFilter; label: string }> =
  [
    { value: "", label: "All statuses" },
    { value: "active", label: "Active" },
    { value: "graduated", label: "Graduated" },
    { value: "withdrawn", label: "Withdrawn" },
    { value: "left_talim", label: "Left Talim" },
    { value: "deactivated", label: "Deactivated" },
  ];

/** Badge words and tone per standing. */
export const STUDENT_STANDING: Record<RosterStanding, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "success" },
  deactivated: { label: "Inactive", tone: "muted" },
  graduated: { label: "Graduated", tone: "accent" },
  withdrawn: { label: "Withdrawn", tone: "warning" },
  left_talim: { label: "Left Talim", tone: "muted" },
};

/**
 * A student's standing.
 *
 * @param student - Their status and roster switch.
 * @param student.status - `Student.status`, if the endpoint sent it.
 * @param student.isActive - The roster switch.
 * @returns The standing.
 */
export function standingOf(student: {
  status?: StudentStatus | null;
  isActive?: boolean;
}): RosterStanding {
  if (student.status && student.status !== "active") return student.status;
  return student.isActive === false ? "deactivated" : "active";
}

/**
 * Whether a student passes the status filter.
 *
 * @param student - The roster row.
 * @param student.status - `Student.status`.
 * @param student.isActive - The roster switch.
 * @param filter - The chosen status (`""` passes everyone).
 * @returns True when it matches.
 */
export function matchesStudentStatus(
  student: { status?: StudentStatus | null; isActive?: boolean },
  filter: StudentStatusFilter
): boolean {
  return filter === "" || standingOf(student) === filter;
}

/**
 * Whether a filter asks for former students (graduated, withdrawn, left Talim).
 *
 * @param filter - The chosen status.
 * @returns True for the three former-student statuses.
 */
export function isFormerFilter(filter: StudentStatusFilter): boolean {
  return filter === "graduated" || filter === "withdrawn" || filter === "left_talim";
}

/**
 * Whether the roster rows carry `status` at all. `GET /users/students` does
 * not send it yet, so former students can only be told from deactivated ones
 * once it does.
 *
 * @param rows - The loaded rows.
 * @returns True when any row has a status.
 */
export function rosterHasStatus(rows: ReadonlyArray<{ status?: unknown }>): boolean {
  return rows.some((row) => typeof row.status === "string");
}

/**
 * Whether a student is a former student of the school (alumni mode).
 *
 * @param status - `Student.status`.
 * @returns True for graduated, withdrawn and left Talim.
 */
export function isFormerStudent(status?: StudentStatus | null): boolean {
  return Boolean(status && status !== "active");
}
