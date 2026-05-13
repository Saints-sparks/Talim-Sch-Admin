import { API_ENDPOINTS } from "../lib/api/config";
import { apiClient } from "@/lib/apiClient";

const getErrorMessage = async (response: Response, fallback: string) => {
  const payload = await response.json().catch(() => null);
  const message = payload?.message || payload?.error || fallback;
  return Array.isArray(message) ? message.join(", ") : message;
};

/**
 * Interface for an announcement
 */
export interface Announcement {
  /**
   * Title of the announcement
   */
  title: string;
  /**
   * Content of the announcement
   */
  content: string;
  /**
   * Attachment URL of the announcement (optional)
   */
  attachment?: string;
  attachments?: string[];
  audience?: string[];
  targetAudience?: string[];
  status?: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  scheduledFor?: string;
  isPinned?: boolean;
}

export interface AnnouncementQuery {
  page?: number;
  limit?: number;
  status?: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  search?: string;
}

/**
 * Interface for a create announcement response
 */
export interface CreateAnnouncementResponse {
  /**
   * ID of the announcement
   */
  id: string;
  /**
   * Title of the announcement
   */
  title: string;
  /**
   * Content of the announcement
   */
  content: string;
  /**
   * Attachment URL of the announcement (optional)
   */
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
  /**
   * Created at timestamp of the announcement
   */
  createdAt: string;
  /**
   * Reactions of the announcement
   */
  reactions: Record<string, number>;
}

/**
 * Interface for announcement meta data
 */
export interface AnnouncementMeta {
  /**
   * Total number of announcements
   */
  total: number;
  /**
   * Current page number
   */
  page: number;
  /**
   * Last page number
   */
  lastPage: number;
  /**
   * Limit of announcements per page
   */
  limit: number;
}

/**
 * Interface for an announcement response
 */
export interface AnnouncementResponse {
  /**
   * Array of create announcement responses
   */
  data: CreateAnnouncementResponse[];
  /**
   * Announcement meta data
   */
  meta: AnnouncementMeta;
}

export interface AnnouncementStats {
  totalAnnouncements: number;
  published: number;
  scheduled: number;
  drafts: number;
  archived: number;
  readRate: number;
  parentEngagement: number;
  studentEngagement: number;
  dailyViews: Array<{
    date: string;
    views: number;
  }>;
  weeklyChange?: {
    totalAnnouncements: number;
    published: number;
    scheduled: number;
    drafts: number;
  };
}

/**
 * Creates a new announcement
 * @param announcement Announcement to create
 * @returns Create announcement response
 */
export const createAnnouncement = async (
  announcement: Announcement
): Promise<CreateAnnouncementResponse> => {
  try {
    const response = await apiClient.post(
      `${API_ENDPOINTS.CREATE_ANNOUNCEMENT}`,
      announcement
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, "Failed to create announcement")
      );
    }

    const data: CreateAnnouncementResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to create announcement:", error);
    throw error;
  }
};

/**
 * Gets announcements by sender
 * @param senderId ID of the sender
 * @param page Page number (default: 1)
 * @param limit Limit of announcements per page (default: 10)
 * @returns Announcement response
 */
export const getAnnouncementsBySender = async (
  senderId: string,
  queryOrPage: AnnouncementQuery | number = {},
  legacyLimit?: number
): Promise<AnnouncementResponse> => {
  try {
    const query =
      typeof queryOrPage === "number"
        ? { page: queryOrPage, limit: legacyLimit }
        : queryOrPage;
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    if (query.status) params.set("status", query.status);
    if (query.search) params.set("search", query.search);

    const response = await apiClient.get(
      `${API_ENDPOINTS.GET_ANNOUNCEMENTS_BY_SENDER(senderId)}?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, "Failed to fetch announcements")
      );
    }

    const data: AnnouncementResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch announcements:", error);
    throw error;
  }
};

export const getAnnouncementStatsBySender = async (
  senderId: string
): Promise<AnnouncementStats> => {
  try {
    const response = await apiClient.get(
      API_ENDPOINTS.GET_ANNOUNCEMENT_STATS_BY_SENDER(senderId)
    );

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, "Failed to fetch announcement stats")
      );
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch announcement stats:", error);
    throw error;
  }
};
