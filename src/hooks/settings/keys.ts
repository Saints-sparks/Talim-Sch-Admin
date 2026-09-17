/**
 * Query keys for the Settings area.
 *
 * They extend `queryKeys.settings` from `@/lib/queryKeys` so that removing the
 * `["settings"]` root on a school switch still drops every one of them, and so
 * no section builds an ad-hoc array of its own. Keys that belong to another
 * domain (wallet, bank accounts, academic years, terms) are taken from
 * `queryKeys` directly — Settings must invalidate the same entry the owning
 * page reads.
 */
import { queryKeys } from "@/lib/queryKeys";

/** Settings-owned query keys, each scoped to one school (or user). */
export const settingsKeys = {
  /** Everything under Settings — removed wholesale on a school switch. */
  all: queryKeys.settings.all,
  /**
   * The school profile record.
   *
   * @param schoolId - The signed-in administrator's school.
   * @returns The query key.
   */
  schoolProfile: (schoolId: string) => queryKeys.settings.school(schoolId),
  /**
   * Receipt appearance settings.
   *
   * @param schoolId - The signed-in administrator's school.
   * @returns The query key.
   */
  receipt: (schoolId: string) => [...queryKeys.settings.all, schoolId, "receipt"] as const,
  /**
   * Withdrawal safeguards (OTP, minimum amount, default payout account).
   *
   * @param schoolId - The signed-in administrator's school.
   * @returns The query key.
   */
  finance: (schoolId: string) => [...queryKeys.settings.all, schoolId, "finance"] as const,
  /**
   * The signed-in administrator's own profile.
   *
   * @param userId - The signed-in user's id.
   * @returns The query key.
   */
  adminProfile: (userId: string) => [...queryKeys.settings.all, "admin", userId] as const,
  /**
   * The signed-in administrator's notification preferences.
   *
   * @param userId - The signed-in user's id.
   * @returns The query key.
   */
  notificationPrefs: (userId: string) =>
    [...queryKeys.settings.all, "notification-preferences", userId] as const,
} as const;
