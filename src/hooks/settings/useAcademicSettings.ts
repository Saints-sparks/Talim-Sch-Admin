/**
 * Settings → School Day & Bells data: the school's timezone, teaching days,
 * morning-register times and bell schedule (`/settings/academic`).
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

/**
 * Saves academic settings. Not optimistic: the API re-sorts and validates the
 * bell schedule, so the cache takes the server's copy once it answers.
 *
 * @returns The save function and its pending flag.
 */
export function useUpdateAcademicSettings(): UpdateAcademicSettings {
  const client = useQueryClient();
  const schoolId = useSchoolId();
  const key = settingsKeys.academic(schoolId ?? "none");

  const mutation = useMutation({
    mutationFn: async (dto: UpdateAcademicSettingsDto) => (await updateAcademicSettings(dto)).settings,
    onError: (err) => {
      logger.error("settings/academic", "save failed", err);
      toast.error(settingsErrorMessage(err, "Failed to save the school day settings"));
    },
    onSuccess: (settings) => {
      client.setQueryData(key, settings);
      toast.success("School day settings saved");
    },
  });

  return { save: (dto) => mutation.mutateAsync(dto), saving: mutation.isPending };
}
