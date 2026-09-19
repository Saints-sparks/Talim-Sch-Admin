import { ChatRoomType, type CreateGroupChatDto } from "@/types/chat.types";

/** The four kinds of group an admin can start. */
export type GroupKind = "parent" | "class" | "course" | "custom";

/** The accent colour of a group kind. */
export type GroupColor = "blue" | "green" | "purple" | "orange";

/** One card of the type picker (the icon is added by the component). */
export interface GroupTypeOption {
  kind: GroupKind;
  label: string;
  description: string;
  color: GroupColor;
  badge: string;
}

/** The type picker's cards, in display order. */
export const GROUP_TYPES: GroupTypeOption[] = [
  {
    kind: "parent",
    label: "Parent Group",
    description: "All school parents are added automatically",
    color: "blue",
    badge: "Auto-populates",
  },
  {
    kind: "class",
    label: "Class Group",
    description: "All students in a class are added automatically",
    color: "green",
    badge: "Auto-populates",
  },
  {
    kind: "course",
    label: "Subject / Course Group",
    description: "All students enrolled in a subject are added automatically",
    color: "purple",
    badge: "Auto-populates",
  },
  {
    kind: "custom",
    label: "Custom Group",
    description: "Start blank and add any members manually",
    color: "orange",
    badge: "Manual",
  },
];

/** Tailwind classes for each accent colour. */
export const COLOR_MAP: Record<GroupColor, { bg: string; text: string; border: string; badge: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-500", badge: "bg-blue-100 text-blue-700" },
  green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-500", badge: "bg-green-100 text-green-700" },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-500",
    badge: "bg-purple-100 text-purple-700",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    border: "border-orange-500",
    badge: "bg-orange-100 text-orange-700",
  },
};

/** Classes of the submit button for each accent colour. */
const SUBMIT_CLASS: Record<GroupColor, string> = {
  blue: "bg-blue-600 hover:bg-blue-700",
  green: "bg-green-600 hover:bg-green-700",
  purple: "bg-purple-600 hover:bg-purple-700",
  orange: "bg-orange-500 hover:bg-orange-600",
};

/**
 * The submit button's colour classes.
 *
 * @param color - The chosen kind's accent colour.
 * @returns Background and hover classes.
 */
export function submitButtonClass(color: GroupColor): string {
  return SUBMIT_CLASS[color];
}

/** The success toast noun of each kind. */
const CREATED_LABELS: Record<GroupKind, string> = {
  parent: "Parent group",
  class: "Class group",
  course: "Subject group",
  custom: "Group",
};

/**
 * The success message after creating a group.
 *
 * @param kind - The kind that was created.
 * @param reused - True when an existing class or course group was opened instead.
 * @returns The toast text.
 */
export function createdMessage(kind: GroupKind, reused?: boolean): string {
  return reused ? "Opened the existing group" : `${CREATED_LABELS[kind]} created successfully!`;
}

/**
 * The name input's example text.
 *
 * @param kind - The chosen kind.
 * @returns A placeholder such as "e.g., Grade 5A Chat".
 */
export function namePlaceholder(kind: GroupKind | null): string {
  switch (kind) {
    case "parent":
      return "e.g., School Parents 2025";
    case "class":
      return "e.g., Grade 5A Chat";
    case "course":
      return "e.g., Mathematics Group";
    default:
      return "e.g., Staff Planning Team";
  }
}

/** The form fields that decide whether a group can be created. */
export interface GroupFormValues {
  kind: GroupKind | null;
  name: string;
  classId: string;
  courseId: string;
}

/**
 * Whether the form is complete: a name, plus a class or a subject where the
 * kind needs one.
 *
 * @param values - The form as typed.
 * @returns True when the group can be created.
 */
export function isGroupFormValid({ kind, name, classId, courseId }: GroupFormValues): boolean {
  if (!name.trim()) return false;
  if (kind === "class" && !classId) return false;
  if (kind === "course" && !courseId) return false;
  return true;
}

/**
 * The create request for a valid form. A missing kind is treated as custom.
 *
 * @param values - The valid form.
 * @returns The DTO: the backend room type, the trimmed name, and the class or
 *   subject id where the kind has one.
 */
export function buildGroupPayload({ kind, name, classId, courseId }: GroupFormValues): CreateGroupChatDto {
  const base = { name: name.trim() };
  switch (kind) {
    case "parent":
      return { ...base, type: ChatRoomType.ADMIN_PARENT_GROUP };
    case "class":
      return { ...base, classId, type: ChatRoomType.CLASS_GROUP };
    case "course":
      return { ...base, courseId, type: ChatRoomType.COURSE_GROUP };
    default:
      return { ...base, type: ChatRoomType.CUSTOM_GROUP };
  }
}

/**
 * The "What happens next" bullets.
 *
 * @param kind - The chosen kind.
 * @param schoolName - The admin's school, for the parent group's first bullet.
 * @returns Three short sentences.
 */
export function nextSteps(kind: GroupKind, schoolName?: string): string[] {
  switch (kind) {
    case "parent":
      return [
        `All parents in ${schoolName || "your school"} are auto-added`,
        "You are added as the group admin",
        "New parents can be added later",
      ];
    case "class":
      return [
        "All students in the selected class are auto-added",
        "You are added as the group admin",
        "More members can be added later",
      ];
    case "course":
      return [
        "All students enrolled in the subject are auto-added",
        "You are added as the group admin",
        "More members can be added later",
      ];
    case "custom":
      return [
        "Only you are added initially",
        "Add any members manually from the group info panel",
        "Full control over who can join",
      ];
  }
}

/**
 * A class option's label.
 *
 * @param cls - The class.
 * @returns e.g. "Grade 5A (JSS1)"; without a grade level the name keeps a trailing space, as it always has.
 */
export function classOptionLabel(cls: { name: string; gradeLevel?: string }): string {
  return `${cls.name} ${cls.gradeLevel ? `(${cls.gradeLevel})` : ""}`;
}

/**
 * A subject option's label.
 *
 * @param course - The course.
 * @returns e.g. "Algebra — Mathematics", or just the title.
 */
export function courseOptionLabel(course: { title: string; subjectName?: string }): string {
  return `${course.title}${course.subjectName ? ` — ${course.subjectName}` : ""}`;
}
