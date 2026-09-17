/** Shared view types for the fees screens. */
import type { Class } from "@/app/services/school.service";

/**
 * A class as the fees screens read it.
 *
 * `GET /classes` returns `classCapacity` and `gradeLevel`, but the shared
 * `Class` interface in `school.service` does not declare them yet (widening it
 * belongs to whoever owns that file). Both are optional here, so a missing
 * capacity counts as zero students rather than `NaN`.
 */
export type FeeClass = Class & {
  classCapacity?: string | number;
  gradeLevel?: string;
};
