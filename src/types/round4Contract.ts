/**
 * Round 4 (Messages, Notifications and Settings) types, hand-written from the
 * contract while the backend is built in parallel:
 * `talimBE-V2/docs/redesign-teachers-round4-inbox-settings.md`.
 *
 * `ChatRoomCategory` now aliases the generated contract. Replace the others
 * with an alias of their `Schema<...>` (as `gradingContract.ts` does) once
 * the contract has them, so `tsc` flags any drift. The section numbers below are the contract's.
 */
import type { Schema } from "./apiContract";

// ─── §27 Room view additions ──────────────────────────────────────────────────

/**
 * What a room is to the viewer (§27). Per viewer: the same room can be a
 * `colleague` chat for one person and something else for another.
 */
export type ChatRoomCategory = Schema<"ChatRoomViewDto">["category"];

/** The per-viewer fields every room list and room read gains (§27). */
export interface RoomViewAdditions {
  category: ChatRoomCategory;
  /**
   * One line describing the room, e.g. "Parent of Ada Obi · Grade 5A",
   * "Class group · 12 students". An admin viewing an office room gets
   * "Office thread · {teacher name}".
   */
  subtitle: string;
  /** Teachers only (a parent in a one-to-one); always null for admins. */
  callPhone: string | null;
}

/**
 * A group admin (Round 4 group info, not yet in the written contract): the
 * room view's `admins: { id, name }[]`. Group admins may edit the group's
 * name and description like school staff.
 */
export interface RoomAdmin {
  /** The admin's user id. */
  id: string;
  name: string;
}

// ─── §28 Office inbox ─────────────────────────────────────────────────────────

/**
 * The room type of a teacher's office thread (§28): one per (school, teacher).
 * Its members are the teacher, every admin and every sub-admin with
 * `manage:messages`; the server keeps that list in step, so nobody adds,
 * removes or leaves.
 */
export const OFFICE_ROOM_TYPE = "office" as const;

// ─── §34 Sessions and password policy ─────────────────────────────────────────

/**
 * One signed-in device, from `GET /auth/sessions` (§34). `current` marks the
 * session this request came from (decided by the refresh cookie); when the
 * server can't tell, every entry is false.
 */
export type AuthSession = Schema<"SessionDto">;

/** `POST /auth/sessions/revoke-others` (§34): how many sessions were signed out. */
export type RevokeOtherSessionsResponse = Schema<"RevokeOthersDto">;

/** `DELETE /auth/sessions/:id` (§34). */
export type RevokeSessionResponse = Schema<"RevokeSessionDto">;

/** `GET /auth/password-policy` (§34, public), as the server sends it. */
export type PasswordPolicyResponse = Schema<"PasswordPolicyDto">;

/**
 * The password rules the checklist applies: the fields of
 * {@link PasswordPolicyResponse} it reads (`normalizePasswordPolicy` keeps
 * only these; the symbol set is the backend's, fixed in `passwordPolicy.ts`).
 */
export type PasswordPolicy = Pick<
  PasswordPolicyResponse,
  "minLength" | "requireUppercase" | "requireLowercase" | "requireNumber" | "requireSymbol" | "historyCount"
>;

// ─── §35 Support tickets ──────────────────────────────────────────────────────

/** What a support ticket is about (§35). */
export type SupportTicketArea = "grading" | "attendance" | "timetable" | "messages" | "signing_in" | "other";

/** Shortest description `POST /support/tickets` accepts (§35). */
export const SUPPORT_DESCRIPTION_MIN = 10;
/** Longest description `POST /support/tickets` accepts (§35). */
export const SUPPORT_DESCRIPTION_MAX = 2000;

/** Body of `POST /support/tickets` (§35). */
export interface CreateSupportTicketPayload {
  area: SupportTicketArea;
  /** 10–2000 characters. */
  description: string;
  attachmentUrl?: string;
  context?: { path: string; appVersion: string; userAgent: string };
}

/** `POST /support/tickets` answer (§35). */
export interface SupportTicketResponse {
  /** e.g. "TS-4F2K9". */
  reference: string;
  createdAt: string;
}

// ─── §36 Office hours ─────────────────────────────────────────────────────────

/**
 * `AcademicSettings.officeHours` (§36): `HH:mm` times; null or absent when the
 * school hasn't set any. Edited through `PATCH /settings/academic`, where
 * `null` clears it.
 */
export interface OfficeHours {
  start: string;
  end: string;
}
