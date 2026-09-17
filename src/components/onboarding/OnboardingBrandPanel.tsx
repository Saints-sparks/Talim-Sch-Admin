/**
 * The blue panel beside the phase-1 form: logo, illustration and a line about
 * the step being filled in.
 */
"use client";

import Image from "next/legacy/image";
import treelogo from "../../../public/img/treelogo.svg";
import loginImage from "../../../public/img/Education-rafiki 1.svg";

/**
 * @param props.step - Which phase-1 step is showing (0 = school, 1 = personal).
 * @returns The brand panel, hidden below `lg`.
 */
export default function OnboardingBrandPanel({ step }: { step: 0 | 1 }) {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center bg-[#003366] p-12">
      <div className="flex items-center gap-3 mb-10">
        <Image src={treelogo} alt="Talim Logo" width={44} height={44} />
        <span className="text-2xl font-bold text-white">Talim</span>
        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
          School Admin
        </span>
      </div>
      <div className="relative w-full max-w-sm aspect-square opacity-90">
        <Image src={loginImage} alt="Setup illustration" layout="fill" objectFit="contain" />
      </div>
      <div className="mt-8 text-center">
        <p className="text-xl font-bold text-white">
          {step === 0 ? "Let's set up your school" : "Almost there!"}
        </p>
        <p className="mt-2 text-sm text-white/70 max-w-xs leading-relaxed">
          {step === 0
            ? "Confirm your school details and upload a logo before getting started."
            : "Set up your personal admin profile so your team knows who you are."}
        </p>
      </div>
      <div className="mt-10 flex gap-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${step === 0 ? "w-8 bg-white" : "w-2 bg-white/40"}`}
        />
        <div
          className={`h-2 rounded-full transition-all duration-300 ${step === 1 ? "w-8 bg-white" : "w-2 bg-white/40"}`}
        />
      </div>
    </div>
  );
}
