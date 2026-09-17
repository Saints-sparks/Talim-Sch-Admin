/**
 * Settings → Fees & Receipts data: how a payment receipt looks and what
 * parents may do with it.
 */
"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/CustomToast";
import { useSchoolId } from "@/hooks/useSchoolId";
import { settingsKeys } from "@/hooks/settings/keys";
import { staleTimes } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import {
  getReceiptSettings,
  updateReceiptSettings,
  type ReceiptSettings,
  type UpdateReceiptSettingsDto,
} from "@/app/services/school-settings.service";

/**
 * The school's receipt settings.
 *
 * @returns Query result; `data` is undefined until the first load finishes.
 */
export function useReceiptSettings(): UseQueryResult<ReceiptSettings> {
  const schoolId = useSchoolId();
  return useQuery({
    queryKey: settingsKeys.receipt(schoolId ?? "none"),
    queryFn: async () => (await getReceiptSettings()).settings,
    enabled: Boolean(schoolId),
    staleTime: staleTimes.reference,
  });
}

/** What {@link useUpdateReceiptSettings} returns. */
export interface UpdateReceiptSettings {
  /**
   * Saves the given fields.
   *
   * @param dto - The fields to change.
   * @param successMessage - Toast to show; omit for a silent save (a toggle,
   *   which shows its own state).
   */
  save: (dto: UpdateReceiptSettingsDto, successMessage?: string) => Promise<ReceiptSettings>;
  /** True while a save is in flight. */
  saving: boolean;
}

/**
 * Saves receipt settings, updating the cached copy optimistically so a toggle
 * flips at once and rolls back if the request fails.
 *
 * @returns The save function and its pending flag.
 */
export function useUpdateReceiptSettings(): UpdateReceiptSettings {
  const client = useQueryClient();
  const schoolId = useSchoolId();
  const key = settingsKeys.receipt(schoolId ?? "none");

  const mutation = useMutation({
    mutationFn: async ({ dto }: { dto: UpdateReceiptSettingsDto; successMessage?: string }) =>
      (await updateReceiptSettings(dto)).settings,
    onMutate: async ({ dto }) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<ReceiptSettings>(key);
      if (previous) client.setQueryData<ReceiptSettings>(key, { ...previous, ...dto });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
      logger.error("settings/receipt", "save failed", err);
      toast.error(getErrorMessage(err, "Failed to save receipt settings"));
    },
    onSuccess: (settings, { successMessage }) => {
      client.setQueryData(key, settings);
      if (successMessage) toast.success(successMessage);
    },
    onSettled: () => {
      client.invalidateQueries({ queryKey: key });
    },
  });

  return {
    save: (dto, successMessage) => mutation.mutateAsync({ dto, successMessage }),
    saving: mutation.isPending,
  };
}
