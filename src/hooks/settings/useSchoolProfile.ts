/**
 * Settings → School Profile data.
 *
 * The school record is reference data (it changes a few times a year), so it
 * is cached under the settings key for the signed-in school and only refetched
 * when a save invalidates it.
 */
"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/CustomToast";
import { useAuth } from "@/context/AuthContext";
import { useSchoolId } from "@/hooks/useSchoolId";
import { settingsKeys } from "@/hooks/settings/keys";
import { staleTimes } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import {
  getSchoolProfile,
  updateSchoolProfile,
  type SchoolProfile,
  type UpdateSchoolProfileDto,
} from "@/app/services/school-settings.service";

/**
 * The signed-in school's profile.
 *
 * @returns Query result; `data` is undefined until the first load finishes.
 */
export function useSchoolProfile(): UseQueryResult<SchoolProfile> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: settingsKeys.schoolProfile(schoolId ?? "none"),
    queryFn: async () => (await getSchoolProfile()).school,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.reference,
  });
}

/** What {@link useUpdateSchoolProfile} returns. */
export interface UpdateSchoolProfile {
  /** Saves the given fields. */
  save: (dto: UpdateSchoolProfileDto) => Promise<SchoolProfile>;
  /** True while a save is in flight. */
  saving: boolean;
}

/**
 * Saves the editable parts of the school profile and refreshes every reader
 * of the profile — including the school logo the app shell shows.
 *
 * @param successMessage - Toast shown after a successful save.
 * @returns The save function and its pending flag.
 */
export function useUpdateSchoolProfile(successMessage = "School profile updated"): UpdateSchoolProfile {
  const client = useQueryClient();
  const schoolId = useSchoolId();
  const { updateUser } = useAuth();

  const mutation = useMutation({
    mutationFn: async (dto: UpdateSchoolProfileDto) => (await updateSchoolProfile(dto)).school,
    onSuccess: (school) => {
      client.setQueryData(settingsKeys.schoolProfile(schoolId ?? "none"), school);
      client.invalidateQueries({ queryKey: settingsKeys.schoolProfile(schoolId ?? "none") });
      // The shell reads the logo from the session user, not from this query.
      if (school.logo) updateUser({ schoolLogo: school.logo });
      toast.success(successMessage);
    },
    onError: (err) => {
      logger.error("settings/school-profile", "save failed", err);
      toast.error(getErrorMessage(err, "Failed to update school profile"));
    },
  });

  return { save: mutation.mutateAsync, saving: mutation.isPending };
}
