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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

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
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const dropdownEl = document.getElementById(`dropdown-${menuOpen}`);
      if (!dropdownEl) {
        setMenuOpen(null);
        return;
      }
      if (dropdownEl.contains(event.target as Node)) {
        return;
      }
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
      try {
        if (!classId) {
          setError("Class ID is required");
          return;
        }

        const data = await getClass(classId);
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
        {/* Navigation Skeleton */}
        <div className="bg-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="p-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Tabs Skeleton */}
            <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex space-x-8">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-6 w-24 bg-gray-200 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="p-8 space-y-6">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto mt-32">
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.963-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                ></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Class
            </h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/classes")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Classes
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto mt-32">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Class Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              The class you're looking for doesn't exist.
            </p>
            <button
              onClick={() => router.push("/classes")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Classes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/classes")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Classes</span>
            </button>
            <div className="text-gray-300">|</div>
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Class Details</span>
            </div>
          </div>
          <button
            onClick={() => router.push(`/classes/edit-class/${classId}`)}
            className="flex items-center gap-2 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            <FiEdit className="w-4 h-4" />
            Edit Class
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 bg-gray-50 border-b border-gray-200 rounded-none h-auto p-0">
              <TabsTrigger
                value="details"
                className="flex items-center gap-2 py-4 px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-[#003366] data-[state=active]:text-[#003366] rounded-none font-medium transition-all"
              >
                <Info className="w-4 h-4" />
                Class Details
              </TabsTrigger>
              <TabsTrigger
                value="courses"
                className="flex items-center gap-2 py-4 px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-[#003366] data-[state=active]:text-[#003366] rounded-none font-medium transition-all"
              >
                <BookOpen className="w-4 h-4" />
                Courses
              </TabsTrigger>
              <TabsTrigger
                value="teacher"
                className="flex items-center gap-2 py-4 px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-[#003366] data-[state=active]:text-[#003366] rounded-none font-medium transition-all"
              >
                <User className="w-4 h-4" />
                Class Teacher
              </TabsTrigger>
            </TabsList>

            <div className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  {/* Class Details Tab */}
                  <TabsContent value="details" className="space-y-8 mt-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {classData.name}
                        </h2>
                        <p className="text-gray-600 mt-1">
                          Class information and statistics
                        </p>
                      </div>
                    </div>

                    {/* Class Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <GraduationCap className="w-4 h-4" />
                          Class Name
                        </label>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <span className="text-gray-900">
                            {classData.name}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Total Courses
                        </label>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <span className="text-gray-900">
                            {classData.courses?.length || 0} courses
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Class Capacity
                        </label>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <span className="text-gray-900">
                            {classData.classCapacity || "Not set"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Class Teacher
                        </label>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <span className="text-gray-900">
                            {getTeacherName(classData)}
                          </span>
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Info className="w-4 h-4" />
                          Class Description
                        </label>
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <span className="text-gray-900">
                            {classData.classDescription ||
                              "No description available"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              {classData.courses?.length || 0}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Total Courses
                            </p>
                          </div>
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              {classData.classCapacity || "0"}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Class Capacity
                            </p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <Users className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">1</p>
                            <p className="text-sm text-gray-600 mt-1">
                              Class Teacher
                            </p>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <User className="w-6 h-6 text-purple-600" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Courses Tab */}
                  <TabsContent value="courses" className="space-y-8 mt-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Courses
                        </h2>
                        <p className="text-gray-600 mt-1">
                          Manage courses for this class
                        </p>
                      </div>
                      <button
                        onClick={handleAddCourse}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium"
                      >
                        + Add Course
                      </button>
                    </div>

                    {!classData.courses || classData.courses.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                        <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No courses yet
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                          You haven't added any courses to this class.
                        </p>
                        <button
                          onClick={handleAddCourse}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                        >
                          Add First Course
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classData.courses.map((course, index) => (
                          <div
                            key={course._id || index}
                            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                          >
                            {/* Course Header */}
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {course.title || "Untitled Course"}
                              </h3>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditCourse(course._id)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                >
                                  <FiEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteCourse(course._id, course.title)
                                  }
                                  disabled={isDeletingCourse === course._id}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Course Info */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-gray-700">
                                  Code:
                                </span>
                                <span className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                                  {course.courseCode || "N/A"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-gray-700">
                                  Subject:
                                </span>
                                <span className="text-gray-900">
                                  {course.subjectId?.name} (
                                  {course.subjectId?.code})
                                </span>
                              </div>

                              {course.updatedAt && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">
                                    Updated{" "}
                                    {new Date(
                                      course.updatedAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Class Teacher Tab */}
                  <TabsContent value="teacher" className="space-y-8 mt-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Class Teacher Information
                        </h2>
                        <p className="text-gray-600 mt-1">
                          Teacher assigned to this class
                        </p>
                      </div>
                    </div>

                    {classData?.classTeacherId?.userId ? (
                      <div className="space-y-6">
                        {/* Teacher Profile */}
                        <div className="flex items-center gap-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                            {classData.classTeacherId.userId.firstName?.[0]}
                            {classData.classTeacherId.userId.lastName?.[0]}
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">
                              {classData.classTeacherId.userId.firstName}{" "}
                              {classData.classTeacherId.userId.lastName}
                            </h3>
                            <p className="text-gray-600 mt-1">
                              {classData.classTeacherId.isFormTeacher
                                ? "Form Teacher"
                                : "Class Teacher"}
                            </p>
                          </div>
                        </div>

                        {/* Teacher Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              First Name
                            </label>
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <span className="text-gray-900">
                                {classData.classTeacherId.userId.firstName}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Last Name
                            </label>
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <span className="text-gray-900">
                                {classData.classTeacherId.userId.lastName}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              Email
                            </label>
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <span className="text-gray-900 break-all">
                                {classData.classTeacherId.userId.email}
                              </span>
                            </div>
                          </div>

                          {classData.classTeacherId.specialization && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" />
                                Specialization
                              </label>
                              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <span className="text-gray-900">
                                  {classData.classTeacherId.specialization}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <Badge className="w-4 h-4" />
                              Form Teacher Status
                            </label>
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
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
                      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                        <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No teacher assigned
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                          A teacher can be assigned through the edit page.
                        </p>
                        <button
                          onClick={() =>
                            router.push(`/classes/edit-class/${classId}`)
                          }
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                          Assign Teacher
                        </button>
                      </div>
                    )}
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs>
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