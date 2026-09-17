/**
 * Student leave requests — the queue a school administrator approves or
 * rejects.
 *
 * Parents raise these from the parent app; this portal only ever reads them
 * and moves them out of `Pending`. The status values are the backend's
 * `LeaveStatus` enum (`Pending`, `Approved`, `Rejected`) and the leave types
 * its `LeaveType` enum — both are title-cased strings, not upper-case ones, so
 * they are declared here rather than derived from a UI label.
 *
 * `GET /leave-requests/school-admin/all` is scoped to the caller's school by
 * the API and needs `MANAGE_LEAVE_REQUESTS`; so does
 * `PUT /leave-requests/:id/status`. Every function throws `ApiError` on a
 * non-2xx response.
 *
 * See `talimBE-V2/src/modules/user/data/dtos/leaveRequest.dto.ts`.
 */
import { api } from "@/lib/apiClient";
import { API_ENDPOINTS } from "../lib/api/config";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Where a request stands (`LeaveStatus` on the backend). */
export type LeaveStatus = "Pending" | "Approved" | "Rejected";

/** Why the leave was asked for (`LeaveType` on the backend). */
export type LeaveType =
  | "Health Issue"
  | "Family Event"
  | "Fees Issue"
  | "Travel"
  | "Emergency"
  | "Other";

/** The student's account, as the API allow-lists it onto a leave request. */
export interface LeaveStudentUser {
  _id: string;
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role?: string;
  schoolId?: string;
  userAvatar?: string;
  isActive?: boolean;
}

/** Whoever the school has on file for the student. */
export interface LeaveParentContact {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
}

/** The student's enrolment record. */
export interface LeaveStudentProfile {
  _id: string;
  userId: string;
  classId?: string;
  gradeLevel?: string;
  parentId?: string;
  parentContact?: LeaveParentContact;
}

/**
 * One leave request.
 *
 * `studentUser` and `studentProfile` are populated by the API but are null
 * when the student record has since been removed — never read through them
 * without a guard.
 */
export interface LeaveRequest {
  _id: string;
  child: string;
  classTeacher?: string;
  term?: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType | string;
  reason?: string;
  attachments?: string[];
  status: LeaveStatus | string;
  viewed?: boolean;
  declineReason?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  studentUser: LeaveStudentUser | null;
  studentProfile: LeaveStudentProfile | null;
}

/**
 * Body of `PUT /leave-requests/:id/status` (`UpdateLeaveRequestDto`).
 *
 * Deciding a request also marks it viewed — the parent app shows an
 * "unopened" flag until it is.
 */
export interface UpdateLeaveStatusPayload {
  status: LeaveStatus;
  viewed?: boolean;
  /** Shown to the parent when a request is rejected. */
  declineReason?: string;
}

// ─── Calls ────────────────────────────────────────────────────────────────────

/**
 * Every leave request raised by a student of the signed-in administrator's
 * school, with the student and parent details attached.
 *
 * The API returns the whole list in one response — there is no server-side
 * pagination for this endpoint.
 *
 * @returns The school's leave requests.
 */
export const getLeaveRequests = (): Promise<LeaveRequest[]> =>
  api.get<LeaveRequest[]>(API_ENDPOINTS.GET_LEAVE_REQUESTS);

/**
 * One leave request, with the student's profile and parent contact.
 *
 * @param leaveId - The leave request's id.
 * @returns The leave request.
 */
export const getLeaveRequestById = (leaveId: string): Promise<LeaveRequest> =>
  api.get<LeaveRequest>(`/leave-requests/${encodeURIComponent(leaveId)}`);

/**
 * Approves or rejects a leave request.
 *
 * Destructive: the parent and the class teacher are notified, so the caller
 * must hold `MANAGE_LEAVE_REQUESTS` — the API refuses otherwise.
 *
 * @param leaveId - The leave request's id.
 * @param payload - The new status, plus a decline reason when rejecting.
 * @returns The updated leave request.
 */
export const updateLeaveRequestStatus = (
  leaveId: string,
  payload: UpdateLeaveStatusPayload
): Promise<LeaveRequest> =>
  api.put<LeaveRequest>(`/leave-requests/${encodeURIComponent(leaveId)}/status`, {
    status: payload.status,
    viewed: payload.viewed ?? true,
    ...(payload.declineReason ? { declineReason: payload.declineReason } : {}),
  });
