"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/CustomToast";
import { Tooltip } from "@/components/ui/Tooltip";
import { CalendarDays, Check, Clock, UsersRound } from "lucide-react";
import {
  registerTeacher,
  createTeacherProfile,
} from "../app/services/teacher.service";
import { getClasses } from "../app/services/student.service";
import { getSchoolId } from "../app/services/school.service";

interface Class {
  _id: string;
  name: string;
}

const ACADEMIC_QUALIFICATIONS = [
  "Graduate",
  "Postgraduate",
  "Doctorate",
  "Other",
] as const;

const EMPLOYMENT_TYPES = ["Fulltime", "Parttime"] as const;

const EMPLOYMENT_ROLES = ["Academic"] as const;

const AVAILABILITY_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;

const AVAILABLE_TIME_SLOTS = [
  "8:00 AM - 2:00 PM",
  "9:00 AM - 3:00 PM",
  "10:00 AM - 4:00 PM",
] as const;

const AddTeacherModal: React.FC<{
  onClose: () => void;
  onSuccess?: () => Promise<void>;
}> = ({ onClose, onSuccess }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [formData, setFormData] = useState({
    // Step 0: Registration data
    email: "",
    password: "defaultPassword", // Consider generating a random temp password
    firstName: "",
    lastName: "",
    phoneNumber: "",

    // Step 1: Personal details
    dateOfBirth: "",
    gender: "",
    highestAcademicQualification: "Graduate",
    yearsOfExperience: 0,
    specialization: "",

    // Step 2: Employment details
    employmentType: "Fulltime",
    employmentRole: "Academic",
    availabilityDays: [],
    availableTime: "",
    isFormTeacher: false,
    assignedClasses: [],
    assignedCourses: [],
  });

  useEffect(() => {
    const fetchClasses = async () => {
      const schoolId = getSchoolId();
      if (!schoolId) {
        toast.error("School ID is required");
        return;
      }

      try {
        const classes = await getClasses();
        setClasses(classes);
      } catch (error) {
        console.log("Error fetching classes:", error);
        toast.error("Failed to load classes");
      }
    };

    fetchClasses();
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const schoolId = getSchoolId();

      if (!schoolId) throw new Error("School ID not found");

      if (currentStep === 0) {
        // First step - register the teacher
        const registrationData = {
          email: formData.email,
          password: formData.password,
          role: "teacher",
          schoolId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
        };
        const { userId } = await registerTeacher(registrationData);
        if (userId) {
          toast.success("Teacher account created successfully");
        }
        setUserId(userId);
        setCurrentStep(1);
      } else if (currentStep === 1) {
        // Move to next step without submitting
        setCurrentStep(2);
      } else {
        // Final step - create teacher profile
        if (!userId) throw new Error("User ID not found");

        const profileData = {
          userId,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          highestAcademicQualification: formData.highestAcademicQualification,
          yearsOfExperience: formData.yearsOfExperience,
          specialization: formData.specialization,
          employmentType: formData.employmentType,
          employmentRole: formData.employmentRole,
          availabilityDays: formData.availabilityDays,
          availableTime: formData.availableTime,
          isFormTeacher: formData.isFormTeacher,
          assignedClasses: formData.assignedClasses,
          assignedCourses: formData.assignedCourses,
        };

        await createTeacherProfile(userId, profileData);
        toast.success("Teacher Profile created successfully");
        if (onSuccess) {
          await onSuccess();
        } else {
          router.push("/users/teachers");
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "An error occurred. Please try again.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter((option) => option.selected)
      .map((option) => option.value);

    setFormData({ ...formData, [name]: selectedValues });
  };

  const toggleArrayField = (
    field: "assignedClasses" | "availabilityDays",
    value: string
  ) => {
    const currentValues = formData[field] as string[];
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];

    setFormData({ ...formData, [field]: nextValues });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-8">
            {/* Login Credentials */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Login Credentials
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="teacher@example.com"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temporary Password
                  </label>
                  <input
                    type="text"
                    name="password"
                    placeholder="defaultPassword"
                    className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-gray-600 cursor-not-allowed"
                    value={formData.password}
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Teacher will change this on first login
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Personal Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Enter first name"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Enter last name"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="+234 XXX XXX XXXX"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>
                      Select gender
                    </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Next Steps Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h5 className="text-sm font-medium text-blue-900 mb-1">
                    Next: Academic Qualifications
                  </h5>
                  <p className="text-sm text-blue-700">
                    We'll collect academic background and teaching experience
                    information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-8">
            {/* Academic Background */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l9-5-9-5-9 5 9 5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  />
                </svg>
                Academic Qualifications
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Highest Academic Qualification *
                  </label>
                  <select
                    name="highestAcademicQualification"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                    value={formData.highestAcademicQualification}
                    onChange={handleInputChange}
                    required
                  >
                    {ACADEMIC_QUALIFICATIONS.map((qualification) => (
                      <option key={qualification} value={qualification}>
                        {qualification}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience *
                  </label>
                  <select
                    name="yearsOfExperience"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                    value={formData.yearsOfExperience}
                    onChange={handleInputChange}
                    required
                  >
                    <option value={0}>Select years of experience</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map((year) => (
                      <option key={year} value={year}>
                        {year} {year === 1 ? "year" : "years"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area of Specialization
                  </label>
                  <input
                    type="text"
                    name="specialization"
                    placeholder="e.g., Mathematics, English Literature, Chemistry"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                    value={formData.specialization}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Next Steps Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h5 className="text-sm font-medium text-blue-900 mb-1">
                    Next: Employment Details
                  </h5>
                  <p className="text-sm text-blue-700">
                    Final step - employment type, class assignments, and
                    schedule details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Employment Details */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6"
                  />
                </svg>
                Employment Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Type *
                  </label>
                  <select
                    name="employmentType"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                    value={formData.employmentType}
                    onChange={handleInputChange}
                    required
                  >
                    {EMPLOYMENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Role *
                  </label>
                  <select
                    name="employmentRole"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
                    value={formData.employmentRole}
                    onChange={handleInputChange}
                    required
                  >
                    {EMPLOYMENT_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              {/* Teaching Assignments */}
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
                      <UsersRound className="h-4 w-4 text-[#003366]" />
                      Teaching Assignments
                    </h4>
                    <p className="mt-1 text-sm text-gray-500">
                      Select the classes this teacher can support. Course and subject links still happen from course setup.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#003366]/10 px-3 py-1 text-xs font-semibold text-[#003366]">
                    {(formData.assignedClasses as string[]).length} selected
                  </span>
                </div>

                {classes.length > 0 ? (
                  <div className="grid max-h-52 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                    {classes.map((classItem) => {
                      const isSelected = (formData.assignedClasses as string[]).includes(classItem._id);

                      return (
                        <button
                          key={classItem._id}
                          type="button"
                          onClick={() => toggleArrayField("assignedClasses", classItem._id)}
                          className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left transition ${
                            isSelected
                              ? "border-[#003366] bg-[#EAF2FB] text-[#003366] shadow-sm"
                              : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#003366]/40 hover:bg-white"
                          }`}
                        >
                          <span className="min-w-0 truncate text-sm font-medium">
                            {classItem.name}
                          </span>
                          <span
                            className={`ml-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border ${
                              isSelected
                                ? "border-[#003366] bg-[#003366] text-white"
                                : "border-gray-300 bg-white text-transparent"
                            }`}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                    No classes available yet.
                  </div>
                )}
              </section>

              {/* Schedule Information */}
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
                    <CalendarDays className="h-4 w-4 text-[#003366]" />
                    Schedule & Availability
                  </h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose working days and the usual availability window.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Availability Days
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABILITY_DAYS.map((day) => {
                        const isSelected = (formData.availabilityDays as string[]).includes(day);

                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleArrayField("availabilityDays", day)}
                            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                              isSelected
                                ? "border-[#003366] bg-[#003366] text-white shadow-sm"
                                : "border-gray-200 bg-gray-50 text-gray-600 hover:border-[#003366]/40 hover:bg-white"
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Clock className="h-4 w-4 text-gray-400" />
                      Available Time
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {AVAILABLE_TIME_SLOTS.map((slot) => {
                        const isSelected = formData.availableTime === slot;

                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() =>
                              setFormData({ ...formData, availableTime: slot })
                            }
                            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition ${
                              isSelected
                                ? "border-[#003366] bg-[#EAF2FB] text-[#003366]"
                                : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#003366]/40 hover:bg-white"
                            }`}
                          >
                            {slot}
                            {isSelected && <Check className="h-4 w-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#F4B740]/40 bg-[#FFF8E8] p-4 transition hover:border-[#F4B740]">
                    <input
                      type="checkbox"
                      name="isFormTeacher"
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#003366] focus:ring-[#003366]"
                      checked={formData.isFormTeacher}
                      onChange={handleCheckboxChange}
                    />
                    <span>
                      <span className="block text-sm font-semibold text-gray-800">
                        Assign as Form Teacher
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-gray-600">
                        Marks this teacher as the primary class coordinator where applicable.
                      </span>
                    </span>
                  </label>
                </div>
              </section>
            </div>

            {/* Final Review */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h5 className="text-sm font-medium text-blue-900 mb-1">
                    Ready to Create Teacher Account
                  </h5>
                  <p className="text-sm text-blue-700">
                    All required information has been collected. Click "Create
                    Teacher" to finalize the account setup.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleBackClick = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepLabel = () => {
    switch (currentStep) {
      case 0:
        return "Basic Information";
      case 1:
        return "Qualifications";
      case 2:
        return "Employment Details";
      default:
        return "";
    }
  };

  return (
    <div
      id="modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={(e) => {
        if ((e.target as Element).id === "modal-overlay") {
          onClose();
        }
      }}
    >
      <div className="bg-white h-[90vh] w-full max-w-4xl mx-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-8 duration-300" data-guide="teacher-create-modal">
        {/* Header */}
        <div className="bg-[#003366] p-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l9-5-9-5-9 5 9 5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Add New Teacher</h2>
                <p className="text-blue-100 text-sm">
                  Create a teacher account and profile
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white p-2 rounded-lg hover:bg-blue-500 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="mt-6" data-guide="teacher-create-progress">
            <Tooltip content="Teacher setup has three stages: login account, personal qualifications, then employment and class availability." side="bottom">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-blue-100">
                Step {currentStep + 1} of 3: {getStepLabel()}
              </span>
              <span className="text-sm text-blue-200">
                {Math.round(((currentStep + 1) / 3) * 100)}% Complete
              </span>
            </div>
            </Tooltip>
            <div className="bg-blue-500 bg-opacity-30 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-300 ease-out"
                style={{ width: `${((currentStep + 1) / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" data-guide="teacher-create-fields">
          <div className="mb-5 rounded-2xl border border-[#F4B740]/30 bg-gradient-to-r from-[#FFF8E8] to-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-[#003366]">
              Teacher setup guide
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Create the account first, then complete profile details so this teacher can be assigned to classes, courses, and messages.
            </p>
          </div>
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBackClick}
              className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                currentStep === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              disabled={currentStep === 0}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>

            <Tooltip content={currentStep === 2 ? "Finish the teacher profile and make the account available across Talim." : "Save this stage and continue to the next teacher setup step."} side="top">
            <button
              onClick={handleSubmit}
              className="bg-[#003366] text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  {currentStep === 2 ? "Create Teacher" : "Continue"}
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </>
              )}
            </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTeacherModal;
