"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiEdit } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { studentService, StudentById } from "@/app/services/student.service";
import { PerformanceMonitor } from "@/app/lib/performance";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  User,
  BookOpen,
  Users,
  GraduationCap,
  Briefcase,
  Clock,
  Award,
  Mail,
  Phone,
  MapPin,
  Badge,
  Calendar as CalendarIcon,
  UserCheck,
  School,
  Heart,
} from "lucide-react";

const StudentProfile = () => {
  const [student, setStudent] = useState<StudentById | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("personal-details");

  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Log network conditions
        PerformanceMonitor.logNetworkMetrics();

        // Start overall page timing
        PerformanceMonitor.startMeasurement("student-page-load");

        const studentData = await studentService.getStudentById(studentId);

        if (!studentData) {
          throw new Error("Student not found");
        }

        setStudent(studentData);

        // End overall timing
        const totalTime =
          PerformanceMonitor.endMeasurement("student-page-load");

        // Log performance warning if slow
        if (totalTime > 2000) {
          console.warn(
            `🐌 Student page took ${totalTime.toFixed(
              2
            )}ms to load - this is slower than expected`
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch student data";
        setError(errorMessage);
        console.error("Error fetching student:", err);

        // End timing even on error
        PerformanceMonitor.endMeasurement("student-page-load");
      } finally {
        setIsLoading(false);
      }
    };

    if (studentId) {
      fetchStudent();
    }
  }, [studentId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full bg-white shadow-sm">
          <div className="h-16 bg-gray-100 animate-pulse"></div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Navigation Skeleton */}
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex space-x-8">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-6 w-24 bg-gray-200 rounded animate-pulse"
                  ></div>
                ))}
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="p-8">
              <div className="space-y-8">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Profile Picture Skeleton */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>

                  {/* Information Skeleton */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-10 bg-gray-100 border rounded-md animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
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
              Error Loading Student
            </h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/users/students")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Students
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto mt-32">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Student Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              The student you're looking for doesn't exist.
            </p>
            <button
              onClick={() => router.push("/users/students")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Students
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Navigation */}
      <div className="bg-white px-4 sm:px-6 py-6 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
            {/* Left Navigation */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push("/users/students")}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-all duration-200 group p-2 rounded-lg hover:bg-blue-50"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                <span className="text-sm font-medium">Students</span>
              </button>

              <div className="flex items-center space-x-2 text-gray-400">
                <ChevronRight className="w-3 h-3" />
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm">Profile</span>
                </div>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/users/students/${studentId}/edit`)}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-blue-200 text-sm font-medium"
              >
                <FiEdit className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 bg-gray-50/50 border-b border-gray-100 rounded-none h-auto p-0">
                <TabsTrigger
                  value="personal-details"
                  className="flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none font-medium transition-all text-xs sm:text-sm hover:bg-white/50"
                >
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Personal Details</span>
                  <span className="sm:hidden">Personal</span>
                </TabsTrigger>
                <TabsTrigger
                  value="parent-guardian"
                  className="flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none font-medium transition-all text-xs sm:text-sm hover:bg-white/50"
                >
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Parent/Guardian</span>
                  <span className="sm:hidden">Parent</span>
                </TabsTrigger>
                <TabsTrigger
                  value="academic-info"
                  className="flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none font-medium transition-all text-xs sm:text-sm hover:bg-white/50"
                >
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Academic Info</span>
                  <span className="sm:hidden">Academic</span>
                </TabsTrigger>
                <TabsTrigger
                  value="attendance"
                  className="flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none font-medium transition-all text-xs sm:text-sm hover:bg-white/50"
                >
                  <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Attendance</span>
                  <span className="sm:hidden">Attend</span>
                </TabsTrigger>
              </TabsList>

              <CardContent className="p-4 sm:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <TabsContent value="personal-details" className="mt-0">
                      <div className="space-y-6 sm:space-y-8">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                            Personal Information
                          </h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                          {/* Profile Picture Section */}
                          <div className="flex flex-col items-center space-y-4 order-1 lg:order-none">
                            <div className="text-center">
                              <div className="relative">
                                <Avatar className="w-24 h-24 sm:w-32 sm:h-32 ring-4 ring-gray-100">
                                  <AvatarImage
                                    src={
                                      student.userId.userAvatar ||
                                      "/placeholder.svg"
                                    }
                                    alt={`${student.userId.firstName} ${student.userId.lastName}`}
                                  />
                                  <AvatarFallback className="bg-blue-500 text-white text-lg sm:text-2xl font-semibold">
                                    {student.userId.firstName?.[0]}
                                    {student.userId.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 border-white"></div>
                              </div>

                              <div className="text-center mt-4 space-y-2">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                  {student.userId.firstName}{" "}
                                  {student.userId.lastName}
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600">
                                  Student
                                </p>
                                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium inline-block">
                                  {student.isActive ? "Active" : "Inactive"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Information Display */}
                          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 order-2 lg:order-none">
                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                First Name
                              </label>
                              <div className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 border rounded-lg text-gray-900 text-sm sm:text-base">
                                {student.userId.firstName || "Not specified"}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Last Name
                              </label>
                              <div className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 border rounded-lg text-gray-900 text-sm sm:text-base">
                                {student.userId.lastName || "Not specified"}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email Address
                              </label>
                              <div className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 border rounded-lg text-gray-900 text-sm sm:text-base break-all">
                                {student.userId.email || "Not specified"}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Phone Number
                              </label>
                              <div className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 border rounded-lg text-gray-900 text-sm sm:text-base">
                                {student.userId.phoneNumber || "Not specified"}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Date of Birth
                              </label>
                              <div className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 border rounded-lg text-gray-900 text-sm sm:text-base">
                                {student.userId.dateOfBirth
                                  ? new Date(
                                      student.userId.dateOfBirth
                                    ).toLocaleDateString()
                                  : "Not specified"}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <UserCheck className="w-4 h-4" />
                                Gender
                              </label>
                              <div className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 border rounded-lg text-gray-900 text-sm sm:text-base">
                                {student.userId.gender || "Not specified"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="parent-guardian" className="mt-0">
                      <div className="space-y-6 sm:space-y-8">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Users className="w-5 h-5 text-green-600" />
                          </div>
                          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                            Parent/Guardian Information
                          </h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                          {/* Profile Picture Section */}
                          <div className="flex flex-col items-center space-y-4 order-1 lg:order-none">
                            <div className="text-center">
                              <div className="relative">
                                <Avatar className="w-24 h-24 sm:w-32 sm:h-32 ring-4 ring-gray-100">
                                  <AvatarImage
                                    src={
                                      student.userId.userAvatar ||
                                      "/placeholder.svg"
                                    }
                                    alt={`${student.userId.firstName} ${student.userId.lastName}`}
                                  />
                                  <AvatarFallback className="bg-green-500 text-white text-lg sm:text-2xl font-semibold">
                                    {student.userId.firstName?.[0]}
                                    {student.userId.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 border-white"></div>
                              </div>

                              <div className="text-center mt-4 space-y-2">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                  {student.userId.firstName}{" "}
                                  {student.userId.lastName}
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600">
                                  Student
                                </p>
                                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium inline-block">
                                  {student.isActive ? "Active" : "Inactive"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Information Display */}
                          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 order-2 lg:order-none">
                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Full Name
                              </label>
                              <div className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 border rounded-lg text-gray-900 text-sm sm:text-base">
                                {student.parentContact.fullName ||
                                  "Not specified"}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Heart className="w-4 h-4" />
                                Relationship
                              </label>
                              <div className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 border rounded-lg text-gray-900 text-sm sm:text-base">
                                {student.parentContact.relationship ||
                                  "Not specified"}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Phone Number
                              </label>
                              <div className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 border rounded-lg text-gray-900 text-sm sm:text-base">
                                {student.parentContact.phoneNumber ||
                                  "Not specified"}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email Address
                              </label>
                              <div className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 border rounded-lg text-gray-900 text-sm sm:text-base break-all">
                                {student.parentContact.email || "Not specified"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="academic-info" className="mt-0">
                      <div className="space-y-6 sm:space-y-8">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <BookOpen className="w-5 h-5 text-purple-600" />
                          </div>
                          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                            Academic Information
                          </h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                          {/* Profile Picture Section */}
                          <div className="flex flex-col items-center space-y-4 order-1 lg:order-none">
                            <div className="text-center">
                              <div className="relative">
                                <Avatar className="w-24 h-24 sm:w-32 sm:h-32 ring-4 ring-gray-100">
                                  <AvatarImage
                                    src={
                                      student.userId.userAvatar ||
                                      "/placeholder.svg"
                                    }
                                    alt={`${student.userId.firstName} ${student.userId.lastName}`}
                                  />
                                  <AvatarFallback className="bg-purple-500 text-white text-lg sm:text-2xl font-semibold">
                                    {student.userId.firstName?.[0]}
                                    {student.userId.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-purple-500 rounded-full border-2 border-white"></div>
                              </div>

                              <div className="text-center mt-4 space-y-2">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                  {student.userId.firstName}{" "}
                                  {student.userId.lastName}
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600">
                                  Student
                                </p>
                                <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs sm:text-sm font-medium inline-block">
                                  {student.classId?.name || "No Class Assigned"}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Information Display */}
                          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 order-2 lg:order-none">
                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <School className="w-4 h-4" />
                                Class
                              </label>
                              <div className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 border rounded-lg text-gray-900 text-sm sm:text-base">
                                {student.classId?.name || "Not assigned"}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" />
                                Grade Level
                              </label>
                              <div className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 border rounded-lg text-gray-900 text-sm sm:text-base">
                                {student.gradeLevel || "Not specified"}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Enrollment Date
                              </label>
                              <div className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 border rounded-lg text-gray-900 text-sm sm:text-base">
                                {student.enrollmentDate
                                  ? new Date(
                                      student.enrollmentDate
                                    ).toLocaleDateString()
                                  : "Not specified"}
                              </div>
                            </div>

                            <div className="space-y-3 sm:col-span-2">
                              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Assigned Subjects
                              </label>
                              <div className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 border rounded-lg text-gray-900 text-sm sm:text-base">
                                {student.assignedSubjects &&
                                student.assignedSubjects.length > 0
                                  ? student.assignedSubjects.join(", ")
                                  : "No subjects assigned"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="attendance" className="mt-0">
                      <div className="space-y-6 sm:space-y-8">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <UserCheck className="w-5 h-5 text-orange-600" />
                          </div>
                          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                            Attendance Information
                          </h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                          {/* Profile Picture Section */}
                          <div className="flex flex-col items-center space-y-4 order-1 lg:order-none">
                            <div className="text-center">
                              <div className="relative">
                                <Avatar className="w-24 h-24 sm:w-32 sm:h-32 ring-4 ring-gray-100">
                                  <AvatarImage
                                    src={
                                      student.userId.userAvatar ||
                                      "/placeholder.svg"
                                    }
                                    alt={`${student.userId.firstName} ${student.userId.lastName}`}
                                  />
                                  <AvatarFallback className="bg-orange-500 text-white text-lg sm:text-2xl font-semibold">
                                    {student.userId.firstName?.[0]}
                                    {student.userId.lastName?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 rounded-full border-2 border-white"></div>
                              </div>

                              <div className="text-center mt-4 space-y-2">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                  {student.userId.firstName}{" "}
                                  {student.userId.lastName}
                                </h3>
                                <p className="text-sm sm:text-base text-gray-600">
                                  Student
                                </p>
                                <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs sm:text-sm font-medium inline-block">
                                  Attendance Tracking
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Information Display */}
                          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-none">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                              <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                  <UserCheck className="w-4 h-4" />
                                  Current Status
                                </label>
                                <div className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 border rounded-lg text-gray-900 text-sm sm:text-base">
                                  {student.attendance || "No attendance data"}
                                </div>
                              </div>

                              <div className="space-y-3">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  Account Status
                                </label>
                                <div className="px-3 py-3 sm:px-4 sm:py-3 bg-gray-50 border rounded-lg">
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      student.isActive
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {student.isActive ? "Active" : "Inactive"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <Card>
                              <CardContent className="p-4 sm:p-6">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
                                  Quick Stats
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                                    <div className="text-lg sm:text-2xl font-bold text-blue-600">
                                      --
                                    </div>
                                    <div className="text-xs sm:text-sm text-blue-600">
                                      Total Days
                                    </div>
                                  </div>
                                  <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                                    <div className="text-lg sm:text-2xl font-bold text-green-600">
                                      --
                                    </div>
                                    <div className="text-xs sm:text-sm text-green-600">
                                      Present Days
                                    </div>
                                  </div>
                                  <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
                                    <div className="text-lg sm:text-2xl font-bold text-red-600">
                                      --
                                    </div>
                                    <div className="text-xs sm:text-sm text-red-600">
                                      Absent Days
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
