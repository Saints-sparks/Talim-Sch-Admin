"use client";

import React, { useState, useEffect } from "react";

import { FiEdit, FiArrowLeft } from "react-icons/fi";
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
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { getClass } from "../../services/student.service";
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
    <div className="flex flex-col h-screen bg-[#F8F8F8]">
      {/* Navigation Header */}
      <div className="flex-shrink-0 bg-[#F8F8F8] border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex flex-wrap items-center text-sm text-gray-600 gap-x-2">
            <button
              onClick={() => router.push("/classes")}
              className="flex items-center hover:text-blue-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Back to Classes</span>
              <span className="sm:hidden">Back</span>
            </button>
            <span className="text-gray-400 hidden sm:inline">|</span>
            <User className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Class Profile</span>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <span className="text-gray-900 font-semibold">
              {getStringValue(classData.name)}
            </span>
          </div>
          <button
            onClick={() => router.push(`/classes/edit-class/${classId}`)}
            className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center text-sm font-medium whitespace-nowrap"
          >
            <FiEdit className="mr-1 sm:mr-2 w-4 h-4" />
            <span className="hidden sm:inline">Edit Class</span>
            <span className="sm:hidden">Edit</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6">
          <nav className="grid grid-cols-3 gap-0">
            <button
              onClick={() => setActiveTab("details")}
              className={`flex items-center justify-center py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                activeTab === "details"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Info className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Class Details</span>
              <span className="sm:hidden">Details</span>
            </button>
            <button
              onClick={() => setActiveTab("courses")}
              className={`flex items-center justify-center py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                activeTab === "courses"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Courses</span>
              <span className="sm:hidden">Courses</span>
            </button>
            <button
              onClick={() => setActiveTab("teacher")}
              className={`flex items-center justify-center py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                activeTab === "teacher"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Class Teacher</span>
              <span className="sm:hidden">Teacher</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
            {/* Class Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Class Information
                      </h2>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    {/* Description */}
                    {classData.classDescription && (
                      <div className="mb-6">
                        <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                          <Info className="w-4 h-4 mr-2" />
                          Class Description
                        </label>
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                          <p className="text-gray-900 text-sm sm:text-base">
                            {getStringValue(classData.classDescription)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4 sm:p-6 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-blue-700">
                              Total Courses
                            </p>
                            <p className="text-xl sm:text-2xl font-bold text-blue-900">
                              {classData.courses?.length || 0}
                            </p>
                            <p className="text-xs sm:text-sm text-blue-600">
                              assigned
                            </p>
                          </div>
                          <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                        </div>
                      </div>

                      <div className="bg-green-50 rounded-lg p-4 sm:p-6 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm font-medium text-green-700">
                              Class Capacity
                            </p>
                            <p className="text-xl sm:text-2xl font-bold text-green-900">
                              {getStringValue(classData.classCapacity)}
                            </p>
                            <p className="text-xs sm:text-sm text-green-600">
                              students
                            </p>
                          </div>
                          <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                        </div>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4 sm:p-6 border border-purple-200 sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-purple-700">
                              Class Teacher
                            </p>
                            <p className="text-sm sm:text-lg font-bold text-purple-900 truncate">
                              {getTeacherName(classData)}
                            </p>
                            <p className="text-xs sm:text-sm text-purple-600">
                              instructor
                            </p>
                          </div>
                          <User className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0 ml-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Courses Tab */}
            {activeTab === "courses" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg mr-3">
                          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                          Courses ({classData.courses?.length || 0})
                        </h2>
                      </div>
                      <button className="px-3 py-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                        <span className="hidden sm:inline">Add Course</span>
                        <span className="sm:hidden">Add</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    {!classData.courses || classData.courses.length === 0 ? (
                      <div className="text-center py-8 sm:py-12">
                        <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                          No courses assigned
                        </h3>
                        <p className="text-sm sm:text-base text-gray-500 mb-4 max-w-sm mx-auto">
                          This class doesn't have any courses assigned yet. Add
                          courses to get started.
                        </p>
                        <button className="px-4 py-2 sm:px-6 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                          Assign First Course
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {classData.courses.map((course: any, index: number) => (
                          <div
                            key={course._id || index}
                            className="bg-gray-50 rounded-lg p-4 sm:p-6 hover:bg-gray-100 transition-colors border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 truncate">
                                  {course.title || "Untitled Course"}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Course Code: {course.courseCode || "N/A"}
                                </p>
                                {course.subjectId && (
                                  <p className="text-xs sm:text-sm text-purple-600 font-medium">
                                    Subject: {course.subjectId.name} (
                                    {course.subjectId.code})
                                  </p>
                                )}
                              </div>
                              <div className="ml-3 flex-shrink-0">
                                <button className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {course.description && (
                              <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">
                                {course.description}
                              </p>
                            )}

                            {course.teacherId?.userId && (
                              <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                                <p className="text-xs text-blue-700 font-medium">
                                  Instructor:{" "}
                                  {course.teacherId.userId.firstName}{" "}
                                  {course.teacherId.userId.lastName}
                                </p>
                                <p className="text-xs text-blue-600">
                                  {course.teacherId.userId.email}
                                </p>
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-3 border-t border-gray-200">
                              <button className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium self-start sm:self-auto">
                                View Details
                              </button>
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
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg mr-3">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Class Teacher Information
                      </h2>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    {classData.classTeacherId?.userId ? (
                      <div className="space-y-6">
                        {/* Teacher Profile Card */}
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                            <div className="flex-shrink-0">
                              <div className="p-3 sm:p-4 bg-purple-200 rounded-full">
                                <User className="w-8 h-8 sm:w-12 sm:h-12 text-purple-700" />
                              </div>
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                              <h3 className="text-xl sm:text-2xl font-bold text-purple-900 mb-1">
                                {getTeacherName(classData)}
                              </h3>
                              <p className="text-purple-700 font-medium mb-2 text-sm sm:text-base">
                                Primary Class Teacher
                              </p>
                              {classData.classTeacherId.userId.email && (
                                <p className="text-purple-600 text-sm sm:text-base break-all">
                                  {classData.classTeacherId.userId.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Teacher Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              First Name
                            </label>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <span className="text-gray-900 text-sm sm:text-base">
                                {classData.classTeacherId.userId.firstName}
                              </span>
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Last Name
                            </label>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <span className="text-gray-900 text-sm sm:text-base">
                                {classData.classTeacherId.userId.lastName}
                              </span>
                            </div>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Email Address
                            </label>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <span className="text-gray-900 text-sm sm:text-base break-all">
                                {classData.classTeacherId.userId.email}
                              </span>
                            </div>
                          </div>

                          {classData.classTeacherId.specialization && (
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Specialization
                              </label>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <span className="text-gray-900 text-sm sm:text-base">
                                  {classData.classTeacherId.specialization}
                                </span>
                              </div>
                            </div>
                          )}

                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                              Form Teacher
                            </label>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  classData.classTeacherId.isFormTeacher
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
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
    </div>
  );
};

export default ViewClass;
