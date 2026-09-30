/**
 * Talim support (`/support`, Round 4 §35): problems reported to the Talim
 * team. Stored apart from school complaints, so the school never sees them,
 * and emailed to support@mytalim.com. Throws `ApiError` on failure.
 */
import { api } from "@/lib/apiClient";
import type { CreateSupportTicketPayload, SupportTicketResponse } from "@/types/round4Contract";

/**
 * Reports a problem to Talim support.
 *
 * @param payload - The area, a 10–2000 character description and where it happened.
 * @returns The ticket's reference, e.g. `TS-4F2K9`, and when it was filed.
 * @throws `ApiError` when the request fails.
 */
export const createSupportTicket = (payload: CreateSupportTicketPayload): Promise<SupportTicketResponse> =>
  api.post<SupportTicketResponse>("/support/tickets", payload);
