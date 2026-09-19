/**
 * Academic calendar API — academic years, terms and the class timetable read
 * used by the onboarding checklist.
 *
 * Payloads mirror the backend DTOs in
 * `talimBE-V2/src/modules/academic/data/dtos` (`CreateAcademicYearDto`,
 * `CreateTermDto`, `CreateTimetableDto`). The school is taken from the bearer
 * token, so no call sends a school id; responses still carry `schoolId` and
 * callers must never compare it by identity.
 *
 * Every function throws `ApiError` (`@/lib/apiError`) on a non-2xx response —
 * branch on `err.code`, or pass it to `getErrorMessage` for a toast.
 */
import { API_ENDPOINTS } from "../lib/api/config";
import { api } from "@/lib/apiClient";
import type { CreateAcademicYearPayload, CreateTermPayload } from "@/types/apiPayloads";

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Lifecycle of an academic year or term (`AcademicPeriodStatus` on the
 * backend).
 */
export type AcademicPeriodStatus = "draft" | "active" | "closed" | "archived";

/** One of the five teaching days a timetable entry can fall on. */
export type TimetableDay = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";

/** Body for `POST /academic-year` (`CreateAcademicYearDto`). */
export type AcademicYear = CreateAcademicYearPayload & { isCurrent: boolean };

/** Body for `POST /term` (`CreateTermDto`), minus the server-stamped school. */
export type Term = CreateTermPayload & { isCurrent: boolean; schoolId: string };

/** An academic year as the API returns it. */
export interface AcademicYearResponse {
  _id: string;
  year: string;
  startDate: string;
  endDate: string;
  schoolId: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
  /** Present once the school starts closing periods. */
  status?: AcademicPeriodStatus;
}

/** A term as the API returns it. */
export interface TermResponse {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  schoolId: string;
  academicYearId: string;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
  /** Present once the school starts closing periods. */
  status?: AcademicPeriodStatus;
}

/**
 * What `POST /term` replies with. Today the API answers `{ message }` only, so
 * every term field is filled in just when a deployment echoes the created
 * document — read the term back with `getTerms()` rather than trusting these.
 */
export type CreateTermResult = TermResponse & { message?: string };

/** One lesson slot as `GET /timetable/class/:classId` returns it. */
export interface TimetableEntryResponse {
  _id?: string;
  /** Pre-joined `"08:00 - 09:00"` label. */
  time: string;
  startTime: string;
  /** Legacy misspelling the API still sends alongside `startTime`. */
  startTIme?: string;
  endTime: string;
  courseId?: string;
  subjectId?: string;
  course?: string;
  subject?: string;
  /** Class name, not its id. */
  class?: string;
  /** `"Unassigned teacher"` when the course has no teacher. */
  teacherName?: string;
}

/** A class timetable, grouped by day as the API returns it. */
export type TimetableByDay = Partial<Record<TimetableDay, TimetableEntryResponse[]>>;

/** The minimum an academic year needs for a display label. */
type AcademicYearLike = {
  _id: string;
  year?: string;
  name?: string;
  isCurrent?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/** Shape `POST /academic-year` replies with across deployments. */
interface CreateAcademicYearBody {
  academicYear?: AcademicYearResponse;
  data?: AcademicYearResponse;
}

/** Shape `GET /academic-year/school` replies with across deployments. */
interface AcademicYearsBody {
  academicYears?: AcademicYearResponse[];
  data?: AcademicYearResponse[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * The label to show for an academic year, whichever field the API filled in.
 *
 * @param year - The academic year, populated or partial.
 * @returns Its `year`, else its `name`, else its id.
 */
export function getAcademicYearLabel(year: AcademicYearLike): string {
  return year.year ?? year.name ?? year._id;
}

/**
 * Collapses academic years that share a display name, which older schools
 * accumulated before the API enforced uniqueness.
 *
 * @param years - Academic years as fetched.
 * @returns One year per label, preferring the one flagged `isCurrent`.
 */
export function dedupeAcademicYearsByName<T extends AcademicYearLike>(years: T[]): T[] {
  const byName = new Map<string, T>();

  years.forEach((year) => {
    const key = getAcademicYearLabel(year).trim().toLowerCase();
    if (!key) return;

    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, year);
      return;
    }

    if (!existing.isCurrent && year.isCurrent) {
      byName.set(key, year);
    }
  });

  return Array.from(byName.values());
}

// ─── Academic years ───────────────────────────────────────────────────────────

/**
 * Creates an academic year for the signed-in school.
 *
 * @param academicYear - Year label, date range and whether it is the current one.
 * @returns The created academic year.
 * @throws ApiError When the year overlaps an existing one or validation fails.
 */
export const createAcademicYear = async (
  academicYear: AcademicYear
): Promise<AcademicYearResponse> => {
  const body: CreateAcademicYearPayload = academicYear;
  const raw = await api.post<CreateAcademicYearBody | AcademicYearResponse | null>(
    API_ENDPOINTS.CREATE_ACADEMIC_YEAR,
    body
  );
  // Deployments reply `{ message, academicYear }`, `{ data }` or the bare document.
  const wrapped = raw as CreateAcademicYearBody | null;
  return (wrapped?.academicYear ?? wrapped?.data ?? raw) as AcademicYearResponse;
};

/**
 * The school's academic years, with duplicate labels collapsed.
 *
 * @returns The academic years, or `[]` when the API sends no list.
 * @throws ApiError When the request fails.
 */
export const getAcademicYears = async (): Promise<AcademicYearResponse[]> => {
  const raw = await api.get<AcademicYearsBody | AcademicYearResponse[] | null>(
    API_ENDPOINTS.GET_ACADEMIC_YEARS
  );
  const data = Array.isArray(raw)
    ? raw
    : (raw?.academicYears ?? raw?.data ?? raw);
  return Array.isArray(data) ? dedupeAcademicYearsByName(data) : [];
};

// ─── Terms ────────────────────────────────────────────────────────────────────

/**
 * Creates a term inside an academic year.
 *
 * @param data - Term name, date range, academic year and current flag; the
 *   school comes from the bearer token.
 * @returns The API's reply — a `message`, plus the term's fields when the
 *   deployment echoes the created document.
 * @throws ApiError When the dates overlap another term or validation fails.
 */
export const createTerm = async (data: Omit<Term, "schoolId">): Promise<CreateTermResult> => {
  const body: CreateTermPayload = {
    academicYearId: data.academicYearId,
    name: data.name.trim(),
    startDate: data.startDate,
    endDate: data.endDate,
    isCurrent: data.isCurrent,
  };
  const result = await api.post<Partial<CreateTermResult>>(API_ENDPOINTS.CREATE_TERM, body);

  return {
    message: result?.message,
    _id: result?._id,
    name: result?.name,
    startDate: result?.startDate,
    endDate: result?.endDate,
    academicYearId: result?.academicYearId,
    isCurrent: result?.isCurrent,
    schoolId: result?.schoolId,
    createdAt: result?.createdAt,
    updatedAt: result?.updatedAt,
  } as CreateTermResult;
};

/**
 * The school's terms across every academic year.
 *
 * @returns The terms, or `[]` when the API sends no list.
 * @throws ApiError When the request fails.
 */
export const getTerms = async (): Promise<TermResponse[]> => {
  const body = await api.get<{ terms?: TermResponse[] } | null>(API_ENDPOINTS.GET_TERMS);
  const terms = body?.terms;
  return Array.isArray(terms) ? terms : [];
};

/**
 * Makes one term the school's current term; the API clears the flag on the rest.
 *
 * @param termId - Term to promote.
 * @returns Nothing.
 * @throws ApiError When the term is not in this school or no longer exists.
 */
export const setCurrentTerm = async (termId: string): Promise<void> => {
  await api.put<unknown>(API_ENDPOINTS.SET_CURRENT_TERM(termId));
};

// ─── Timetable ────────────────────────────────────────────────────────────────

/**
 * A page of timetable entries, used only to answer "has this school built a
 * timetable yet?" for the onboarding checklist.
 *
 * @returns The timetable grouped by day.
 * @throws ApiError When the request fails, including the 404 the API returns
 *   for a class with no entries.
 */
export const getTimetableEntries = async (): Promise<TimetableByDay> => {
  return api.get<TimetableByDay>(API_ENDPOINTS.GET_TIMETABLE(1, 1));
};
