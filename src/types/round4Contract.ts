/**
 * Round 4 (Messages, Notifications and Settings) types, from
 * `talimBE-V2/docs/redesign-teachers-round4-inbox-settings.md`. Every wire
 * shape here aliases the generated contract (`./api.d.ts`, as
 * `gradingContract.ts` does), so `tsc` flags any drift; what stays written
 * here is not in the OpenAPI document (the office room type). The section
 * numbers below are the contract's. §35 (the old "Report a problem" route)
 * is gone: tickets are raised in Help & support through `/tickets`
 * (`./tickets.ts`).
 */
import type { Schema } from "./apiContract";

// ─── §27 Room view additions ──────────────────────────────────────────────────

/**
 * What a room is to the viewer (§27). Per viewer: the same room can be a
 * `colleague` chat for one person and something else for another.
 */
export type ChatRoomCategory = Schema<"ChatRoomViewDto">["category"];

/**
 * The per-viewer fields every room list and room read gains (§27): the
 * `category`, a one-line `subtitle` (an admin viewing an office room gets
 * "Office thread · {teacher name}") and `callPhone` (teachers only; always
 * null for admins).
 */
export type RoomViewAdditions = Pick<Schema<"ChatRoomViewDto">, "category" | "subtitle" | "callPhone">;

/**
 * A group admin (Round 4 group info): one of the room view's
 * `admins: { id, name }[]`, `id` being their user id. Group admins may edit
 * the group's name and description like school staff.
 */
export type RoomAdmin = Schema<"ChatRoomAdminDto">;

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

// ─── v1.5 addendum: POST /auth/account/deletion ──────────────────────────────

/** `POST /auth/account/deletion` body: the account's password and an optional reason (at most 500 characters). */
export type AccountDeletionBody = Schema<"RequestAccountDeletionDto">;

/**
 * `GET`/`POST /auth/account/deletion` 200 (`AccountDeletionStatusDto`). After a
 * successful request `status` is `scheduled`, with `requestedAt` and
 * `scheduledFor` (`requestedAt` + 30 days); `none` carries neither.
 */
export type AccountDeletionScheduled = Schema<"AccountDeletionStatusDto">;

/**
 * The password rules the checklist applies: the fields of
 * {@link PasswordPolicyResponse} it reads (`normalizePasswordPolicy` keeps
 * only these; the symbol set is the backend's, fixed in `passwordPolicy.ts`).
 */
export type PasswordPolicy = Pick<
  PasswordPolicyResponse,
  "minLength" | "requireUppercase" | "requireLowercase" | "requireNumber" | "requireSymbol" | "historyCount"
>;

// ─── §36 Office hours ─────────────────────────────────────────────────────────

/**
 * `AcademicSettings.officeHours` (§36): `HH:mm` times; null or absent when the
 * school hasn't set any. Edited through `PATCH /settings/academic`, where
 * `null` clears it.
 */
export type OfficeHours = Schema<"OfficeHoursDto">;
