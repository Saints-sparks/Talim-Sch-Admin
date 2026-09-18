/**
 * The data behind `/profile`: the signed-in administrator's own account and
 * the school record attached to it.
 *
 * `GET /auth/profile/:userId` already returns the school populated, so the
 * page needs one cached request rather than a profile call plus the school
 * dashboard aggregate. The query is the same one Settings → Admin Account
 * reads, so opening either screen after the other costs nothing and a save on
 * one is visible on the other.
 */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/CustomToast";
import { useAdminProfile } from "@/hooks/settings/useAdminProfile";
import { useAuth } from "@/context/AuthContext";
import { useSchoolId } from "@/hooks/useSchoolId";
import { settingsKeys } from "@/hooks/settings/keys";
import { queryKeys } from "@/lib/queryKeys";
import { getErrorMessage } from "@/lib/apiError";
import { logger } from "@/lib/logger";
import {
  authService,
  type UpdateUserProfilePayload,
  type UserProfile,
} from "@/app/services/auth.service";
import { updateSchool, type UpdateSchoolPayload } from "@/app/services/school.service";

/** The administrator's own details, as the page edits them. */
export interface AdminDetails {
  firstName: string;
  lastName: string;
  /** Read-only: the sign-in address cannot be changed from this screen. */
  email: string;
  phone: string;
  avatar: string | null;
}

/** The school details the page shows. */
export interface SchoolDetails {
  name: string;
  /** Read-only: the id prefix is a platform-admin decision. */
  prefix: string;
  street: string;
  state: string;
  country: string;
  logo: string | null;
}

/** What {@link useProfileSnapshot} returns. */
export interface ProfileSnapshot {
  /** The administrator's details as the server has them. */
  admin: AdminDetails;
  /** The school as the server has it. */
  school: SchoolDetails;
  /** True until the first load finishes. */
  isLoading: boolean;
  /** True when the profile could not be loaded at all. */
  isError: boolean;
  /** Retries the load. */
  retry: () => void;
}

/** Reads the administrator's details out of the profile response. */
function toAdminDetails(profile: UserProfile | undefined): AdminDetails {
  return {
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    email: profile?.email ?? "",
    phone: profile?.phoneNumber ?? "",
    avatar: profile?.userAvatar ?? null,
  };
}

/** Reads the school out of the profile response. */
function toSchoolDetails(profile: UserProfile | undefined): SchoolDetails {
  const school = profile?.schoolId;
  return {
    name: school?.name ?? "",
    prefix: school?.schoolPrefix ?? "",
    street: school?.physicalAddress ?? "",
    state: school?.location?.state ?? "",
    country: school?.location?.country ?? "",
    logo: school?.logo ?? null,
  };
}

/**
 * The administrator and their school, from one cached request.
 *
 * Falls back to the session user for the name and email, so a failed request
 * still renders a recognisable page instead of an empty one.
 *
 * @returns The snapshot and its loading/error state.
 */
export function useProfileSnapshot(): ProfileSnapshot {
  const { user } = useAuth();
  const query = useAdminProfile();

  const admin = toAdminDetails(query.data);
  const school = toSchoolDetails(query.data);

  return {
    admin: {
      firstName: admin.firstName || user?.firstName || "",
      lastName: admin.lastName || user?.lastName || "",
      email: admin.email || user?.email || "",
      phone: admin.phone || user?.phoneNumber || "",
      avatar: admin.avatar ?? user?.userAvatar ?? null,
    },
    school: {
      ...school,
      logo: school.logo ?? user?.schoolLogo ?? null,
    },
    isLoading: query.isLoading,
    isError: query.isError,
    retry: () => void query.refetch(),
  };
}

/** What {@link useSaveAdminDetails} returns. */
export interface SaveAdminDetails {
  /** Saves the administrator's personal details. */
  save: (details: Pick<AdminDetails, "firstName" | "lastName" | "phone">) => Promise<void>;
  /** Saves (or, with `""`, removes) the profile picture. */
  saveAvatar: (avatarUrl: string) => Promise<void>;
  /** True while either save is in flight. */
  saving: boolean;
}

/**
 * Saves the administrator's own account.
 *
 * The email is deliberately not sent: `UpdateUserProfilePayload` has no such
 * field, and the sign-in address is changed through account recovery.
 *
 * @returns The save functions and their pending flag.
 */
export function useSaveAdminDetails(): SaveAdminDetails {
  const client = useQueryClient();
  const { user, updateUser } = useAuth();
  const userId = user?.userId ?? user?._id ?? "none";

  const invalidate = () =>
    client.invalidateQueries({ queryKey: settingsKeys.adminProfile(userId) });

  const details = useMutation({
    mutationFn: (payload: UpdateUserProfilePayload) => authService.updateUserProfile(payload),
    onSuccess: (profile, payload) => {
      client.setQueryData(settingsKeys.adminProfile(userId), profile);
      void invalidate();
      updateUser({
        firstName: payload.firstName ?? profile.firstName,
        lastName: payload.lastName ?? profile.lastName,
        phoneNumber: payload.phoneNumber ?? profile.phoneNumber,
      });
      toast.success("Administrator details updated!");
    },
    onError: (err) => {
      logger.error("profile/admin", "save failed", err);
      toast.error(getErrorMessage(err, "Failed to update profile"));
    },
  });

  const avatar = useMutation({
    mutationFn: (avatarUrl: string) => authService.updateAvatarUrl(avatarUrl),
    onSuccess: ({ userAvatar }, avatarUrl) => {
      updateUser({ userAvatar });
      void invalidate();
      toast.success(avatarUrl ? "Profile picture updated" : "Profile picture removed");
    },
    onError: (err) => {
      logger.error("profile/avatar", "save failed", err);
      toast.error(getErrorMessage(err, "Failed to update profile picture"));
    },
  });

  return {
    save: async ({ firstName, lastName, phone }) => {
      await details.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phone.trim(),
      });
    },
    saveAvatar: async (avatarUrl) => {
      await avatar.mutateAsync(avatarUrl);
    },
    saving: details.isPending || avatar.isPending,
  };
}

/** What {@link useSaveSchoolDetails} returns. */
export interface SaveSchoolDetails {
  /** Saves the editable school fields. */
  save: (details: Omit<SchoolDetails, "prefix" | "logo">) => Promise<void>;
  /** Saves (or, with `null`, clears) the school logo. */
  saveLogo: (logoUrl: string | null) => Promise<void>;
  /** True while either save is in flight. */
  saving: boolean;
}

/**
 * Saves the school record behind `PUT /schools/update/:id`.
 *
 * `schoolPrefix` and `active` are never sent: the backend drops both for
 * school staff (they are platform-admin decisions), so offering them would be
 * an edit that silently does nothing.
 *
 * @returns The save functions and their pending flag.
 */
export function useSaveSchoolDetails(): SaveSchoolDetails {
  const client = useQueryClient();
  const schoolId = useSchoolId();
  const { user, updateUser } = useAuth();
  const userId = user?.userId ?? user?._id ?? "none";

  const mutation = useMutation({
    mutationFn: (payload: UpdateSchoolPayload) => {
      if (!schoolId) throw new Error("No school in the current session. Please sign in again.");
      return updateSchool(schoolId, payload);
    },
    onSuccess: () => {
      // The school travels inside the admin profile response, and the shell
      // reads the logo from the session user.
      void client.invalidateQueries({ queryKey: settingsKeys.adminProfile(userId) });
      void client.invalidateQueries({ queryKey: settingsKeys.schoolProfile(schoolId ?? "none") });
      void client.invalidateQueries({ queryKey: queryKeys.school.all });
    },
    onError: (err) => {
      logger.error("profile/school", "save failed", err);
      toast.error(getErrorMessage(err, "Failed to update profile"));
    },
  });

  return {
    save: async ({ name, street, state, country }) => {
      await mutation.mutateAsync({
        name: name.trim(),
        physicalAddress: street.trim(),
        location: { country, state },
      });
      toast.success("School information updated!");
    },
    saveLogo: async (logoUrl) => {
      await mutation.mutateAsync({ logo: logoUrl ?? "" });
      updateUser({ schoolLogo: logoUrl ?? "" });
      toast.success(logoUrl ? "School logo updated" : "School logo removed");
    },
    saving: mutation.isPending,
  };
}
