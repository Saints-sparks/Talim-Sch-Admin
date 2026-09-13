import { api } from "@/lib/apiClient";
import { API_URLS } from "../lib/api/config";

interface ComplaintUser {
  _id: string;
  userId: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  schoolId: string;
}

export interface Complaint {
  _id: string;
  ticket: string;
  userId: ComplaintUser;
  subject: string;
  description: string;
  attachment?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** Body for `POST /complaints`. The server issues the ticket number and sets the status. */
export interface CreateComplaintInput {
  subject: string;
  description: string;
  attachment?: string;
}

/** Complaints raised by the signed-in admin. */
export const complaintService = {
  /**
   * Raises a complaint.
   *
   * @param complaint - Subject, description and optional attachment URL.
   */
  createComplaint: (complaint: CreateComplaintInput): Promise<Complaint> =>
    api.post<Complaint>(API_URLS.COMPLAINTS.CREATE_COMPLAINT, complaint),

  /** Lists the signed-in admin's complaints. */
  getComplaints: (): Promise<Complaint[]> => api.get<Complaint[]>(API_URLS.COMPLAINTS.GET_COMPLAINTS),

  /**
   * Loads one complaint by its ticket number.
   *
   * @param ticket - Ticket number, e.g. `TCKT-8F3K2Q9D`.
   */
  getComplaintByTicket: (ticket: string): Promise<Complaint> =>
    api.get<Complaint>(API_URLS.COMPLAINTS.GET_COMPLAINT_BY_TICKET.replace(":ticket", encodeURIComponent(ticket))),
};
