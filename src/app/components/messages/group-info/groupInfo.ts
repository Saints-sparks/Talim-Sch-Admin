import { ChatRoomType } from "@/types/chat.types";
import { fileKind, validateFile } from "@/components/chat-kit";

/** Longest group name the API accepts. */
export const NAME_MAX = 80;
/** Longest group description the API accepts. */
export const DESCRIPTION_MAX = 500;

/** The panes of the group-info dialog: "" is the info pane, the rest are shared media. */
export type Section = "" | "Images" | "Videos" | "Links" | "Documents";

/** How each room type is described under the group's name. */
export const ROOM_TYPE_LABELS: Record<string, string> = {
  [ChatRoomType.CLASS_GROUP]: "Class group",
  [ChatRoomType.COURSE_GROUP]: "Subject group",
  [ChatRoomType.ADMIN_PARENT_GROUP]: "Parent group",
  [ChatRoomType.PARENT_GROUP]: "Parent group",
  [ChatRoomType.CUSTOM_GROUP]: "Group",
  [ChatRoomType.ONE_TO_ONE]: "Direct message",
};

/**
 * The line under the group's name: its kind, and for a group its member count.
 *
 * @param type - The room type, if known.
 * @param isGroup - Whether the room is a group (not a direct message).
 * @param memberCount - Participants in the room.
 * @returns e.g. "Class group · 3 members", or "Chat" for an unknown type.
 */
export function roomSubtitle(type: string | undefined, isGroup: boolean, memberCount: number): string {
  const label = ROOM_TYPE_LABELS[type ?? ""] ?? "Chat";
  return isGroup && memberCount > 0 ? `${label} · ${memberCount} member${memberCount === 1 ? "" : "s"}` : label;
}

/**
 * The heading above the member list.
 *
 * @param isGroup - Whether the room is a group.
 * @param memberCount - Participants in the room.
 * @returns "Members (n)" for a group, "People" for a direct message.
 */
export function membersHeading(isGroup: boolean, memberCount: number): string {
  return isGroup ? `Members (${memberCount})` : "People";
}

/** What saving an edited field should do. */
export type SavePlan<T> = { kind: "invalid" } | { kind: "unchanged" } | { kind: "save"; value: T };

/**
 * Decides what to do with an edited group name.
 *
 * @param draft - The name as typed.
 * @param current - The room's saved name.
 * @returns `invalid` when empty or too long, `unchanged` when it equals the
 *   saved name, otherwise `save` with the trimmed name.
 */
export function planNameSave(draft: string, current: string | undefined): SavePlan<string> {
  const next = draft.trim();
  if (!next || next.length > NAME_MAX) return { kind: "invalid" };
  if (next === current) return { kind: "unchanged" };
  return { kind: "save", value: next };
}

/**
 * Decides what to do with an edited group description.
 *
 * @param draft - The description as typed.
 * @param current - The room's saved description.
 * @returns `invalid` when too long, `unchanged` when it equals the saved one,
 *   otherwise `save` with the trimmed text (`null` clears it).
 */
export function planDescriptionSave(draft: string, current: string | undefined): SavePlan<string | null> {
  const next = draft.trim();
  if (next.length > DESCRIPTION_MAX) return { kind: "invalid" };
  if (next === (current ?? "")) return { kind: "unchanged" };
  return { kind: "save", value: next || null };
}

/**
 * Why a file cannot be the group picture.
 *
 * @param file - The chosen file.
 * @returns A message to show, or `null` when the file is an acceptable image.
 */
export function pictureProblem(file: File): string | null {
  return fileKind(file) !== "image" ? "Choose a JPG, PNG, GIF or WebP image" : validateFile(file);
}
