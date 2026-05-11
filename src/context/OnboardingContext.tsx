"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

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

export interface OnboardingStep {
  id: OnboardingStepId;
  label: string;
  description: string;
  required: boolean;
  phase: 1 | 2;
  deps: OnboardingStepId[];
}

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

interface OnboardingState {
  completedSteps: OnboardingStepId[];
  phase1Completed: boolean;
  setupDismissed: boolean;
}

interface OnboardingContextType {
  completedSteps: OnboardingStepId[];
  phase1Completed: boolean;
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

export const useOnboarding = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
};

const storageKey = (schoolId: string) => `onboarding_${schoolId}`;

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

const saveState = (schoolId: string, state: OnboardingState) => {
  try {
    localStorage.setItem(storageKey(schoolId), JSON.stringify(state));
  } catch {
    // ignore
  }
};

export const OnboardingProvider: React.FC<{
  children: React.ReactNode;
  schoolId: string | null;
  serverOnboardingCompleted?: boolean;
}> = ({ children, schoolId, serverOnboardingCompleted }) => {
  const [state, setState] = useState<OnboardingState>({
    completedSteps: [],
    phase1Completed: false,
    setupDismissed: false,
  });

  useEffect(() => {
    if (!schoolId) return;
    const local = loadState(schoolId);
    // Server flag is authoritative for phase1Completed
    const phase1Completed = serverOnboardingCompleted ?? local.phase1Completed;
    setState({ ...local, phase1Completed });
  }, [schoolId, serverOnboardingCompleted]);

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
      if (state.completedSteps.includes(id)) return;
      persist({
        ...state,
        completedSteps: [...state.completedSteps, id],
      });
    },
    [state, persist]
  );

  const completePhase1 = useCallback(() => {
    const phase1Ids: OnboardingStepId[] = ["school-profile", "personal-profile"];
    const merged = Array.from(new Set([...state.completedSteps, ...phase1Ids]));
    persist({ ...state, completedSteps: merged, phase1Completed: true });

    // Notify the server — fire-and-forget, localStorage is the fallback
    try {
      const token = typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
      if (token) {
        const { API_BASE_URL, API_URLS } = require("@/app/lib/api/config");
        fetch(`${API_BASE_URL}${API_URLS.AUTH.COMPLETE_ONBOARDING}`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    } catch {
      // ignore — server flag update is best-effort
    }
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
