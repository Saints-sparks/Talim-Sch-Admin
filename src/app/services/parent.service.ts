// app/services/parent.service.ts
import { API_ENDPOINTS } from "../lib/api/config";
import { apiClient } from "@/lib/apiClient";

export interface ParentUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  userAvatar?: string;
  dateOfBirth?: string;
  gender?: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface ParentChild {
  _id: string;
  gradeLevel?: string;
  isActive?: boolean;
  parentContact?: {
    fullName?: string;
    phoneNumber?: string;
    email?: string;
    relationship?: string;
  };
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    userAvatar?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  classId?: {
    _id: string;
    name?: string;
    gradeLevel?: string;
  };
}

export interface Parent {
  _id: string;
  userId: ParentUser;
  children: ParentChild[];
  childrenCount?: number;
  schoolId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ParentsStats {
  totalParents: number;
  activeParents: number;
  inactiveParents: number;
  totalChildren: number;
}

export interface GetParentsResponse {
  data: Parent[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
  };
  stats?: ParentsStats;
}

export interface GetParentsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  gender?: string;
  sortBy?: string;
}

const getStoredJSON = (key: string) => {
  if (typeof window === "undefined") return null;
  const item = localStorage.getItem(key) || sessionStorage.getItem(key);
  if (!item) return null;

  try {
    return JSON.parse(item);
  } catch {
    return null;
  }
};

export const parentService = {
  async getParentsDashboard(
    params: GetParentsParams = {}
  ): Promise<GetParentsResponse> {
    const user = getStoredJSON("user");
    const schoolId =
      typeof user?.schoolId === "string" ? user.schoolId : user?.schoolId?._id;
    if (!schoolId) {
      throw new Error("School ID not found in user data");
    }
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });

    const url = `${API_ENDPOINTS.GET_PARENT(schoolId)}${
        query.toString() ? `?${query.toString()}` : ""
      }`;
    console.info("[Parents] Fetching parents dashboard", url);

    const response = await apiClient.get(url);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch parents");
    }
    const data: GetParentsResponse = await response.json();
    return data;
  },

  async getParentsBySchoolId(): Promise<Parent[]> {
    const response = await this.getParentsDashboard();
    return response.data;
  },
};
