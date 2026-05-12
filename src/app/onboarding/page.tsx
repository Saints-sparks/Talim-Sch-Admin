"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/legacy/image";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  CheckCircle2,
  Upload,
  School,
  User,
  Mail,
  Phone,
  MapPin,
  Loader2,
  ArrowRight,
  Lock,
} from "lucide-react";
import { toast } from "@/components/CustomToast";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { authService, type UpdateUserProfilePayload } from "@/app/services/auth.service";
import { getSchoolId, updateSchool } from "@/app/services/school.service";
import { getSchoolDashboard } from "@/app/services/dashboard.service";
import { uploadToCloudinary, validateImageFile } from "@/app/utils/cloudinary";
import treelogo from "../../../public/img/treelogo.svg";
import loginImage from "../../../public/img/Education-rafiki 1.svg";

type Step = 0 | 1;

interface SchoolInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  state: string;
  logo: string | null;
}

export default function OnboardingPhase1() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { phase1Completed, completePhase1 } = useOnboarding();

  const [step, setStep] = useState<Step>(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // School profile state
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({
    name: "",
    email: "",
    phone: "",
    address: "",
    country: "",
    state: "",
    logo: null,
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState("");

  // Personal profile state
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.userAvatar ?? null
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Redirect if Phase 1 already done
  useEffect(() => {
    if (phase1Completed) {
      router.replace("/onboarding/setup");
    }
  }, [phase1Completed, router]);

  // Load school + user profile data
  useEffect(() => {
    const load = async () => {
      try {
        const schoolId = getSchoolId();
        if (schoolId) {
          const data = await getSchoolDashboard(schoolId);
          const si = data.schoolInfo;
          setSchoolInfo({
            name: si?.name ?? "",
            email: si?.email ?? "",
            phone: si?.primaryContacts?.[0]?.phone ?? "",
            address: si?.physicalAddress ?? "",
            country: si?.location?.country ?? "",
            state: si?.location?.state ?? "",
            logo: si?.logo ?? null,
          });
          if (si?.logo) setLogoPreview(si.logo);
        }
        if (user?.userId) {
          const profile = await authService.getUserProfile(user.userId);
          setFirstName(profile.firstName ?? "");
          setLastName(profile.lastName ?? "");
          if (profile.userAvatar) setAvatarPreview(profile.userAvatar);
        }
      } catch {
        // non-critical — proceed with empty fields
      }
    };
    load();
  }, [user?.userId]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { valid, error } = validateImageFile(file);
    if (!valid) { toast.error(error || "Invalid file"); return; }
    setLogoPreview(URL.createObjectURL(file));
    setUploadingImage(true);
    try {
      const url = await uploadToCloudinary(file);
      setSchoolInfo((prev) => ({ ...prev, logo: url }));
    } catch {
      toast.error("Logo upload failed. Please try again.");
      setLogoPreview(schoolInfo.logo);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { valid, error } = validateImageFile(file);
    if (!valid) { toast.error(error || "Invalid file"); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Step 1 save: update school logo
  const saveSchoolProfile = async () => {
    setSubmitting(true);
    try {
      const schoolId = getSchoolId();
      if (schoolId && schoolInfo.logo) {
        await updateSchool(schoolId, { logo: schoolInfo.logo });
      }
      setStep(1);
    } catch {
      toast.error("Failed to save school profile. You can update it later.");
      setStep(1); // allow proceeding anyway
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2 save: update personal profile
  const savePersonalProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Please enter your first and last name.");
      return;
    }
    setSubmitting(true);
    try {
      let avatarUrl = avatarPreview;
      if (avatarFile) {
        setUploadingImage(true);
        try {
          avatarUrl = await uploadToCloudinary(avatarFile);
        } finally {
          setUploadingImage(false);
        }
      }
      const payload: UpdateUserProfilePayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(avatarUrl ? { userAvatar: avatarUrl } : {}),
      };
      await authService.updateUserProfile(payload);
      updateUser({ firstName: firstName.trim(), lastName: lastName.trim(), userAvatar: avatarUrl ?? undefined });
      completePhase1();
      router.push("/onboarding/setup");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-[#003366] p-12">
        <div className="flex items-center gap-3 mb-10">
          <Image src={treelogo} alt="Talim Logo" width={44} height={44} />
          <span className="text-2xl font-bold text-white">Talim</span>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white">
            School Admin
          </span>
        </div>
        <div className="relative w-full max-w-sm aspect-square opacity-90">
          <Image
            src={loginImage}
            alt="Setup illustration"
            layout="fill"
            objectFit="contain"
          />
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
        {/* Step dots */}
        <div className="mt-10 flex gap-2">
          <div className={`h-2 rounded-full transition-all duration-300 ${step === 0 ? "w-8 bg-white" : "w-2 bg-white/40"}`} />
          <div className={`h-2 rounded-full transition-all duration-300 ${step === 1 ? "w-8 bg-white" : "w-2 bg-white/40"}`} />
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-col justify-center px-8 py-12 sm:px-16 bg-white overflow-y-auto">
        <div className="w-full max-w-md mx-auto">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <Image src={treelogo} alt="Talim Logo" width={36} height={36} />
            <span className="text-lg font-bold text-[#030E18]">Talim</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <StepBadge num={1} active={step === 0} done={step > 0} />
            <div className="flex-1 h-0.5 bg-gray-200">
              <div
                className="h-full bg-[#003366] transition-all duration-500"
                style={{ width: step >= 1 ? "100%" : "0%" }}
              />
            </div>
            <StepBadge num={2} active={step === 1} done={false} />
          </div>

          {/* ─── Step 0: School Profile ─── */}
          {step === 0 && (
            <>
              <h1 className="text-2xl font-bold text-[#030E18]">School Profile</h1>
              <p className="mt-1 text-sm text-[#6F6F6F] mb-6">
                This information was set up by your Talim administrator. You can upload a school logo.
              </p>

              {/* Logo upload */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#003366] transition-colors group"
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="School logo" className="w-full h-full object-cover" />
                  ) : (
                    <School className="h-8 w-8 text-gray-300 group-hover:text-[#003366] transition-colors" />
                  )}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <Tooltip content="Recommended: square image, at least 200×200px. Appears on reports and student-facing pages." side="top">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm font-medium text-[#003366] hover:underline"
                  >
                    <Upload className="h-4 w-4" />
                    {logoPreview ? "Change logo" : "Upload school logo"}
                  </button>
                  </Tooltip>
                  <p className="text-xs text-gray-400 mt-0.5">PNG, JPG up to 5MB</p>
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
              </div>

              {/* Read-only school fields */}
              <div className="space-y-3">
                <Tooltip content="This was set during registration. Contact support to change it." side="top">
                <ReadOnlyField icon={<School className="h-4 w-4" />} label="School name" value={schoolInfo.name} />
                </Tooltip>
                <ReadOnlyField icon={<Mail className="h-4 w-4" />} label="Email" value={schoolInfo.email} />
                <ReadOnlyField icon={<Phone className="h-4 w-4" />} label="Contact phone" value={schoolInfo.phone || "Not set"} />
                <ReadOnlyField
                  icon={<MapPin className="h-4 w-4" />}
                  label="Location"
                  value={[schoolInfo.address, schoolInfo.state, schoolInfo.country].filter(Boolean).join(", ") || "Not set"}
                />
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5">
                <Lock className="h-4 w-4 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-600">
                  School name, email and phone can only be changed by a Talim administrator.
                </p>
              </div>

              <button
                onClick={saveSchoolProfile}
                disabled={submitting || uploadingImage}
                className="mt-8 w-full h-11 bg-[#003366] hover:bg-[#002244] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                ) : (
                  <>Continue <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
            </>
          )}

          {/* ─── Step 1: Personal Profile ─── */}
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-[#030E18]">Your Profile</h1>
              <p className="mt-1 text-sm text-[#6F6F6F] mb-6">
                Add your name and a profile photo so your team recognises you.
              </p>

              {/* Avatar upload */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="relative w-20 h-20 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#003366] transition-colors group"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Your photo" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-gray-300 group-hover:text-[#003366] transition-colors" />
                  )}
                </div>
                <div>
                  <Tooltip content="Your photo appears in messages and announcements you send." side="top">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="flex items-center gap-2 text-sm font-medium text-[#003366] hover:underline"
                  >
                    <Upload className="h-4 w-4" />
                    {avatarPreview ? "Change photo" : "Upload photo"}
                  </button>
                  </Tooltip>
                  <p className="text-xs text-gray-400 mt-0.5">Optional — PNG, JPG up to 5MB</p>
                </div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>

              {/* Editable name fields */}
              <div className="space-y-4">
                <Tooltip content="This name is shown to teachers, students, and parents across the platform." side="top">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#030E18] mb-1.5">First name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Sarah"
                      className="w-full h-10 px-3 border border-[#E5E7EB] bg-[#F9FAFB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#030E18] mb-1.5">Last name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Johnson"
                      className="w-full h-10 px-3 border border-[#E5E7EB] bg-[#F9FAFB] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366]"
                    />
                  </div>
                </div>
                </Tooltip>

                {/* Read-only contact */}
                <ReadOnlyField icon={<Mail className="h-4 w-4" />} label="Email" value={user?.email ?? ""} />
                <ReadOnlyField icon={<Phone className="h-4 w-4" />} label="Phone" value={user?.phoneNumber || "Not set"} />
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5">
                <Lock className="h-4 w-4 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-600">
                  Email and phone number can only be changed by a Talim administrator.
                </p>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="h-11 px-5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={savePersonalProfile}
                  disabled={submitting || uploadingImage}
                  className="flex-1 h-11 bg-[#003366] hover:bg-[#002244] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  ) : (
                    <><CheckCircle2 className="h-4 w-4" /> Save & Continue</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StepBadge({ num, active, done }: { num: number; active: boolean; done: boolean }) {
  if (done) {
    return (
      <div className="w-8 h-8 rounded-full bg-[#003366] flex items-center justify-center shrink-0">
        <CheckCircle2 className="h-4 w-4 text-white" />
      </div>
    );
  }
  return (
    <div
      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 text-sm font-bold transition-colors ${
        active
          ? "border-[#003366] bg-[#003366] text-white"
          : "border-gray-300 text-gray-400"
      }`}
    >
      {num}
    </div>
  );
}

function ReadOnlyField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
      <span className="text-gray-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-700 truncate">{value || "—"}</p>
      </div>
    </div>
  );
}
