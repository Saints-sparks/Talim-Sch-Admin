"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

type Tab = "school" | "admin";

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
  const [activeTab, setActiveTab] = useState<Tab>("school");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [adminAvatarPreview, setAdminAvatarPreview] = useState<string | null>(
    null
  );
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

  // Load user data and school data on component mount
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoadingData(true);

        // Load user data from local storage utility for consistency
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
          } catch (apiError) {
            // Fallback: use basic stored user fields if API fails
            const fallback = storedUser || {};
            setFormData((prev) => ({
              ...prev,
              adminFirstName:
                fallback.firstName || fallback.name?.split(" ")[0] || "",
              adminLastName:
                fallback.lastName ||
                fallback.name?.split(" ").slice(1).join(" ") ||
                "",
              adminEmail: fallback.email || "",
              adminPhone: fallback.phoneNumber || fallback.phone || "",
              adminAvatar: null,
            }));
          }
        }

        // Load school data from API (if available)
        const schoolId = getSchoolId();
        if (schoolId) {
          try {
            const dashboardData: SchoolDashboardData = await getSchoolDashboard(
              schoolId
            );
            if (dashboardData?.schoolInfo) {
              setFormData((prev) => ({
                ...prev,
                schoolName: dashboardData.schoolInfo.name || prev.schoolName,
                schoolPrefix:
                  dashboardData.schoolInfo.schoolPrefix || prev.schoolPrefix,
                street: dashboardData.schoolInfo.physicalAddress || prev.street,
                state: dashboardData.schoolInfo.location?.state || prev.state,
                country:
                  dashboardData.schoolInfo.location?.country || prev.country,
                logo: dashboardData.schoolInfo.logo || prev.logo,
              }));
            }
          } catch {
            // ignore — keep whatever we already have in formData
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

  // Form validation
  const validateForm = (): string | null => {
    if (activeTab === "school") {
      if (!formData.schoolName.trim()) return "School name is required";
      if (!formData.schoolPrefix.trim()) return "School prefix is required";
      if (!formData.street.trim()) return "Street address is required";
      if (!formData.state) return "State is required";
      if (!formData.country) return "Country is required";
    } else {
      if (!formData.adminFirstName.trim()) return "First name is required";
      if (!formData.adminLastName.trim()) return "Last name is required";
      if (!formData.adminEmail.trim()) return "Admin email is required";
      if (!formData.adminPhone.trim()) return "Phone number is required";

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.adminEmail.trim()))
        return "Please enter a valid email address";

      if (password || confirmPassword) {
        if (password.length < 8)
          return "Password must be at least 8 characters long";
        if (password !== confirmPassword) return "Passwords do not match";
      }
    }
    return null;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfirmPassword(e.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((s) => !s);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((s) => !s);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
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
          if (activeTab === "school") {
            setAvatarPreview(event.target.result as string);
          } else {
            setAdminAvatarPreview(event.target.result as string);
          }
        }
      };
      reader.readAsDataURL(file);

      // Upload
      setIsUploadingImage(true);
      setUploadProgress(0);
      const uploadingToastId = toast.loading("Uploading image...");

      try {
        const imageUrl = await uploadToCloudinary(file, (progress) => {
          setUploadProgress(Math.round(progress));
        });

        if (activeTab === "school") {
          setFormData((prev) => ({ ...prev, logo: imageUrl }));
        } else {
          setFormData((prev) => ({ ...prev, adminAvatar: imageUrl }));
        }

        toast.success("Image uploaded successfully!", { id: uploadingToastId });
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload image",
          { id: uploadingToastId }
        );
        // reset preview & value on error
        if (activeTab === "school") {
          setAvatarPreview(null);
          setFormData((prev) => ({ ...prev, logo: null }));
        } else {
          setAdminAvatarPreview(null);
          setFormData((prev) => ({ ...prev, adminAvatar: null }));
        }
      } finally {
        setIsUploadingImage(false);
        setUploadProgress(0);
        e.target.value = "";
      }
    }
  };

  const handleUpdate = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (isUploadingImage) {
      toast.error("Please wait for image upload to complete");
      return;
    }

    setIsSubmitting(true);
    const loadingToastId = toast.loading(
      `Updating ${
        activeTab === "school" ? "school information" : "administrator details"
      }...`
    );

    try {
      if (activeTab === "school") {
        const schoolId = getSchoolId();
        if (!schoolId) {
          throw new Error(
            "School ID not found. Please ensure you're logged in."
          );
        }

        const schoolPayload: UpdateSchoolPayload = {
          name: formData.schoolName.trim(),
          physicalAddress: formData.street.trim(),
          location: {
            country: formData.country,
            state: formData.state,
          },
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
        if (!currentUser || !currentUser.userId) {
          throw new Error("User ID not found. Please ensure you're logged in.");
        }

        const adminPayload: UpdateUserProfilePayload = {
          firstName: formData.adminFirstName.trim(),
          lastName: formData.adminLastName.trim(),
          phoneNumber: formData.adminPhone.trim(),
        };

        if (formData.adminAvatar) {
          adminPayload.userAvatar = formData.adminAvatar;
        }

        if (formData.adminEmail && formData.adminEmail.trim()) {
          // include email update if user provided one (may require verification on backend)
          // some backends restrict email updates; handle server errors accordingly
          // @ts-ignore - if UpdateUserProfilePayload doesn't include email, backend call may still accept it
          adminPayload.email = formData.adminEmail.trim().toLowerCase();
        }

        if (password && password.length >= 8) {
          // @ts-ignore - include password only if backend supports updating via this endpoint
          adminPayload.password = password;
        }

        await authService.updateUserProfile(adminPayload);
      }

      toast.success(
        `${
          activeTab === "school"
            ? "School information"
            : "Administrator details"
        } updated successfully!`,
        { id: loadingToastId }
      );

      setIsEditing(false);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile",
        { id: loadingToastId }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPassword("");
    setConfirmPassword("");
    // we don't automatically revert formData here — you can add a reload if desired
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      {/* Loading */}
      {isLoadingData ? (
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-sm w-full"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading Profile Data
            </h2>
            <p className="text-gray-600">
              Please wait while we fetch your information…
            </p>
          </motion.div>
        </div>
      ) : (
        <>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white border-b border-gray-200 shadow-sm mx-6 my-4 rounded-2xl"
            aria-hidden={isLoadingData}
          >
            <div className="container mx-auto p-6 max-w-6xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                      Profile Settings
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Manage your school and administrator information
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsEditing((s) => !s)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold shadow-lg transition-all duration-200 ${
                    isEditing
                      ? "bg-gray-500 text-white hover:bg-gray-600"
                      : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
                  }`}
                  aria-pressed={isEditing}
                  aria-label={isEditing ? "Cancel editing" : "Edit profile"}
                >
                  {isEditing ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Edit3 className="w-5 h-5" />
                  )}
                  {isEditing ? "Cancel Edit" : "Edit Profile"}
                </motion.button>
              </div>
            </div>
          </motion.div>

          <div className="container mx-auto p-6 max-w-6xl">
            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8"
            >
              <div className="flex">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 flex items-center gap-3 py-5 px-6 transition-all duration-200 ${
                    activeTab === "school"
                      ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-b-4 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setActiveTab("school")}
                  aria-current={activeTab === "school"}
                >
                  <Building className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">School Information</div>
                    <div className="text-sm opacity-80">
                      Institution details & contact
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 flex items-center gap-3 py-5 px-6 transition-all duration-200 ${
                    activeTab === "admin"
                      ? "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-b-4 border-emerald-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setActiveTab("admin")}
                  aria-current={activeTab === "admin"}
                >
                  <Shield className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-semibold">Administrator</div>
                    <div className="text-sm opacity-80">
                      Personal details & security
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>

            {/* School Tab */}
            <AnimatePresence mode="wait">
              {activeTab === "school" && (
                <motion.div
                  key="school"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.28 }}
                  className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-8"
                >
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-8 py-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <Building className="w-6 h-6 text-blue-700" />
                      <h2 className="text-xl font-bold text-blue-900">
                        School Information
                      </h2>
                    </div>
                    <p className="text-blue-600 mt-2">
                      Manage your institution details and contact information
                    </p>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Logo */}
                      <div className="lg:col-span-1 flex flex-col items-center">
                        <div className="relative w-40 h-40 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-xl overflow-hidden">
                          {formData.logo || avatarPreview ? (
                            <div className="relative w-full h-full">
                              <Image
                                src={
                                  formData.logo ||
                                  avatarPreview ||
                                  "/placeholder.svg"
                                }
                                alt="School Logo"
                                fill
                                className="object-cover"
                                sizes="160px"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full h-full">
                              <School className="w-16 h-16 text-blue-600" />
                            </div>
                          )}

                          {/* Upload progress overlay */}
                          {isUploadingImage && (
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                              <div className="text-white text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
                                <div className="text-sm font-medium">
                                  {uploadProgress}%
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {isEditing && !isUploadingImage && (
                          <label
                            htmlFor="school-logo"
                            className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full cursor-pointer shadow"
                            aria-label="Upload school logo"
                            title="Upload school logo"
                          >
                            <Camera className="w-4 h-4" />
                            Upload Logo
                            <input
                              id="school-logo"
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              onChange={handleFileChange}
                              aria-hidden={!isEditing}
                            />
                          </label>
                        )}

                        <div className="mt-4 text-center">
                          <h3 className="text-lg font-semibold text-gray-900">
                            School Logo
                          </h3>
                          <p className="text-sm text-gray-600">
                            {isUploadingImage
                              ? "Uploading image..."
                              : "Upload your institution logo"}
                          </p>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <School className="w-4 h-4 text-blue-600" />
                            School Name
                          </label>
                          <input
                            type="text"
                            name="schoolName"
                            value={formData.schoolName}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="Enter your school name"
                            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                              isEditing
                                ? "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                : "border-gray-100 bg-gray-50"
                            } text-gray-900 font-medium disabled:cursor-not-allowed`}
                            aria-label="School name"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Building className="w-4 h-4 text-blue-600" />
                            School Prefix
                          </label>
                          <input
                            type="text"
                            name="schoolPrefix"
                            value={formData.schoolPrefix}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="e.g. USS"
                            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                              isEditing
                                ? "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                : "border-gray-100 bg-gray-50"
                            } text-gray-900 font-medium disabled:cursor-not-allowed`}
                            aria-label="School prefix"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            Street Address
                          </label>
                          <input
                            type="text"
                            name="street"
                            value={formData.street}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="Enter street address"
                            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                              isEditing
                                ? "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                : "border-gray-100 bg-gray-50"
                            } text-gray-900 font-medium disabled:cursor-not-allowed`}
                            aria-label="Street address"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            State
                          </label>
                          <div className="relative">
                            <select
                              name="state"
                              value={formData.state}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                              className={`w-full appearance-none px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                                isEditing
                                  ? "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                  : "border-gray-100 bg-gray-50"
                              } text-gray-900 font-medium disabled:cursor-not-allowed pr-12`}
                              aria-label="State"
                            >
                              <option value="">Choose your state</option>
                              <option value="Lagos State">Lagos State</option>
                              <option value="FCT Abuja">FCT Abuja</option>
                              <option value="Rivers State">Rivers State</option>
                              <option value="Kano State">Kano State</option>
                              <option value="Oyo State">Oyo State</option>
                            </select>
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                              <svg
                                className="w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Globe className="w-4 h-4 text-blue-600" />
                            Country
                          </label>
                          <div className="relative">
                            <select
                              name="country"
                              value={formData.country}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                              className={`w-full appearance-none px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                                isEditing
                                  ? "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                  : "border-gray-100 bg-gray-50"
                              } text-gray-900 font-medium disabled:cursor-not-allowed pr-12`}
                              aria-label="Country"
                            >
                              <option value="">Choose your country</option>
                              <option value="Nigeria">Nigeria</option>
                              <option value="Ghana">Ghana</option>
                              <option value="Kenya">Kenya</option>
                              <option value="South Africa">South Africa</option>
                            </select>
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                              <svg
                                className="w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200"
                      >
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleUpdate}
                          disabled={isSubmitting || isUploadingImage}
                          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center"
                          aria-disabled={isSubmitting || isUploadingImage}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Updating...
                            </>
                          ) : isUploadingImage ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Update School
                            </>
                          )}
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCancel}
                          disabled={isSubmitting}
                          className="flex items-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Admin Tab */}
            <AnimatePresence mode="wait">
              {activeTab === "admin" && (
                <motion.div
                  key="admin"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.28 }}
                  className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-8 py-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-emerald-700" />
                      <h2 className="text-xl font-bold text-emerald-900">
                        Administrator Details
                      </h2>
                    </div>
                    <p className="text-emerald-600 mt-2">
                      Manage your personal information and security settings
                    </p>
                  </div>

                  <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Avatar Column */}
                      <div className="lg:col-span-1 flex flex-col items-center">
                        <div className="relative w-40 h-40 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 border-4 border-white shadow-xl overflow-hidden">
                          {formData.adminAvatar || adminAvatarPreview ? (
                            <div className="relative w-full h-full">
                              <Image
                                src={
                                  formData.adminAvatar ||
                                  adminAvatarPreview ||
                                  "/placeholder.svg"
                                }
                                alt="Administrator Avatar"
                                fill
                                className="object-cover"
                                sizes="160px"
                                unoptimized
                              />
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full h-full">
                              <User className="w-16 h-16 text-emerald-600" />
                            </div>
                          )}

                          {isUploadingImage && (
                            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                              <div className="text-white text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2" />
                                <div className="text-sm font-medium">
                                  {uploadProgress}%
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {isEditing && !isUploadingImage && (
                          <label
                            htmlFor="admin-avatar"
                            className="mt-4 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full cursor-pointer shadow"
                            aria-label="Upload profile photo"
                          >
                            <Camera className="w-4 h-4" />
                            Upload Photo
                            <input
                              id="admin-avatar"
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                          </label>
                        )}

                        <div className="mt-4 text-center">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Profile Picture
                          </h3>
                          <p className="text-sm text-gray-600">
                            {isUploadingImage
                              ? "Uploading image..."
                              : "Upload your profile photo"}
                          </p>
                        </div>
                      </div>

                      {/* Admin Fields */}
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <User className="w-4 h-4 text-emerald-600" />
                            First Name
                          </label>
                          <input
                            type="text"
                            name="adminFirstName"
                            value={formData.adminFirstName}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="Enter your first name"
                            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                              isEditing
                                ? "border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                                : "border-gray-100 bg-gray-50"
                            } text-gray-900 font-medium disabled:cursor-not-allowed`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <User className="w-4 h-4 text-emerald-600" />
                            Last Name
                          </label>
                          <input
                            type="text"
                            name="adminLastName"
                            value={formData.adminLastName}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="Enter your last name"
                            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                              isEditing
                                ? "border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                                : "border-gray-100 bg-gray-50"
                            } text-gray-900 font-medium disabled:cursor-not-allowed`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Mail className="w-4 h-4 text-emerald-600" />
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="adminEmail"
                            value={formData.adminEmail}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="Enter your email address"
                            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                              isEditing
                                ? "border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                                : "border-gray-100 bg-gray-50"
                            } text-gray-900 font-medium disabled:cursor-not-allowed`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Phone className="w-4 h-4 text-emerald-600" />
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            name="adminPhone"
                            value={formData.adminPhone}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="Enter your phone number"
                            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 ${
                              isEditing
                                ? "border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                                : "border-gray-100 bg-gray-50"
                            } text-gray-900 font-medium disabled:cursor-not-allowed`}
                          />
                        </div>

                        {/* Password fields when editing */}
                        {isEditing ? (
                          <>
                            <div className="space-y-2">
                              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <Key className="w-4 h-4 text-emerald-600" />
                                New Password
                              </label>
                              <div className="relative">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  value={password}
                                  onChange={handlePasswordChange}
                                  placeholder="Enter new password (optional)"
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition text-gray-900 font-medium pr-12"
                                  aria-label="New password"
                                />
                                <button
                                  type="button"
                                  onClick={togglePasswordVisibility}
                                  className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-gray-700"
                                  aria-label={
                                    showPassword
                                      ? "Hide password"
                                      : "Show password"
                                  }
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                  ) : (
                                    <Eye className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <Key className="w-4 h-4 text-emerald-600" />
                                Confirm Password
                              </label>
                              <div className="relative">
                                <input
                                  type={
                                    showConfirmPassword ? "text" : "password"
                                  }
                                  value={confirmPassword}
                                  onChange={handleConfirmPasswordChange}
                                  placeholder="Confirm your password"
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition text-gray-900 font-medium pr-12"
                                  aria-label="Confirm password"
                                />
                                <button
                                  type="button"
                                  onClick={toggleConfirmPasswordVisibility}
                                  className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-gray-700"
                                  aria-label={
                                    showConfirmPassword
                                      ? "Hide confirm password"
                                      : "Show confirm password"
                                  }
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                  ) : (
                                    <Eye className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div />
                            <div />
                          </>
                        )}
                      </div>
                    </div>

                    {/* Security Notice */}
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl"
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-semibold text-amber-900">
                              Security Notice
                            </h4>
                            <p className="text-sm text-amber-700 mt-1">
                              Leave password fields empty if you don't want to
                              change your password. New passwords must be at
                              least 8 characters long.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Admin actions */}
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200"
                      >
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleUpdate}
                          disabled={isSubmitting || isUploadingImage}
                          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Updating...
                            </>
                          ) : isUploadingImage ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Update Profile
                            </>
                          )}
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCancel}
                          disabled={isSubmitting}
                          className="flex items-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
