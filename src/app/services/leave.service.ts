import { API_BASE_URL } from '../lib/api/config';
import { getLocalStorageItem } from '../lib/localStorage';
import { toast } from 'react-toastify';

export interface LeaveRequest {
  title: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachment?: string;
  leaveType: string;
}

export interface LeaveResponse {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachment?: string;
  leaveType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  senderId: string;
  senderName: string;
  senderRole: string;
}

export interface LeaveMeta {
  total: number;
  page: number;
  lastPage: number;
  limit: number;
}

export interface LeaveRequestsResponse {
  data: LeaveResponse[];
  meta: LeaveMeta;
}

export const createLeaveRequest = async (leave: LeaveRequest): Promise<LeaveResponse> => {
  const senderId = getLocalStorageItem('user')?.userId;

  if (!senderId) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/leave/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({
        ...leave,
        senderId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create leave request');
    }

    const data: LeaveResponse = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to create leave request. Please try again.');
    throw error;
  }
};

export const getLeaveRequests = async (page: number = 1, limit: number = 10): Promise<LeaveRequestsResponse> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/leave/requests?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch leave requests');
    }

    const data: LeaveRequestsResponse = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to fetch leave requests. Please try again.');
    throw error;
  }
};

export const getLeaveRequestById = async (leaveId: string): Promise<LeaveResponse> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/leave/requests/${leaveId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch leave request details');
    }

    const data: LeaveResponse = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to fetch leave request details. Please try again.');
    throw error;
  }
};

export const updateLeaveRequestStatus = async (leaveId: string, status: string): Promise<LeaveResponse> => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/leave/requests/${leaveId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update leave request status');
    }

    const data: LeaveResponse = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to update leave request status. Please try again.');
    throw error;
  }
};
