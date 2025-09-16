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
  Check,
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
  city: string;
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
    city: "",
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

        // Load user data from API
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          const userId = user.userId;

          try {
            // Fetch detailed user profile from API
            const userProfile: UserProfile = await authService.getUserProfile(
              userId
            );

            // Update form data with API data
            setFormData((prev) => ({
              ...prev,
              adminFirstName: userProfile.firstName || "",
              adminLastName: userProfile.lastName || "",
              adminEmail: userProfile.email || "",
              adminPhone: userProfile.phoneNumber || "",
              adminAvatar: userProfile.userAvatar || null,
            }));

            // Also extract school data from nested schoolId if available
            if (userProfile.schoolId) {
              setFormData((prev) => ({
                ...prev,
                schoolName: userProfile.schoolId.name || "",
                schoolPrefix: userProfile.schoolId.schoolPrefix || "",
                street: userProfile.schoolId.physicalAddress || "",
                city: "", // You might need to parse this from physicalAddress or get from another field
                state: userProfile.schoolId.location?.state || "",
                country: userProfile.schoolId.location?.country || "",
                logo: userProfile.schoolId.logo || null,
              }));
            }
          } catch (apiError) {
            console.error("Error loading user profile from API:", apiError);
            // Fallback to localStorage data if API fails
            const fullName = `${user.firstName || ""} ${
              user.lastName || ""
            }`.trim();
            setFormData((prev) => ({
              ...prev,
              adminFirstName: user.firstName || user.name?.split(" ")[0] || "",
              adminLastName:
                user.lastName || user.name?.split(" ").slice(1).join(" ") || "",
              adminEmail: user.email || "",
              adminPhone: user.phoneNumber || user.phone || "",
              adminAvatar: null,
            }));
          }
        } else {
          // Set default admin data if no user in localStorage
          setFormData((prev) => ({
            ...prev,
            adminFirstName: "Administrator",
            adminLastName: "",
            adminEmail: "",
            adminPhone: "",
            adminAvatar: null,
          }));
        }

        // Load school data from API
        const schoolId = getSchoolId();
        if (schoolId) {
          try {
            const dashboardData = await getSchoolDashboard(schoolId);
            if (dashboardData.schoolInfo) {
              setFormData((prev) => ({
                ...prev,
                schoolName:
                  dashboardData.schoolInfo.name || "Unity Secondary School",
                schoolPrefix: dashboardData.schoolInfo.schoolPrefix || "USS",
                street:
                  dashboardData.schoolInfo.physicalAddress ||
                  "123 Education Street",
                city: prev.city || "Lagos", // Keep existing or set default
                state: prev.state || "Lagos State",
                country: prev.country || "Nigeria",
                logo: dashboardData.schoolInfo.logo || null,
              }));
            }
          } catch (schoolError) {
            console.error("Error loading school data:", schoolError);
            // Set default school data if API fails
            setFormData((prev) => ({
              ...prev,
              schoolName: prev.schoolName || "Unity Secondary School",
              schoolPrefix: prev.schoolPrefix || "USS",
              street: prev.street || "123 Education Street",
              city: prev.city || "Lagos",
              state: prev.state || "Lagos State",
              country: prev.country || "Nigeria",
            }));
          }
        } else {
          // Set default school data if no schoolId
          setFormData((prev) => ({
            ...prev,
            schoolName: "Unity Secondary School",
            schoolPrefix: "USS",
            street: "123 Education Street",
            city: "Lagos",
            state: "Lagos State",
            country: "Nigeria",
          }));
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
      if (!formData.city) return "City is required";
      if (!formData.state) return "State is required";
      if (!formData.country) return "Country is required";
    } else {
      if (!formData.adminFirstName.trim()) return "First name is required";
      if (!formData.adminLastName.trim()) return "Last name is required";
      if (!formData.adminEmail.trim()) return "Admin email is required";
      if (!formData.adminPhone.trim()) return "Phone number is required";

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.adminEmail))
        return "Please enter a valid email address";

      // Password validation (only if passwords are entered)
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
    setFormData({ ...formData, [name]: value });
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
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file using the utility function
      const validation = validateImageFile(file);
      if (!validation.valid) {
        toast.error(validation.error || "Invalid file");
        e.target.value = ""; // Reset input
        return;
      }

      // Show preview immediately
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

      // Upload to Cloudinary
      setIsUploadingImage(true);
      setUploadProgress(0);

      const uploadingToast = toast.loading("Uploading image...");

      try {
        const imageUrl = await uploadToCloudinary(file, (progress) => {
          setUploadProgress(progress);
        });

        // Update form data with the Cloudinary URL based on active tab
        if (activeTab === "school") {
          setFormData({ ...formData, logo: imageUrl });
        } else {
          setFormData({ ...formData, adminAvatar: imageUrl });
        }
        toast.success("Image uploaded successfully!", { id: uploadingToast });
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload image",
          {
            id: uploadingToast,
          }
        );

        // Reset preview on error
        if (activeTab === "school") {
          setAvatarPreview(null);
          setFormData({ ...formData, logo: null });
        } else {
          setAdminAvatarPreview(null);
          setFormData({ ...formData, adminAvatar: null });
        }
      } finally {
        setIsUploadingImage(false);
        setUploadProgress(0);
        e.target.value = ""; // Reset input for potential re-upload
      }
    }
  };

  const handleUpdate = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // Prevent submission if image is still uploading
    if (isUploadingImage) {
      toast.error("Please wait for image upload to complete");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading(
      `Updating ${
        activeTab === "school" ? "school information" : "administrator details"
      }...`
    );

    try {
      if (activeTab === "school") {
        // Debug localStorage contents
        console.log("=== DEBUGGING LOCALSTORAGE ===");
        console.log(
          "Raw user data from localStorage:",
          localStorage.getItem("user")
        );
        console.log(
          "Raw accessToken from localStorage:",
          localStorage.getItem("accessToken")
        );
        console.log("Parsed user data:", getLocalStorageItem("user"));
        console.log("================================");

        // Update school information
        const schoolId = getSchoolId();
        console.log("Retrieved school ID:", schoolId);

        if (!schoolId) {
          throw new Error(
            "School ID not found. Please ensure you are logged in properly."
          );
        }

        // Prepare school update payload according to API specification
        const schoolPayload: UpdateSchoolPayload = {
          name: formData.schoolName.trim(),
          physicalAddress: formData.street.trim(),
          location: {
            country: formData.country,
            state: formData.state,
          },
          // Add primary contacts - this might need to be customized based on your needs
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

        // Only include logo if it exists
        if (formData.logo) {
          schoolPayload.logo = formData.logo;
        }

        console.log("About to update school with payload:", schoolPayload);

        try {
          console.log("Calling updateSchool function...");
          const updatedSchool = await updateSchool(schoolId, schoolPayload);
          console.log("School updated successfully:", updatedSchool);
        } catch (updateError) {
          console.log("Error caught in updateSchool call:", updateError);
          console.log("Error type:", typeof updateError);
          if (updateError instanceof Error) {
            console.log("Error message:", updateError.message);
            console.log("Error stack:", updateError.stack);
          }
          console.log("Full error:", updateError);
          throw updateError;
        }
      } else {
        // Update administrator details
        console.log("Administrator data to update:", {
          firstName: formData.adminFirstName,
          lastName: formData.adminLastName,
          email: formData.adminEmail,
          phone: formData.adminPhone,
          avatar: formData.adminAvatar,
          password: password ? "***" : "not changed",
        });

        // Get the current user ID from localStorage or user context
        const currentUser = getLocalStorageItem("user");
        if (!currentUser || !currentUser.userId) {
          throw new Error(
            "User ID not found. Please ensure you are logged in properly."
          );
        }

        // Prepare admin profile update payload
        const adminPayload: UpdateUserProfilePayload = {
          firstName: formData.adminFirstName.trim(),
          lastName: formData.adminLastName.trim(),
          phoneNumber: formData.adminPhone.trim(),
        };

        // Only include avatar if it exists
        if (formData.adminAvatar) {
          adminPayload.userAvatar = formData.adminAvatar;
        }

        // Note: Email updates might require additional verification
        // dateOfBirth, gender, and other optional fields can be added based on your form

        console.log("About to update user profile with payload:", adminPayload);

        try {
          const updatedProfile = await authService.updateUserProfile(
            adminPayload
          );
          console.log("User profile updated successfully:", updatedProfile);
        } catch (updateError) {
          console.log("Error caught in updateUserProfile call:", updateError);
          throw updateError;
        }
      }

      toast.success(
        `${
          activeTab === "school"
            ? "School information"
            : "Administrator details"
        } updated successfully!`,
        { id: loadingToast }
      );

      setIsEditing(false);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update profile";
      toast.error(`Update failed: ${errorMessage}`, {
        id: loadingToast,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPassword("");
    setConfirmPassword("");
    // Reset form data if needed
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      {/* Loading State */}
      {isLoadingData && (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-2xl shadow-lg text-center"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading Profile Data
            </h2>
            <p className="text-gray-600">
              Please wait while we fetch your information...
            </p>
          </motion.div>
        </div>
      )}

      {/* Main Content - Only show when not loading */}
      {!isLoadingData && (
        <>
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white border-b border-gray-200 shadow-sm mx-6 my-4 rounded-2xl"
          >
            <div className="container mx-auto p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="">
                    <h1 className="text-3xl font-bold text-gray-900">
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
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300"
                >
                  {isEditing ? (
                    <>
                      <X className="w-5 h-5" />
                      Cancel Edit
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-5 h-5" />
                      Edit Profile
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>

          <div className="container mx-auto p-6">
            {/* Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8"
            >
              <div className="flex">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 flex items-center justify-center gap-3 py-6 px-8 transition-all duration-300 ${
                    activeTab === "school"
                      ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-b-4 border-blue-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setActiveTab("school")}
                >
                  <Building className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-semibold text-lg">
                      School Information
                    </div>
                    <div className="text-sm opacity-80">
                      Institution details & contact
                    </div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 flex items-center justify-center gap-3 py-6 px-8 transition-all duration-300 ${
                    activeTab === "admin"
                      ? "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-b-4 border-emerald-600"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                  onClick={() => setActiveTab("admin")}
                >
                  <Shield className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-semibold text-lg">Administrator</div>
                    <div className="text-sm opacity-80">
                      Personal details & security
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>

            {/* School Information Tab */}
            <AnimatePresence mode="wait">
              {activeTab === "school" && (
                <motion.div
                  key="school"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
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
                      {/* Logo Section */}
                      <div className="lg:col-span-1">
                        <div className="text-center">
                          <div className="relative inline-block">
                            <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                              {formData.logo || avatarPreview ? (
                                <img
                                  src={
                                    formData.logo ||
                                    avatarPreview ||
                                    "/placeholder.svg"
                                  }
                                  alt="School Logo"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <School className="w-16 h-16 text-blue-600" />
                              )}

                              {/* Upload Progress Overlay */}
                              {isUploadingImage && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                  <div className="text-white text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                                    <div className="text-sm font-medium">
                                      {uploadProgress}%
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            {isEditing && !isUploadingImage && (
                              <motion.label
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute -bottom-2 -right-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full cursor-pointer shadow-lg transition-colors"
                              >
                                <Camera className="w-5 h-5" />
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={handleFileChange}
                                  accept="image/*"
                                />
                              </motion.label>
                            )}
                          </div>
                          <div className="mt-4">
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
                            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                              isEditing
                                ? "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                : "border-gray-100 bg-gray-50"
                            } text-gray-900 font-medium disabled:cursor-not-allowed`}
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
                            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                              isEditing
                                ? "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                : "border-gray-100 bg-gray-50"
                            } text-gray-900 font-medium disabled:cursor-not-allowed`}
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
                            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                              isEditing
                                ? "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                : "border-gray-100 bg-gray-50"
                            } text-gray-900 font-medium disabled:cursor-not-allowed`}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            City
                          </label>
                          <div className="relative">
                            <select
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                              className={`w-full appearance-none px-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                                isEditing
                                  ? "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                  : "border-gray-100 bg-gray-50"
                              } text-gray-900 font-medium disabled:cursor-not-allowed pr-12`}
                            >
                              <option value="">Choose your city</option>
                              <option value="Lagos">Lagos</option>
                              <option value="Abuja">Abuja</option>
                              <option value="Port Harcourt">
                                Port Harcourt
                              </option>
                              <option value="Kano">Kano</option>
                              <option value="Ibadan">Ibadan</option>
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
                            <MapPin className="w-4 h-4 text-blue-600" />
                            State
                          </label>
                          <div className="relative">
                            <select
                              name="state"
                              value={formData.state}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                              className={`w-full appearance-none px-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                                isEditing
                                  ? "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                  : "border-gray-100 bg-gray-50"
                              } text-gray-900 font-medium disabled:cursor-not-allowed pr-12`}
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
                              className={`w-full appearance-none px-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                                isEditing
                                  ? "border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                  : "border-gray-100 bg-gray-50"
                              } text-gray-900 font-medium disabled:cursor-not-allowed pr-12`}
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

                    {/* Action Buttons */}
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200"
                      >
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleUpdate}
                          disabled={isSubmitting || isUploadingImage}
                          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Updating...
                            </>
                          ) : isUploadingImage ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5" />
                              Update School
                            </>
                          )}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCancel}
                          disabled={isSubmitting}
                          className="flex items-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="w-5 h-5" />
                          Cancel
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Administrator Details Tab */}
            <AnimatePresence mode="wait">
              {activeTab === "admin" && (
                <motion.div
                  key="admin"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
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
                      {/* Avatar Section */}
                      <div className="lg:col-span-1">
                        <div className="text-center">
                          <div className="relative inline-block">
                            <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                              {formData.adminAvatar || adminAvatarPreview ? (
                                <img
                                  src={
                                    formData.adminAvatar ||
                                    adminAvatarPreview ||
                                    "/placeholder.svg"
                                  }
                                  alt="Administrator Avatar"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-16 h-16 text-emerald-600" />
                              )}

                              {/* Upload Progress Overlay */}
                              {isUploadingImage && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                  <div className="text-white text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                                    <div className="text-sm font-medium">
                                      {uploadProgress}%
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            {isEditing && !isUploadingImage && (
                              <motion.label
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="absolute -bottom-2 -right-2 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-full cursor-pointer shadow-lg transition-colors"
                              >
                                <Camera className="w-5 h-5" />
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={handleFileChange}
                                  accept="image/*"
                                />
                              </motion.label>
                            )}
                          </div>
                          <div className="mt-4">
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
                      </div>

                      {/* Form Fields */}
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                              isEditing
                                ? "border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
                            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                              isEditing
                                ? "border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
                            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                              isEditing
                                ? "border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
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
                            className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 ${
                              isEditing
                                ? "border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                                : "border-gray-100 bg-gray-50"
                            } text-gray-900 font-medium disabled:cursor-not-allowed`}
                          />
                        </div>

                        {/* Empty div for grid alignment */}
                        <div></div>

                        {/* Password Fields - Only show when editing */}
                        {isEditing && (
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
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 text-gray-900 font-medium pr-12"
                                />
                                <button
                                  type="button"
                                  onClick={togglePasswordVisibility}
                                  className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-gray-700"
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
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 text-gray-900 font-medium pr-12"
                                />
                                <button
                                  type="button"
                                  onClick={toggleConfirmPasswordVisibility}
                                  className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-gray-700"
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
                        )}
                      </div>
                    </div>

                    {/* Security Notice */}
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
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

                    {/* Action Buttons */}
                    {isEditing && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200"
                      >
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleUpdate}
                          disabled={isSubmitting || isUploadingImage}
                          className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] justify-center"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Updating...
                            </>
                          ) : isUploadingImage ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Save className="w-5 h-5" />
                              Update Profile
                            </>
                          )}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCancel}
                          disabled={isSubmitting}
                          className="flex items-center gap-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="w-5 h-5" />
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
