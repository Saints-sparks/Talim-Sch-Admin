/**
 * Parents — the directory behind "Users → Parents", with the children linked
 * to each parent.
 *
 * Unlike the student and teacher rosters, `GET /parents/school/:schoolId`
 * filters, searches and sorts server-side, so the page passes its controls
 * straight through instead of filtering in the browser.
 */
import { API_ENDPOINTS } from "../lib/api/config";
import { api } from "@/lib/apiClient";
import { sessionStore } from "@/lib/session";

/** The user account behind a parent or a child. */
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

/** A student linked to a parent. */
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

/** A parent and the children linked to them. */
export interface Parent {
  _id: string;
  userId: ParentUser;
  children: ParentChild[];
  childrenCount?: number;
  schoolId: string;
  createdAt?: string;
  updatedAt?: string;
}

/** The headline counts the parents dashboard shows above the table. */
export interface ParentsStats {
  totalParents: number;
  activeParents: number;
  inactiveParents: number;
  totalChildren: number;
}

/** A page of parents, with the dashboard's stats attached. */
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

/** Status values `GET /parents/school/:schoolId` accepts. */
export type ParentStatusFilter = "all" | "active" | "inactive";

/** Gender values `GET /parents/school/:schoolId` accepts. */
export type ParentGenderFilter = "all" | "male" | "female" | "other";

/** Sort orders `GET /parents/school/:schoolId` accepts. */
export type ParentSortOrder = "az" | "za" | "joined_desc" | "joined_asc";

/** Query for `GET /parents/school/:schoolId` (backend `GetParentsQueryDto`). */
export interface GetParentsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ParentStatusFilter;
  gender?: ParentGenderFilter;
  sortBy?: ParentSortOrder;
}

/** Just the profile fields the parents page reads for a user. */
export interface ParentProfileFields {
  dateOfBirth?: string;
  gender?: string;
}

export const parentService = {
  /**
   * The date of birth and gender for one user, which the parents list does not
   * include. Returns `{}` rather than throwing: this only enriches the detail
   * panel, and one missing profile must not blank the page.
   *
   * @param userId - The user to read.
   * @returns The fields, or `{}` when they could not be read.
   */
  async getUserProfile(userId: string): Promise<ParentProfileFields> {
    try {
      const data = await api.get<{ user?: ParentProfileFields } & ParentProfileFields>(
        API_ENDPOINTS.GET_USER_PROFILE(userId),
      );
      return data?.user ?? data ?? {};
    } catch {
      return {};
    }
  },

  /**
   * A filtered, sorted page of the school's parents plus the dashboard stats.
   *
   * @param params - Page, page size, search text, status, gender and sort order.
   * @returns The page, its `meta` and the stats.
   * @throws `Error` when there is no school in the session; `ApiError` otherwise.
   */
  async getParentsDashboard(params: GetParentsParams = {}): Promise<GetParentsResponse> {
    const schoolId = sessionStore.getSchoolId();
    if (!schoolId) throw new Error("No school in the current session");

    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
    }

    const suffix = query.toString() ? `?${query}` : "";
    return api.get<GetParentsResponse>(`${API_ENDPOINTS.GET_PARENT(schoolId)}${suffix}`);
  },

  /**
   * Every parent on the first page of the school's directory.
   *
   * @returns The parents.
   */
  async getParentsBySchoolId(): Promise<Parent[]> {
    const response = await this.getParentsDashboard();
    return response.data;
  },
};
