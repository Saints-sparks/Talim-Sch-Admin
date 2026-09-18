/**
 * Onboarding progress — which setup steps this school has finished.
 *
 * Progress lives in `localStorage` under the school id, not on the server:
 * the only thing the API records is whether phase 1 is done. A server "true"
 * is authoritative; a server "false" is not trusted over local state, because
 * the PATCH that records it is fire-and-forget and may not have landed.
 *
 * `useOnboardingSync` is what keeps this honest — it re-derives phase-2 steps
 * from the school's real data, so a step done from another device or another
 * page is ticked off here too.
 */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { API_URLS } from "@/app/lib/api/config";
import { api } from "@/lib/apiClient";

/** Every step of the two onboarding phases. */
export type OnboardingStepId =
  | "school-profile"
  | "personal-profile"
  | "academic-year"
  | "create-class"
  | "add-teacher"
  | "add-student"
  | "create-subject"
  | "create-course"
  | "create-announcement"
  | "timetable-entry"
  | "create-assessment";

/** One step of the checklist. */
export interface OnboardingStep {
  id: OnboardingStepId;
  /** Shown in the rail and the card header. */
  label: string;
  /** One sentence under the label. */
  description: string;
  /** Whether full access waits on it; optional steps can be skipped. */
  required: boolean;
  /** 1 = profile setup before the portal opens, 2 = the setup checklist. */
  phase: 1 | 2;
  /** Steps that must be done first; until they are, this one is locked. */
  deps: OnboardingStepId[];
}

/** The checklist, in the order it is shown. */
export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "school-profile",
    label: "School Profile",
    description: "Review and update your school information and logo.",
    required: true,
    phase: 1,
    deps: [],
  },
  {
    id: "personal-profile",
    label: "Personal Profile",
    description: "Set up your admin profile photo and display name.",
    required: true,
    phase: 1,
    deps: [],
  },
  {
    id: "academic-year",
    label: "Academic Year & Terms",
    description: "Create the current academic year and add your first term.",
    required: true,
    phase: 2,
    deps: [],
  },
  {
    id: "create-class",
    label: "Create First Class",
    description: "Add a class that students and teachers can be assigned to.",
    required: true,
    phase: 2,
    deps: ["academic-year"],
  },
  {
    id: "add-teacher",
    label: "Add First Teacher",
    description: "Register a teacher account and set up their profile.",
    required: true,
    phase: 2,
    deps: [],
  },
  {
    id: "add-student",
    label: "Add First Student",
    description: "Enrol a student and assign them to a class.",
    required: true,
    phase: 2,
    deps: ["create-class"],
  },
  {
    id: "create-subject",
    label: "Create First Subject",
    description: "Define a subject area for your school curriculum.",
    required: true,
    phase: 2,
    deps: [],
  },
  {
    id: "create-course",
    label: "Create First Course",
    description: "Create a course within a subject and assign it to a class.",
    required: true,
    phase: 2,
    deps: ["create-subject"],
  },
  {
    id: "create-announcement",
    label: "Create Announcement",
    description: "Post your first announcement to students and staff.",
    required: false,
    phase: 2,
    deps: [],
  },
  {
    id: "timetable-entry",
    label: "Add Timetable Entry",
    description: "Schedule a course session in the school timetable.",
    required: false,
    phase: 2,
    deps: ["create-class", "add-teacher", "create-course"],
  },
  {
    id: "create-assessment",
    label: "Create Assessment",
    description: "Set up your first assessment for a term.",
    required: false,
    phase: 2,
    deps: ["academic-year"],
  },
];

/** What is persisted per school. */
interface OnboardingState {
  completedSteps: OnboardingStepId[];
  phase1Completed: boolean;
  setupDismissed: boolean;
}

interface OnboardingContextType {
  completedSteps: OnboardingStepId[];
  phase1Completed: boolean;
  isHydrated: boolean;
  setupDismissed: boolean;
  isStepComplete: (id: OnboardingStepId) => boolean;
  isStepLocked: (id: OnboardingStepId) => boolean;
  markStepComplete: (id: OnboardingStepId) => void;
  completePhase1: () => void;
  dismissSetup: () => void;
  progressPercent: number;
  completedCount: number;
  totalCount: number;
  requiredRemaining: OnboardingStep[];
  isFullyComplete: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

/**
 * Onboarding progress for the signed-in school.
 *
 * @returns The checklist state and the actions that change it.
 * @throws When used outside `OnboardingProvider`.
 */
export const useOnboarding = (): OnboardingContextType => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
};

/** Where one school's progress is stored. */
const storageKey = (schoolId: string) => `onboarding_${schoolId}`;

/** Reads a school's stored progress, falling back to "nothing done". */
const loadState = (schoolId: string): OnboardingState => {
  if (typeof window === "undefined") {
    return { completedSteps: [], phase1Completed: false, setupDismissed: false };
  }
  try {
    const raw = localStorage.getItem(storageKey(schoolId));
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { completedSteps: [], phase1Completed: false, setupDismissed: false };
};

/** Writes a school's progress; a full or blocked store is not fatal. */
const saveState = (schoolId: string, state: OnboardingState) => {
  try {
    localStorage.setItem(storageKey(schoolId), JSON.stringify(state));
  } catch {
    // ignore
  }
};

const PHASE_1_STEP_IDS: OnboardingStepId[] = ["school-profile", "personal-profile"];

/**
 * Marks the cached user as onboarded in whichever storage holds it.
 *
 * Both are written because "keep me signed in" decides which one the session
 * was put in, and the app shell reads `onboardingCompleted` from there to
 * decide whether to send the admin back into onboarding on the next load.
 */
const markStoredUserOnboardingComplete = () => {
  if (typeof window === "undefined") return;

  ["localStorage", "sessionStorage"].forEach((storageName) => {
    const storage = window[storageName as "localStorage" | "sessionStorage"];
    const raw = storage.getItem("user");
    if (!raw) return;

    try {
      storage.setItem(
        "user",
        JSON.stringify({ ...JSON.parse(raw), onboardingCompleted: true })
      );
    } catch {
      // ignore malformed stored user
    }
  });
};

/**
 * Provides onboarding progress to the app.
 *
 * @param props.schoolId - The signed-in school; progress is stored per school.
 * @param props.serverOnboardingCompleted - The account's `onboardingCompleted`
 *   flag, trusted only when it is `true`.
 * @param props.isAuthLoading - True while the session is still being read, so
 *   a signed-out render is not mistaken for "nothing done".
 * @returns The provider.
 */
export const OnboardingProvider: React.FC<{
  children: React.ReactNode;
  schoolId: string | null;
  serverOnboardingCompleted?: boolean;
  isAuthLoading?: boolean;
}> = ({ children, schoolId, serverOnboardingCompleted, isAuthLoading = false }) => {
  const [state, setState] = useState<OnboardingState>({
    completedSteps: [],
    phase1Completed: false,
    setupDismissed: false,
  });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (!schoolId) {
      setIsHydrated(!isAuthLoading);
      return;
    }

    setIsHydrated(false);
    const local = loadState(schoolId);
    // Server "true" is authoritative (phase1 IS done).
    // Server "false" is NOT trusted — the backend PATCH may have failed silently.
    // If local state says completed, keep it.
    const phase1Completed = serverOnboardingCompleted === true ? true : local.phase1Completed;
    const completedSteps = phase1Completed
      ? Array.from(new Set([...local.completedSteps, ...PHASE_1_STEP_IDS]))
      : local.completedSteps;
    const next = { ...local, completedSteps, phase1Completed };
    setState(next);
    saveState(schoolId, next);
    setIsHydrated(true);
  }, [schoolId, serverOnboardingCompleted, isAuthLoading]);

  const persist = useCallback(
    (next: OnboardingState) => {
      setState(next);
      if (schoolId) saveState(schoolId, next);
    },
    [schoolId]
  );

  const isStepComplete = useCallback(
    (id: OnboardingStepId) => state.completedSteps.includes(id),
    [state.completedSteps]
  );

  const isStepLocked = useCallback(
    (id: OnboardingStepId) => {
      const step = ONBOARDING_STEPS.find((s) => s.id === id);
      if (!step) return false;
      return step.deps.some((dep) => !state.completedSteps.includes(dep));
    },
    [state.completedSteps]
  );

  const markStepComplete = useCallback(
    (id: OnboardingStepId) => {
      setState((current) => {
        if (current.completedSteps.includes(id)) return current;

        const next = {
          ...current,
          completedSteps: [...current.completedSteps, id],
        };

        if (schoolId) saveState(schoolId, next);
        return next;
      });
    },
    [schoolId]
  );

  const completePhase1 = useCallback(() => {
    const merged = Array.from(new Set([...state.completedSteps, ...PHASE_1_STEP_IDS]));
    persist({ ...state, completedSteps: merged, phase1Completed: true });
    markStoredUserOnboardingComplete();

    // Notify the server — fire-and-forget, localStorage is the fallback.
    api.patch(API_URLS.AUTH.COMPLETE_ONBOARDING).catch(() => undefined);
  }, [state, persist]);

  const dismissSetup = useCallback(() => {
    persist({ ...state, setupDismissed: true });
  }, [state, persist]);

  const allSteps = ONBOARDING_STEPS;
  const completedCount = state.completedSteps.length;
  const totalCount = allSteps.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const requiredRemaining = allSteps.filter(
    (s) => s.required && !state.completedSteps.includes(s.id)
  );

  const isFullyComplete = allSteps
    .filter((s) => s.required)
    .every((s) => state.completedSteps.includes(s.id));

  return (
    <OnboardingContext.Provider
      value={{
        completedSteps: state.completedSteps,
        phase1Completed: state.phase1Completed,
        isHydrated,
        setupDismissed: state.setupDismissed,
        isStepComplete,
        isStepLocked,
        markStepComplete,
        completePhase1,
        dismissSetup,
        progressPercent,
        completedCount,
        totalCount,
        requiredRemaining,
        isFullyComplete,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};
