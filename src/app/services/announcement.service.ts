import { toast } from 'react-toastify';
import { API_ENDPOINTS } from '../lib/api/config';
import { getLocalStorageItem } from '../lib/localStorage';
import { uploadImage } from './files.service';

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
export const createAnnouncement = async (announcement: Announcement): Promise<CreateAnnouncementResponse> => {
  const senderId = getLocalStorageItem('user')?.userId;

  if (!senderId) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.CREATE_ANNOUNCEMENT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({
        ...announcement,
        senderId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create announcement');
    }

    const data: CreateAnnouncementResponse = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to create announcement. Please try again.');
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
export const getAnnouncementsBySender = async (senderId: string, page: number = 1, limit: number = 10): Promise<AnnouncementResponse> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.GET_ANNOUNCEMENTS_BY_SENDER.replace(':senderId', senderId).replace(':page', page.toString()).replace(':limit', limit.toString())}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch announcements');
    }

    const data: AnnouncementResponse = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to fetch announcements. Please try again.');
    throw error;
  }
};
