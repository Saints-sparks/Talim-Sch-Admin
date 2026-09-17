/**
 * Query keys for the Transit area.
 *
 * Same shape as `@/lib/queryKeys`: `["transit", schoolId, …params]`, so signing
 * into another school never reuses a cached transfer list, and one mutation can
 * invalidate exactly the lists it changed. Lives here rather than in
 * `src/lib/queryKeys.ts` only because that file is shared; it belongs there.
 */

/** The root segment every transit key starts with. */
const ROOT = "transit" as const;

/** Key factory for every cached transit resource. */
export const transitKeys = {
  /** Everything transit — use to drop the whole area at once. */
  all: [ROOT] as const,
  /** The overview counters. */
  dashboard: (schoolId: string) => [ROOT, schoolId, "dashboard"] as const,
  /** Every transfer list, for blanket invalidation after a transition. */
  transfers: (schoolId: string) => [ROOT, schoolId, "transfers"] as const,
  /** One filtered transfer list. */
  transferList: (schoolId: string, status?: string) =>
    [ROOT, schoolId, "transfers", "list", status ?? ""] as const,
  /** One transfer request. */
  transfer: (schoolId: string, id: string) => [ROOT, schoolId, "transfers", id] as const,
  /** A student's academic snapshot. */
  snapshot: (schoolId: string, studentId: string) =>
    [ROOT, schoolId, "snapshot", studentId] as const,
  /** Every promotion run list. */
  promotions: (schoolId: string) => [ROOT, schoolId, "promotions"] as const,
  /** One filtered promotion run list. */
  promotionList: (schoolId: string, status?: string) =>
    [ROOT, schoolId, "promotions", "list", status ?? ""] as const,
  /** One promotion run. */
  promotionRun: (schoolId: string, id: string) => [ROOT, schoolId, "promotions", id] as const,
  /** Every enrollment list. */
  enrollments: (schoolId: string) => [ROOT, schoolId, "enrollments"] as const,
  /** One filtered enrollment list. */
  enrollmentList: (schoolId: string, filters: Record<string, string | undefined>) =>
    [ROOT, schoolId, "enrollments", "list", filters] as const,
  /** One student's enrollment history. */
  enrollmentHistory: (schoolId: string, studentId: string) =>
    [ROOT, schoolId, "enrollments", "history", studentId] as const,
  /** A school search by name. */
  schoolSearch: (query: string) => [ROOT, "schoolSearch", query] as const,
} as const;
