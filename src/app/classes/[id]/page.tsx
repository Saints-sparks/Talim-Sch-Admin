"use client";

import React, { useState, useEffect } from "react";

import {
  FiEdit,
  FiArrowLeft,
  FiBook,
  FiCalendar,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import {
  BookOpen,
  GraduationCap,
  Users,
  User,
  Info,
  Calendar,
  Settings,
  ChevronLeft,
  Bell,
  MapPin,
  Phone,
  Mail,
  Badge,
  Calendar as CalendarIcon,
  MoreVertical,
  Clock,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { getClass } from "../../services/student.service";
import { deleteCourseService } from "../../services/subjects.service";
import CourseModal from "@/components/CourseModal";
import "react-toastify/dist/ReactToastify.css";

interface ClassDetails {
  _id: string;
  name: string;
  schoolId: {
    _id: string;
    name: string;
    email: string;
    physicalAddress: string;
    location: {
      country: string;
      state: string;
      _id: string;
    };
    schoolPrefix: string;
    primaryContacts: Array<{
      name: string;
      phone: string;
      email: string;
      role: string;
      _id: string;
    }>;
    active: boolean;
    logo: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  classTeacherId: {
    _id: string;
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      id: string;
    };
    assignedClasses: string[];
    assignedCourses: string[];
    isFormTeacher: boolean;
    isActive: boolean;
    highestAcademicQualification: string;
    yearsOfExperience: number;
    specialization: string;
    employmentType: string;
    employmentRole: string;
    availabilityDays: string[];
    availableTime: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
  courses: Course[];
  classDescription: string;
  classCapacity: string;
  assignedCourses: any[];
  createdAt?: string;
  updatedAt?: string;
  __v: number;
}

interface Course {
  _id: string;
  courseCode: string;
  title: string;
  description: string;
  teacherId: {
    _id: string;
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  subjectId: {
    _id: string;
    name: string;
    code: string;
  };
  classId: string;
  schoolId: string;
  createdAt?: string;
  updatedAt?: string;
  __v: number;
  id: string;
}

const ViewClass: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const classId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [classData, setClassData] = useState<ClassDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState("details");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [isDeletingCourse, setIsDeletingCourse] = useState<string | null>(null);

  // Course modal states
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseModalMode, setCourseModalMode] = useState<"add" | "edit">(
    "edit"
  );
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Helper function to safely extract string values from potentially nested objects
  const getStringValue = (value: any): string => {
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    if (typeof value === "object" && value !== null) {
      return value.name || value.title || value._id || "Unknown";
    }
    return value?.toString() || "Unknown";
  };

  // Helper function to get teacher name from populated data
  const getTeacherName = (classData: ClassDetails): string => {
    if (
      classData.classTeacherId?.userId?.firstName &&
      classData.classTeacherId?.userId?.lastName
    ) {
      return `${classData.classTeacherId.userId.firstName} ${classData.classTeacherId.userId.lastName}`;
    }
    return "No teacher assigned";
  };

  // Course management functions
  const handleEditCourse = (courseId: string) => {
    if (!classData) return;
    const course = classData.courses.find((c) => c._id === courseId);
    if (course) {
      setSelectedCourse(course);
      setCourseModalMode("edit");
      setShowCourseModal(true);
    }
    setMenuOpen(null);
  };

  const handleCourseModalSuccess = async () => {
    try {
      // Refresh class data to reflect the changes
      const updatedData = await getClass(classId!);
      setClassData(updatedData);
    } catch (error) {
      console.error("Error refreshing class data:", error);
    }
  };

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setCourseModalMode("add");
    setShowCourseModal(true);
  };

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${courseTitle}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      setMenuOpen(null);
      return;
    }

    try {
      setIsDeletingCourse(courseId);
      setMenuOpen(null);

      await deleteCourseService(courseId);

      toast.success(`${courseTitle} has been deleted successfully!`, {
        position: "top-right",
        autoClose: 4000,
      });

      // Refresh class data to reflect the deletion
      const updatedData = await getClass(classId!);
      setClassData(updatedData);
    } catch (error: any) {
      console.error("Error deleting course:", error);

      let errorMessage = `Failed to delete ${courseTitle}`;

      if (error.message?.includes("not found")) {
        errorMessage = `${courseTitle} not found. It may have already been deleted.`;
      } else if (
        error.message?.includes("unauthorized") ||
        error.message?.includes("forbidden")
      ) {
        errorMessage = "You don't have permission to delete this course.";
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
        autoClose: 6000,
      });
    } finally {
      setIsDeletingCourse(null);
    }
  };

  // Close menu when clicking outside
  // Close menu when clicking outside (but ignore clicks inside the open dropdown)
  useEffect(() => {
    if (!menuOpen) return; // only attach when a menu is open

    const handleClickOutside = (event: MouseEvent) => {
      // find the currently open dropdown element
      const dropdownEl = document.getElementById(`dropdown-${menuOpen}`);
      // if no dropdown found, just close
      if (!dropdownEl) {
        setMenuOpen(null);
        return;
      }
      // if click/mousedown was inside the dropdown, don't close it
      if (dropdownEl.contains(event.target as Node)) {
        return;
      }
      // otherwise close it
      setMenuOpen(null);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const toggleMenu = (courseId: string) => {
    setMenuOpen(menuOpen === courseId ? null : courseId);
  };

  useEffect(() => {
    const fetchClassData = async () => {
      //   console.log("🔍 ViewClass component loaded");
      //   console.log("🔍 Params:", params);
      //   console.log("🔍 Class ID:", classId);

      try {
        if (!classId) {
          setError("Class ID is required");
          return;
        }

        // console.log("🚀 Fetching class data for ID:", classId);
        const data = await getClass(classId);
        //console.log("✅ Class data received:", data);

        setClassData(data);
      } catch (error: any) {
        console.error("❌ Error fetching class:", error);
        setError("Failed to load class details");
        toast.error("Failed to load class details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassData();
  }, [classId, params]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="border-b border-gray-200 px-6 py-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md mx-8">
              <div className="h-10 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Navigation Skeleton */}
        <div className="p-6 bg-white">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-28 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Tabs Skeleton */}
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex space-x-8">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-6 w-24 bg-gray-200 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="h-32 w-32 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
                  <div className="h-6 w-32 bg-gray-200 rounded mx-auto animate-pulse"></div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="h-16 bg-gray-200 rounded animate-pulse"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If there's an error, show error message
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
                  className="px-6 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#033c76] transition-colors duration-200 flex items-center"
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

  // If there is no class data found
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
    <div>
      <div className="flex flex-col h-screen bg-[#F8F8F8]">
        {/* Navigation Header */}
        <div className="flex-shrink-0 bg-[#F8F8F8] border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={() => router.push("/classes")}
              className="flex items-center text-[15px] font-semibold"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </button>

            {/* Edit Class Button */}
            <button
              onClick={() => router.push(`/classes/edit-class/${classId}`)}
              className="flex items-center gap-2 bg-[#002D62] hover:bg-[#001F45] text-white font-semibold text-[15px] px-5 py-2 rounded-lg transition"
            >
              <span>Edit Class</span>
              <FiEdit className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6">
            <nav className="flex space-x-6">
              {[
                { key: "details", label: "Class Details", icon: Info },
                { key: "courses", label: "Courses", icon: BookOpen },
                { key: "teacher", label: "Class Teacher", icon: User },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center py-4 border-b-2 font-semibold text-[15px] transition-all ${
                      activeTab === tab.key
                        ? "border-black text-black"
                        : "border-transparent text-[#808080] hover:text-[#929292] hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2 text-[#1A1A1A]" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {activeTab === "details" && (
              <>
                {/* Class Information Header */}
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-[#1A1A1A]" />
                    <h2 className="text-[15px] font-semibold text-[#4D4D4D]">
                      Class Information
                    </h2>
                  </div>
                  <button
                    onClick={() =>
                      router.push(`/classes/edit-class/${classId}`)
                    }
                    className="flex items-center gap-2 text-[15px] font-semibold text-[#393939] hover:text-[#003366] transition"
                  >
                    <FiEdit2 className="w-4 h-4 text-[#393939]" />
                    Edit
                  </button>
                </div>

                {/* Class Info Fields */}
                <div className="space-y-4 text-[15px]">
                  {/* Class Name */}
                  <div className="flex items-center space-x-5 max-w-md">
                    <span className="font-medium  text-gray-800">
                      Class Name
                    </span>
                    <div className="flex items-center bg-gray-100 text-[#4D4D4D] px-2 py-1 rounded-md">
                      <FiCalendar className="w-4 h-4 mr-1 text-gray-700" />
                      <span>Grade 1</span>
                    </div>
                  </div>

                  {/* Courses */}
                  <div className="flex items-center space-x-5 max-w-md">
                    <span className="font-medium text-gray-800">Courses</span>
                    <div className="flex items-center bg-gray-100 text-[#4D4D4D]  px-2 py-1 rounded-md">
                      <FiBook className="w-4 h-4 mr-1 text-gray-700" />
                      <span>9 courses</span>
                    </div>
                  </div>

                  {/* Students */}
                  <div className="flex items-center space-x-5 max-w-md">
                    <span className="font-medium text-gray-800">Students</span>
                    <div className="flex items-center text-[#4D4D4D]  bg-gray-100 px-2 py-1 rounded-md">
                      <span>40/50</span>
                      <div className="flex ml-2 -space-x-2">
                        <img
                          src="/img/classdetail-student1.png"
                          alt="student image"
                          className="w-6 h-6 rounded-full border border-white"
                        />
                        <img
                          src="/img/classdetail-student2.png"
                          alt="student image"
                          className="w-6 h-6 rounded-full border border-white"
                        />
                        <img
                          src="/img/classdetail-student3.png"
                          alt="student image"
                          className="w-6 h-6 rounded-full border border-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Class Description */}
                  <div className="flex items-center max-w-md">
                    <span className="font-medium text-gray-800">
                      {" "}
                      Class Description
                    </span>
                    <div className="bg-gray-100 px-2 py-1 text-[#4D4D4D] ">
                      <span>
                        {" "}
                        In class 1, our students will be building on the basic
                        foundation.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                  <div className="bg-white border border-gray-200 rounded-lg p-8 flex items-center justify-between">
                    <div>
                      <p className="text-[23px] font-semibold text-[#030E18]">
                        15
                      </p>
                      <p className="text-[13px] font-medium text-[#B3B3B3]">
                        Total Courses
                      </p>
                    </div>
                    <FiBook className="w-6 h-6 text-[#292D32]" />
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-8 flex items-center justify-between">
                    <div>
                      <p className="text-[23px] font-semibold text-[#030E18]">
                        15
                      </p>
                      <p className="text-[13px] font-medium text-[#B3B3B3]">
                        Class Capacity
                      </p>
                    </div>
                    <Users className="w-6 h-6 text-[#292D32]" />
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-8 flex items-center justify-between">
                    <div>
                      <p className="text-[23px] font-semibold text-[#030E18]">
                        15
                      </p>
                      <p className="text-[13px] font-medium text-[#B3B3B3]">
                        Teachers
                      </p>
                    </div>
                    <User className="w-6 h-6 text-[#292D32]" />
                  </div>
                </div>
              </>
            )}

            {/* Courses Tab */}
            {activeTab === "courses" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm">
                  {/* Header */}
                  <div className="flex items-center gap-3 px-4 py-2">
                    {/* Icon + Text */}
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <BookOpen className="w-5 h-5 text-gray-700" />
                      </div>
                      <h2 className="text-base font-medium text-gray-800">
                        Courses
                      </h2>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddCourse}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        + Add
                      </button>
                      <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        <FiEdit className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-6">
                    {!classData.courses || classData.courses.length === 0 ? (
                      <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No courses yet
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          You haven’t added any courses to this class.
                        </p>
                        <button
                          onClick={handleAddCourse}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                        >
                          Add First Course
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classData.courses.map((course, index) => (
                          <div
                            key={course._id || index}
                            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                          >
                            {/* Top Row */}
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="text-base font-semibold text-gray-900">
                                {course.title || "Untitled Course"}
                              </h3>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditCourse(course._id)}
                                  className="p-1.5 text-[#003366] hover:bg-blue-50 rounded-full transition"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteCourse(course._id, course.title)
                                  }
                                  className="p-1.5 text-[#CC3333] hover:bg-red-50 rounded-full transition"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Course Info */}
                            <div className="space-y-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">
                                  Course Code:
                                </span>
                                <span className="text-gray-900">
                                  {course.courseCode || "N/A"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">
                                  Subject:
                                </span>
                                <span className="text-gray-900">
                                  {course.subjectId?.name} (
                                  {course.subjectId?.code})
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">
                                  Students:
                                </span>
                                <span className="text-gray-900">40/50</span>
                                <div className="flex -space-x-2">
                                  {[1, 2, 3].map((i) => (
                                    <img
                                      key={i}
                                      src={`/img/classdetail-student1${i}.png`}
                                      alt="student"
                                      className="w-6 h-6 rounded-full border-2 border-white"
                                    />
                                  ))}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">
                                  Last Updated:
                                </span>
                                <span className="text-gray-900">
                                  {course.updatedAt
                                    ? new Date(
                                        course.updatedAt
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Class Teacher Tab */}
            {activeTab === "teacher" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <User className="w-5 h-5 text-gray-700" />
                      </div>
                      <h2 className="text-base font-semibold text-gray-800">
                        Class Teacher Information
                      </h2>
                    </div>

                    <button
                      onClick={handleAddCourse}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                    >
                      <FiEdit className="w-4 h-4" />
                      Change
                    </button>
                  </div>

                  {/* Teacher Info */}
                  {classData?.classTeacherId?.userId ? (
                    <div className="space-y-6">
                      {/* Profile */}
                      <div className="flex items-center gap-4">
                        <img
                          src={"/img/default-teacher.png"}
                          alt="Teacher"
                          className="w-20 h-20 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            Mrs {classData.classTeacherId.userId.lastName}
                          </h3>
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-lg">
                            {classData.name || "Primary 2"}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-4">
                        {/* First Name */}
                        <div className="flex items-center gap-4">
                          <p className="text-sm text-gray-500 w-32">
                            First Name
                          </p>
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-800 text-sm">
                              {classData.classTeacherId.userId.firstName}
                            </span>
                          </div>
                        </div>

                        {/* Last Name */}
                        <div className="flex items-center gap-4">
                          <p className="text-sm text-gray-500 w-32">
                            Last Name
                          </p>
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-800 text-sm">
                              {classData.classTeacherId.userId.lastName}
                            </span>
                          </div>
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-4">
                          <p className="text-sm text-gray-500 w-32">Email</p>
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 flex-1">
                            <FiEdit className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-800 text-sm break-all">
                              {classData.classTeacherId.userId.email}
                            </span>
                          </div>
                        </div>

                        {/* Specialization (if exists) */}
                        {classData.classTeacherId.specialization && (
                          <div className="flex items-center gap-4">
                            <p className="text-sm text-gray-500 w-32">
                              Specialization
                            </p>
                            <div className="bg-gray-50 rounded-lg px-3 py-2 text-gray-800 text-sm flex-1">
                              {classData.classTeacherId.specialization}
                            </div>
                          </div>
                        )}

                        {/* Form Teacher */}
                        <div className="flex items-center gap-4">
                          <p className="text-sm text-gray-500 w-32">
                            Form Teacher
                          </p>
                          <div className="bg-gray-50 rounded-lg px-3 py-2 flex-1">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                classData.classTeacherId.isFormTeacher
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {classData.classTeacherId.isFormTeacher
                                ? "Yes"
                                : "No"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <User className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium mb-2 text-sm sm:text-base">
                        No teacher assigned
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
                        A teacher can be assigned through the edit page.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 rounded-lg mr-3">
                        <Settings className="w-5 h-5 text-gray-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Class Settings
                      </h2>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Class Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Class ID
                          </label>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <span className="text-gray-900 font-mono text-sm">
                              {getStringValue(classData._id)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            School ID
                          </label>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <span className="text-gray-900 font-mono text-sm">
                              {classData.schoolId?._id ||
                                getStringValue(classData.schoolId)}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Created At
                          </label>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <span className="text-gray-900">
                              {classData.createdAt
                                ? new Date(classData.createdAt).toLocaleString()
                                : "N/A"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">
                            Last Updated
                          </label>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <span className="text-gray-900">
                              {classData.updatedAt
                                ? new Date(classData.updatedAt).toLocaleString()
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Quick Actions
                        </h3>
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() =>
                              router.push(`/classes/edit-class/${classId}`)
                            }
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                          >
                            <FiEdit className="mr-2 w-4 h-4" />
                            Edit Class
                          </button>
                          <button
                            onClick={() => router.push("/classes")}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center text-sm"
                          >
                            <FiArrowLeft className="mr-2 w-4 h-4" />
                            Back to Classes
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Modal */}
      <CourseModal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        onSuccess={handleCourseModalSuccess}
        mode={courseModalMode}
        course={selectedCourse}
        subjectId={selectedCourse?.subjectId?._id}
        subjectName={selectedCourse?.subjectId?.name}
        initialClassId={classId || ""}
      />
    </div>
  );
};

export default ViewClass;
