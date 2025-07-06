"use client";

import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
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
  ChevronRight,
  Search,
  Bell,
  User,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import {
  teacherService,
  type TeacherById,
} from "@/app/services/teacher.service";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/app/lib/api/config";
import { Loader2 } from "lucide-react";

interface Course {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

interface Class {
  _id: string;
  name: string;
  gradeLevel?: string;
  section?: string;
  // Add other class properties as needed
}

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
  subjectToTeach: string;
  assignedClass: string;
  classTeacherAssignment: string;
}

export default function TeacherProfileForm() {
  const router = useRouter();
  const params = useParams();
  const teacherId = Array.isArray(params.id) ? params.id[0] : params.id || "";

  const [activeTab, setActiveTab] = useState("personal-details");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingPersonal, setIsSubmittingPersonal] = useState(false);
  const [isSubmittingQualifications, setIsSubmittingQualifications] =
    useState(false);
  const [isSubmittingEmployment, setIsSubmittingEmployment] = useState(false);
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);
  const [isSubmittingAvailability, setIsSubmittingAvailability] =
    useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
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
    subjectToTeach: "",
    assignedClass: "",
    classTeacherAssignment: "",
  });

  const fetchTeacherData = async () => {
    try {
      if (!teacherId) {
        toast.error("Teacher ID is required");
        router.push("/users/teachers");
        return;
      }

      const data: TeacherById = await teacherService.getTeacherById(teacherId);
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
        subjectToTeach: data.assignedCourses?.[0]?._id || "",
        assignedClass: data.assignedClasses?.[0]?._id || "",
        classTeacherAssignment: "",
      });
    } catch (error) {
      console.error("Error fetching teacher:", error);
      toast.error("Failed to load teacher details");
      router.push("/users/teachers");
    }
  };

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
      if (Array.isArray(responseData)) {
        setCourses(responseData);
      } else if (responseData.data && Array.isArray(responseData.data)) {
        setCourses(responseData.data);
      } else {
        console.error("Unexpected response structure:", responseData);
        toast.error("Invalid data format received for courses");
        setCourses([]);
      }
    } catch (error) {
      toast.error("Error loading courses");
      console.error(error);
      setCourses([]);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        "https://talimbe-v2-li38.onrender.com/classes",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch classes");

      const responseData = await response.json();

      // Handle different response structures
      let classesData: Class[] = [];
      if (Array.isArray(responseData)) {
        classesData = responseData;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        classesData = responseData.data;
      } else if (responseData.classes && Array.isArray(responseData.classes)) {
        classesData = responseData.classes;
      } else {
        console.error(
          "Unexpected response structure for classes:",
          responseData
        );
        toast.error("Invalid data format received for classes");
        setClasses([]);
        return;
      }

      setClasses(classesData);
    } catch (error) {
      toast.error("Error loading classes");
      console.error("Error fetching classes:", error);
      setClasses([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTeacherData(), fetchCourses(), fetchClasses()]);
      setIsLoading(false);
    };

    loadData();
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

  // Separate submit handlers for each tab
  const handleSubmitPersonal = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmittingPersonal(true);

    try {
      if (!teacherId) {
        throw new Error("Teacher ID is missing");
      }

      // Get the current teacher data to extract userId
      const teacherData = await teacherService.getTeacherById(teacherId);
      const userId = teacherData.userId._id;

      const personalData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
      };

      // Use direct API call to update personal details
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
      if (!teacherId) {
        throw new Error("Teacher ID is missing");
      }

      // Get the current teacher data to extract userId
      const teacherData = await teacherService.getTeacherById(teacherId);
      const userId = teacherData.userId._id;

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
      if (!teacherId) {
        throw new Error("Teacher ID is missing");
      }

      // Get the current teacher data to extract userId
      const teacherData = await teacherService.getTeacherById(teacherId);
      const userId = teacherData.userId._id;

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
    } catch (error: any) {
      console.error("Error updating employment details:", error);
      toast.error(error.message || "Failed to update employment details");
    } finally {
      setIsSubmittingEmployment(false);
    }
  };

  const handleSubmitAssign = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmittingAssign(true);

    try {
      if (!teacherId) {
        throw new Error("Teacher ID is missing");
      }

      // Get the current teacher data to extract userId
      const teacherData = await teacherService.getTeacherById(teacherId);
      const userId = teacherData.userId._id;

      // Use the correct endpoint structure from your controller
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${API_ENDPOINTS.BASE_URL}/teachers/${userId}/class-course-assignments`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            assignedClasses: formData.assignedClass
              ? [formData.assignedClass]
              : [],
            assignedCourses: formData.subjectToTeach
              ? [formData.subjectToTeach]
              : [],
            isFormTeacher: formData.isFormTeacher,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update assignments");
      }

      toast.success("Class and subject assignment updated successfully!");
    } catch (error: any) {
      console.error("Error updating assignment:", error);
      toast.error(
        error.message || "Failed to update class and subject assignment"
      );
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  const handleSubmitAvailability = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmittingAvailability(true);

    try {
      if (!teacherId) {
        throw new Error("Teacher ID is missing");
      }

      // Get the current teacher data to extract userId
      const teacherData = await teacherService.getTeacherById(teacherId);
      const userId = teacherData.userId._id;

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
              <Input
                placeholder="Search"
                className="pl-10 bg-gray-100 border-0 focus:bg-white"
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
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-2 text-gray-600">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-600">
            <span className="text-sm">Next</span>
            <ChevronRight className="w-5 h-5" />
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
                Assign to Class and Subject
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
                <form onSubmit={handleSubmitPersonal}>
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
                            <User className="w-12 h-12 text-gray-400" />
                          </div>
                          <Button
                            variant="outline"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            Upload Photo
                          </Button>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="firstName"
                            className="text-sm font-medium text-gray-700"
                          >
                            First Name
                          </Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="Enter first name"
                            className="bg-gray-50 border-gray-200"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="lastName"
                            className="text-sm font-medium text-gray-700"
                          >
                            Last Name
                          </Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Enter last name"
                            className="bg-gray-50 border-gray-200"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="phone"
                            className="text-sm font-medium text-gray-700"
                          >
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="e.g +234829xxxxx"
                            className="bg-gray-50 border-gray-200"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="email"
                            className="text-sm font-medium text-gray-700"
                          >
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="e.g 123@gmail.com"
                            className="bg-gray-50 border-gray-200"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="dob"
                            className="text-sm font-medium text-gray-700"
                          >
                            Date of Birth
                          </Label>
                          <Input
                            id="dob"
                            placeholder="12/10/2024"
                            className="bg-gray-50 border-gray-200"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="gender"
                            className="text-sm font-medium text-gray-700"
                          >
                            Gender
                          </Label>
                          <Select>
                            <SelectTrigger className="bg-gray-50 border-gray-200">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
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
                        className="bg-blue-900 hover:bg-blue-800 px-8"
                        disabled={isSubmittingPersonal}
                      >
                        {isSubmittingPersonal ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="qualifications" className="mt-0">
                <form onSubmit={handleSubmitQualifications}>
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
                            <User className="w-12 h-12 text-gray-400" />
                          </div>
                          <Button
                            variant="outline"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            Upload Photo
                          </Button>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="qualification"
                            className="text-sm font-medium text-gray-700"
                          >
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
                            <SelectTrigger className="bg-gray-50 border-gray-200">
                              <SelectValue placeholder="Select qualification" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Undergraduate">
                                Undergraduate
                              </SelectItem>
                              <SelectItem value="Graduate">Graduate</SelectItem>
                              <SelectItem value="Postgraduate">
                                Postgraduate
                              </SelectItem>
                              <SelectItem value="Doctorate">
                                Doctorate
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="experience"
                            className="text-sm font-medium text-gray-700"
                          >
                            Years of Teaching Experience
                          </Label>
                          <Input
                            id="experience"
                            name="yearsOfExperience"
                            value={formData.yearsOfExperience}
                            onChange={handleChange}
                            type="number"
                            placeholder="Enter years"
                            className="bg-gray-50 border-gray-200"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <Label
                            htmlFor="specialization"
                            className="text-sm font-medium text-gray-700"
                          >
                            Specialization/Subject Expertise
                          </Label>
                          <Input
                            id="specialization"
                            name="specialization"
                            value={formData.specialization}
                            onChange={handleChange}
                            placeholder="e.g maths, english"
                            className="bg-gray-50 border-gray-200"
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
                        className="bg-blue-900 hover:bg-blue-800 px-8"
                        disabled={isSubmittingQualifications}
                      >
                        {isSubmittingQualifications ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="employment" className="mt-0">
                <form onSubmit={handleSubmitEmployment}>
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
                            <User className="w-12 h-12 text-gray-400" />
                          </div>
                          <Button
                            variant="outline"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            Upload Photo
                          </Button>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="employmentType"
                            className="text-sm font-medium text-gray-700"
                          >
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
                            <SelectTrigger className="bg-gray-50 border-gray-200">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Fulltime">
                                Full-time
                              </SelectItem>
                              <SelectItem value="Parttime">
                                Part-time
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="classroomRole"
                            className="text-sm font-medium text-gray-700"
                          >
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
                            <SelectTrigger className="bg-gray-50 border-gray-200">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Academic">
                                Aacademic Staff
                              </SelectItem>
                              <SelectItem value="NonAcademic">
                                Non-Academic Staff
                              </SelectItem>
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
                        className="bg-blue-900 hover:bg-blue-800 px-8"
                        disabled={isSubmittingEmployment}
                      >
                        {isSubmittingEmployment ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="assign" className="mt-0">
                <form onSubmit={handleSubmitAssign}>
                  <div className="space-y-8">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Assign to Class and Subject
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Profile Picture Section */}
                      <div className="flex flex-col items-center space-y-4">
                        <div className="text-center">
                          <Label className="text-sm font-medium text-gray-700 mb-4 block">
                            Profile Picture
                          </Label>
                          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <User className="w-12 h-12 text-gray-400" />
                          </div>
                          <Button
                            variant="outline"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            Upload Photo
                          </Button>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="subjectsToTeach"
                            className="text-sm font-medium text-gray-700"
                          >
                            Subjects to Teach
                          </Label>
                          <Select
                            value={formData.subjectToTeach}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                subjectToTeach: value,
                              }))
                            }
                          >
                            <SelectTrigger className="bg-gray-50 border-gray-200">
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                            <SelectContent>
                              {courses.length > 0 ? (
                                courses.map((course) => (
                                  <SelectItem
                                    key={course._id}
                                    value={course._id}
                                  >
                                    {course.code} - {course.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="" disabled>
                                  No subjects available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="assignTeacherToClass"
                            className="text-sm font-medium text-gray-700"
                          >
                            Assign Teacher to Class
                          </Label>
                          <Select
                            value={formData.assignedClass}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                assignedClass: value,
                              }))
                            }
                          >
                            <SelectTrigger className="bg-gray-50 border-gray-200">
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                              {classes.length > 0 ? (
                                classes.map((classItem) => (
                                  <SelectItem
                                    key={classItem._id}
                                    value={classItem._id}
                                  >
                                    {classItem.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="" disabled>
                                  No classes available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                          <Label
                            htmlFor="classTeacherAssignment"
                            className="text-sm font-medium text-gray-700"
                          >
                            Class Teacher Assignment
                          </Label>
                          <Select
                            value={formData.classTeacherAssignment}
                            onValueChange={(value) =>
                              setFormData((prev) => ({
                                ...prev,
                                classTeacherAssignment: value,
                              }))
                            }
                          >
                            <SelectTrigger className="bg-gray-50 border-gray-200">
                              <SelectValue placeholder="Select assignment type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="primary-class-teacher">
                                Primary Class Teacher
                              </SelectItem>
                              <SelectItem value="secondary-class-teacher">
                                Secondary Class Teacher
                              </SelectItem>
                              <SelectItem value="assistant-class-teacher">
                                Assistant Class Teacher
                              </SelectItem>
                              <SelectItem value="no-assignment">
                                No Class Teacher Assignment
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Add checkbox for Form Teacher */}
                        <div className="md:col-span-2 space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isFormTeacher"
                              name="isFormTeacher"
                              checked={formData.isFormTeacher}
                              onChange={handleCheckboxChange}
                              className="rounded border-gray-300"
                            />
                            <Label
                              htmlFor="isFormTeacher"
                              className="text-sm font-medium text-gray-700"
                            >
                              Make this teacher a Form Teacher
                            </Label>
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
                        className="bg-blue-900 hover:bg-blue-800 px-8"
                        disabled={isSubmittingAssign}
                      >
                        {isSubmittingAssign ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="availability" className="mt-0">
                <form onSubmit={handleSubmitAvailability}>
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
                            <User className="w-12 h-12 text-gray-400" />
                          </div>
                          <Button
                            variant="outline"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            Upload Photo
                          </Button>
                        </div>
                      </div>

                      {/* Form Fields */}
                      <div className="lg:col-span-2 space-y-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">
                            Available Days
                          </Label>
                          <Select>
                            <SelectTrigger className="bg-gray-50 border-gray-200">
                              <SelectValue placeholder="Select Day(s)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monday">Monday</SelectItem>
                              <SelectItem value="tuesday">Tuesday</SelectItem>
                              <SelectItem value="wednesday">
                                Wednesday
                              </SelectItem>
                              <SelectItem value="thursday">Thursday</SelectItem>
                              <SelectItem value="friday">Friday</SelectItem>
                              <SelectItem value="saturday">Saturday</SelectItem>
                              <SelectItem value="sunday">Sunday</SelectItem>
                              <SelectItem value="weekdays">
                                Weekdays (Mon-Fri)
                              </SelectItem>
                              <SelectItem value="weekends">
                                Weekends (Sat-Sun)
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="availableTime"
                            className="text-sm font-medium text-gray-700"
                          >
                            Available Time{" "}
                            <span className="text-gray-500 font-normal">
                              (Optional)
                            </span>
                          </Label>
                          <Input
                            id="availableTime"
                            name="availableTime"
                            value={formData.availableTime}
                            onChange={handleChange}
                            placeholder="e.g. 08:00 AM - 03:00 PM"
                            className="bg-gray-50 border-gray-200"
                            defaultValue="08:00 AM - 03:00 PM"
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
                        className="bg-blue-900 hover:bg-blue-800 px-8"
                        disabled={isSubmittingAvailability}
                      >
                        {isSubmittingAvailability ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
