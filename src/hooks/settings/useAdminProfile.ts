/**
 * Settings → Admin Profile and Security data: the signed-in administrator's
 * own account.
 *
 * The user id comes from the auth context — no page decodes the token or reads
 * the cached user out of localStorage — and a save updates both the cached
 * query and the session user the app shell renders.
 */
"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/CustomToast";
import { useAuth } from "@/context/AuthContext";
import { settingsKeys } from "@/hooks/settings/keys";
import { staleTimes } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import {
  authService,
  type UpdateUserProfilePayload,
  type UserProfile,
} from "@/app/services/auth.service";

/**
 * The signed-in administrator's full profile.
 *
 * @returns Query result; disabled (and never loading) when there is no session.
 */
export function useAdminProfile(): UseQueryResult<UserProfile> {
  const { user } = useAuth();
  const userId = user?.userId ?? user?._id ?? null;
  return useQuery({
    queryKey: settingsKeys.adminProfile(userId ?? "none"),
    queryFn: () => authService.getUserProfile(userId as string),
    enabled: Boolean(userId),
    staleTime: staleTimes.list,
  });
}

/** What {@link useUpdateAdminProfile} returns. */
export interface UpdateAdminProfile {
  /** Saves the given personal details. */
  save: (payload: UpdateUserProfilePayload) => Promise<UserProfile>;
  /** True while a save is in flight. */
  saving: boolean;
}

/**
 * Saves the administrator's own details and keeps the session user in step.
 *
 * @param successMessage - Toast shown after a successful save.
 * @returns The save function and its pending flag.
 */
export function useUpdateAdminProfile(successMessage = "Profile updated successfully"): UpdateAdminProfile {
  const client = useQueryClient();
  const { user, updateUser } = useAuth();
  const userId = user?.userId ?? user?._id ?? "none";

  const mutation = useMutation({
    mutationFn: (payload: UpdateUserProfilePayload) => authService.updateUserProfile(payload),
    onSuccess: (profile, payload) => {
      client.setQueryData(settingsKeys.adminProfile(userId), profile);
      client.invalidateQueries({ queryKey: settingsKeys.adminProfile(userId) });
      updateUser({
        firstName: payload.firstName ?? profile.firstName,
        lastName: payload.lastName ?? profile.lastName,
        phoneNumber: payload.phoneNumber ?? profile.phoneNumber,
      });
      toast.success(successMessage);
    },
    onError: (err) => {
      logger.error("settings/admin-profile", "save failed", err);
      toast.error(getErrorMessage(err, "Failed to update profile"));
    },
  });

  return { save: mutation.mutateAsync, saving: mutation.isPending };
}

/** What {@link useUpdateAdminAvatar} returns. */
export interface UpdateAdminAvatar {
  /** Saves a hosted avatar URL (an empty string removes it). */
  save: (avatarUrl: string) => Promise<{ userAvatar: string }>;
  /** True while a save is in flight. */
  saving: boolean;
}

/**
 * Saves the administrator's profile picture.
 *
 * @returns The save function and its pending flag.
 */
export function useUpdateAdminAvatar(): UpdateAdminAvatar {
  const client = useQueryClient();
  const { user, updateUser } = useAuth();
  const userId = user?.userId ?? user?._id ?? "none";

  const mutation = useMutation({
    mutationFn: (avatarUrl: string) => authService.updateAvatarUrl(avatarUrl),
    onSuccess: ({ userAvatar }) => {
      updateUser({ userAvatar });
      client.invalidateQueries({ queryKey: settingsKeys.adminProfile(userId) });
      toast.success("Profile picture updated");
    },
    onError: (err) => {
      logger.error("settings/admin-avatar", "save failed", err);
      toast.error(getErrorMessage(err, "Failed to update profile picture"));
    },
  });

  return { save: mutation.mutateAsync, saving: mutation.isPending };
}
