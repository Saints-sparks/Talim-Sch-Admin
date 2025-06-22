'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiEdit } from 'react-icons/fi';
import { teacherService, TeacherById } from '@/app/services/teacher.service';
import { Header } from '@/components/Header';
import { API_ENDPOINTS } from '@/app/lib/api/config';
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
} from "lucide-react";

interface Class {
  _id: string;
  name: string;
  gradeLevel?: string;
  section?: string;
}

interface Course {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

const TeacherProfile = () => {
  const [teacher, setTeacher] = useState<TeacherById | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("personal-details");
  
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;

  // Function to fetch classes
  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("https://talimbe-v2-li38.onrender.com/classes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch classes");

      const responseData = await response.json();
      
      let classesData: Class[] = [];
      if (Array.isArray(responseData)) {
        classesData = responseData;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        classesData = responseData.data;
      } else if (responseData.classes && Array.isArray(responseData.classes)) {
        classesData = responseData.classes;
      }

      setClasses(classesData);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  // Function to fetch courses/subjects
  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(API_ENDPOINTS.GET_SUBJECTS_BY_SCHOOL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch courses");

      const responseData = await response.json();
      
      let coursesData: Course[] = [];
      if (Array.isArray(responseData)) {
        coursesData = responseData;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        coursesData = responseData.data;
      }

      setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const teachers = await teacherService.getTeacherById(teacherId);
        console.log(teachers, "teachers");

        if (!teachers) {
          throw new Error('Teacher not found');
        }

        const teacherData: TeacherById = {
          _id: teachers._id,
          userId: {
            _id: teachers.userId._id,
            userId: teachers.userId._id,
            email: teachers.userId.email,
            firstName: teachers.userId.firstName,
            lastName: teachers.userId.lastName,
            phoneNumber: teachers.userId.phoneNumber,
            role: teachers.userId.role,
            schoolId: teachers.userId.schoolId,
            isActive: teachers.userId.isActive,
            isEmailVerified: teachers.userId.isEmailVerified || false,
            isTwoFactorEnabled: teachers.userId.isTwoFactorEnabled || false,
            devices: teachers.userId.devices || [],
            id: teachers.userId._id,
            createdAt: teachers.userId.createdAt || new Date().toISOString(),
            updatedAt: teachers.userId.updatedAt || new Date().toISOString(),
            __v: teachers.userId.__v || 0,
          },
          assignedClasses: teachers.assignedClasses,
          assignedCourses: teachers.assignedCourses,
          isFormTeacher: teachers.isFormTeacher,
          highestAcademicQualification: teachers.highestAcademicQualification,
          yearsOfExperience: teachers.yearsOfExperience,
          specialization: teachers.specialization,
          employmentType: teachers.employmentType,
          employmentRole: teachers.employmentRole,
          availabilityDays: teachers.availabilityDays,
          availableTime: teachers.availableTime,
          createdAt: teachers.createdAt || new Date().toISOString(),
          updatedAt: teachers.updatedAt || new Date().toISOString(),
          __v: teachers.__v || 0,
        };
        setTeacher(teacherData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch teacher');
      } finally {
        setIsLoading(false);
      }
    };

    const loadData = async () => {
      await Promise.all([
        fetchTeacher(),
        fetchClasses(),
        fetchCourses()
      ]);
    };

    if (teacherId) {
      loadData();
    }
  }, [teacherId]);

  // Helper function to get class name by ID
  const getClassName = (classId: string): string => {
    const classItem = classes.find(c => c._id === classId);
    return classItem ? classItem.name : classId;
  };

  // Helper function to get course name by ID
  const getCourseName = (courseId: string): string => {
    const courseItem = courses.find(c => c._id === courseId);
    return courseItem ? `${courseItem.code} - ${courseItem.name}` : courseId;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] p-6">
        <Header />
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/users/teachers')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Teachers
          </button>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] p-6">
        <Header />
        <div className="text-center py-12">
          <p className="text-gray-600">Teacher not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F3F3]">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                placeholder="Search"
                className="w-full pl-10 bg-gray-100 border-0 focus:bg-white rounded-md py-2 px-3"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">12 Oct, 2024</span>
            </div>
            <Bell className="w-5 h-5 text-gray-600" />
            <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/users/teachers')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Back to Teachers</span>
            </button>
          </div>
          <button 
            onClick={() => router.push(`/users/teachers/${teacherId}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <FiEdit /> Edit Teacher
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Card>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full h-[50px]"
          >
            <TabsList className="grid w-full h-[50px] grid-cols-5 bg-gray-100 rounded-lg">
              <TabsTrigger
                value="personal-details"
                className="data-[state=active]:bg-white h-[45px] data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-md"
              >
                Personal Details
              </TabsTrigger>
              <TabsTrigger
                value="qualifications"
                className="data-[state=active]:bg-white h-[45px] data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-md"
              >
                Qualifications & Experience
              </TabsTrigger>
              <TabsTrigger
                value="employment"
                className="data-[state=active]:bg-white h-[45px] data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-md"
              >
                Employment Details
              </TabsTrigger>
              <TabsTrigger
                value="assign"
                className="data-[state=active]:bg-white h-[45px] data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-md"
              >
                Class and Subject Assignment
              </TabsTrigger>
              <TabsTrigger
                value="availability"
                className="data-[state=active]:bg-white h-[45px] data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-md"
              >
                Teacher Availability
              </TabsTrigger>
            </TabsList>

            <CardContent className="p-8">
              <TabsContent value="personal-details" className="mt-0">
                <div className="space-y-8">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Personal Details
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Picture Section */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="text-center">
                        <Label className="text-sm font-medium text-gray-700 mb-4 block">
                          Profile Picture
                        </Label>
                        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <span className="text-2xl font-bold text-gray-600">
                            {teacher.userId.firstName[0]}{teacher.userId.lastName[0]}
                          </span>
                        </div>
                        {teacher.isFormTeacher && (
                          <span className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            Form Teacher
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Information Display */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          First Name
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                          <span className="text-gray-900">{teacher.userId.firstName}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Last Name
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                          <span className="text-gray-900">{teacher.userId.lastName}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Phone Number
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                          <span className="text-gray-900">{teacher.userId.phoneNumber}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Email Address
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                          <span className="text-gray-900">{teacher.userId.email}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Status
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            teacher.userId.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {teacher.userId.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          User ID
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                          <span className="text-gray-900 text-sm">{teacher.userId._id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="qualifications" className="mt-0">
                <div className="space-y-8">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Qualifications & Experience
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Picture Section */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="text-center">
                        <Label className="text-sm font-medium text-gray-700 mb-4 block">
                          Profile Picture
                        </Label>
                        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <span className="text-2xl font-bold text-gray-600">
                            {teacher.userId.firstName[0]}{teacher.userId.lastName[0]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Information Display */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Highest Qualification
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                          <span className="text-gray-900">{teacher.highestAcademicQualification}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Years of Teaching Experience
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                          <span className="text-gray-900">{teacher.yearsOfExperience} years</span>
                        </div>
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Specialization/Subject Expertise
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                          <span className="text-gray-900">{teacher.specialization}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="employment" className="mt-0">
                <div className="space-y-8">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Employment Details
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Picture Section */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="text-center">
                        <Label className="text-sm font-medium text-gray-700 mb-4 block">
                          Profile Picture
                        </Label>
                        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <span className="text-2xl font-bold text-gray-600">
                            {teacher.userId.firstName[0]}{teacher.userId.lastName[0]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Information Display */}
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Employment Type
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                          <span className="text-gray-900">{teacher.employmentType}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Employment Role
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                          <span className="text-gray-900">{teacher.employmentRole}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="assign" className="mt-0">
                <div className="space-y-8">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Class and Subject Assignment
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Picture Section */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="text-center">
                        <Label className="text-sm font-medium text-gray-700 mb-4 block">
                          Profile Picture
                        </Label>
                        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <span className="text-2xl font-bold text-gray-600">
                            {teacher.userId.firstName[0]}{teacher.userId.lastName[0]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Information Display */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Form Teacher Status
                          </Label>
                          <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              teacher.isFormTeacher 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {teacher.isFormTeacher ? 'Form Teacher' : 'Regular Teacher'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-3">Assigned Classes</h3>
                          <div className="space-y-2">
                            {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
                              teacher.assignedClasses.map((classId, index) => (
                                <div key={index} className="bg-gray-50 border border-gray-200 rounded-md p-3">
                                  <span className="font-medium">{getClassName(classId)}</span>
                                  <span className="text-xs text-gray-500 ml-2">ID: {classId}</span>
                                </div>
                              ))
                            ) : (
                              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                                <span className="text-gray-500 italic">No classes assigned</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold mb-3">Assigned Courses</h3>
                          <div className="space-y-2">
                            {teacher.assignedCourses && teacher.assignedCourses.length > 0 ? (
                              teacher.assignedCourses.map((courseId, index) => (
                                <div key={index} className="bg-gray-50 border border-gray-200 rounded-md p-3">
                                  <span className="font-medium">{getCourseName(courseId)}</span>
                                  <span className="text-xs text-gray-500 ml-2">ID: {courseId}</span>
                                </div>
                              ))
                            ) : (
                              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                                <span className="text-gray-500 italic">No courses assigned</span>
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
                  <h2 className="text-xl font-semibold text-gray-900">
                    Teacher Availability
                  </h2>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Picture Section */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="text-center">
                        <Label className="text-sm font-medium text-gray-700 mb-4 block">
                          Profile Picture
                        </Label>
                        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <span className="text-2xl font-bold text-gray-600">
                            {teacher.userId.firstName[0]}{teacher.userId.lastName[0]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Information Display */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Available Days
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                          <span className="text-gray-900">
                            {teacher.availabilityDays && teacher.availabilityDays.length > 0 
                              ? teacher.availabilityDays.join(', ') 
                              : 'Not specified'
                            }
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Available Time
                        </Label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                          <span className="text-gray-900">
                            {teacher.availableTime || 'Not specified'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default TeacherProfile;