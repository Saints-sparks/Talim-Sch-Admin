"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  School,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  X,
  Eye,
  EyeOff,
  Edit3,
  AlertCircle,
  Building,
  Globe,
  Key,
  Shield,
  Pencil,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import Image from "next/image";
import {
  getSchoolDashboard,
  type SchoolDashboardData,
} from "../services/dashboard.service";
import {
  getSchoolId,
  updateSchool,
  type UpdateSchoolPayload,
} from "../services/school.service";
import { uploadToCloudinary, validateImageFile } from "../utils/cloudinary";
import { getLocalStorageItem } from "../utils/localStorage";
import {
  authService,
  type UserProfile,
  type UpdateUserProfilePayload,
} from "../services/auth.service";

// Which section is currently being edited
type EditingSection = "admin" | "school" | null;

interface FormData {
  schoolName: string;
  schoolPrefix: string;
  street: string;
  state: string;
  country: string;
  logo: string | null;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone: string;
  adminAvatar: string | null;
}

export default function Profile() {
  const [editingSection, setEditingSection] = useState<EditingSection>(null);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const [formData, setFormData] = useState<FormData>({
    schoolName: "",
    schoolPrefix: "",
    street: "",
    state: "",
    country: "",
    logo: null,
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminPhone: "",
    adminAvatar: null,
  });

  // ─── Data loading ────────────────────────────────────────────────────────────
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoadingData(true);

        const storedUser = getLocalStorageItem("user");
        if (storedUser && storedUser.userId) {
          try {
            const userProfile: UserProfile = await authService.getUserProfile(
              storedUser.userId
            );
            setFormData((prev) => ({
              ...prev,
              adminFirstName: userProfile.firstName || "",
              adminLastName: userProfile.lastName || "",
              adminEmail: userProfile.email || "",
              adminPhone: userProfile.phoneNumber || "",
              adminAvatar: userProfile.userAvatar || null,
            }));

            if (userProfile.schoolId) {
              setFormData((prev) => ({
                ...prev,
                schoolName: userProfile.schoolId.name || "",
                schoolPrefix: userProfile.schoolId.schoolPrefix || "",
                street: userProfile.schoolId.physicalAddress || "",
                state: userProfile.schoolId.location?.state || "",
                country: userProfile.schoolId.location?.country || "",
                logo: userProfile.schoolId.logo || null,
              }));
            }
          } catch {
            const fallback = storedUser || {};
            setFormData((prev) => ({
              ...prev,
              adminFirstName: fallback.firstName || fallback.name?.split(" ")[0] || "",
              adminLastName:
                fallback.lastName || fallback.name?.split(" ").slice(1).join(" ") || "",
              adminEmail: fallback.email || "",
              adminPhone: fallback.phoneNumber || fallback.phone || "",
            }));
          }
        }

        const schoolId = getSchoolId();
        if (schoolId) {
          try {
            const dashboardData: SchoolDashboardData = await getSchoolDashboard(schoolId);
            if (dashboardData?.schoolInfo) {
              setFormData((prev) => ({
                ...prev,
                schoolName: dashboardData.schoolInfo.name || prev.schoolName,
                schoolPrefix: dashboardData.schoolInfo.schoolPrefix || prev.schoolPrefix,
                street: dashboardData.schoolInfo.physicalAddress || prev.street,
                state: dashboardData.schoolInfo.location?.state || prev.state,
                country: dashboardData.schoolInfo.location?.country || prev.country,
                logo: dashboardData.schoolInfo.logo || prev.logo,
              }));
            }
          } catch {
            // ignore — keep existing data
          }
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadProfileData();
  }, []);

  // ─── Validation ──────────────────────────────────────────────────────────────
  const validateForm = (section: EditingSection): string | null => {
    if (section === "school") {
      if (!formData.schoolName.trim()) return "School name is required";
      if (!formData.schoolPrefix.trim()) return "School prefix is required";
      if (!formData.street.trim()) return "Street address is required";
      if (!formData.state) return "State is required";
      if (!formData.country) return "Country is required";
    } else {
      if (!formData.adminFirstName.trim()) return "First name is required";
      if (!formData.adminLastName.trim()) return "Last name is required";
      if (!formData.adminEmail.trim()) return "Email is required";
      if (!formData.adminPhone.trim()) return "Phone number is required";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.adminEmail.trim()))
        return "Please enter a valid email address";
      if (password || confirmPassword) {
        if (password.length < 8) return "Password must be at least 8 characters";
        if (password !== confirmPassword) return "Passwords do not match";
      }
    }
    return null;
  };

  // ─── Input handlers ───────────────────────────────────────────────────────────
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ─── File upload ──────────────────────────────────────────────────────────────
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "logo" | "avatar"
  ) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file");
      e.target.value = "";
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target) {
        if (target === "logo") setLogoPreview(event.target.result as string);
        else setAvatarPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploadingImage(true);
    setUploadProgress(0);
    const toastId = toast.loading("Uploading image...");

    try {
      const imageUrl = await uploadToCloudinary(file, (p) => setUploadProgress(Math.round(p)));
      if (target === "logo") {
        setFormData((prev) => ({ ...prev, logo: imageUrl }));
      } else {
        setFormData((prev) => ({ ...prev, adminAvatar: imageUrl }));
      }
      toast.success("Image uploaded successfully!", { id: toastId });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload image", {
        id: toastId,
      });
      if (target === "logo") {
        setLogoPreview(null);
        setFormData((prev) => ({ ...prev, logo: null }));
      } else {
        setAvatarPreview(null);
        setFormData((prev) => ({ ...prev, adminAvatar: null }));
      }
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
      e.target.value = "";
    }
  };

  // ─── Save ─────────────────────────────────────────────────────────────────────
  const handleUpdate = async (section: EditingSection) => {
    const validationError = validateForm(section);
    if (validationError) { toast.error(validationError); return; }
    if (isUploadingImage) { toast.error("Please wait for image upload to complete"); return; }

    setIsSubmitting(true);
    const toastId = toast.loading(
      section === "school" ? "Updating school information..." : "Updating administrator details..."
    );

    try {
      if (section === "school") {
        const schoolId = getSchoolId();
        if (!schoolId) throw new Error("School ID not found. Please ensure you're logged in.");

        const schoolPayload: UpdateSchoolPayload = {
          name: formData.schoolName.trim(),
          physicalAddress: formData.street.trim(),
          location: { country: formData.country, state: formData.state },
          primaryContacts: [
            {
              name: `${formData.adminFirstName} ${formData.adminLastName}`.trim(),
              phone: formData.adminPhone,
              email: formData.adminEmail,
              role: "Administrator",
            },
          ],
          active: true,
        };
        if (formData.logo) schoolPayload.logo = formData.logo;
        await updateSchool(schoolId, schoolPayload);
      } else {
        const currentUser = getLocalStorageItem("user");
        if (!currentUser?.userId)
          throw new Error("User ID not found. Please ensure you're logged in.");

        const adminPayload: UpdateUserProfilePayload = {
          firstName: formData.adminFirstName.trim(),
          lastName: formData.adminLastName.trim(),
          phoneNumber: formData.adminPhone.trim(),
        };
        if (formData.adminAvatar) adminPayload.userAvatar = formData.adminAvatar;
        // @ts-ignore
        if (formData.adminEmail) adminPayload.email = formData.adminEmail.trim().toLowerCase();
        // @ts-ignore
        if (password && password.length >= 8) adminPayload.password = password;

        await authService.updateUserProfile(adminPayload);
      }

      toast.success(
        section === "school" ? "School information updated!" : "Administrator details updated!",
        { id: toastId }
      );
      setEditingSection(null);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setPassword("");
    setConfirmPassword("");
  };

  // ─── Derived helpers ──────────────────────────────────────────────────────────
  const adminInitials =
    `${formData.adminFirstName?.[0] ?? ""}${formData.adminLastName?.[0] ?? ""}`.toUpperCase() || "AD";
  const adminFullName =
    [formData.adminFirstName, formData.adminLastName].filter(Boolean).join(" ") || "Administrator";
  const isEditingAdmin = editingSection === "admin";
  const isEditingSchool = editingSection === "school";

  // ─── Loading state ────────────────────────────────────────────────────────────
  if (isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Toaster position="top-center" />
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-sm w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003366] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Profile</h2>
          <p className="text-gray-500 text-sm">Please wait while we fetch your information…</p>
        </div>
      </div>
    );
  }

  // ─── Reusable field renderer ─────────────────────────────────────────────────
  const Field = ({
    label,
    icon: Icon,
    value,
    name,
    type = "text",
    editing,
    placeholder,
  }: {
    label: string;
    icon: React.ElementType;
    value: string;
    name: string;
    type?: string;
    editing: boolean;
    placeholder?: string;
  }) => (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
        <Icon className="w-4 h-4" />
        {label}
      </label>
      {editing ? (
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition text-gray-900 text-sm"
        />
      ) : (
        <p className="text-gray-900 font-medium">{value || <span className="text-gray-400 font-normal">Not set</span>}</p>
      )}
    </div>
  );

  const SelectField = ({
    label,
    icon: Icon,
    value,
    name,
    editing,
    options,
    placeholder,
  }: {
    label: string;
    icon: React.ElementType;
    value: string;
    name: string;
    editing: boolean;
    options: { value: string; label: string }[];
    placeholder?: string;
  }) => (
    <div className="space-y-1.5">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-500">
        <Icon className="w-4 h-4" />
        {label}
      </label>
      {editing ? (
        <div className="relative">
          <select
            name={name}
            value={value}
            onChange={handleInputChange}
            className="w-full appearance-none px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition text-gray-900 text-sm pr-8"
          >
            <option value="">{placeholder || "Select…"}</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      ) : (
        <p className="text-gray-900 font-medium">{value || <span className="text-gray-400 font-normal">Not set</span>}</p>
      )}
    </div>
  );

  const CardHeader = ({
    title,
    section,
  }: {
    title: string;
    section: "admin" | "school";
  }) => {
    const isActive = editingSection === section;
    return (
      <div className="bg-gray-100 px-6 py-4 flex items-center justify-between border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        <button
          onClick={() => {
            if (isActive) handleCancel();
            else setEditingSection(section);
          }}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#003366] transition-colors"
        >
          {isActive ? (
            <>
              <X className="w-4 h-4" /> Cancel
            </>
          ) : (
            <>
              <Pencil className="w-4 h-4" /> Edit
            </>
          )}
        </button>
      </div>
    );
  };

  const SaveBar = ({ section }: { section: "admin" | "school" }) => (
    <div className="flex items-center gap-3 pt-4 mt-2 border-t border-gray-100">
      <button
        onClick={() => handleUpdate(section)}
        disabled={isSubmitting || isUploadingImage}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white text-sm font-semibold rounded-lg hover:bg-[#002244] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
        ) : (
          <><Save className="w-4 h-4" />Save Changes</>
        )}
      </button>
      <button
        onClick={handleCancel}
        disabled={isSubmitting}
        className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );

  // ─── Main render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-center" />

      {/* Page title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      <div className="max-w-4xl space-y-6">

        {/* ── Admin hero row ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-[#003366] flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {formData.adminAvatar || avatarPreview ? (
                <Image
                  src={avatarPreview || formData.adminAvatar || ""}
                  alt="Admin avatar"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <span className="text-white text-2xl font-bold">{adminInitials}</span>
              )}
            </div>
            {isUploadingImage && editingSection === "admin" && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <span className="text-white text-xs font-medium">{uploadProgress}%</span>
              </div>
            )}
          </div>

          {/* Name + buttons */}
          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{adminFullName}</h2>
              <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-0.5">
                <Shield className="w-3.5 h-3.5" />
                School Administrator
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <label
                htmlFor="admin-avatar-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#003366] text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-[#002244] transition"
              >
                <Camera className="w-4 h-4" />
                Change Photo
                <input
                  id="admin-avatar-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, "avatar")}
                />
              </label>
              {(formData.adminAvatar || avatarPreview) && (
                <button
                  onClick={() => {
                    setAvatarPreview(null);
                    setFormData((prev) => ({ ...prev, adminAvatar: null }));
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Personal Information card ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <CardHeader title="Personal Information" section="admin" />

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field label="First Name" icon={User} value={formData.adminFirstName} name="adminFirstName" editing={isEditingAdmin} placeholder="First name" />
              <Field label="Last Name" icon={User} value={formData.adminLastName} name="adminLastName" editing={isEditingAdmin} placeholder="Last name" />
              <Field label="Email Address" icon={Mail} value={formData.adminEmail} name="adminEmail" type="email" editing={isEditingAdmin} placeholder="Email address" />
              <Field label="Phone Number" icon={Phone} value={formData.adminPhone} name="adminPhone" type="tel" editing={isEditingAdmin} placeholder="Phone number" />
            </div>

            {/* Password section — only shown when editing */}
            {isEditingAdmin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-6 pt-6 border-t border-gray-100 space-y-4"
              >
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Key className="w-4 h-4 text-[#003366]" />
                  Change Password <span className="font-normal text-gray-400">(optional)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="New password"
                      className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    Leave password fields empty if you don't want to change your password. Minimum 8 characters.
                  </p>
                </div>
              </motion.div>
            )}

            {isEditingAdmin && <SaveBar section="admin" />}
          </div>
        </motion.div>

        {/* ── School hero row ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start gap-6 mt-4">
          {/* Logo */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-xl bg-blue-50 border-2 border-white shadow-lg flex items-center justify-center overflow-hidden">
              {formData.logo || logoPreview ? (
                <Image
                  src={logoPreview || formData.logo || ""}
                  alt="School logo"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <School className="w-10 h-10 text-[#003366]" />
              )}
            </div>
            {isUploadingImage && editingSection === "school" && (
              <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center">
                <span className="text-white text-xs font-medium">{uploadProgress}%</span>
              </div>
            )}
          </div>

          {/* School name + buttons */}
          <div className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {formData.schoolName || "Your School"}
              </h2>
              {formData.schoolPrefix && (
                <p className="text-gray-500 text-sm mt-0.5">Prefix: {formData.schoolPrefix}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <label
                htmlFor="school-logo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#003366] text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-[#002244] transition"
              >
                <Camera className="w-4 h-4" />
                Change Logo
                <input
                  id="school-logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, "logo")}
                />
              </label>
              {(formData.logo || logoPreview) && (
                <button
                  onClick={() => {
                    setLogoPreview(null);
                    setFormData((prev) => ({ ...prev, logo: null }));
                  }}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
                >
                  Remove Logo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── School Information card ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          <CardHeader title="School Information" section="school" />

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Field label="School Name" icon={Building} value={formData.schoolName} name="schoolName" editing={isEditingSchool} placeholder="School name" />
              <Field label="School Prefix" icon={Building} value={formData.schoolPrefix} name="schoolPrefix" editing={isEditingSchool} placeholder="e.g. USS" />
              <Field label="Street Address" icon={MapPin} value={formData.street} name="street" editing={isEditingSchool} placeholder="Street address" />
              <SelectField
                label="State"
                icon={MapPin}
                value={formData.state}
                name="state"
                editing={isEditingSchool}
                placeholder="Choose your state"
                options={[
                  { value: "Lagos State", label: "Lagos State" },
                  { value: "FCT Abuja", label: "FCT Abuja" },
                  { value: "Rivers State", label: "Rivers State" },
                  { value: "Kano State", label: "Kano State" },
                  { value: "Oyo State", label: "Oyo State" },
                ]}
              />
              <SelectField
                label="Country"
                icon={Globe}
                value={formData.country}
                name="country"
                editing={isEditingSchool}
                placeholder="Choose your country"
                options={[
                  { value: "Nigeria", label: "Nigeria" },
                  { value: "Ghana", label: "Ghana" },
                  { value: "Kenya", label: "Kenya" },
                  { value: "South Africa", label: "South Africa" },
                ]}
              />
            </div>

            {isEditingSchool && <SaveBar section="school" />}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
