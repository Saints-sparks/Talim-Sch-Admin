import { API_ENDPOINTS } from './api/urls';
import { getLocalStorageItem } from '../lib/localStorage';
import { toast } from 'react-toastify';

export interface TimetableEntry {
  id: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  teacherId: string;
  classroom: string;
  status: string;
}

export interface TimetableMeta {
  total: number;
  page: number;
  lastPage: number;
  limit: number;
}

export interface TimetableResponse {
  data: TimetableEntry[];
  meta: TimetableMeta;
}

export const createTimetableEntry = async (entry: Omit<TimetableEntry, 'id' | 'status'>): Promise<TimetableEntry> => {
  const senderId = getLocalStorageItem('user')?.userId;

  if (!senderId) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.CREATE_TIMETABLE_ENTRY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({
        ...entry,
        senderId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create timetable entry');
    }

    const data: TimetableEntry = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to create timetable entry. Please try again.');
    throw error;
  }
};

export const getTimetable = async (page: number = 1, limit: number = 10): Promise<TimetableResponse> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.GET_TIMETABLE}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch timetable');
    }

    const data: TimetableResponse = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to fetch timetable. Please try again.');
    throw error;
  }
};

export const getTimetableByDay = async (day: string): Promise<TimetableEntry[]> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.GET_TIMETABLE_BY_DAY.replace(':day', day)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch timetable for day');
    }

    const data: TimetableEntry[] = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to fetch timetable for day. Please try again.');
    throw error;
  }
};

export const updateTimetableEntry = async (entryId: string, entry: Partial<TimetableEntry>): Promise<TimetableEntry> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.UPDATE_TIMETABLE_ENTRY.replace(':entryId', entryId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update timetable entry');
    }

    const data: TimetableEntry = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to update timetable entry. Please try again.');
    throw error;
  }
};

export const deleteTimetableEntry = async (entryId: string): Promise<void> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.DELETE_TIMETABLE_ENTRY.replace(':entryId', entryId)}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete timetable entry');
    }

    toast.success('Timetable entry deleted successfully');
  } catch (error) {
    toast.error('Failed to delete timetable entry. Please try again.');
    throw error;
  }
};
