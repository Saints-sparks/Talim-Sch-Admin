"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  ChevronLeft,
  Search,
  Bell,
  User,
  BookOpen,
  GraduationCap,
  Briefcase,
  Clock,
  Award,
  Mail,
  Phone,
  Badge,
  Calendar as CalendarIcon,
  Save,
} from "lucide-react";
import {
  teacherService,
  type TeacherById,
} from "@/app/services/teacher.service";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/app/lib/api/config";
import { Loader2 } from "lucide-react";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  specialization: string;
  employmentType: string;
  employmentRole: string;
  highestAcademicQualification: string;
  yearsOfExperience: string;
  availabilityDays: string[];
  availableTime: string;
  isFormTeacher: boolean;
  schoolId: string;
}

export default function TeacherEditProfile() {
  const router = useRouter();
  const params = useParams();
  const teacherId = Array.isArray(params.id) ? params.id[0] : params.id || "";

  const [activeTab, setActiveTab] = useState("personal-details");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingPersonal, setIsSubmittingPersonal] = useState(false);
  const [isSubmittingQualifications, setIsSubmittingQualifications] = useState(false);
  const [isSubmittingEmployment, setIsSubmittingEmployment] = useState(false);
  const [isSubmittingAvailability, setIsSubmittingAvailability] = useState(false);
  const [teacher, setTeacher] = useState<TeacherById | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    specialization: "",
    employmentType: "",
    employmentRole: "",
    highestAcademicQualification: "",
    yearsOfExperience: "",
    availabilityDays: [],
    availableTime: "",
    isFormTeacher: false,
    schoolId: "",
  });

  const fetchTeacherData = async () => {
    try {
      if (!teacherId) {
        throw new Error("Teacher ID is required");
      }

      const data: TeacherById = await teacherService.getTeacherById(teacherId);
      setTeacher(data);
      setFormData({
        firstName: data.userId.firstName || "",
        lastName: data.userId.lastName || "",
        email: data.userId.email || "",
        phoneNumber: data.userId.phoneNumber || "",
        specialization: data.specialization || "",
        employmentType: data.employmentType || "",
        employmentRole: data.employmentRole || "",
        highestAcademicQualification: data.highestAcademicQualification || "",
        yearsOfExperience: data.yearsOfExperience?.toString() || "",
        availabilityDays: data.availabilityDays || [],
        availableTime: data.availableTime || "",
        isFormTeacher: data.isFormTeacher || false,
        schoolId: data.userId.schoolId || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teacher');
      router.push('/users/teachers');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      await fetchTeacherData();
      setIsLoading(false);
    };

    if (teacherId) {
      loadData();
    }
  }, [teacherId, router]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleAvailabilityDaysChange = (day: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      availabilityDays: checked
        ? [...prev.availabilityDays, day]
        : prev.availabilityDays.filter((d) => d !== day),
    }));
  };

  // Submit handlers for each tab
  const handleSubmitPersonal = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmittingPersonal(true);

    try {
      if (!teacherId || !teacher) {
        throw new Error("Teacher data is missing");
      }

      const userId = teacher.userId._id;
      const personalData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
      };

      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${API_ENDPOINTS.BASE_URL}/users/${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(personalData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update personal details");
      }

      toast.success("Personal details updated successfully!");
      // Refresh teacher data
      await fetchTeacherData();
    } catch (error: any) {
      console.error("Error updating personal details:", error);
      toast.error(error.message || "Failed to update personal details");
    } finally {
      setIsSubmittingPersonal(false);
    }
  };

  const handleSubmitQualifications = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmittingQualifications(true);

    try {
      if (!teacherId || !teacher) {
        throw new Error("Teacher data is missing");
      }

      const userId = teacher.userId._id;
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${API_ENDPOINTS.BASE_URL}/teachers/${userId}/qualification-details`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            specialization: formData.specialization,
            highestAcademicQualification: formData.highestAcademicQualification,
            yearsOfExperience: Number.parseInt(formData.yearsOfExperience) || 0,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update qualifications");
      }

      toast.success("Qualifications updated successfully!");
      // Refresh teacher data
      await fetchTeacherData();
    } catch (error: any) {
      console.error("Error updating qualifications:", error);
      toast.error(error.message || "Failed to update qualifications");
    } finally {
      setIsSubmittingQualifications(false);
    }
  };

  const handleSubmitEmployment = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmittingEmployment(true);

    try {
      if (!teacherId || !teacher) {
        throw new Error("Teacher data is missing");
      }

      const userId = teacher.userId._id;
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${API_ENDPOINTS.BASE_URL}/teachers/${userId}/employment`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            employmentType: formData.employmentType,
            employmentRole: formData.employmentRole,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update employment details"
        );
      }

      toast.success("Employment details updated successfully!");
      // Refresh teacher data
      await fetchTeacherData();
    } catch (error: any) {
      console.error("Error updating employment details:", error);
      toast.error(error.message || "Failed to update employment details");
    } finally {
      setIsSubmittingEmployment(false);
    }
  };

  const handleSubmitAvailability = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmittingAvailability(true);

    try {
      if (!teacherId || !teacher) {
        throw new Error("Teacher data is missing");
      }

      const userId = teacher.userId._id;
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${API_ENDPOINTS.BASE_URL}/teachers/${userId}/availability`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            availabilityDays: formData.availabilityDays,
            availableTime: formData.availableTime,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update availability");
      }

      toast.success("Availability updated successfully!");
      // Refresh teacher data
      await fetchTeacherData();
    } catch (error: any) {
      console.error("Error updating availability:", error);
      toast.error(error.message || "Failed to update availability");
    } finally {
      setIsSubmittingAvailability(false);
    }
  };

  const handleRemoveUser = async () => {
    if (window.confirm("Are you sure you want to deactivate this teacher?")) {
      try {
        await teacherService.deactivateTeacher(teacherId);
        toast.success("Teacher deactivated successfully!");
        router.push("/users/teachers");
      } catch (error: any) {
        console.error("Error deactivating teacher:", error);
        toast.error(error.message || "Failed to deactivate teacher");
      }
    }
  };

  // Skeleton Loading Component - matching the view page
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
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
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
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.963-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Teacher</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/users/teachers')}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Teacher Not Found</h3>
            <p className="text-gray-600 mb-6">The teacher you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => router.push('/users/teachers')}
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
    <div className="min-h-screen bg-gray-50">
      {/* Header - matching view page */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                placeholder="Search teachers, classes, subjects..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <CalendarIcon className="w-4 h-4" />
              <span className="text-sm font-medium">July 6, 2025</span>
            </div>
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <Avatar className="w-8 h-8 ring-2 ring-gray-200">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback className="bg-blue-500 text-white text-sm font-semibold">AD</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Navigation - matching view page */}
      <div className="bg-white px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/users/teachers')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Teachers</span>
            </button>
            <div className="text-gray-300">|</div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Edit Teacher Profile</span>
            </div>
          </div>
          <button 
            onClick={() => router.push(`/users/teachers/${teacherId}`)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm font-medium"
          >
            <User className="w-4 h-4" /> 
            View Profile
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
            <TabsList className="grid w-full grid-cols-4 bg-gray-50 border-b border-gray-200 rounded-none h-auto p-0">
              <TabsTrigger
                value="personal-details"
                className="flex items-center gap-2 py-4 px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none font-medium transition-all"
              >
                <User className="w-4 h-4" />
                Personal Details
              </TabsTrigger>
              <TabsTrigger
                value="qualifications"
                className="flex items-center gap-2 py-4 px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none font-medium transition-all"
              >
                <GraduationCap className="w-4 h-4" />
                Qualifications
              </TabsTrigger>
              <TabsTrigger
                value="employment"
                className="flex items-center gap-2 py-4 px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none font-medium transition-all"
              >
                <Briefcase className="w-4 h-4" />
                Employment
              </TabsTrigger>
              <TabsTrigger
                value="availability"
                className="flex items-center gap-2 py-4 px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none font-medium transition-all"
              >
                <Clock className="w-4 h-4" />
                Availability
              </TabsTrigger>
            </TabsList>

            <CardContent className="p-8">
              <TabsContent value="personal-details" className="mt-0">
                <form onSubmit={handleSubmitPersonal}>
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Personal Details</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Profile Picture Section */}
                      <div className="flex flex-col items-center space-y-4">
                        <div className="text-center">
                          <Label className="text-sm font-medium text-gray-700 mb-4 block">
                            Profile Picture
                          </Label>
                          <div className="relative">
                            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                              <span className="text-3xl font-bold text-white">
                                {teacher.userId.firstName[0]}{teacher.userId.lastName[0]}
                              </span>
                            </div>
                            <div className="absolute -bottom-2 -right-2">
                              {teacher.userId.isActive ? (
                                <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                              ) : (
                                <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white"></div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {teacher.userId.firstName} {teacher.userId.lastName}
                            </h3>
                            {teacher.isFormTeacher && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full font-medium">
                                <Badge className="w-3 h-3" />
                                Form Teacher
                              </span>
                            )}
                            <div className="flex items-center justify-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${teacher.userId.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                              <span className={`text-xs font-medium ${teacher.userId.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                                {teacher.userId.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <User className="w-4 h-4" />
                            First Name
                          </Label>
                          <Input
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="Enter first name"
                            className="bg-gray-50 border-gray-200 rounded-lg px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <User className="w-4 h-4" />
                            Last Name
                          </Label>
                          <Input
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Enter last name"
                            className="bg-gray-50 border-gray-200 rounded-lg px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Phone className="w-4 h-4" />
                            Phone Number
                          </Label>
                          <Input
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="e.g +234829xxxxx"
                            className="bg-gray-50 border-gray-200 rounded-lg px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Mail className="w-4 h-4" />
                            Email Address
                          </Label>
                          <Input
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="e.g 123@gmail.com"
                            className="bg-gray-50 border-gray-200 rounded-lg px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Badge className="w-4 h-4" />
                            Account Status
                          </Label>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                              teacher.userId.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${teacher.userId.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              {teacher.userId.isActive ? 'Active Account' : 'Inactive Account'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Badge className="w-4 h-4" />
                            Teacher ID
                          </Label>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                            <span className="text-gray-600 text-sm font-mono">{teacher.userId._id}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-6 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={handleRemoveUser}
                      >
                        Remove User
                      </Button>
                      <Button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 px-8 flex items-center gap-2"
                        disabled={isSubmittingPersonal}
                      >
                        {isSubmittingPersonal ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Update Personal Details
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="qualifications" className="mt-0">
                <form onSubmit={handleSubmitQualifications}>
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <GraduationCap className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Qualifications & Experience</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Profile Picture Section */}
                      <div className="flex flex-col items-center space-y-4">
                        <div className="text-center">
                          <Label className="text-sm font-medium text-gray-700 mb-4 block">
                            Academic Profile
                          </Label>
                          <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <GraduationCap className="w-12 h-12 text-white" />
                          </div>
                          <div className="text-center space-y-1">
                            <h3 className="text-lg font-semibold text-gray-900">{teacher.specialization || 'Specialization'}</h3>
                            <p className="text-sm text-gray-600">Subject Expertise</p>
                          </div>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Award className="w-4 h-4" />
                            Highest Qualification
                          </Label>
                          <Select
                            value={formData.highestAcademicQualification}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                highestAcademicQualification: value,
                              }))
                            }
                          >
                            <SelectTrigger className="bg-gray-50 border-gray-200 rounded-lg px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                              <SelectValue placeholder="Select qualification" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                              <SelectItem value="Graduate">Graduate</SelectItem>
                              <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                              <SelectItem value="Doctorate">Doctorate</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Clock className="w-4 h-4" />
                            Teaching Experience
                          </Label>
                          <Input
                            name="yearsOfExperience"
                            value={formData.yearsOfExperience}
                            onChange={handleChange}
                            type="number"
                            placeholder="Enter years"
                            className="bg-gray-50 border-gray-200 rounded-lg px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <BookOpen className="w-4 h-4" />
                            Subject Expertise
                          </Label>
                          <Input
                            name="specialization"
                            value={formData.specialization}
                            onChange={handleChange}
                            placeholder="e.g Mathematics, English, Science"
                            className="bg-gray-50 border-gray-200 rounded-lg px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-6 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={handleRemoveUser}
                      >
                        Remove User
                      </Button>
                      <Button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 px-8 flex items-center gap-2"
                        disabled={isSubmittingQualifications}
                      >
                        {isSubmittingQualifications ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Update Qualifications
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="employment" className="mt-0">
                <form onSubmit={handleSubmitEmployment}>
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <Briefcase className="w-5 h-5 text-amber-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Employment Details</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Profile Picture Section */}
                      <div className="flex flex-col items-center space-y-4">
                        <div className="text-center">
                          <Label className="text-sm font-medium text-gray-700 mb-4 block">
                            Employment Status
                          </Label>
                          <div className="w-32 h-32 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <Briefcase className="w-12 h-12 text-white" />
                          </div>
                          <div className="text-center space-y-2">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 text-sm rounded-full font-medium">
                              <Briefcase className="w-3 h-3" />
                              {teacher.employmentType || 'Employment Type'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Clock className="w-4 h-4" />
                            Employment Type
                          </Label>
                          <Select
                            value={formData.employmentType}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                employmentType: value,
                              }))
                            }
                          >
                            <SelectTrigger className="bg-gray-50 border-gray-200 rounded-lg px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Fulltime">Full-time</SelectItem>
                              <SelectItem value="Parttime">Part-time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Badge className="w-4 h-4" />
                            Employment Role
                          </Label>
                          <Select
                            value={formData.employmentRole}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                employmentRole: value,
                              }))
                            }
                          >
                            <SelectTrigger className="bg-gray-50 border-gray-200 rounded-lg px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Academic">Academic Staff</SelectItem>
                              <SelectItem value="NonAcademic">Non-Academic Staff</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-6 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={handleRemoveUser}
                      >
                        Remove User
                      </Button>
                      <Button
                        type="submit"
                        className="bg-amber-600 hover:bg-amber-700 px-8 flex items-center gap-2"
                        disabled={isSubmittingEmployment}
                      >
                        {isSubmittingEmployment ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Update Employment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="availability" className="mt-0">
                <form onSubmit={handleSubmitAvailability}>
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <Clock className="w-5 h-5 text-teal-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Teacher Availability</h2>
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
                            <h3 className="text-lg font-semibold text-gray-900">Work Schedule</h3>
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="w-4 h-4 text-teal-600" />
                              <span className="text-sm text-gray-600">Teaching Hours</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-4">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <CalendarIcon className="w-4 h-4" />
                            Available Days
                          </Label>
                          <div className="space-y-3">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                              <div key={day} className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  id={day}
                                  checked={formData.availabilityDays.includes(day)}
                                  onChange={(e) => handleAvailabilityDaysChange(day, e.target.checked)}
                                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                                />
                                <Label htmlFor={day} className="text-sm font-medium text-gray-700">
                                  {day}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Clock className="w-4 h-4" />
                            Available Time
                          </Label>
                          <Input
                            name="availableTime"
                            value={formData.availableTime}
                            onChange={handleChange}
                            placeholder="e.g. 08:00 AM - 03:00 PM"
                            className="bg-gray-50 border-gray-200 rounded-lg px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between pt-6 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={handleRemoveUser}
                      >
                        Remove User
                      </Button>
                      <Button
                        type="submit"
                        className="bg-teal-600 hover:bg-teal-700 px-8 flex items-center gap-2"
                        disabled={isSubmittingAvailability}
                      >
                        {isSubmittingAvailability ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Update Availability
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}