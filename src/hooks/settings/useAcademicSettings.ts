/**
 * Settings → School Day & Bells and Settings → Grading data: the school's
 * timezone, teaching days, morning-register times, bell schedule, grade scale
 * and pass mark (`/settings/academic`).
 *
 * The timetable page reads the same query for its period picker, so a saved
 * bell schedule shows up there without a reload.
 */
"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/CustomToast";
import { useSchoolId } from "@/hooks/useSchoolId";
import { settingsKeys } from "@/hooks/settings/keys";
import { staleTimes } from "@/lib/queryKeys";
import { logger } from "@/lib/logger";
import { settingsErrorMessage } from "@/components/settings/ui";
import {
  getAcademicSettings,
  updateAcademicSettings,
  type AcademicSettings,
  type UpdateAcademicSettingsDto,
} from "@/app/services/school-settings.service";

/**
 * The school's academic settings.
 *
 * @param options.enabled - Set false to skip the request (e.g. no class chosen yet).
 * @returns Query result; `data` is undefined until the first load finishes.
 */
export function useAcademicSettings(options: { enabled?: boolean } = {}): UseQueryResult<AcademicSettings> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: settingsKeys.academic(schoolId ?? "none"),
    queryFn: async () => (await getAcademicSettings()).settings,
    enabled: Boolean(schoolId) && options.enabled !== false,
    staleTime: staleTimes.reference,
  });
}

/** What {@link useUpdateAcademicSettings} returns. */
export interface UpdateAcademicSettings {
  /**
   * Saves the given fields and toasts the outcome.
   *
   * @param dto - The fields to change.
   * @returns The saved settings.
   * @throws The `ApiError`, after the toast, so the form can map field errors.
   */
  save: (dto: UpdateAcademicSettingsDto) => Promise<AcademicSettings>;
  /** True while a save is in flight. */
  saving: boolean;
}

/** What the save toasts; each section names what it saved. */
export interface AcademicSettingsMessages {
  success: string;
  failure: string;
}

const SCHOOL_DAY_MESSAGES: AcademicSettingsMessages = {
  success: "School day settings saved",
  failure: "Failed to save the school day settings",
};

/**
 * Saves academic settings. Not optimistic: the API re-sorts and validates the
 * bell schedule and the grade scale, so the cache takes the server's copy
 * once it answers.
 *
 * @param messages - The toasts; the School Day & Bells wording by default.
 * @returns The save function and its pending flag.
 */
export function useUpdateAcademicSettings(
  messages: AcademicSettingsMessages = SCHOOL_DAY_MESSAGES
): UpdateAcademicSettings {
  const client = useQueryClient();
  const schoolId = useSchoolId();
  const key = settingsKeys.academic(schoolId ?? "none");

  const mutation = useMutation({
    mutationFn: async (dto: UpdateAcademicSettingsDto) => (await updateAcademicSettings(dto)).settings,
    onError: (err) => {
      logger.error("settings/academic", "save failed", err);
      toast.error(settingsErrorMessage(err, messages.failure));
    },
    onSuccess: (settings) => {
      client.setQueryData(key, settings);
      toast.success(messages.success);
    },
  });

  return { save: (dto) => mutation.mutateAsync(dto), saving: mutation.isPending };
}
