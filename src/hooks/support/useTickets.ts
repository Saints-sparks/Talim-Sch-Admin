/**
 * Support tickets (v1.5 §1) on TanStack Query: the school desk's queue and
 * counts, one ticket, the admin's own tickets to Talim, and every write
 * (reply, internal note, status / priority / assignee, escalate, reopen,
 * close, raise).
 *
 * A write's answer is the ticket as it now stands, so it replaces the cached
 * ticket straight away and the lists and counts are refreshed. A 409 (the
 * ticket was closed, escalated, capped or changed meanwhile) or a 404 reads
 * the ticket again, so the screen never acts on a stale copy; the caller
 * shows `ticketErrorMessage(error)`.
 */
"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useSchoolId } from "@/hooks/useSchoolId";
import { queryKeys, staleTimes } from "@/lib/queryKeys";
import { logger } from "@/lib/logger";
import { ticketService } from "@/app/services/ticket.service";
import { uploadFileAttachment } from "@/app/services/files.service";
import { uploadAttachments } from "@/components/chat-kit";
import { shouldRefetchAfter } from "@/components/support/ticket.presentation";
import type {
  AddTicketMessageBody,
  CreateTicketBody,
  DeskTicketQuery,
  MyTicketQuery,
  Ticket,
  TicketAttachment,
  TicketDeskCounts,
  TicketListResponse,
  UpdateTicketBody,
} from "@/types/tickets";

/**
 * The school desk's queue for the given filters.
 *
 * @param query - Status, area, priority, assignee, search and paging.
 * @param enabled - False to hold the request (the viewer is not desk staff).
 * @returns The query.
 */
export function useDeskQueue(
  query: DeskTicketQuery,
  enabled = true
): UseQueryResult<TicketListResponse> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.tickets.desk(schoolId ?? "none", query as Record<string, unknown>),
    queryFn: () => ticketService.schoolDesk(query),
    enabled: Boolean(schoolId) && enabled,
    staleTime: staleTimes.list,
    placeholderData: (previous) => previous,
  });
}

/**
 * The school desk's counts for the status tabs and the Unassigned / Mine
 * shortcuts.
 *
 * @param enabled - False to hold the request.
 * @returns The query.
 */
export function useDeskCounts(enabled = true): UseQueryResult<TicketDeskCounts> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: queryKeys.tickets.deskCounts(schoolId ?? "none"),
    queryFn: () => ticketService.schoolDeskCounts(),
    enabled: Boolean(schoolId) && enabled,
    staleTime: staleTimes.live,
  });
}

/**
 * The signed-in admin's own tickets (to Talim).
 *
 * @param query - Statuses and paging.
 * @returns The query.
 */
export function useMyTickets(query: MyTicketQuery): UseQueryResult<TicketListResponse> {
  const { user } = useAuth();
  const userId = user?.userId ?? "";
  return useQuery({
    queryKey: queryKeys.tickets.mine(userId || "none", query as Record<string, unknown>),
    queryFn: () => ticketService.mine(query),
    enabled: Boolean(userId),
    staleTime: staleTimes.list,
    placeholderData: (previous) => previous,
  });
}

/**
 * One ticket with its messages.
 *
 * @param id - The ticket id ("" holds the request).
 * @returns The query.
 */
export function useTicket(id: string): UseQueryResult<Ticket> {
  return useQuery({
    queryKey: queryKeys.tickets.detail(id),
    queryFn: () => ticketService.get(id),
    enabled: Boolean(id),
    staleTime: staleTimes.live,
  });
}

/**
 * Stores a ticket a write answered with and refreshes every list and count
 * (but not the ticket itself, which is now current).
 *
 * @param client - The query client.
 * @param ticket - The ticket after the write.
 */
function storeTicket(client: QueryClient, ticket: Ticket): void {
  client.setQueryData(queryKeys.tickets.detail(ticket.id), ticket);
  void client.invalidateQueries({
    queryKey: queryKeys.tickets.all,
    // Not the ticket itself (now current) nor the staff list (unchanged by a ticket write).
    predicate: (query) => query.queryKey[1] !== "detail" && query.queryKey[2] !== "deskStaff",
  });
}

/**
 * After a failed write: a 409 or 404 means the ticket on screen is stale, so
 * it and the lists are read again.
 *
 * @param client - The query client.
 * @param id - The ticket id.
 * @param error - What the write threw.
 */
function recoverFrom(client: QueryClient, id: string, error: unknown): void {
  logger.warn("support", "a ticket write failed", error);
  if (!shouldRefetchAfter(error)) return;
  void client.invalidateQueries({ queryKey: queryKeys.tickets.all });
  void client.invalidateQueries({ queryKey: queryKeys.tickets.detail(id) });
}

/** A file to attach, and its upload once done (a retry skips finished uploads). */
export interface PendingAttachment {
  file: File;
  uploaded?: TicketAttachment;
}

/**
 * Uploads the files that are not uploaded yet with the app's upload route
 * (`POST /upload/file`), two at a time, and returns them as ticket
 * attachments in order.
 *
 * @param items - The files, with any finished uploads.
 * @param onUploaded - Called as each file finishes, so a retry can skip it.
 * @returns The attachments.
 */
export async function uploadTicketAttachments(
  items: PendingAttachment[],
  onUploaded?: (index: number, attachment: TicketAttachment) => void
): Promise<TicketAttachment[]> {
  const sendable = await uploadAttachments(
    items.map((item) => ({
      file: item.file,
      uploaded: item.uploaded ? { ...item.uploaded, type: "file" as const } : undefined,
    })),
    async (file, onProgress) => ({
      url: await uploadFileAttachment(file, (percent) => onProgress?.(percent / 100)),
    }),
    {
      concurrency: 2,
      onItemUploaded: (index, attachment) =>
        onUploaded?.(index, {
          url: attachment.url,
          name: attachment.name,
          mimeType: attachment.mimeType,
          size: attachment.size,
        }),
    }
  );
  return sendable.map((a) => ({ url: a.url, name: a.name, mimeType: a.mimeType, size: a.size }));
}

/**
 * Every write on one ticket. Each mutation's data is the ticket after it.
 *
 * @param id - The ticket id.
 * @returns The reply, update, escalate, reopen and close mutations.
 */
export function useTicketActions(id: string) {
  const client = useQueryClient();
  const options = {
    onSuccess: (ticket: Ticket) => storeTicket(client, ticket),
    onError: (error: unknown) => recoverFrom(client, id, error),
  };
  return {
    reply: useMutation({
      mutationFn: (body: AddTicketMessageBody) => ticketService.reply(id, body),
      ...options,
    }),
    update: useMutation({
      mutationFn: (body: UpdateTicketBody) => ticketService.update(id, body),
      ...options,
    }),
    escalate: useMutation({
      mutationFn: (note: string) => ticketService.escalate(id, { note }),
      ...options,
    }),
    reopen: useMutation({ mutationFn: () => ticketService.reopen(id), ...options }),
    close: useMutation({ mutationFn: () => ticketService.close(id), ...options }),
  };
}

/**
 * Raises a ticket (School Admin raises them to Talim).
 *
 * @returns The mutation; its data is the new ticket.
 */
export function useCreateTicket() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTicketBody) => ticketService.create(body),
    onSuccess: (ticket: Ticket) => storeTicket(client, ticket),
    onError: (error: unknown) => logger.warn("support", "raising a ticket failed", error),
  });
}
