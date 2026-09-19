/**
 * Request payloads for every write endpoint the School Admin app calls, taken
 * from the backend contract (`./api.d.ts`) instead of written by hand.
 *
 * A service that types its parameter with one of these aliases makes `tsc`
 * compare the object the app builds with the backend DTO. The API runs
 * `whitelist + forbidNonWhitelisted`, so a missing required field, a wrong enum
 * value or one extra property is a 400 in production; here it is a compile
 * error the next time the contract is refreshed (`npm run types:api`).
 *
 * Deliberately NOT here (the generated type is too loose or wrong, so the
 * hand-written type stays in the service; see each service's comment):
 * - `POST/PUT /subjects-courses/courses`: the contract documents an outdated
 *   `@ApiBody` (`subjectName`), while the validated DTO needs `subjectId`.
 * - `POST /subjects-courses/subjects`, `POST /timetable`: ids are typed as
 *   `Record<string, never>` (a raw ObjectId), which no string satisfies.
 * - `PUT /auth/profile/avatar`: documented as multipart only; the app sends
 *   `{ avatarUrl }` as JSON, which the endpoint also accepts.
 */
import type { RequestBody } from "./apiContract";

// ─── Fees ─────────────────────────────────────────────────────────────────────

/** Body of `POST /fees/categories`. */
export type CreateFeeCategoryPayload = RequestBody<"/fees/categories", "post">;
/** Body of `PATCH /fees/categories/{id}`. */
export type UpdateFeeCategoryPayload = RequestBody<"/fees/categories/{id}", "patch">;
/** Body of `POST /fees/items`. */
export type CreateFeeItemPayload = RequestBody<"/fees/items", "post">;
/** Body of `PATCH /fees/items/{id}`. */
export type UpdateFeeItemPayload = RequestBody<"/fees/items/{id}", "patch">;
/** Body of `POST /fees/assignments`. */
export type AssignFeePayload = RequestBody<"/fees/assignments", "post">;
/** One class's terms inside `AssignFeePayload`. */
export type ClassAssignmentOverride = AssignFeePayload["classes"][number];
/** Body of `PATCH /fees/assignments/{id}`. */
export type UpdateFeeAssignmentPayload = RequestBody<"/fees/assignments/{id}", "patch">;
/** Body of `PATCH /fees/receipt-settings`. */
export type UpdateFeeReceiptSettingsPayload = RequestBody<"/fees/receipt-settings", "patch">;

// ─── Finance ──────────────────────────────────────────────────────────────────

/** Body of `POST /finance/bank-accounts`. */
export type AddBankAccountPayload = RequestBody<"/finance/bank-accounts", "post">;
/** Body of `POST /finance/withdrawals/initiate`. */
export type InitiateWithdrawalPayload = RequestBody<"/finance/withdrawals/initiate", "post">;
/** Body of `POST /finance/withdrawals/resend-otp`. */
export type ResendWithdrawalOtpPayload = RequestBody<"/finance/withdrawals/resend-otp", "post">;
/** Body of `POST /finance/withdrawals/verify-otp`. */
export type VerifyWithdrawalOtpPayload = RequestBody<"/finance/withdrawals/verify-otp", "post">;
/** Body of `POST /finance/withdrawals/confirm`. */
export type ConfirmWithdrawalPayload = RequestBody<"/finance/withdrawals/confirm", "post">;
/** Body of `POST /finance/security/2fa/verify`. */
export type Verify2faPayload = RequestBody<"/finance/security/2fa/verify", "post">;
/** Body of `POST /finance/security/2fa/disable`. */
export type Disable2faPayload = RequestBody<"/finance/security/2fa/disable", "post">;
/** Body of `PATCH /finance/security/withdrawals/require-2fa`. */
export type Require2faPayload = RequestBody<"/finance/security/withdrawals/require-2fa", "patch">;

// ─── Payments ─────────────────────────────────────────────────────────────────

/** Body of `POST /payments/admin/manual-payment`. */
export type ManualPaymentPayload = RequestBody<"/payments/admin/manual-payment", "post">;
/** Body of `POST /payments/admin/transactions/{transactionId}/refund`. */
export type RefundPaymentPayload = RequestBody<
  "/payments/admin/transactions/{transactionId}/refund",
  "post"
>;

// ─── Users: accounts, teachers, students, classes ─────────────────────────────

/** Body of `POST /auth/register` (any role). */
export type RegisterUserPayload = RequestBody<"/auth/register", "post">;
/**
 * Body of `POST /teachers/{userId}`. The generated `CreateTeacherDto` also lists
 * `userId`, `schoolId` and `staffNumber`, which the class declares without
 * validators (the server fills them, and the whitelist rejects them from a
 * client), so they are removed here.
 */
export type CreateTeacherProfilePayload = Omit<
  RequestBody<"/teachers/{userId}", "post">,
  "userId" | "schoolId" | "staffNumber"
>;
/** Body of `PATCH /teachers/{userId}/personal-details`. */
export type TeacherPersonalDetailsPayload = RequestBody<
  "/teachers/{userId}/personal-details",
  "patch"
>;
/** Body of `PATCH /teachers/{userId}/qualification-details`. */
export type TeacherQualificationsPayload = RequestBody<
  "/teachers/{userId}/qualification-details",
  "patch"
>;
/** Body of `PUT /teachers/{userId}/employment`. */
export type TeacherEmploymentPayload = RequestBody<"/teachers/{userId}/employment", "put">;
/** Body of `PATCH /teachers/{userId}/availability`. */
export type TeacherAvailabilityPayload = RequestBody<"/teachers/{userId}/availability", "patch">;
/** Body of `PATCH /teachers/{userId}/class-course-assignments`. */
export type TeacherAssignmentsPayload = RequestBody<
  "/teachers/{userId}/class-course-assignments",
  "patch"
>;
/** Body of `PUT /users/teachers/{id}/status`. */
export type UpdateTeacherStatusPayload = RequestBody<"/users/teachers/{id}/status", "put">;
/** Body of `POST /students`. */
export type CreateStudentProfilePayload = RequestBody<"/students", "post">;
/** Body of `PUT /students/{id}`. */
export type UpdateStudentPayload = RequestBody<"/students/{id}", "put">;
/** Body of `POST /classes`. */
export type CreateClassPayload = RequestBody<"/classes", "post">;
/** Body of `PUT /classes/{id}`: the whole `CreateClassDto`, not a partial. */
export type UpdateClassPayload = RequestBody<"/classes/{id}", "put">;
/** Body of `PUT /classes/{id}/assign-teacher`. */
export type AssignTeacherPayload = RequestBody<"/classes/{id}/assign-teacher", "put">;

// ─── Sub-admins ───────────────────────────────────────────────────────────────

/** Body of `POST /sub-admins`. */
export type CreateSubAdminPayload = RequestBody<"/sub-admins", "post">;
/** Body of `POST /sub-admins/promote-teacher`. */
export type PromoteTeacherPayload = RequestBody<"/sub-admins/promote-teacher", "post">;
/** Body of `PATCH /sub-admins/{userId}/permissions`. */
export type UpdateSubAdminPermissionsPayload = RequestBody<
  "/sub-admins/{userId}/permissions",
  "patch"
>;

// ─── Announcements, leave, complaints, notifications ──────────────────────────

/** Body of `POST /notifications/announcements`. */
export type CreateAnnouncementPayload = RequestBody<"/notifications/announcements", "post">;
/** Body of `PUT /leave-requests/{id}/status` (approve / reject). */
export type UpdateLeaveStatusPayload = RequestBody<"/leave-requests/{id}/status", "put">;
/** Body of `POST /complaints`. */
export type CreateComplaintPayload = RequestBody<"/complaints", "post">;
/** Body of `PATCH /notifications/preferences`. */
export type UpdateNotificationPreferencePayload = RequestBody<
  "/notifications/preferences",
  "patch"
>;
/** Body of `POST /notifications/web-push/subscribe`. */
export type CreateWebPushSubscriptionPayload = RequestBody<
  "/notifications/web-push/subscribe",
  "post"
>;
/** Body of `DELETE /notifications/web-push/subscribe`. */
export type DeleteWebPushSubscriptionPayload = RequestBody<
  "/notifications/web-push/subscribe",
  "delete"
>;

// ─── Settings, school, academic calendar ──────────────────────────────────────

/** Body of `PATCH /settings/school-profile`. */
export type UpdateSchoolProfilePayload = RequestBody<"/settings/school-profile", "patch">;
/** Body of `PATCH /settings/receipt`. */
export type UpdateReceiptSettingsPayload = RequestBody<"/settings/receipt", "patch">;
/** Body of `PATCH /settings/finance`. */
export type UpdateFinanceSettingsPayload = RequestBody<"/settings/finance", "patch">;
/** Body of `PUT /schools/update/{id}`. */
export type UpdateSchoolPayload = RequestBody<"/schools/update/{id}", "put">;
/** Body of `POST /academic-year-term/academic-year`. */
export type CreateAcademicYearPayload = RequestBody<"/academic-year-term/academic-year", "post">;
/** Body of `POST /academic-year-term/term`. */
export type CreateTermPayload = RequestBody<"/academic-year-term/term", "post">;

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Body of `POST /auth/change-password`. */
export type ChangePasswordPayload = RequestBody<"/auth/change-password", "post">;
/** Body of `POST /auth/forgot-password`. */
export type ForgotPasswordPayload = RequestBody<"/auth/forgot-password", "post">;
/** Body of `POST /auth/verify-reset-code`. */
export type VerifyResetCodePayload = RequestBody<"/auth/verify-reset-code", "post">;
/** Body of `POST /auth/reset-password`. */
export type ResetPasswordPayload = RequestBody<"/auth/reset-password", "post">;
/** Body of `POST /auth/login`. */
export type LoginPayload = RequestBody<"/auth/login", "post">;
/** Body of `PUT /auth/profile/update`. */
export type UpdateProfilePayload = RequestBody<"/auth/profile/update", "put">;

// ─── Assessments, transit ─────────────────────────────────────────────────────

/** Body of `POST /assessments`. */
export type CreateAssessmentPayload = RequestBody<"/assessments", "post">;
/** Body of `PUT /assessments/{id}`. */
export type UpdateAssessmentPayload = RequestBody<"/assessments/{id}", "put">;
/** Body of `POST /transit/transfers`. */
export type CreateTransferPayload = RequestBody<"/transit/transfers", "post">;
/** Body of `POST /transit/transfers/{id}/reject`. */
export type RejectTransferPayload = RequestBody<"/transit/transfers/{id}/reject", "post">;
/** Body of `POST /transit/transfers/{id}/cancel`. */
export type CancelTransferPayload = RequestBody<"/transit/transfers/{id}/cancel", "post">;
/** Body of `POST /transit/promotions`. */
export type CreatePromotionRunPayload = RequestBody<"/transit/promotions", "post">;
/** Body of `POST /transit/enrollments`. */
export type CreateEnrollmentPayload = RequestBody<"/transit/enrollments", "post">;

// ─── Chat ─────────────────────────────────────────────────────────────────────

/** Body of `POST /chat/rooms`. */
export type CreateChatRoomPayload = RequestBody<"/chat/rooms", "post">;
/** Body of `POST /chat/groups`. */
export type CreateGroupChatPayload = RequestBody<"/chat/groups", "post">;
/** Body of `PATCH /chat/rooms/{roomId}`. */
export type UpdateChatRoomPayload = RequestBody<"/chat/rooms/{roomId}", "patch">;
/** Body of `POST /chat/rooms/{roomId}/participants/batch`. */
export type AddParticipantsPayload = RequestBody<"/chat/rooms/{roomId}/participants/batch", "post">;
