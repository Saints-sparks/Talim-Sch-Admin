/**
 * Support complaints — the tickets a school raises with Talim.
 *
 * There are two list endpoints and a school administrator can use both:
 * `GET /complaints/by-school` is the school-staff view (every complaint raised
 * from their school, which is the one the page is for), and
 * `GET /complaints/by-user` is "the ones I raised". The school view is filtered
 * on the complaint's `schoolId`, which was only stamped from the submitter's
 * session after that field was added — complaints raised before then have
 * none, so the administrator's own list is merged in to keep their older
 * tickets visible.
 *
 * The ticket number and the status are server-owned: a complaint is created
 * `Pending` and only the platform admin moves it on
 * (`PATCH /complaints/:id/status`), so nothing here sends either.
 *
 * See `talimBE-V2/src/modules/complaints/controllers/complaints.controllers.ts`.
 * Every function throws `ApiError` on a non-2xx response.
 */
import { api } from "@/lib/apiClient";
import { API_URLS } from "../lib/api/config";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Where a complaint stands (`ComplaintStatus` on the backend). */
export type ComplaintStatus = "Pending" | "In Progress" | "Resolved";

/**
 * Who raised a complaint.
 *
 * The API populates an allow-list of fields (`firstName lastName email role
 * schoolId`) — there is no phone number here, and the whole object is a bare
 * id string on records the populate could not resolve.
 */
export interface ComplaintUser {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  schoolId?: string;
}

/** One support complaint. */
export interface Complaint {
  _id: string;
  /** Server-issued, e.g. `TCKT-8F3K2Q9D`. */
  ticket: string;
  userId: ComplaintUser | string | null;
  subject: string;
  description: string;
  attachment?: string;
  status: ComplaintStatus | string;
  createdAt: string;
  updatedAt: string;
}

/** Body of `POST /complaints` (`CreateComplaintDto`). */
export interface CreateComplaintInput {
  subject: string;
  description: string;
  /** A URL the file service already holds — not a local blob. */
  attachment?: string;
}

/** Newest first, by the date the complaint was raised. */
function byNewest(a: Complaint, b: Complaint): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

// ─── Calls ────────────────────────────────────────────────────────────────────

export const complaintService = {
  /**
   * Raises a complaint. The server issues the ticket number and sets the
   * status, so neither is sent.
   *
   * @param complaint - Subject, description and an optional attachment URL.
   * @returns The created complaint, with its ticket number.
   */
  createComplaint: (complaint: CreateComplaintInput): Promise<Complaint> =>
    api.post<Complaint>(API_URLS.COMPLAINTS.CREATE_COMPLAINT, complaint),

  /**
   * Every complaint raised from the signed-in administrator's school, plus
   * their own, newest first.
   *
   * The two lists overlap and are de-duplicated by id; they are fetched
   * together rather than one after the other.
   *
   * @returns The school's complaints.
   */
  getComplaints: async (): Promise<Complaint[]> => {
    const [school, mine] = await Promise.all([
      api.get<Complaint[]>(API_URLS.COMPLAINTS.GET_COMPLAINTS_BY_SCHOOL),
      api.get<Complaint[]>(API_URLS.COMPLAINTS.GET_COMPLAINTS_BY_USER),
    ]);

    const byId = new Map<string, Complaint>();
    for (const complaint of [...(school ?? []), ...(mine ?? [])]) {
      if (complaint?._id) byId.set(complaint._id, complaint);
    }
    return [...byId.values()].sort(byNewest);
  },

  /**
   * One complaint, by its ticket number or its id.
   *
   * The API serves it to its author, to staff of the author's school, and to
   * the platform admin; anyone else gets `NOT_FOUND`, so tickets cannot be
   * guessed at.
   *
   * @param ticket - Ticket number, e.g. `TCKT-8F3K2Q9D`, or the complaint's id.
   * @returns The complaint.
   */
  getComplaintByTicket: (ticket: string): Promise<Complaint> =>
    api.get<Complaint>(
      API_URLS.COMPLAINTS.GET_COMPLAINT_BY_TICKET.replace(":ticket", encodeURIComponent(ticket))
    ),
};
