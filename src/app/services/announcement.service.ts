/**
 * School announcements — the broadcast messages an administrator sends to
 * parents, students and teachers.
 *
 * Every payload mirrors `CreateAnnouncementDto` in
 * `talimBE-V2/src/modules/notification/data/dtos/create-announcement.dto.ts`.
 * The audience values are the backend's `AnnouncementAudience` enum
 * (`all_parents`, `all_students`, `all_teachers`, `custom`); `custom` is only
 * valid together with a non-empty `targetAudience` of user ids, so the UI
 * offers the three broadcast audiences only.
 *
 * The school is taken from the bearer token by the API; no call sends a
 * school id. Every function throws `ApiError` on a non-2xx response.
 */
import { api } from "@/lib/apiClient";
import { API_ENDPOINTS } from "../lib/api/config";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Lifecycle of an announcement (`AnnouncementStatus` on the backend). */
export type AnnouncementStatus = "PENDING" | "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

/** Who a broadcast reaches (`AnnouncementAudience` on the backend). */
export type AnnouncementAudience = "all_parents" | "all_students" | "all_teachers" | "custom";

/** Body of `POST /notifications/announcements` (`CreateAnnouncementDto`). */
export interface Announcement {
  title: string;
  content: string;
  /** Single attachment URL. The API merges it with `attachments`. */
  attachment?: string;
  attachments?: string[];
  audience?: AnnouncementAudience[];
  /** User ids — required by the API when `audience` contains `custom`. */
  targetAudience?: string[];
  status?: AnnouncementStatus;
  /** ISO timestamp; only meaningful with `status: "SCHEDULED"`. */
  scheduledFor?: string;
  isPinned?: boolean;
}

/** Query string accepted by `GET /notifications/announcements/sender/:id`. */
export interface AnnouncementQuery {
  page?: number;
  limit?: number;
  status?: AnnouncementStatus;
  search?: string;
}

/** One announcement as the API returns it. */
export interface CreateAnnouncementResponse {
  id: string;
  title: string;
  content: string;
  attachment?: string;
  attachments?: string[];
  audience?: string[];
  targetAudience?: string[];
  status?: string;
  scheduledFor?: string;
  publishedAt?: string;
  isPinned?: boolean;
  readRate?: number;
  readCount?: number;
  audienceCount?: number;
  hasAttachment?: boolean;
  createdAt: string;
  reactions: Record<string, number>;
}

/** Pagination envelope the announcement list is wrapped in. */
export interface AnnouncementMeta {
  total: number;
  page: number;
  lastPage: number;
  limit: number;
}

/** Body of `GET /notifications/announcements/sender/:id`. */
export interface AnnouncementResponse {
  data: CreateAnnouncementResponse[];
  meta: AnnouncementMeta;
}

/** One day of the read-activity chart. */
export interface AnnouncementDailyViews {
  date: string;
  views: number;
}

/** Body of `GET /notifications/announcements/sender/:id/stats`. */
export interface AnnouncementStats {
  totalAnnouncements: number;
  published: number;
  scheduled: number;
  drafts: number;
  archived: number;
  readRate: number;
  parentEngagement: number;
  studentEngagement: number;
  dailyViews: AnnouncementDailyViews[];
  weeklyChange?: {
    totalAnnouncements: number;
    published: number;
    scheduled: number;
    drafts: number;
  };
}

// ─── Calls ────────────────────────────────────────────────────────────────────

/**
 * Creates an announcement and sends it to the chosen audiences.
 *
 * @param announcement - Title, content and audience, plus an optional
 *   attachment and schedule.
 * @returns The created announcement.
 */
export const createAnnouncement = (announcement: Announcement): Promise<CreateAnnouncementResponse> =>
  api.post<CreateAnnouncementResponse>(API_ENDPOINTS.CREATE_ANNOUNCEMENT, announcement);

/**
 * One page of the announcements a sender has written, newest first.
 *
 * Filtering is done by the API, not in the browser: a status or search term
 * belongs in the query so the pagination counts stay honest.
 *
 * @param senderId - The author's user id.
 * @param queryOrPage - Page, limit, status and search. A bare number is the
 *   legacy `(page, limit)` form and is still accepted.
 * @param legacyLimit - Page size, when `queryOrPage` is a page number.
 * @returns The page of announcements and its pagination meta.
 */
export const getAnnouncementsBySender = (
  senderId: string,
  queryOrPage: AnnouncementQuery | number = {},
  legacyLimit?: number
): Promise<AnnouncementResponse> => {
  const query: AnnouncementQuery =
    typeof queryOrPage === "number" ? { page: queryOrPage, limit: legacyLimit } : queryOrPage;

  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(query.limit ?? 10),
  });
  if (query.status) params.set("status", query.status);
  if (query.search) params.set("search", query.search);

  return api.get<AnnouncementResponse>(
    `${API_ENDPOINTS.GET_ANNOUNCEMENTS_BY_SENDER(senderId)}?${params.toString()}`
  );
};

/**
 * Dashboard counters and engagement rates for one sender's announcements.
 *
 * @param senderId - The author's user id.
 * @returns Totals per status, read rates and the last week of views.
 */
export const getAnnouncementStatsBySender = (senderId: string): Promise<AnnouncementStats> =>
  api.get<AnnouncementStats>(API_ENDPOINTS.GET_ANNOUNCEMENT_STATS_BY_SENDER(senderId));
