/**
 * Data for onboarding phase 1 — the school card and the administrator's own
 * profile.
 *
 * Both reads are cached queries rather than a `useEffect` fetch, so coming
 * back to the screen (or reloading it mid-flow) shows what was already loaded
 * instead of an empty form, and the two requests run in parallel.
 */
"use client";

import { useMemo } from "react";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useSchoolId } from "@/hooks/useSchoolId";
import { useSchoolDashboardQuery } from "@/hooks/dashboard/useDashboardQueries";
import { useAdminProfile } from "@/hooks/settings/useAdminProfile";
import { updateSchool } from "@/app/services/school.service";
import { authService, type UpdateUserProfilePayload, type UserProfile } from "@/app/services/auth.service";
import { logger } from "@/lib/logger";

/** The school details onboarding shows, flattened out of the dashboard payload. */
export interface OnboardingSchoolInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  state: string;
  logo: string | null;
}

/** An empty school card, used until the school read lands. */
const EMPTY_SCHOOL: OnboardingSchoolInfo = {
  name: "",
  email: "",
  phone: "",
  address: "",
  country: "",
  state: "",
  logo: null,
};

/** What {@link usePhase1Profile} hands the page. */
export interface Phase1Profile {
  /** The school's own details. */
  school: OnboardingSchoolInfo;
  /** The administrator's stored first name, or `""`. */
  firstName: string;
  /** The administrator's stored last name, or `""`. */
  lastName: string;
  /** The administrator's stored avatar URL, or `null`. */
  avatar: string | null;
  /** True while either read is still in flight. */
  isLoading: boolean;
  /** True once the school record carries the details a school is set up with. */
  hasSchoolProfile: boolean;
  /** True once the administrator has both names stored. */
  hasPersonalProfile: boolean;
  /** Both reads failed, so the form would be filled in blind. */
  isError: boolean;
  /** Retries whichever read failed. */
  retry: () => void;
}

/**
 * Loads the school and the signed-in administrator in parallel.
 *
 * Neither failure is fatal — the admin can still type their details in — so
 * the page treats `isError` as a banner rather than an empty screen.
 *
 * @returns The current values plus the flags that decide whether phase 1 is
 *   already satisfied.
 */
export function usePhase1Profile(): Phase1Profile {
  const schoolId = useSchoolId();
  const schoolQuery = useSchoolDashboardQuery();
  const profileQuery = useAdminProfile();

  const school = useMemo<OnboardingSchoolInfo>(() => {
    const info = schoolQuery.data?.schoolInfo;
    if (!info) return EMPTY_SCHOOL;
    return {
      name: info.name ?? "",
      email: info.email ?? "",
      phone: info.primaryContacts?.[0]?.phone ?? "",
      address: info.physicalAddress ?? "",
      country: info.location?.country ?? "",
      state: info.location?.state ?? "",
      logo: info.logo ?? null,
    };
  }, [schoolQuery.data]);

  const profile = profileQuery.data;

  return {
    school,
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    avatar: profile?.userAvatar ?? null,
    isLoading: (Boolean(schoolId) && schoolQuery.isLoading) || profileQuery.isLoading,
    hasSchoolProfile: Boolean(school.name && school.email),
    hasPersonalProfile: Boolean(profile?.firstName?.trim() && profile?.lastName?.trim()),
    isError: schoolQuery.isError && profileQuery.isError,
    retry: () => {
      if (schoolQuery.isError) void schoolQuery.refetch();
      if (profileQuery.isError) void profileQuery.refetch();
    },
  };
}

/**
 * Saves the school logo chosen in step 1.
 *
 * The school record itself is set up by a Talim administrator, so the logo is
 * the only field this step writes.
 *
 * @returns The mutation; `mutateAsync(logoUrl)` resolves once the logo is stored.
 */
export function useSaveSchoolLogo(): UseMutationResult<void, unknown, string> {
  const schoolId = useSchoolId();

  return useMutation({
    mutationFn: async (logo: string) => {
      if (!schoolId) throw new Error("No school in the current session");
      await updateSchool(schoolId, { logo });
    },
    onError: (err) => logger.error("onboarding/school-logo", "logo save failed", err),
  });
}

/**
 * Saves the administrator's name and photo in step 2, and mirrors them onto
 * the session user so the app shell greets them correctly straight away.
 *
 * @returns The mutation; `mutateAsync(payload)` resolves with the saved profile.
 */
export function useSavePersonalProfile(): UseMutationResult<UserProfile, unknown, UpdateUserProfilePayload> {
  const { updateUser } = useAuth();

  return useMutation({
    mutationFn: (payload: UpdateUserProfilePayload) => authService.updateUserProfile(payload),
    onSuccess: (_profile, payload) => {
      updateUser({
        firstName: payload.firstName,
        lastName: payload.lastName,
        ...(payload.userAvatar ? { userAvatar: payload.userAvatar } : {}),
        onboardingCompleted: true,
      });
    },
    onError: (err) => logger.error("onboarding/personal-profile", "profile save failed", err),
  });
}
