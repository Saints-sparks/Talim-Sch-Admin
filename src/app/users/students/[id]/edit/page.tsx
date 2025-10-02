"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiSave, FiUpload } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import {
  studentService,
  StudentById,
  updateStudent,
  getClasses,
  Class,
} from "@/app/services/student.service";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
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

const EditStudentProfile = () => {
  const [student, setStudent] = useState<StudentById | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("personal-details");

  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [studentData, classesData] = await Promise.all([
          studentService.getStudentById(studentId),
          getClasses(),
        ]);

        if (!studentData) {
          throw new Error("Student not found");
        }

        setStudent(studentData);
        setClasses(classesData);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch student data";
        setError(errorMessage);
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  const handleInputChange = (
    field: string,
    value: string | boolean | string[],
    section?: string
  ) => {
    if (!student) return;

    setStudent((prev) => {
      if (!prev) return null;

      if (section === "userId") {
        return {
          ...prev,
          userId: {
            ...prev.userId,
            [field]: value,
          },
        };
      } else if (section === "parentContact") {
        return {
          ...prev,
          parentContact: {
            ...prev.parentContact,
            [field]: value,
          },
        };
      } else {
        return {
          ...prev,
          [field]: value,
        };
      }
    });
  };

  const handleBooleanChange = (field: string, value: boolean) => {
    if (!student) return;

    setStudent((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleSave = async () => {
    if (!student) return;

    try {
      setIsSaving(true);

      const updateData = {
        userInfo: {
          firstName: student.userId.firstName,
          lastName: student.userId.lastName,
          phoneNumber: student.userId.phoneNumber,
          email: student.userId.email,
          dateOfBirth: student.userId.dateOfBirth || "",
          gender: student.userId.gender || "",
          userAvatar: student.userId.userAvatar || "",
        },
        classId: student.classId?._id,
        gradeLevel: student.gradeLevel,
        parentContact: {
          fullName: student.parentContact.fullName,
          phoneNumber: student.parentContact.phoneNumber,
          email: student.parentContact.email,
          relationship: student.parentContact.relationship,
        },
        isActive: student.isActive,
      };

      await updateStudent(studentId, updateData as any);

      toast.success("Student profile updated successfully");

      // Navigate back to view mode
      router.push(`/users/students/${studentId}/view`);
    } catch (error) {
      console.error("Error updating student:", error);

      let errorMessage = "Failed to update student profile";

      // Handle different types of errors
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        // Handle fetch errors or other structured errors
        const err = error as any;
        if (err.message) {
          errorMessage = err.message;
        } else if (err.error) {
          errorMessage = err.error;
        }
      }

      // Show the specific error message to the user
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!student || !e.target.files || !e.target.files[0]) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) return;
      const result = event.target.result as string;
      handleInputChange("userAvatar", result, "userId");
    };
    reader.readAsDataURL(e.target.files[0]);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full bg-white shadow-sm">
          <div className="h-16 bg-gray-100 animate-pulse"></div>
        </div>

        <div className="max-w-7xl mx-auto">
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

            <div className="p-8">
              <div className="space-y-8">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>

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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/users/students/${studentId}/view`)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Profile</span>
            </button>
            <div className="text-gray-300">|</div>
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                Edit Student Profile
              </span>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm font-medium disabled:opacity-50"
          >
            <FiSave className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Changes"}
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
                value="settings"
                className="flex items-center gap-2 py-4 px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 rounded-none font-medium transition-all"
              >
                <UserCheck className="w-4 h-4" />
                Settings
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
                  <TabsContent
                    value="personal-details"
                    className="space-y-8 mt-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Personal Information
                        </h2>
                        <p className="text-gray-600 mt-1">
                          Edit student's personal details
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Profile Picture */}
                      <div className="flex flex-col items-center space-y-6">
                        <div className="relative">
                          <Avatar className="w-32 h-32 ring-4 ring-gray-100">
                            <AvatarImage
                              src={
                                student.userId.userAvatar || "/placeholder.svg"
                              }
                              alt={`${student.userId.firstName} ${student.userId.lastName}`}
                            />
                            <AvatarFallback className="bg-blue-500 text-white text-2xl font-semibold">
                              {student.userId.firstName?.[0]}
                              {student.userId.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <button
                            onClick={() =>
                              document.getElementById("photoInput")?.click()
                            }
                            className="absolute bottom-2 right-2 w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center hover:bg-blue-600 transition-colors"
                          >
                            <FiUpload className="w-4 h-4 text-white" />
                          </button>
                          <input
                            type="file"
                            id="photoInput"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </div>

                        <div className="text-center">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {student.userId.firstName} {student.userId.lastName}
                          </h3>
                          <p className="text-gray-600 mt-1">Student</p>
                        </div>
                      </div>

                      {/* Personal Information */}
                      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            First Name
                          </label>
                          <Input
                            value={student.userId.firstName || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "firstName",
                                e.target.value,
                                "userId"
                              )
                            }
                            placeholder="Enter first name"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Last Name
                          </label>
                          <Input
                            value={student.userId.lastName || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "lastName",
                                e.target.value,
                                "userId"
                              )
                            }
                            placeholder="Enter last name"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email Address
                          </label>
                          <Input
                            type="email"
                            value={student.userId.email || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "email",
                                e.target.value,
                                "userId"
                              )
                            }
                            placeholder="Enter email address"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone Number
                          </label>
                          <Input
                            value={student.userId.phoneNumber || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "phoneNumber",
                                e.target.value,
                                "userId"
                              )
                            }
                            placeholder="Enter phone number"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Date of Birth
                          </label>
                          <Input
                            type="date"
                            value={student.userId.dateOfBirth || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "dateOfBirth",
                                e.target.value,
                                "userId"
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <UserCheck className="w-4 h-4" />
                            Gender
                          </label>
                          <Select
                            value={student.userId.gender || ""}
                            onValueChange={(value) =>
                              handleInputChange("gender", value, "userId")
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="parent-guardian"
                    className="space-y-8 mt-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Parent/Guardian Information
                        </h2>
                        <p className="text-gray-600 mt-1">
                          Edit contact information for student's parent or
                          guardian
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Full Name
                        </label>
                        <Input
                          value={student.parentContact.fullName || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "fullName",
                              e.target.value,
                              "parentContact"
                            )
                          }
                          placeholder="Enter parent/guardian full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Heart className="w-4 h-4" />
                          Relationship
                        </label>
                        <Select
                          value={student.parentContact.relationship || ""}
                          onValueChange={(value) =>
                            handleInputChange(
                              "relationship",
                              value,
                              "parentContact"
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MOTHER">Mother</SelectItem>
                            <SelectItem value="FATHER">Father</SelectItem>
                            <SelectItem value="GUARDIAN">Guardian</SelectItem>
                            <SelectItem value="GRANDPARENT">
                              Grandparent
                            </SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone Number
                        </label>
                        <Input
                          value={student.parentContact.phoneNumber || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "phoneNumber",
                              e.target.value,
                              "parentContact"
                            )
                          }
                          placeholder="Enter phone number"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email Address
                        </label>
                        <Input
                          type="email"
                          value={student.parentContact.email || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "email",
                              e.target.value,
                              "parentContact"
                            )
                          }
                          placeholder="Enter email address"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-8 mt-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Student Settings
                        </h2>
                        <p className="text-gray-600 mt-1">
                          Manage student account settings and status
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <UserCheck className="w-4 h-4" />
                          Account Status
                        </label>
                        <Select
                          value={student.isActive ? "active" : "inactive"}
                          onValueChange={(value) =>
                            handleBooleanChange("isActive", value === "active")
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Attendance Status
                        </label>
                        <Input
                          value={student.attendance || ""}
                          onChange={(e) =>
                            handleInputChange("attendance", e.target.value)
                          }
                          placeholder="Enter attendance status"
                        />
                      </div>
                    </div>

                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Account Actions
                        </h3>
                        <div className="space-y-4">
                          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <h4 className="text-red-800 font-semibold mb-2">
                              Danger Zone
                            </h4>
                            <p className="text-red-600 text-sm mb-4">
                              These actions cannot be undone. Please proceed
                              with caution.
                            </p>
                            <Button
                              variant="destructive"
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => {
                                if (
                                  confirm(
                                    "Are you sure you want to deactivate this student account?"
                                  )
                                ) {
                                  handleBooleanChange("isActive", false);
                                }
                              }}
                            >
                              Deactivate Account
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EditStudentProfile;
