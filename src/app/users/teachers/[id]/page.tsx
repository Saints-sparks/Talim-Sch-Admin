"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiEdit } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { teacherService, TeacherById } from "@/app/services/teacher.service";
import { Header } from "@/components/Header";
import { API_ENDPOINTS } from "@/app/lib/api/config";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";

const TeacherProfile = () => {
  const [teacher, setTeacher] = useState<TeacherById | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("personal-details");

  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const teachers = await teacherService.getTeacherById(teacherId);
        console.log(teachers, "teachers");

        if (!teachers) {
          throw new Error("Teacher not found");
        }

        // No need to manually transform the data since it should match the interface now
        setTeacher(teachers);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch teacher"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (teacherId) {
      fetchTeacher();
    }
  }, [teacherId]);

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
                {[1, 2, 3, 4, 5].map((i) => (
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
              Error Loading Teacher
            </h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => router.push("/users/teachers")}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Teachers
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-md mx-auto mt-32">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Teacher Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              The teacher you're looking for doesn't exist or has been removed.
            </p>
            <button
              onClick={() => router.push("/users/teachers")}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Teachers
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
                onClick={() => router.push("/users/teachers")}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-all duration-200 group p-2 rounded-lg hover:bg-blue-50"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
                <span className="text-sm font-medium">Teachers</span>
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
                onClick={() => router.push(`/users/teachers/${teacherId}/edit`)}
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
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-gray-50/50 border-b border-gray-100 rounded-none h-auto p-0">
                <TabsTrigger
                  value="personal-details"
                  className="flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none font-medium transition-all text-xs sm:text-sm hover:bg-white/50"
                >
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Personal Details</span>
                  <span className="sm:hidden">Personal</span>
                </TabsTrigger>
                <TabsTrigger
                  value="qualifications"
                  className="flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none font-medium transition-all text-xs sm:text-sm hover:bg-white/50"
                >
                  <GraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Qualifications</span>
                  <span className="sm:hidden">Quals</span>
                </TabsTrigger>
                <TabsTrigger
                  value="employment"
                  className="flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none font-medium transition-all text-xs sm:text-sm col-span-2 sm:col-span-1 hover:bg-white/50"
                >
                  <Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Employment</span>
                  <span className="sm:hidden">Work</span>
                </TabsTrigger>
                <TabsTrigger
                  value="assign"
                  className="flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none font-medium transition-all text-xs sm:text-sm hidden sm:flex lg:flex hover:bg-white/50"
                >
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Assignments</span>
                  <span className="sm:hidden">Assign</span>
                </TabsTrigger>
                <TabsTrigger
                  value="availability"
                  className="flex items-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none font-medium transition-all text-xs sm:text-sm hidden sm:flex lg:flex hover:bg-white/50"
                >
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Availability</span>
                  <span className="sm:hidden">Times</span>
                </TabsTrigger>
              </TabsList>

              <CardContent className="p-4 sm:p-6 lg:p-8">
                <TabsContent value="personal-details" className="mt-0">
                  <div className="space-y-6 sm:space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Personal Details
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                      {/* Profile Picture Section */}
                      <div className="flex flex-col items-center space-y-4 order-1 lg:order-1">
                        <div className="text-center">
                          <Label className="text-sm font-medium text-gray-700 mb-4 block">
                            Profile Picture
                          </Label>
                          <div className="relative">
                            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg mx-auto">
                              <span className="text-xl sm:text-3xl font-bold text-white">
                                {teacher.userId.firstName[0]}
                                {teacher.userId.lastName[0]}
                              </span>
                            </div>
                            <div className="absolute -bottom-2 -right-2">
                              {teacher.userId.isActive ? (
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                                </div>
                              ) : (
                                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-400 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                              {teacher.userId.firstName}{" "}
                              {teacher.userId.lastName}
                            </h3>
                            {teacher.isFormTeacher && (
                              <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-emerald-100 text-emerald-800 text-xs sm:text-sm rounded-full font-medium">
                                <Badge className="w-3 h-3" />
                                Form Teacher
                              </span>
                            )}
                            <div className="flex items-center justify-center gap-1">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  teacher.userId.isActive
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }`}
                              ></span>
                              <span
                                className={`text-xs font-medium ${
                                  teacher.userId.isActive
                                    ? "text-green-700"
                                    : "text-gray-500"
                                }`}
                              >
                                {teacher.userId.isActive
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Information Display */}
                      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 order-2 lg:order-2">
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <User className="w-4 h-4" />
                            First Name
                          </Label>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors">
                            <span className="text-gray-900 font-medium">
                              {teacher.userId.firstName}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <User className="w-4 h-4" />
                            Last Name
                          </Label>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors">
                            <span className="text-gray-900 font-medium">
                              {teacher.userId.lastName}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Phone className="w-4 h-4" />
                            Phone Number
                          </Label>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors">
                            <span className="text-gray-900 font-medium">
                              {teacher.userId.phoneNumber}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Mail className="w-4 h-4" />
                            Email Address
                          </Label>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors">
                            <span className="text-gray-900 font-medium">
                              {teacher.userId.email}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Badge className="w-4 h-4" />
                            Account Status
                          </Label>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                                teacher.userId.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  teacher.userId.isActive
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              ></span>
                              {teacher.userId.isActive
                                ? "Active Account"
                                : "Inactive Account"}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <MapPin className="w-4 h-4" />
                            User ID
                          </Label>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors">
                            <span className="text-gray-600 text-sm font-mono">
                              {teacher.userId._id}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="qualifications" className="mt-0">
                  <div className="space-y-6 sm:space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Qualifications & Experience
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                      {/* Profile Picture Section */}
                      <div className="flex flex-col items-center space-y-4 order-1 lg:order-1">
                        <div className="text-center">
                          <Label className="text-sm font-medium text-gray-700 mb-4 block">
                            Academic Profile
                          </Label>
                          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg mx-auto">
                            <GraduationCap className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                          </div>
                          <div className="text-center space-y-1">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                              {teacher.specialization}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Specialization
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Information Display */}
                      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 order-2 lg:order-2">
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Award className="w-4 h-4" />
                            Highest Qualification
                          </Label>
                          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg px-4 py-4">
                            <span className="text-emerald-900 font-semibold text-sm sm:text-base">
                              {teacher.highestAcademicQualification}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Clock className="w-4 h-4" />
                            Teaching Experience
                          </Label>
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg px-4 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xl sm:text-2xl font-bold text-blue-700">
                                {teacher.yearsOfExperience}
                              </span>
                              <span className="text-blue-600 font-medium text-sm sm:text-base">
                                years
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-2 space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <BookOpen className="w-4 h-4" />
                            Subject Expertise
                          </Label>
                          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-200 rounded-lg">
                                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-700" />
                              </div>
                              <div>
                                <span className="text-purple-900 font-semibold text-sm sm:text-lg">
                                  {teacher.specialization}
                                </span>
                                <p className="text-purple-700 text-xs sm:text-sm">
                                  Primary teaching subject
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="employment" className="mt-0">
                  <div className="space-y-6 sm:space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Employment Details
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                      {/* Profile Picture Section */}
                      <div className="flex flex-col items-center space-y-4 order-1 lg:order-1">
                        <div className="text-center">
                          <Label className="text-sm font-medium text-gray-700 mb-4 block">
                            Employment Status
                          </Label>
                          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mb-4 shadow-lg mx-auto">
                            <Briefcase className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                          </div>
                          <div className="text-center space-y-2">
                            <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-amber-100 text-amber-800 text-xs sm:text-sm rounded-full font-medium">
                              <Briefcase className="w-3 h-3" />
                              {teacher.employmentType}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Information Display */}
                      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 order-2 lg:order-2">
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Clock className="w-4 h-4" />
                            Employment Type
                          </Label>
                          <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-amber-200 rounded-lg">
                                <Clock className="w-4 h-4 text-amber-700" />
                              </div>
                              <div>
                                <span className="text-amber-900 font-semibold text-sm sm:text-base">
                                  {teacher.employmentType}
                                </span>
                                <p className="text-amber-700 text-xs sm:text-sm">
                                  Work schedule
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Badge className="w-4 h-4" />
                            Employment Role
                          </Label>
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-200 rounded-lg">
                                <Badge className="w-4 h-4 text-blue-700" />
                              </div>
                              <div>
                                <span className="text-blue-900 font-semibold">
                                  {teacher.employmentRole}
                                </span>
                                <p className="text-blue-700 text-sm">
                                  Position type
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="assign" className="mt-0">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Class and Subject Assignments
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Profile Picture Section */}
                      <div className="flex flex-col items-center space-y-4">
                        <div className="text-center">
                          <Label className="text-sm font-medium text-gray-700 mb-4 block">
                            Teaching Overview
                          </Label>
                          <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <BookOpen className="w-12 h-12 text-white" />
                          </div>
                          <div className="space-y-3">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">
                                Form Teacher Status
                              </Label>
                              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                                <span
                                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                                    teacher.isFormTeacher
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  <Badge className="w-3 h-3" />
                                  {teacher.isFormTeacher
                                    ? "Form Teacher"
                                    : "Subject Teacher"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Information Display */}
                      <div className="lg:col-span-2 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Users className="w-5 h-5 text-indigo-600" />
                              <h3 className="text-lg font-semibold text-gray-900">
                                Assigned Classes
                              </h3>
                            </div>
                            <div className="space-y-3">
                              {/* Regular assigned classes */}
                              {teacher.assignedClasses &&
                                teacher.assignedClasses.length > 0 && (
                                  <>
                                    {teacher.assignedClasses.map(
                                      (classObj, index) => (
                                        <div
                                          key={`assigned-${index}`}
                                          className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all"
                                        >
                                          <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-2">
                                                <Users className="w-4 h-4 text-blue-600" />
                                                <span className="font-semibold text-blue-900">
                                                  {classObj.name}
                                                </span>
                                              </div>
                                              <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-blue-700">
                                                  <User className="w-3 h-3" />
                                                  <span>
                                                    Capacity:{" "}
                                                    {classObj.classCapacity}{" "}
                                                    students
                                                  </span>
                                                </div>
                                                {classObj.classDescription && (
                                                  <p className="text-sm text-blue-600">
                                                    {classObj.classDescription}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                            <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                                              Subject Teacher
                                            </span>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </>
                                )}

                              {/* Form teacher classes */}
                              {teacher.classTeacherClasses &&
                                teacher.classTeacherClasses.length > 0 && (
                                  <>
                                    {teacher.classTeacherClasses.map(
                                      (classObj, index) => (
                                        <div
                                          key={`form-teacher-${index}`}
                                          className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg p-4 hover:shadow-md transition-all"
                                        >
                                          <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2 mb-2">
                                                <Badge className="w-4 h-4 text-emerald-600" />
                                                <span className="font-semibold text-emerald-900">
                                                  {classObj.name}
                                                </span>
                                              </div>
                                              <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-emerald-700">
                                                  <User className="w-3 h-3" />
                                                  <span>
                                                    Capacity:{" "}
                                                    {classObj.classCapacity}{" "}
                                                    students
                                                  </span>
                                                </div>
                                                {classObj.classDescription && (
                                                  <p className="text-sm text-emerald-600">
                                                    {classObj.classDescription}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                            <span className="bg-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                                              Form Teacher
                                            </span>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </>
                                )}

                              {/* Show message if no classes assigned */}
                              {(!teacher.assignedClasses ||
                                teacher.assignedClasses.length === 0) &&
                                (!teacher.classTeacherClasses ||
                                  teacher.classTeacherClasses.length === 0) && (
                                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <span className="text-gray-500 italic">
                                      No classes assigned
                                    </span>
                                  </div>
                                )}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-purple-600" />
                              <h3 className="text-lg font-semibold text-gray-900">
                                Assigned Courses
                              </h3>
                            </div>
                            <div className="space-y-3">
                              {teacher.assignedCourses &&
                              teacher.assignedCourses.length > 0 ? (
                                teacher.assignedCourses.map((course, index) => {
                                  // Find the class name from both assigned classes and form teacher classes
                                  let assignedClass =
                                    teacher.assignedClasses?.find(
                                      (cls) => cls._id === course.classId
                                    );
                                  if (!assignedClass) {
                                    assignedClass =
                                      teacher.classTeacherClasses?.find(
                                        (cls) => cls._id === course.classId
                                      );
                                  }
                                  const className = assignedClass
                                    ? assignedClass.name
                                    : course.classId;

                                  return (
                                    <div
                                      key={index}
                                      className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-all"
                                    >
                                      <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                          <div className="flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-purple-600" />
                                            <span className="font-semibold text-purple-900">
                                              {course.title}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          <div className="flex items-center gap-2 text-sm">
                                            <Badge className="w-3 h-3 text-purple-600" />
                                            <span className="text-purple-700 font-medium">
                                              Code: {course.courseCode}
                                            </span>
                                          </div>
                                          {course.description && (
                                            <p className="text-sm text-purple-600 bg-purple-50 rounded px-2 py-1">
                                              {course.description}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-2 text-sm">
                                            <Users className="w-3 h-3 text-purple-600" />
                                            <span className="text-purple-700">
                                              Class: {className}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                                  <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                  <span className="text-gray-500 italic">
                                    No courses assigned
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="availability" className="mt-0">
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <Clock className="w-5 h-5 text-teal-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Teacher Availability
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Profile Picture Section */}
                      <div className="flex flex-col items-center space-y-4">
                        <div className="text-center">
                          <Label className="text-sm font-medium text-gray-700 mb-4 block">
                            Schedule Overview
                          </Label>
                          <div className="w-32 h-32 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <Clock className="w-12 h-12 text-white" />
                          </div>
                          <div className="text-center space-y-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Work Schedule
                            </h3>
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="w-4 h-4 text-teal-600" />
                              <span className="text-sm text-gray-600">
                                Teaching Hours
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Information Display */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-4">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <CalendarIcon className="w-4 h-4" />
                            Available Days
                          </Label>
                          <div className="bg-gradient-to-r from-teal-50 to-teal-100 border border-teal-200 rounded-lg p-6">
                            {teacher.availabilityDays &&
                            teacher.availabilityDays.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {teacher.availabilityDays.map((day, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-200 text-teal-800 rounded-full text-sm font-medium"
                                  >
                                    <CalendarIcon className="w-3 h-3" />
                                    {day}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <CalendarIcon className="w-8 h-8 text-teal-400 mx-auto mb-2" />
                                <span className="text-teal-600 italic">
                                  No specific days specified
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Clock className="w-4 h-4" />
                            Available Time
                          </Label>
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                            {teacher.availableTime ? (
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-200 rounded-lg">
                                  <Clock className="w-6 h-6 text-blue-700" />
                                </div>
                                <div>
                                  <span className="text-blue-900 font-semibold text-lg">
                                    {teacher.availableTime}
                                  </span>
                                  <p className="text-blue-700 text-sm">
                                    Working hours
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                                <span className="text-blue-600 italic">
                                  No specific time specified
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
