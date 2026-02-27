import { API_ENDPOINTS } from "../lib/api/config";
import { apiClient } from "@/lib/apiClient";

export interface Parent {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  children?: string[]; // Array of student IDs
  schoolId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface GetParentsResponse {
  data: Parent[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

const getLocalStorageItem = (key: string) => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

export const parentService = {
  async getParentsBySchoolId(): Promise<Parent[]> {
    const user = getLocalStorageItem("user");
    const schoolId = user?.schoolId;
    if (!schoolId) {
      throw new Error("School ID not found in user data");
    }
    const response = await apiClient.get(
      `${API_ENDPOINTS.GET_PARENT(schoolId)}`
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch parents");
    }
    const data: GetParentsResponse = await response.json();
    return data.data;
  },
};
