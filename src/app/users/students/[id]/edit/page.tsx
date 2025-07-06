'use client';

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
  Users,
  GraduationCap,
  Mail,
  Phone,
  Badge,
  Calendar as CalendarIcon,
  Save,
  UserCheck,
  School,
} from "lucide-react";
import { studentService } from '@/app/services/student.service';
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StudentData {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth?: string;
    gender?: string;
    userAvatar?: string;
    role?: string;
  };
  parentContact?: {
    fullName: string;
    phoneNumber: string;
    email: string;
    relationship: string;
  };
  classId?: {
    _id: string;
    name: string;
    classCapacity?: number;
    classDescription?: string;
  };
  isActive: boolean;
  enrollmentDate?: string;
  assignedSubjects?: string[];
  attendance?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  gender: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  relationship: string;
}

export default function StudentEditProfile() {
  const router = useRouter();
  const params = useParams();
  const studentId = Array.isArray(params.id) ? params.id[0] : params.id || "";

  const [activeTab, setActiveTab] = useState("personal-details");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingPersonal, setIsSubmittingPersonal] = useState(false);
  const [isSubmittingParent, setIsSubmittingParent] = useState(false);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };
  
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    parentName: "",
    parentPhone: "",
    parentEmail: "",
    relationship: "",
  });

  const fetchStudentData = async () => {
    try {
      if (!studentId) {
        throw new Error("Student ID is required");
      }

      const data: StudentData = await studentService.getStudentById(studentId);
      setStudent(data);
      setFormData({
        firstName: data.userId.firstName || "",
        lastName: data.userId.lastName || "",
        email: data.userId.email || "",
        phoneNumber: data.userId.phoneNumber || "",
        dateOfBirth: data.userId.dateOfBirth || "",
        gender: data.userId.gender || "",
        parentName: data.parentContact?.fullName || "",
        parentPhone: data.parentContact?.phoneNumber || "",
        parentEmail: data.parentContact?.email || "",
        relationship: data.parentContact?.relationship || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch student');
      router.push('/users/students');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      await fetchStudentData();
      setIsLoading(false);
    };

    if (studentId) {
      loadData();
    }
  }, [studentId, router]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit handlers for each tab
  const handleSubmitPersonal = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmittingPersonal(true);

    try {
      if (!studentId || !student) {
        throw new Error("Student data is missing");
      }

      const userId = student.userId._id;
      const personalData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
      };

      // Update student personal details - you'll need to implement this API call
      // For now, using a placeholder API structure
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://talimbe-v2-li38.onrender.com/users/${userId}`,
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
      // Refresh student data
      await fetchStudentData();
    } catch (error: any) {
      console.error("Error updating personal details:", error);
      toast.error(error.message || "Failed to update personal details");
    } finally {
      setIsSubmittingPersonal(false);
    }
  };

  const handleSubmitParent = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmittingParent(true);

    try {
      if (!studentId || !student) {
        throw new Error("Student data is missing");
      }

      const parentData = {
        parentContact: {
          fullName: formData.parentName,
          phoneNumber: formData.parentPhone,
          email: formData.parentEmail,
          relationship: formData.relationship,
        }
      };

      // Update parent contact details - you'll need to implement this API call
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://talimbe-v2-li38.onrender.com/students/${studentId}/parent-contact`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(parentData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update parent details");
      }

      toast.success("Parent/Guardian details updated successfully!");
      // Refresh student data
      await fetchStudentData();
    } catch (error: any) {
      console.error("Error updating parent details:", error);
      toast.error(error.message || "Failed to update parent details");
    } finally {
      setIsSubmittingParent(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (window.confirm("Are you sure you want to deactivate this student?")) {
      try {
        // Implement deactivate student API call
        const token = localStorage.getItem("accessToken");
        const response = await fetch(
          `https://talimbe-v2-li38.onrender.com/students/${studentId}/deactivate`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to deactivate student");
        }

        toast.success("Student deactivated successfully!");
        router.push("/users/students");
      } catch (error: any) {
        console.error("Error deactivating student:", error);
        toast.error(error.message || "Failed to deactivate student");
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
                {[1, 2, 3].map((i) => (
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Student</h3>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/users/students')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
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
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Not Found</h3>
            <p className="text-gray-600 mb-6">The student you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => router.push('/users/students')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Students
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gray-50"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Header - matching view page */}
      <motion.div 
        className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                placeholder="Search students, classes, subjects..."
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
      </motion.div>

      {/* Navigation - matching view page */}
      <motion.div 
        className="bg-white px-6 py-4 border-b border-gray-100"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/users/students')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Students</span>
            </button>
            <div className="text-gray-300">|</div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Edit Student Profile</span>
            </div>
          </div>
          <button 
            onClick={() => router.push(`/users/students/${studentId}/view`)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-sm font-medium"
          >
            <User className="w-4 h-4" /> 
            View Profile
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="p-6"
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        <motion.div 
          className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-50 border-b border-gray-200 rounded-none h-auto p-0">
              <TabsTrigger
                value="personal-details"
                className="flex items-center gap-2 py-4 px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none font-medium transition-all"
              >
                <User className="w-4 h-4" />
                Personal Details
              </TabsTrigger>
              <TabsTrigger
                value="parent-guardian"
                className="flex items-center gap-2 py-4 px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none font-medium transition-all"
              >
                <Users className="w-4 h-4" />
                Parent/Guardian
              </TabsTrigger>
            </TabsList>

            <CardContent className="p-8">
              <AnimatePresence mode="wait">
                <TabsContent value="personal-details" className="mt-0">
                  <motion.form 
                    onSubmit={handleSubmitPersonal}
                    key="personal-details"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                  >
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
                              {student.userId.userAvatar ? (
                                <img
                                  src={student.userId.userAvatar}
                                  alt="Profile"
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-3xl font-bold text-white">
                                  {student.userId.firstName[0]}{student.userId.lastName[0]}
                                </span>
                              )}
                            </div>
                            <div className="absolute -bottom-2 -right-2">
                              {student.isActive ? (
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
                              {student.userId.firstName} {student.userId.lastName}
                            </h3>
                            <div className="flex items-center justify-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${student.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                              <span className={`text-xs font-medium ${student.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                                {student.isActive ? 'Active' : 'Inactive'}
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
                            <CalendarIcon className="w-4 h-4" />
                            Date of Birth
                          </Label>
                          <Input
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                            type="date"
                            className="bg-gray-50 border-gray-200 rounded-lg px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <UserCheck className="w-4 h-4" />
                            Gender
                          </Label>
                          <Select
                            value={formData.gender}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                gender: value,
                              }))
                            }
                          >
                            <SelectTrigger className="bg-gray-50 border-gray-200 rounded-lg px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Badge className="w-4 h-4" />
                            Account Status
                          </Label>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                              student.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${student.isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              {student.isActive ? 'Active Account' : 'Inactive Account'}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Badge className="w-4 h-4" />
                            Student ID
                          </Label>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                            <span className="text-gray-600 text-sm font-mono">{student._id}</span>
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
                        onClick={handleRemoveStudent}
                      >
                        Remove Student
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
                </motion.form>
              </TabsContent>

              <TabsContent value="parent-guardian" className="mt-0">
                <motion.form 
                  onSubmit={handleSubmitParent}
                  key="parent-guardian"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-8">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Users className="w-5 h-5 text-emerald-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Parent/Guardian Information</h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Profile Picture Section */}
                      <div className="flex flex-col items-center space-y-4">
                        <div className="text-center">
                          <Label className="text-sm font-medium text-gray-700 mb-4 block">
                            Guardian Profile
                          </Label>
                          <div className="w-32 h-32 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <Users className="w-12 h-12 text-white" />
                          </div>
                          <div className="text-center space-y-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {student.parentContact?.fullName || 'Guardian Information'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {student.parentContact?.relationship || 'Guardian'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <User className="w-4 h-4" />
                            Full Name
                          </Label>
                          <Input
                            name="parentName"
                            value={formData.parentName}
                            onChange={handleChange}
                            placeholder="Enter parent/guardian name"
                            className="bg-gray-50 border-gray-200 rounded-lg px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <UserCheck className="w-4 h-4" />
                            Relationship
                          </Label>
                          <Select
                            value={formData.relationship}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                relationship: value,
                              }))
                            }
                          >
                            <SelectTrigger className="bg-gray-50 border-gray-200 rounded-lg px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Father">Father</SelectItem>
                              <SelectItem value="Mother">Mother</SelectItem>
                              <SelectItem value="Guardian">Guardian</SelectItem>
                              <SelectItem value="Grandfather">Grandfather</SelectItem>
                              <SelectItem value="Grandmother">Grandmother</SelectItem>
                              <SelectItem value="Uncle">Uncle</SelectItem>
                              <SelectItem value="Aunt">Aunt</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Phone className="w-4 h-4" />
                            Phone Number
                          </Label>
                          <Input
                            name="parentPhone"
                            value={formData.parentPhone}
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
                            name="parentEmail"
                            value={formData.parentEmail}
                            onChange={handleChange}
                            placeholder="e.g parent@gmail.com"
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
                        onClick={handleRemoveStudent}
                      >
                        Remove Student
                      </Button>
                      <Button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 px-8 flex items-center gap-2"
                        disabled={isSubmittingParent}
                      >
                        {isSubmittingParent ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Update Parent Details
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.form>
              </TabsContent>
              </AnimatePresence>
            </CardContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
