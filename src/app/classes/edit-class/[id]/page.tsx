"use client";

import React, { useState, useEffect } from "react";

import { FiSave, FiX } from "react-icons/fi";
import {
  BookOpen,
  Users,
  User,
  Info,
  ChevronLeft,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import {
  getClass,
  updateClass,
  assignTeacherToClass,
} from "../../../services/student.service";
import { getTeachers, Teacher } from "../../../services/subjects.service";
import "react-toastify/dist/ReactToastify.css";

interface ClassDetails {
  _id: string;
  name: string;
  schoolId: string;
  classTeacherId: {
    _id: string;
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    specialization: string;
    isFormTeacher: boolean;
  };
  courses: Course[];
  classDescription: string;
  classCapacity: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  courseCode: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  createdAt?: string;
}

const EditClass: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const classId = Array.isArray(params.id) ? params.id[0] : params.id;

  // State management
  const [classData, setClassData] = useState<ClassDetails | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAssigningTeacher, setIsAssigningTeacher] = useState(false);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState("details");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    classDescription: "",
    classCapacity: "",
  });

  // Teacher assignment state
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);

  // Helper functions
  const getTeacherName = (teacher: Teacher): string => {
    return `${teacher.firstName} ${teacher.lastName}`;
  };

  const getTeacherEmail = (teacher: Teacher): string => {
    return teacher.email;
  };

  const getCurrentTeacherName = (): string => {
    if (!classData?.classTeacherId) return "No teacher assigned";
    return `${classData.classTeacherId.userId.firstName} ${classData.classTeacherId.userId.lastName}`;
  };

  const getCurrentTeacherEmail = (): string => {
    if (!classData?.classTeacherId) return "";
    return classData.classTeacherId.userId.email;
  };

  // Filter teachers based on search
  const filteredTeachers = teachers.filter((teacher) => {
    const fullName = getTeacherName(teacher).toLowerCase();
    const email = getTeacherEmail(teacher).toLowerCase();
    const search = teacherSearch.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  // Fetch class data and teachers
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!classId) {
          setError("Class ID is required");
          return;
        }

        // Fetch class data
        const data = await getClass(classId);
        setClassData(data);

        // Set form data
        setFormData({
          name: data.name || "",
          classDescription: data.classDescription || "",
          classCapacity:
            data.classCapacity !== undefined && data.classCapacity !== null
              ? String(data.classCapacity)
              : "",
        });

        // Fetch teachers list
        setIsLoadingTeachers(true);
        try {
          const teachersData = await getTeachers();
          setTeachers(teachersData);
        } catch (teacherError) {
          console.warn("Failed to fetch teachers:", teacherError);
          toast.warn("Failed to load teachers list");
        } finally {
          setIsLoadingTeachers(false);
        }
      } catch (error: any) {
        console.error("❌ Error fetching data:", error);
        setError("Failed to load class details");
        toast.error("Failed to load class details");
        setIsLoadingTeachers(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle class update (Save Changes button)
  const handleSubmit = async () => {
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (!classId) {
        throw new Error("Class ID is required");
      }

      // Basic validation
      if (!formData.name.trim()) {
        throw new Error("Class name is required");
      }
      if (!formData.classCapacity || parseInt(formData.classCapacity) <= 0) {
        throw new Error("Valid class capacity is required");
      }

      // Update class details only (no teacher assignment here)
      await updateClass(classId, {
        name: formData.name,
        classDescription: formData.classDescription,
        classCapacity: formData.classCapacity,
      });

      // Show success message
      const successMsg = "Class updated successfully!";
      setSuccessMessage(successMsg);
      toast.success(successMsg, {
        position: "top-right",
        autoClose: 3000,
      });

      // Refresh class details to show updated data
      const updatedData = await getClass(classId);
      setClassData(updatedData);

      // Redirect to class profile after a short delay
      setTimeout(() => {
        router.push(`/classes/${classId}`);
      }, 2000);
    } catch (error: any) {
      console.error("Error updating class:", error);

      // More detailed error handling
      let errorMessage = "Failed to update class";

      if (error.message?.includes("Class name is required")) {
        errorMessage = "Please enter a valid class name";
      } else if (error.message?.includes("Valid class capacity is required")) {
        errorMessage = "Please enter a valid class capacity (greater than 0)";
      } else if (error.message?.includes("classCapacity must be a string")) {
        errorMessage = "Class capacity format is invalid";
      } else if (
        error.message?.includes("unauthorized") ||
        error.message?.includes("forbidden")
      ) {
        errorMessage = "You don't have permission to update this class";
      } else if (error.message?.includes("not found")) {
        errorMessage = "Class not found. It may have been deleted.";
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setErrorMessage(errorMessage);
      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle teacher assignment (separate Assign Teacher button)
  const handleAssignTeacher = async () => {
    if (!selectedTeacher) {
      toast.error("Please select a teacher to assign", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setIsAssigningTeacher(true);
    try {
      if (!classId) {
        throw new Error("Class ID is required");
      }

      // Attempt to assign teacher
      const assignmentResult = await assignTeacherToClass(
        classId,
        selectedTeacher._id
      );
      console.log("Teacher assignment result:", assignmentResult);

      // Refresh class details to show updated teacher
      const updatedData = await getClass(classId);

      // Verify the teacher was actually assigned
      if (!updatedData.classTeacherId) {
        console.warn(
          "Teacher assignment appeared successful but classTeacherId is null"
        );
        toast.warning(
          "Teacher assignment may not have completed properly. Please refresh the page.",
          {
            position: "top-right",
            autoClose: 5000,
          }
        );
      } else {
        toast.success(
          `${getTeacherName(
            selectedTeacher
          )} has been assigned as class teacher!`,
          {
            position: "top-right",
            autoClose: 4000,
          }
        );
      }

      setClassData(updatedData);

      // Reset teacher selection
      setSelectedTeacher(null);
      setTeacherSearch("");
      setShowTeacherDropdown(false);
    } catch (error: any) {
      console.error("Error assigning teacher:", error);

      // More detailed error messages
      let errorMessage = "Failed to assign teacher";

      if (error.message?.includes("not found")) {
        errorMessage = "Teacher or class not found. Please try again.";
      } else if (
        error.message?.includes("unauthorized") ||
        error.message?.includes("forbidden")
      ) {
        errorMessage =
          "You don't have permission to assign teachers to this class.";
      } else if (error.message?.includes("already assigned")) {
        errorMessage = "This teacher is already assigned to another class.";
      } else if (
        error.message?.includes("network") ||
        error.message?.includes("fetch")
      ) {
        errorMessage =
          "Network error. Please check your connection and try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsAssigningTeacher(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(`/classes/${classId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading class details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center p-6 min-h-[60vh]">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-2xl">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Class ID: {classId || "Not provided"}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => router.push("/classes")}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
                >
                  <ChevronLeft className="mr-2 w-4 h-4" /> Back to Classes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex justify-center items-center p-6 min-h-[60vh]">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-2xl">
            <div className="text-gray-400 text-4xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Class Not Found
            </h2>
            <p className="text-gray-600 mb-4">
              The class you're looking for doesn't exist or has been removed.
            </p>
            <p className="text-sm text-gray-500 mb-6">Class ID: {classId}</p>
            <button
              onClick={() => router.push("/classes")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center mx-auto"
            >
              <ChevronLeft className="mr-2 w-4 h-4" /> Back to Classes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Navigation Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <button
              onClick={() => router.push("/classes")}
              className="flex items-center hover:text-blue-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Classes
            </button>
            <span className="mx-2">|</span>
            <button
              onClick={() => router.push(`/classes/${classId}`)}
              className="flex items-center hover:text-blue-600 transition-colors"
            >
              <User className="w-4 h-4 mr-1" />
              Class Profile
            </button>
            <span className="mx-2">|</span>
            <span className="text-gray-900 font-medium">Edit Class</span>
            <span className="mx-2 text-gray-400">•</span>
            <span className="text-gray-900 font-semibold text-lg">
              {classData.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center text-sm font-medium"
            >
              <FiX className="mr-2 w-4 h-4" /> Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center text-sm font-medium"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="mr-2 w-4 h-4" /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="grid grid-cols-2 gap-0">
            <button
              onClick={() => setActiveTab("details")}
              className={`flex items-center justify-center py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "details"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Info className="w-4 h-4 mr-2" />
              Class Details
            </button>
            <button
              onClick={() => setActiveTab("teacher")}
              className={`flex items-center justify-center py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "teacher"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Assign Teacher
            </button>
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Class Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <Info className="w-5 h-5 text-blue-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Edit Class Information
                      </h2>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Success/Error Messages */}
                    {successMessage && (
                      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg
                              className="w-5 h-5 text-green-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-green-800">
                              {successMessage}
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                              Redirecting you to the class profile...
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {errorMessage && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg
                              className="w-5 h-5 text-red-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-red-800">
                              Error
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                              {errorMessage}
                            </p>
                          </div>
                          <div className="ml-auto pl-3">
                            <button
                              onClick={() => setErrorMessage("")}
                              className="inline-flex text-red-400 hover:text-red-600"
                            >
                              <span className="sr-only">Dismiss</span>
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-6">
                      {/* Class Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Class Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Enter class name (e.g., Grade 1A)"
                          required
                        />
                      </div>

                      {/* Class Capacity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Class Capacity *
                        </label>
                        <input
                          type="number"
                          value={formData.classCapacity}
                          onChange={(e) =>
                            handleInputChange("classCapacity", e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Enter maximum number of students"
                          min="1"
                          required
                        />
                      </div>

                      {/* Class Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Class Description
                        </label>
                        <textarea
                          value={formData.classDescription}
                          onChange={(e) =>
                            handleInputChange(
                              "classDescription",
                              e.target.value
                            )
                          }
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                          placeholder="Enter class description (optional)"
                        />
                      </div>

                      {/* Current Stats Preview */}
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Current Class Statistics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-blue-700">
                                  Total Courses
                                </p>
                                <p className="text-2xl font-bold text-blue-900">
                                  {classData.courses?.length || 0}
                                </p>
                                <p className="text-sm text-blue-600">
                                  assigned
                                </p>
                              </div>
                              <BookOpen className="w-8 h-8 text-blue-600" />
                            </div>
                          </div>

                          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-green-700">
                                  Capacity
                                </p>
                                <p className="text-2xl font-bold text-green-900">
                                  {formData.classCapacity || "0"}
                                </p>
                                <p className="text-sm text-green-600">
                                  students
                                </p>
                              </div>
                              <Users className="w-8 h-8 text-green-600" />
                            </div>
                          </div>

                          <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-purple-700">
                                  Class Teacher
                                </p>
                                <p className="text-lg font-bold text-purple-900 truncate">
                                  {getCurrentTeacherName()}
                                </p>
                                <p className="text-sm text-purple-600">
                                  assigned
                                </p>
                              </div>
                              <User className="w-8 h-8 text-purple-600" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Assign Teacher Tab */}
            {activeTab === "teacher" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg mr-3">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Assign Class Teacher
                      </h2>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Current Teacher Display */}
                      {classData.classTeacherId?.userId && (
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 mb-6">
                          <h3 className="text-lg font-medium text-purple-900 mb-4">
                            Current Class Teacher
                          </h3>
                          <div className="flex items-center gap-6">
                            <div className="p-4 bg-purple-200 rounded-full">
                              <User className="w-12 h-12 text-purple-700" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-purple-900 mb-1">
                                {getCurrentTeacherName()}
                              </h4>
                              <p className="text-purple-700 font-medium mb-2">
                                Primary Class Teacher
                              </p>
                              <p className="text-purple-600">
                                {getCurrentTeacherEmail()}
                              </p>
                              {classData.classTeacherId.specialization && (
                                <p className="text-sm text-purple-600 mt-1">
                                  Specialization:{" "}
                                  {classData.classTeacherId.specialization}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Teacher Search and Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Search and Select Teacher
                        </label>
                        <div className="relative">
                          <div className="flex">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <input
                                type="text"
                                value={teacherSearch}
                                onChange={(e) =>
                                  setTeacherSearch(e.target.value)
                                }
                                onFocus={() => setShowTeacherDropdown(true)}
                                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Search teachers by name or email..."
                              />
                              <button
                                onClick={() =>
                                  setShowTeacherDropdown(!showTeacherDropdown)
                                }
                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                              >
                                {showTeacherDropdown ? (
                                  <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Dropdown */}
                          {showTeacherDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {isLoadingTeachers ? (
                                <div className="p-4 text-center text-gray-500">
                                  Loading teachers...
                                </div>
                              ) : filteredTeachers.length > 0 ? (
                                filteredTeachers.map((teacher) => (
                                  <button
                                    key={teacher._id}
                                    onClick={() => {
                                      setSelectedTeacher(teacher);
                                      setTeacherSearch(getTeacherName(teacher));
                                      setShowTeacherDropdown(false);
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="flex items-center">
                                      <Search className="w-4 h-4 text-gray-400 mr-3" />
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {getTeacherName(teacher)}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                          {getTeacherEmail(teacher)}
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="p-4 text-center text-gray-500">
                                  No teachers found matching your search
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selected Teacher Display */}
                      {selectedTeacher && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  Selected: {getTeacherName(selectedTeacher)}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {getTeacherEmail(selectedTeacher)}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setSelectedTeacher(null);
                                setTeacherSearch("");
                              }}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Assign Teacher Button */}
                      <div className="flex justify-end pt-4 border-t border-gray-200">
                        <button
                          onClick={handleAssignTeacher}
                          disabled={!selectedTeacher || isAssigningTeacher}
                          className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {isAssigningTeacher ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Assigning Teacher...
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4 mr-2" />
                              Assign Teacher
                            </>
                          )}
                        </button>
                      </div>

                      {/* Instructions */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-3">
                          Teacher Assignment Guidelines
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            Search teachers by name or email address
                          </li>
                          <li className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            Select a teacher from the dropdown list
                          </li>
                          <li className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            Click "Assign Teacher" to update the class teacher
                          </li>
                          <li className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            Use "Save Changes" button for class details only
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClass;
