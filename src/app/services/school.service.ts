import { api } from "@/lib/apiClient";
import { API_URLS } from "../lib/api/config";
import type { UpdateSchoolPayload } from "@/types/apiPayloads";

// The request payload is the backend DTO (`src/types/apiPayloads.ts`).
export type { UpdateSchoolPayload } from "@/types/apiPayloads";

/**
 * A class as `GET /classes` returns it, mirroring the backend Class schema.
 * `classTeacherId` and `assignedCourses` arrive populated on some routes, so
 * both shapes are allowed.
 */
export interface Class {
  _id: string;
  name: string;
  /** e.g. "Grade 1" — required by the backend, so always present. */
  gradeLevel?: string;
  classDescription?: string;
  /** Stored as a string on the backend, not a number. */
  classCapacity?: string;
  schoolId: string;
  classTeacherId: string | { _id: string; [key: string]: unknown } | null;
  assignedCourses: Array<string | { _id: string; [key: string]: unknown }>;
}

/** One named contact on the school's profile. */
export interface PrimaryContact {
  name: string;
  phone: string;
  email: string;
  role: string;
}

/** Where the school is, as the profile stores it. */
export interface SchoolLocation {
  country: string;
  state: string;
}

/** The school as the update endpoint returns it. */
export interface UpdateSchoolResponse {
  _id: string;
  name: string;
  email: string;
  physicalAddress: string;
  location: SchoolLocation;
  primaryContacts: PrimaryContact[];
  active: boolean;
  logo?: string;
  updatedAt: string;
}

/**
 * Lists the school's classes. Tolerates the three response shapes the
 * endpoint has returned (bare array, `{ data }`, `{ classes }`).
 */
export const getClasses = async (): Promise<Class[]> => {
  const raw = await api.get<Class[] | { data?: Class[]; classes?: Class[] }>(API_URLS.SCHOOL.GET_CLASSES);
  const data = Array.isArray(raw) ? raw : raw?.data ?? raw?.classes ?? [];
  return Array.isArray(data) ? data : [];
};

/**
 * Updates the school's profile.
 *
 * @param schoolId - School to update.
 * @param payload - Fields to change.
 * @returns The updated school, or `{}` when the server returns no body.
 */
export const updateSchool = async (schoolId: string, payload: UpdateSchoolPayload): Promise<UpdateSchoolResponse> =>
  (await api.put<UpdateSchoolResponse | null>(
    API_URLS.SCHOOL.UPDATE_SCHOOL.replace(":id", encodeURIComponent(schoolId)),
    payload,
  )) ?? ({} as UpdateSchoolResponse);
