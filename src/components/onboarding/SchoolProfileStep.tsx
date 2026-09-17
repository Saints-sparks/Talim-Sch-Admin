/**
 * Phase 1, step 1 — the school card.
 *
 * Everything but the logo is set up by a Talim administrator, so this step
 * confirms the details and stores a logo.
 */
"use client";

import { useRef } from "react";
import { ArrowRight, Loader2, Lock, Mail, MapPin, Phone, School, Upload } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { ReadOnlyField } from "@/components/onboarding/OnboardingAtoms";
import { useImagePicker } from "@/hooks/onboarding/useImagePicker";
import type { OnboardingSchoolInfo } from "@/hooks/onboarding/usePhase1Profile";

interface SchoolProfileStepProps {
  /** The school as the API returned it. */
  school: OnboardingSchoolInfo;
  /** True while the logo is being saved. */
  saving: boolean;
  /** Continues to step 2, storing `logo` first when a new one was picked. */
  onContinue: (logo: string | null) => void;
}

/**
 * @param props - See {@link SchoolProfileStepProps}.
 * @returns The school step.
 */
export default function SchoolProfileStep({ school, saving, onContinue }: SchoolProfileStepProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const logo = useImagePicker("onboarding/logo", school.logo);

  const location =
    [school.address, school.state, school.country].filter(Boolean).join(", ") || "Not set";

  return (
    <>
      <h1 className="text-2xl font-bold text-[#030E18] dark:text-slate-100">School Profile</h1>
      <p className="mt-1 text-sm text-[#6F6F6F] mb-6 dark:text-slate-400">
        This information was set up by your Talim administrator. You can upload a school logo.
      </p>

      <div className="flex items-center gap-4 mb-6">
        <div
          className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#003366] transition-colors group dark:border-slate-600 dark:bg-slate-800"
          onClick={() => fileRef.current?.click()}
        >
          {logo.preview ? (
            // Cloudinary and blob URLs are not in the Next image allow-list.
            <img src={logo.preview} alt="School logo" className="w-full h-full object-cover" />
          ) : (
            <School className="h-8 w-8 text-gray-300 group-hover:text-[#003366] transition-colors dark:text-slate-600" />
          )}
          {logo.uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            </div>
          )}
        </div>
        <div>
          <Tooltip
            content="Recommended: square image, at least 200×200px. Appears on reports and student-facing pages."
            side="top"
          >
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 text-sm font-medium text-[#003366] hover:underline dark:text-blue-300"
            >
              <Upload className="h-4 w-4" />
              {logo.preview ? "Change logo" : "Upload school logo"}
            </button>
          </Tooltip>
          <p className="text-xs text-gray-400 mt-0.5 dark:text-slate-500">PNG, JPG up to 5MB</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={logo.onFileChange}
        />
      </div>

      <div className="space-y-3">
        <Tooltip content="This was set during registration. Contact support to change it." side="top">
          <ReadOnlyField icon={<School className="h-4 w-4" />} label="School name" value={school.name} />
        </Tooltip>
        <ReadOnlyField icon={<Mail className="h-4 w-4" />} label="Email" value={school.email} />
        <ReadOnlyField
          icon={<Phone className="h-4 w-4" />}
          label="Contact phone"
          value={school.phone || "Not set"}
        />
        <ReadOnlyField icon={<MapPin className="h-4 w-4" />} label="Location" value={location} />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5 dark:bg-blue-900/20">
        <Lock className="h-4 w-4 text-blue-500 shrink-0" />
        <p className="text-xs text-blue-600 dark:text-blue-300">
          School name, email and phone can only be changed by a Talim administrator.
        </p>
      </div>

      <button
        onClick={() => onContinue(logo.uploadedUrl)}
        disabled={saving || logo.uploading}
        className="mt-8 w-full h-11 bg-[#003366] hover:bg-[#002244] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Saving…
          </>
        ) : (
          <>
            Continue <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </>
  );
}
