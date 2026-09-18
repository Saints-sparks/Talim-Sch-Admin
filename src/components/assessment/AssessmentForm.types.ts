/**
 * The types the assessment components speak.
 *
 * These used to be a second, hand-maintained copy of the service's shapes,
 * which drifted from the API. They are now aliases of the one definition in
 * `assessment.service` (and, for a term, `academic.service`), so a change to
 * the DTO reaches the components instead of silently disagreeing with them.
 */
import type {
  AssessmentResponse,
  AssessmentStatus,
  AssessmentsResponse,
  CreateAssessmentRequest,
  UpdateAssessmentRequest,
} from "@/app/services/assessment.service";
import type { TermResponse } from "@/app/services/academic.service";

export type {
  AssessmentStatus,
  AssessmentsResponse,
  CreateAssessmentRequest,
  UpdateAssessmentRequest,
};

/** An assessment with its term and author populated. */
export type Assessment = AssessmentResponse;

/** A term, as the assessment screens choose between them. */
export type Term = TermResponse;

/**
 * What the create/edit form holds.
 *
 * Mirrors `CreateAssessmentDto`: `termId` is fixed once an assessment exists,
 * which is why the update DTO has no term.
 */
export interface AssessmentForm {
  name: string;
  description?: string;
  termId: string;
  startDate: string;
  endDate: string;
  status?: AssessmentStatus;
}
