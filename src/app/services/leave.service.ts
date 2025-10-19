import { API_BASE_URL, API_ENDPOINTS } from "../lib/api/config";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/apiClient";

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

export const createLeaveRequest = async (
  leave: LeaveRequest
): Promise<LeaveResponse> => {
  try {
    const response = await apiClient.post(
      `${API_BASE_URL}/leave/requests`,
      leave
    );

    const data: LeaveResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to create leave request:", error);
    throw error;
  }
};

export const getLeaveRequests = async (
  page: number = 1,
  limit: number = 10
): Promise<LeaveRequestsResponse> => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.GET_LEAVE_REQUESTS);

    const data: LeaveRequestsResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch leave requests:", error);
    throw error;
  }
};

export const getLeaveRequestById = async (
  leaveId: string
): Promise<LeaveResponse> => {
  try {
    const response = await apiClient.get(
      `${API_BASE_URL}/leave-requests/${leaveId}`
    );

    const data: LeaveResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch leave request details:", error);
    throw error;
  }
};

export const updateLeaveRequestStatus = async (
  leaveId: string,
  status: string
): Promise<LeaveResponse> => {
  try {
    const response = await apiClient.put(
      `${API_BASE_URL}/leave-requests/${leaveId}/status`,
      { status }
    );

    const data: LeaveResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to update leave request status:", error);
    throw error;
  }
};
