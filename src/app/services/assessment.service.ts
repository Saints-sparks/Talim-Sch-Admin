/**
 * Assessments — the examination and test windows a school runs inside a term.
 *
 * Every endpoint scopes itself to the caller's school from the bearer token, so
 * nothing here sends or compares a school id. Writes require
 * `manage:assessments`; a sub-admin without it gets `FORBIDDEN`.
 */
import { API_URLS } from "../lib/api/config";
import { api, apiClient } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiError";
import type { CreateAssessmentPayload, UpdateAssessmentPayload } from "@/types/apiPayloads";

/** Where an assessment sits in its lifecycle. Mirrors the backend enum. */
export type AssessmentStatus = "pending" | "active" | "completed" | "cancelled";

/** Every status, in the order the UI offers them. */
export const ASSESSMENT_STATUSES: readonly AssessmentStatus[] = [
  "pending",
  "active",
  "completed",
  "cancelled",
] as const;

/** Body for `POST /assessments`, mirroring `CreateAssessmentDto`. */
export type CreateAssessmentRequest = CreateAssessmentPayload;

/** Body for `PUT /assessments/:id`, mirroring `UpdateAssessmentDto`. */
export type UpdateAssessmentRequest = UpdateAssessmentPayload;

/** An assessment with its term and author populated. */
export interface AssessmentResponse {
  _id: string;
  name: string;
  description?: string;
  termId: {
    _id: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  schoolId: string;
  startDate: string;
  endDate: string;
  status: AssessmentStatus;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

/** Pagination meta as the assessments list returns it. */
export interface AssessmentPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

/** One page of the school's assessments. */
export interface AssessmentsResponse {
  assessments: AssessmentResponse[];
  pagination: AssessmentPagination;
}

/** A course that already has grades recorded against an assessment. */
export interface GradedCourseInfo {
  courseName: string;
  teacherName: string;
  teacherEmail: string;
}

/**
 * The `CONFLICT` raised when an assessment cannot be deactivated because
 * grades already exist for it.
 *
 * Extends `ApiError` so callers that only know about `ApiError` still read the
 * right `code` and `message`; the extra `coursesWithGrades` lets the page name
 * the teachers who have already graded.
 */
export class AssessmentHasGradesError extends ApiError {
  readonly coursesWithGrades: GradedCourseInfo[];

  constructor(message: string, coursesWithGrades: GradedCourseInfo[]) {
    super("CONFLICT", message, 409);
    this.name = "AssessmentHasGradesError";
    this.coursesWithGrades = coursesWithGrades;
  }
}

/** The assessments collection; sub-paths are built from it. */
const ASSESSMENTS = API_URLS.ASSESSMENTS.CREATE_ASSESSMENT;

/**
 * The school list route takes no id — the backend reads the school from the
 * token — so the `:schoolId` placeholder in `API_URLS` is not interpolated.
 */
const ASSESSMENTS_BY_SCHOOL = `${ASSESSMENTS}/school/`;

/** Envelope `POST` and `PUT` wrap the saved assessment in. */
interface AssessmentEnvelope {
  message?: string;
  assessment: AssessmentResponse;
}

/** Extra fields Nest attaches to the 409 body when grades block a delete. */
interface ConflictBody {
  coursesWithGrades?: GradedCourseInfo[];
}

export const assessmentService = {
  /**
   * Creates an assessment in a term.
   *
   * @param data - The assessment to create; dates must be ISO strings.
   * @returns The created assessment.
   * @throws `ApiError` — `VALIDATION_FAILED` when the dates or term are
   *   rejected, `FORBIDDEN` without `manage:assessments`.
   */
  async createAssessment(data: CreateAssessmentRequest): Promise<AssessmentResponse> {
    const result = await api.post<AssessmentEnvelope>(ASSESSMENTS, data);
    return result.assessment;
  },

  /**
   * A page of the school's assessments.
   *
   * @param page - 1-based page number.
   * @param limit - Rows per page.
   * @returns The page and its pagination meta.
   */
  async getAssessmentsBySchool(page = 1, limit = 10): Promise<AssessmentsResponse> {
    const query = new URLSearchParams({ page: String(page), limit: String(limit) });
    return api.get<AssessmentsResponse>(`${ASSESSMENTS_BY_SCHOOL}?${query}`);
  },

  /**
   * Every assessment in one term.
   *
   * @param termId - Term to list assessments for.
   * @returns The term's assessments.
   */
  async getAssessmentsByTerm(termId: string): Promise<AssessmentResponse[]> {
    return api.get<AssessmentResponse[]>(
      API_URLS.ASSESSMENTS.GET_ASSESSMENTS_BY_TERM.replace(":termId", encodeURIComponent(termId)),
    );
  },

  /**
   * One assessment.
   *
   * @param id - Assessment id.
   * @returns The assessment.
   * @throws `ApiError` with code `NOT_FOUND` when it belongs to another school.
   */
  async getAssessmentById(id: string): Promise<AssessmentResponse> {
    return api.get<AssessmentResponse>(
      API_URLS.ASSESSMENTS.GET_ASSESSMENT_BY_ID.replace(":id", encodeURIComponent(id)),
    );
  },

  /**
   * Updates an assessment.
   *
   * @param id - Assessment to update.
   * @param data - Fields to change; every field is optional.
   * @returns The updated assessment.
   */
  async updateAssessment(id: string, data: UpdateAssessmentRequest): Promise<AssessmentResponse> {
    const result = await api.put<AssessmentEnvelope>(
      API_URLS.ASSESSMENTS.UPDATE_ASSESSMENT.replace(":id", encodeURIComponent(id)),
      data,
    );
    return result.assessment;
  },

  /**
   * Deactivates an assessment (a soft delete on the backend).
   *
   * @param id - Assessment to deactivate.
   * @throws `AssessmentHasGradesError` when grades already exist for it, so the
   *   page can list the courses and teachers that block the change; any other
   *   failure throws a plain `ApiError`.
   */
  async deleteAssessment(id: string): Promise<void> {
    // The raw client rather than `api.delete`: the 409 body carries
    // `coursesWithGrades`, which `ApiError` has no field for, so the body has
    // to be read here before it is turned into an error.
    const response = await apiClient.delete(
      API_URLS.ASSESSMENTS.DELETE_ASSESSMENT.replace(":id", encodeURIComponent(id)),
    );
    if (response.ok) return;

    const body = (await response.json().catch(() => null)) as (ConflictBody & { message?: string }) | null;
    const error = ApiError.fromResponse(response, body);
    if (response.status === 409) {
      throw new AssessmentHasGradesError(error.message, body?.coursesWithGrades ?? []);
    }
    throw error;
  },

  /**
   * Mirrors the server's date rules so the form can refuse before the request.
   *
   * @param startDate - Start date, any value `Date` parses.
   * @param endDate - End date.
   * @returns `{ isValid: true }`, or the first problem found.
   */
  validateAssessmentDates(startDate: string, endDate: string): { isValid: boolean; error?: string } {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start >= end) return { isValid: false, error: "End date must be after start date" };
    if (start < today) return { isValid: false, error: "Start date cannot be in the past" };
    return { isValid: true };
  },

  /**
   * Converts a date input's value to the ISO string the API expects.
   *
   * @param dateString - Value from a `<input type="date">`.
   * @returns The ISO 8601 string.
   */
  formatDateForAPI(dateString: string): string {
    return new Date(dateString).toISOString();
  },

  /**
   * Tailwind classes for a status badge, in both themes.
   *
   * @param status - The assessment status.
   * @returns Background and text classes.
   */
  getStatusColor(status: string): string {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-300";
    }
  },
};
