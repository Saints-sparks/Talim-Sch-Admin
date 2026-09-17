/**
 * Phase 1, step 2 — the administrator's own name and photo.
 *
 * Email and phone come from the account and are shown read-only; the names are
 * required because the rest of the portal addresses staff by them.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Lock, Mail, Phone, Upload, User } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { ReadOnlyField } from "@/components/onboarding/OnboardingAtoms";
import { useImagePicker } from "@/hooks/onboarding/useImagePicker";

/** The values step 2 saves. */
export interface PersonalProfileValues {
  firstName: string;
  lastName: string;
  /** Hosted avatar URL, or `null` when the admin kept the one they had. */
  avatar: string | null;
}

interface PersonalProfileStepProps {
  /** Stored first name, used as the initial value. */
  firstName: string;
  /** Stored last name, used as the initial value. */
  lastName: string;
  /** Stored avatar URL. */
  avatar: string | null;
  /** The account email, shown read-only. */
  email: string;
  /** The account phone number, shown read-only. */
  phone: string;
  /** True while the profile is being saved. */
  saving: boolean;
  /** Goes back to step 1. */
  onBack: () => void;
  /** Saves the details; only called once both names are filled in. */
  onSave: (values: PersonalProfileValues) => void;
}

/**
 * @param props - See {@link PersonalProfileStepProps}.
 * @returns The personal profile step.
 */
export default function PersonalProfileStep({
  firstName: storedFirstName,
  lastName: storedLastName,
  avatar,
  email,
  phone,
  saving,
  onBack,
  onSave,
}: PersonalProfileStepProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const photo = useImagePicker("onboarding/avatar", avatar);

  const [firstName, setFirstName] = useState(storedFirstName);
  const [lastName, setLastName] = useState(storedLastName);
  const [touched, setTouched] = useState(false);

  // Adopt the stored names once the profile read lands, unless the admin has
  // already started typing over them.
  useEffect(() => {
    if (touched) return;
    setFirstName(storedFirstName);
    setLastName(storedLastName);
  }, [storedFirstName, storedLastName, touched]);

  const firstNameError = touched && !firstName.trim() ? "First name is required" : null;
  const lastNameError = touched && !lastName.trim() ? "Last name is required" : null;

  const handleSubmit = () => {
    setTouched(true);
    if (!firstName.trim() || !lastName.trim()) return;
    onSave({ firstName: firstName.trim(), lastName: lastName.trim(), avatar: photo.uploadedUrl });
  };

  const nameInputCls = (hasError: boolean) =>
    `w-full h-10 px-3 border rounded-lg text-sm bg-[#F9FAFB] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#003366]/30 dark:bg-slate-800 dark:text-slate-100 ${
      hasError
        ? "border-red-400 focus:border-red-500 dark:border-red-500"
        : "border-[#E5E7EB] focus:border-[#003366] dark:border-slate-600"
    }`;

  return (
    <>
      <h1 className="text-2xl font-bold text-[#030E18] dark:text-slate-100">Your Profile</h1>
      <p className="mt-1 text-sm text-[#6F6F6F] mb-6 dark:text-slate-400">
        Add your name and a profile photo so your team recognises you.
      </p>

      <div className="flex items-center gap-4 mb-6">
        <div
          className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#003366] transition-colors group dark:border-slate-600 dark:bg-slate-800"
          onClick={() => fileRef.current?.click()}
        >
          {photo.preview ? (
            // Cloudinary and blob URLs are not in the Next image allow-list.
            <img src={photo.preview} alt="Your photo" className="w-full h-full object-cover" />
          ) : (
            <User className="h-8 w-8 text-gray-300 group-hover:text-[#003366] transition-colors dark:text-slate-600" />
          )}
          {photo.uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            </div>
          )}
        </div>
        <div>
          <Tooltip content="Your photo appears in messages and announcements you send." side="top">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 text-sm font-medium text-[#003366] hover:underline dark:text-blue-300"
            >
              <Upload className="h-4 w-4" />
              {photo.preview ? "Change photo" : "Upload photo"}
            </button>
          </Tooltip>
          <p className="text-xs text-gray-400 mt-0.5 dark:text-slate-500">Optional — PNG, JPG up to 5MB</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={photo.onFileChange}
        />
      </div>

      <div className="space-y-4">
        <Tooltip
          content="This name is shown to teachers, students, and parents across the platform."
          side="top"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="onboarding-first-name"
                className="block text-sm font-medium text-[#030E18] mb-1.5 dark:text-slate-200"
              >
                First name <span className="text-red-500">*</span>
              </label>
              <input
                id="onboarding-first-name"
                type="text"
                value={firstName}
                onChange={(e) => {
                  setTouched(true);
                  setFirstName(e.target.value);
                }}
                aria-invalid={Boolean(firstNameError)}
                placeholder="e.g. Sarah"
                className={nameInputCls(Boolean(firstNameError))}
              />
              {firstNameError && <p className="mt-1 text-xs text-red-600">{firstNameError}</p>}
            </div>
            <div>
              <label
                htmlFor="onboarding-last-name"
                className="block text-sm font-medium text-[#030E18] mb-1.5 dark:text-slate-200"
              >
                Last name <span className="text-red-500">*</span>
              </label>
              <input
                id="onboarding-last-name"
                type="text"
                value={lastName}
                onChange={(e) => {
                  setTouched(true);
                  setLastName(e.target.value);
                }}
                aria-invalid={Boolean(lastNameError)}
                placeholder="e.g. Johnson"
                className={nameInputCls(Boolean(lastNameError))}
              />
              {lastNameError && <p className="mt-1 text-xs text-red-600">{lastNameError}</p>}
            </div>
          </div>
        </Tooltip>

        <ReadOnlyField icon={<Mail className="h-4 w-4" />} label="Email" value={email} />
        <ReadOnlyField icon={<Phone className="h-4 w-4" />} label="Phone" value={phone || "Not set"} />
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5 dark:bg-blue-900/20">
        <Lock className="h-4 w-4 text-blue-500 shrink-0" />
        <p className="text-xs text-blue-600 dark:text-blue-300">
          Email and phone number can only be changed by a Talim administrator.
        </p>
      </div>

      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="h-11 px-5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || photo.uploading}
          className="flex-1 h-11 bg-[#003366] hover:bg-[#002244] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" /> Save &amp; Continue
            </>
          )}
        </button>
      </div>
    </>
  );
}
