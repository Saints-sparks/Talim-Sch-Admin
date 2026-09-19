/**
 * Sub-admins — the staff a primary school admin grants a restricted slice of
 * the school admin portal to.
 *
 * Every route here is `@Roles(SCHOOL_ADMIN) @Permissions(MANAGE_SUB_ADMINS)`
 * on the backend: a sub-admin cannot manage other sub-admins even if someone
 * grants them `manage:sub_admins`, so the UI hides this area from them
 * entirely rather than letting the API refuse.
 */
import { api } from "@/lib/apiClient";
import { API_ENDPOINTS } from "@/app/lib/api/config";
import type { PermissionValue } from "@/lib/permissions";
import type {
  CreateSubAdminPayload,
  PromoteTeacherPayload,
  UpdateSubAdminPermissionsPayload,
} from "@/types/apiPayloads";

/** Body of `POST /sub-admins`, generated from the backend DTO. */
export type CreateSubAdminDto = CreateSubAdminPayload;
/** Body of `POST /sub-admins/promote-teacher`, generated from the backend DTO. */
export type PromoteTeacherDto = PromoteTeacherPayload;
/** Body of `PATCH /sub-admins/:userId/permissions`, generated from the backend DTO. */
export type UpdatePermissionsDto = UpdateSubAdminPermissionsPayload;

/** A sub-admin account and the permissions it holds. */
export interface SubAdmin {
  _id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: "school_sub_admin";
  /** Values from the backend `Permission` enum, e.g. `manage:fees`. */
  permissions: PermissionValue[];
  isActive: boolean;
  userAvatar?: string;
  schoolId: string;
  createdAt: string;
  updatedAt: string;
}

/** A page of sub-admins. */
export interface PaginatedSubAdmins {
  data: SubAdmin[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

/** A newly created sub-admin, with the temporary password the API generated. */
export type CreatedSubAdmin = SubAdmin & { temporaryPassword?: string };

/** The envelope the write routes answer with. */
interface SubAdminEnvelope {
  message?: string;
  subAdmin?: SubAdmin;
  temporaryPassword?: string;
}

/** Unwraps `{ message, subAdmin }`, tolerating a bare sub-admin body. */
function unwrap(body: SubAdminEnvelope | SubAdmin): SubAdmin {
  return (body as SubAdminEnvelope).subAdmin ?? (body as SubAdmin);
}

export const subAdminService = {
  /**
   * A page of the school's sub-admins.
   *
   * @param page - 1-based page number.
   * @param limit - Rows per page.
   * @returns The page and its `meta`.
   * @throws `ApiError` — `FORBIDDEN` for anyone but the primary school admin.
   */
  async getSubAdmins(page = 1, limit = 10): Promise<PaginatedSubAdmins> {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    return api.get<PaginatedSubAdmins>(`${API_ENDPOINTS.SUB_ADMINS}?${query}`);
  },

  /**
   * One sub-admin by their user id.
   *
   * @param id - The sub-admin's user id.
   * @returns The sub-admin.
   * @throws `ApiError` — `NOT_FOUND` when no such sub-admin is in this school.
   */
  async getSubAdminById(id: string): Promise<SubAdmin> {
    return api.get<SubAdmin>(API_ENDPOINTS.SUB_ADMIN_BY_ID(id));
  },

  /**
   * Creates a brand-new account as a sub-admin. The API generates a temporary
   * password and returns it so the admin can pass it on out of band.
   *
   * @param dto - Name, email and the permissions to grant.
   * @returns The new sub-admin, plus `temporaryPassword` when the API sent one.
   * @throws `ApiError` — `CONFLICT` when the email already has an account.
   */
  async createSubAdmin(dto: CreateSubAdminDto): Promise<CreatedSubAdmin> {
    const body = await api.post<SubAdminEnvelope>(API_ENDPOINTS.SUB_ADMIN_CREATE, dto);
    return { ...unwrap(body), temporaryPassword: body.temporaryPassword };
  },

  /**
   * Promotes an existing teacher to sub-admin, keeping their account.
   *
   * @param dto - The teacher's user id and the permissions to grant.
   * @returns The promoted sub-admin.
   * @throws `ApiError` — `NOT_FOUND` when the teacher is not in this school.
   */
  async promoteTeacher(dto: PromoteTeacherDto): Promise<SubAdmin> {
    return unwrap(await api.post<SubAdminEnvelope>(API_ENDPOINTS.SUB_ADMIN_PROMOTE_TEACHER, dto));
  },

  /**
   * Replaces a sub-admin's permissions with exactly the set given.
   *
   * @param id - The sub-admin's user id.
   * @param dto - The full intended permission set.
   * @returns The updated sub-admin.
   */
  async updatePermissions(id: string, dto: UpdatePermissionsDto): Promise<SubAdmin> {
    return unwrap(await api.patch<SubAdminEnvelope>(API_ENDPOINTS.SUB_ADMIN_PERMISSIONS(id), dto));
  },

  /**
   * Activates or deactivates a sub-admin, whichever they are not.
   *
   * @param id - The sub-admin's user id.
   * @returns The updated sub-admin.
   */
  async toggleStatus(id: string): Promise<SubAdmin> {
    return unwrap(await api.patch<SubAdminEnvelope>(API_ENDPOINTS.SUB_ADMIN_TOGGLE_STATUS(id), {}));
  },

  /**
   * Demotes a sub-admin back to their previous role, keeping their account.
   *
   * @param id - The sub-admin's user id.
   * @returns Nothing.
   */
  async demoteSubAdmin(id: string): Promise<void> {
    await api.delete(API_ENDPOINTS.SUB_ADMIN_DEMOTE(id));
  },
};
