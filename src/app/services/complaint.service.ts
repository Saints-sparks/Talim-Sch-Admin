import { API_ENDPOINTS } from './api/urls';
import { getLocalStorageItem } from '../lib/localStorage';
import { toast } from 'react-toastify';

export interface Complaint {
  title: string;
  description: string;
  attachment?: string;
  category: string;
}

export interface ComplaintResponse {
  id: string;
  title: string;
  description: string;
  attachment?: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  senderId: string;
  senderName: string;
  senderRole: string;
}

export interface ComplaintMeta {
  total: number;
  page: number;
  lastPage: number;
  limit: number;
}

export interface ComplaintsResponse {
  data: ComplaintResponse[];
  meta: ComplaintMeta;
}

export const createComplaint = async (complaint: Complaint): Promise<ComplaintResponse> => {
  const senderId = getLocalStorageItem('user')?.userId;

  if (!senderId) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.CREATE_COMPLAINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({
        ...complaint,
        senderId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create complaint');
    }

    const data: ComplaintResponse = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to create complaint. Please try again.');
    throw error;
  }
};

export const getComplaints = async (page: number = 1, limit: number = 10): Promise<ComplaintsResponse> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.GET_COMPLAINTS}?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch complaints');
    }

    const data: ComplaintsResponse = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to fetch complaints. Please try again.');
    throw error;
  }
};

export const getComplaintById = async (complaintId: string): Promise<ComplaintResponse> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.GET_COMPLAINT_BY_ID.replace(':complaintId', complaintId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch complaint details');
    }

    const data: ComplaintResponse = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to fetch complaint details. Please try again.');
    throw error;
  }
};

export const updateComplaintStatus = async (complaintId: string, status: string): Promise<ComplaintResponse> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.UPDATE_COMPLAINT_STATUS.replace(':complaintId', complaintId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update complaint status');
    }

    const data: ComplaintResponse = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to update complaint status. Please try again.');
    throw error;
  }
};
