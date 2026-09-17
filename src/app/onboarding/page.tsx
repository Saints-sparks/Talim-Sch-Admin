"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/legacy/image";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "@/components/CustomToast";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import OnboardingBrandPanel from "@/components/onboarding/OnboardingBrandPanel";
import SchoolProfileStep from "@/components/onboarding/SchoolProfileStep";
import PersonalProfileStep, {
  type PersonalProfileValues,
} from "@/components/onboarding/PersonalProfileStep";
import { StepBadge } from "@/components/onboarding/OnboardingAtoms";
import {
  usePhase1Profile,
  useSavePersonalProfile,
  useSaveSchoolLogo,
} from "@/hooks/onboarding/usePhase1Profile";
import { getErrorMessage } from "@/lib/apiError";
import treelogo from "../../../public/img/treelogo.svg";

type Step = 0 | 1;

/**
 * Onboarding phase 1 — confirm the school, then set up the administrator's own
 * profile. A school that already has both is sent straight on to the setup
 * checklist, so signing in again never restarts the flow.
 *
 * @returns The two-step phase-1 screen.
 */
export default function OnboardingPhase1() {
  const router = useRouter();
  const { user } = useAuth();
  const { phase1Completed, completePhase1, isHydrated } = useOnboarding();

  const [step, setStep] = useState<Step>(0);
  const profile = usePhase1Profile();
  const saveLogo = useSaveSchoolLogo();
  const savePersonal = useSavePersonalProfile();

  // Phase 1 is already behind them — either locally or because the account
  // carries both the school and the administrator's name.
  const alreadyDone =
    !profile.isLoading && profile.hasSchoolProfile && profile.hasPersonalProfile;

  useEffect(() => {
    if (!isHydrated) return;
    if (phase1Completed) {
      router.replace("/onboarding/setup");
      return;
    }
    if (alreadyDone) {
      completePhase1();
      router.replace("/onboarding/setup");
    }
  }, [isHydrated, phase1Completed, alreadyDone, completePhase1, router]);

  /** Stores a newly picked logo, then moves on — a failed save must not trap them. */
  const handleSchoolContinue = async (logo: string | null) => {
    if (logo) {
      try {
        await saveLogo.mutateAsync(logo);
      } catch (err) {
        toast.error(getErrorMessage(err, "We couldn't save the logo. You can add it later."));
      }
    }
    setStep(1);
  };

  const handlePersonalSave = async (values: PersonalProfileValues) => {
    try {
      await savePersonal.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        ...(values.avatar ? { userAvatar: values.avatar } : {}),
      });
      completePhase1();
      router.push("/onboarding/setup");
    } catch (err) {
      toast.error(getErrorMessage(err, "We couldn't save your profile. Please try again."));
    }
  };

  if (!isHydrated || profile.isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-[#003366] dark:text-blue-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <OnboardingBrandPanel step={step} />

      <div className="flex flex-col justify-center px-8 py-12 sm:px-16 bg-white overflow-y-auto dark:bg-slate-900">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <Image src={treelogo} alt="Talim Logo" width={36} height={36} />
            <span className="text-lg font-bold text-[#030E18] dark:text-slate-100">Talim</span>
          </div>

          <div className="flex items-center gap-2 mb-8">
            <StepBadge num={1} active={step === 0} done={step > 0} />
            <div className="flex-1 h-0.5 bg-gray-200 dark:bg-slate-700">
              <div
                className="h-full bg-[#003366] transition-all duration-500"
                style={{ width: step >= 1 ? "100%" : "0%" }}
              />
            </div>
            <StepBadge num={2} active={step === 1} done={false} />
          </div>

          {profile.isError && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div>
                <p>We couldn&apos;t load your details. You can still fill them in below.</p>
                <button type="button" onClick={profile.retry} className="mt-1 font-semibold underline">
                  Try again
                </button>
              </div>
            </div>
          )}

          {step === 0 ? (
            <SchoolProfileStep
              school={profile.school}
              saving={saveLogo.isPending}
              onContinue={handleSchoolContinue}
            />
          ) : (
            <PersonalProfileStep
              firstName={profile.firstName || user?.firstName || ""}
              lastName={profile.lastName || user?.lastName || ""}
              avatar={profile.avatar ?? user?.userAvatar ?? null}
              email={user?.email ?? ""}
              phone={user?.phoneNumber ?? ""}
              saving={savePersonal.isPending}
              onBack={() => setStep(0)}
              onSave={handlePersonalSave}
            />
          )}
        </div>
      </div>
    </div>
  );
}
