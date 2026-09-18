/**
 * Picks the form for the step the checklist is on.
 *
 * Three cases come before the form itself: a step already done shows its
 * confirmation card, a step the signed-in role cannot perform shows why, and
 * only then is the step's own component rendered.
 */
"use client";

import { usePermissions } from "@/hooks/usePermissions";
import type { OnboardingStepId } from "@/context/OnboardingContext";
import { StepDoneCard, StepNotPermittedCard } from "@/components/onboarding/steps/StepCard";
import { permissionForStep } from "@/components/onboarding/steps/stepPermissions";
import AcademicYearStep from "@/components/onboarding/steps/AcademicYearStep";
import CreateClassStep from "@/components/onboarding/steps/CreateClassStep";
import { AddStudentStep, AddTeacherStep } from "@/components/onboarding/steps/PeopleSteps";
import { CreateCourseStep, CreateSubjectStep } from "@/components/onboarding/steps/CurriculumSteps";
import {
  CreateAnnouncementStep,
  CreateAssessmentStep,
  TimetableStep,
} from "@/components/onboarding/steps/ExtrasSteps";

/** Props for {@link StepContent}. */
export interface StepContentProps {
  /** The step being shown. */
  stepId: OnboardingStepId;
  /** Whether the step is already ticked off. */
  isComplete: boolean;
  /** Ticks the step off and moves the checklist on. */
  onComplete: (id: OnboardingStepId) => void;
  /** Passes over an optional step. */
  onSkip: (id: OnboardingStepId) => void;
}

/**
 * @param props - See {@link StepContentProps}.
 * @returns The card for the active step.
 */
export function StepContent({ stepId, isComplete, onComplete, onSkip }: StepContentProps) {
  const { hasPermission } = usePermissions();

  if (isComplete) return <StepDoneCard stepId={stepId} />;

  const required = permissionForStep(stepId);
  if (required && !hasPermission(required)) return <StepNotPermittedCard stepId={stepId} />;

  const complete = () => onComplete(stepId);
  const skip = () => onSkip(stepId);

  switch (stepId) {
    case "academic-year":
      return <AcademicYearStep onComplete={complete} />;
    case "create-class":
      return <CreateClassStep onComplete={complete} />;
    case "add-teacher":
      return <AddTeacherStep onComplete={complete} />;
    case "add-student":
      return <AddStudentStep onComplete={complete} />;
    case "create-subject":
      return <CreateSubjectStep onComplete={complete} />;
    case "create-course":
      return <CreateCourseStep onComplete={complete} />;
    case "create-announcement":
      return <CreateAnnouncementStep onComplete={complete} onSkip={skip} />;
    case "timetable-entry":
      return <TimetableStep onComplete={complete} onSkip={skip} />;
    case "create-assessment":
      return <CreateAssessmentStep onComplete={complete} onSkip={skip} />;
    default:
      return null;
  }
}
