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
  page: number = 1,
  limit: number = 10
): Promise<AnnouncementResponse> => {
  try {
    const response = await apiClient.get(
      API_ENDPOINTS.GET_ANNOUNCEMENTS_BY_SENDER(senderId, page, limit)
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
