'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiEdit } from 'react-icons/fi';
import { studentService } from '@/app/services/student.service';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  Search,
  Bell,
  User,
  BookOpen,
  Users,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Badge,
  Calendar as CalendarIcon,
  UserCheck,
  School,
  Clock,
} from "lucide-react";

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

const StudentProfile = () => {
  const [student, setStudent] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("personal-details");
  
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

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

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const studentData = await studentService.getStudentById(studentId);
        console.log(studentData, "student data");

        if (!studentData) {
          throw new Error('Student not found');
        }

        setStudent(studentData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch student');
      } finally {
        setIsLoading(false);
      }
    };

    if (studentId) {
      fetchStudent();
    }
  }, [studentId]);

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
      {/* Header */}
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

      {/* Navigation */}
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
              <span className="text-sm text-gray-600">Student Profile</span>
            </div>
          </div>
          <button 
            onClick={() => router.push(`/users/students/${studentId}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
          >
            <FiEdit className="w-4 h-4" /> 
            Edit Student
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
            <TabsList className="grid w-full grid-cols-3 bg-gray-50 border-b border-gray-200 rounded-none h-auto p-0">
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
              <TabsTrigger
                value="academic"
                className="flex items-center gap-2 py-4 px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none font-medium transition-all"
              >
                <GraduationCap className="w-4 h-4" />
                Academic Information
              </TabsTrigger>
            </TabsList>

            <CardContent className="p-8">
              <AnimatePresence mode="wait">
                <TabsContent value="personal-details" className="mt-0">
                  <motion.div
                    key="personal-details"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
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

                    {/* Information Display */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <User className="w-4 h-4" />
                          First Name
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors">
                          <span className="text-gray-900 font-medium">{student.userId.firstName}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <User className="w-4 h-4" />
                          Last Name
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors">
                          <span className="text-gray-900 font-medium">{student.userId.lastName}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Phone className="w-4 h-4" />
                          Phone Number
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors">
                          <span className="text-gray-900 font-medium">{student.userId.phoneNumber || 'Not specified'}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Mail className="w-4 h-4" />
                          Email Address
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors">
                          <span className="text-gray-900 font-medium">{student.userId.email}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <CalendarIcon className="w-4 h-4" />
                          Date of Birth
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors">
                          <span className="text-gray-900 font-medium">{student.userId.dateOfBirth || 'Not specified'}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <UserCheck className="w-4 h-4" />
                          Gender
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors">
                          <span className="text-gray-900 font-medium">{student.userId.gender || 'Not specified'}</span>
                        </div>
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
                        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors">
                          <span className="text-gray-600 text-sm font-mono">{student._id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                </TabsContent>

                <TabsContent value="parent-guardian" className="mt-0">
                  <motion.div
                    key="parent-guardian"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
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
                            {student.parentContact?.fullName || 'Not specified'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {student.parentContact?.relationship || 'Guardian'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Information Display */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <User className="w-4 h-4" />
                          Full Name
                        </Label>
                        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 rounded-lg px-4 py-4">
                          <span className="text-emerald-900 font-semibold">{student.parentContact?.fullName || 'Not specified'}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <UserCheck className="w-4 h-4" />
                          Relationship
                        </Label>
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-blue-900 font-semibold">{student.parentContact?.relationship || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Phone className="w-4 h-4" />
                          Phone Number
                        </Label>
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg px-4 py-4">
                          <span className="text-purple-900 font-semibold">{student.parentContact?.phoneNumber || 'Not specified'}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Mail className="w-4 h-4" />
                          Email Address
                        </Label>
                        <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg px-4 py-4">
                          <span className="text-amber-900 font-semibold">{student.parentContact?.email || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                </TabsContent>

                <TabsContent value="academic" className="mt-0">
                  <motion.div
                    key="academic"
                    variants={tabContentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-8"
                  >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Academic Information</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Picture Section */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="text-center">
                        <Label className="text-sm font-medium text-gray-700 mb-4 block">
                          Academic Profile
                        </Label>
                        <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                          <GraduationCap className="w-12 h-12 text-white" />
                        </div>
                        <div className="text-center space-y-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {student.classId?.name || 'No Class Assigned'}
                          </h3>
                          <div className="flex items-center justify-center gap-1">
                            <School className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm text-gray-600">Current Class</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Information Display */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <School className="w-4 h-4" />
                            Class Name
                          </Label>
                          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 border border-indigo-200 rounded-lg px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-200 rounded-lg">
                                <School className="w-4 h-4 text-indigo-700" />
                              </div>
                              <div>
                                <span className="text-indigo-900 font-semibold">{student.classId?.name || 'Not assigned'}</span>
                                <p className="text-indigo-700 text-sm">Student's current class</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <CalendarIcon className="w-4 h-4" />
                            Enrollment Date
                          </Label>
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-200 rounded-lg">
                                <CalendarIcon className="w-4 h-4 text-blue-700" />
                              </div>
                              <div>
                                <span className="text-blue-900 font-semibold">
                                  {student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'Not specified'}
                                </span>
                                <p className="text-blue-700 text-sm">Date of enrollment</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <BookOpen className="w-4 h-4" />
                          Assigned Subjects
                        </Label>
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
                          {student.assignedSubjects && student.assignedSubjects.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {student.assignedSubjects.map((subject, index) => (
                                <span key={index} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-200 text-purple-800 rounded-full text-sm font-medium">
                                  <BookOpen className="w-3 h-3" />
                                  {subject}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <BookOpen className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                              <span className="text-purple-600 italic">No subjects assigned</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Clock className="w-4 h-4" />
                          Attendance Status
                        </Label>
                        <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-200 rounded-lg">
                              <Clock className="w-6 h-6 text-green-700" />
                            </div>
                            <div>
                              <span className="text-green-900 font-semibold text-lg">{student.attendance || 'Present'}</span>
                              <p className="text-green-700 text-sm">Current attendance status</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                </TabsContent>
              </AnimatePresence>
            </CardContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default StudentProfile;
