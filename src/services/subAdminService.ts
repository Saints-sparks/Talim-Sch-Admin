/**
 * Sub-Admin Service
 * Handles all API calls related to school sub-admin management.
 */
import { apiClient } from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/app/lib/api/config";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubAdmin {
  _id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: "school_sub_admin";
  permissions: string[];
  isActive: boolean;
  userAvatar?: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSubAdmins {
  data: SubAdmin[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export interface CreateSubAdminDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  permissions: string[];
}

export interface PromoteTeacherDto {
  userId: string;
  permissions: string[];
}

export interface UpdatePermissionsDto {
  permissions: string[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const subAdminService = {
  /**
   * Fetch paginated list of sub-admins for the authenticated school.
   */
  async getSubAdmins(
    page = 1,
    limit = 10
  ): Promise<PaginatedSubAdmins> {
    const url = `${API_ENDPOINTS.SUB_ADMINS}?page=${page}&limit=${limit}`;
    const res = await apiClient.get(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to fetch sub-admins");
    }
    return res.json();
  },

  /**
   * Get a single sub-admin by their user ID.
   */
  async getSubAdminById(id: string): Promise<SubAdmin> {
    const res = await apiClient.get(API_ENDPOINTS.SUB_ADMIN_BY_ID(id));
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Sub-admin not found");
    }
    return res.json();
  },

  /**
   * Create a brand-new user as a sub-admin.
   */
  async createSubAdmin(dto: CreateSubAdminDto): Promise<SubAdmin> {
    const res = await apiClient.post(API_ENDPOINTS.SUB_ADMIN_CREATE, dto);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to create sub-admin");
    }
    return res.json();
  },

  /**
   * Promote an existing teacher to sub-admin.
   */
  async promoteTeacher(dto: PromoteTeacherDto): Promise<SubAdmin> {
    const res = await apiClient.post(
      API_ENDPOINTS.SUB_ADMIN_PROMOTE_TEACHER,
      dto
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to promote teacher");
    }
    return res.json();
  },

  /**
   * Replace the full permissions set of a sub-admin.
   */
  async updatePermissions(
    id: string,
    dto: UpdatePermissionsDto
  ): Promise<SubAdmin> {
    const res = await apiClient.patch(
      API_ENDPOINTS.SUB_ADMIN_PERMISSIONS(id),
      dto
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to update permissions");
    }
    return res.json();
  },

  /**
   * Toggle a sub-admin's active status.
   */
  async toggleStatus(id: string): Promise<SubAdmin> {
    const res = await apiClient.patch(
      API_ENDPOINTS.SUB_ADMIN_TOGGLE_STATUS(id),
      {}
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to toggle status");
    }
    return res.json();
  },

  /**
   * Demote a sub-admin back to their previous role (teacher → teacher).
   */
  async demoteSubAdmin(id: string): Promise<void> {
    const res = await apiClient.delete(API_ENDPOINTS.SUB_ADMIN_DEMOTE(id));
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to demote sub-admin");
    }
  },
};
