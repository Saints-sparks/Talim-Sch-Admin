/**
 * Round 4 (Messages, Notifications and Settings) types, hand-written from the
 * contract while the backend is built in parallel:
 * `talimBE-V2/docs/redesign-teachers-round4-inbox-settings.md`.
 *
 * None of these are in the generated contract (`./api.d.ts`) yet. Once the
 * backend lands and `npm run types:api` regenerates it, replace each one with
 * an alias of its `Schema<...>` (as `gradingContract.ts` does) so `tsc` flags
 * any drift. The section numbers below are the contract's.
 */

// ─── §27 Room view additions ──────────────────────────────────────────────────

/**
 * What a room is to the viewer (§27). Per viewer: the same room can be a
 * `colleague` chat for one person and something else for another.
 */
export type ChatRoomCategory = "parent" | "colleague" | "class_group" | "office" | "group";

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

// ─── §28 Office inbox ─────────────────────────────────────────────────────────

/**
 * The room type of a teacher's office thread (§28): one per (school, teacher).
 * Its members are the teacher, every admin and every sub-admin with
 * `manage:messages`; the server keeps that list in step, so nobody adds,
 * removes or leaves.
 */
export const OFFICE_ROOM_TYPE = "office" as const;

// ─── §34 Sessions and password policy ─────────────────────────────────────────

/** One signed-in device, from `GET /auth/sessions` (§34). */
export interface AuthSession {
  id: string;
  /** e.g. "iPhone", "Desktop"; null when the server couldn't tell. */
  device: string | null;
  /** e.g. "Chrome 128". */
  browser: string | null;
  /** e.g. "macOS 15". */
  os: string | null;
  ip: string | null;
  /** ISO date-time the session last refreshed. */
  lastUsedAt: string;
  /** ISO date-time the session signed in. */
  createdAt: string;
  /**
   * The session this request came from (decided by the refresh cookie). When
   * the server can't tell, every entry is false.
   */
  current: boolean;
}

/** `POST /auth/sessions/revoke-others` (§34). */
export interface RevokeOtherSessionsResponse {
  /** How many sessions were signed out. */
  revoked: number;
}

/**
 * `GET /auth/password-policy` (§34, public), from the backend's
 * `security-config.service.ts`.
 */
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSymbol: boolean;
  /** How many previous passwords can't be reused. */
  historyCount: number;
}

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
