"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { FiSave, FiX } from "react-icons/fi";
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
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { getClass } from "../../../services/student.service";
import "react-toastify/dist/ReactToastify.css";

interface ClassDetails {
  _id: string;
  name: string;
  schoolId: string;
  classTeacherId: {
    _id: string;
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    specialization: string;
    isFormTeacher: boolean;
  };
  courses: Course[];
  classDescription: string;
  classCapacity: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  courseCode: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  createdAt?: string;
}

interface Teacher {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  specialization: string;
  isFormTeacher: boolean;
}

const EditClass: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const classId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  // State management
  const [classData, setClassData] = useState<ClassDetails | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState("details");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    classDescription: "",
    classCapacity: "",
    classTeacherId: "",
  });

  // Helper function to safely extract string values
  const getStringValue = (value: any): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'object' && value !== null) {
      return value.name || value.title || value._id || 'Unknown';
    }
    return value?.toString() || 'Unknown';
  };

  // Helper function to get teacher name
  const getTeacherName = (teacher: any): string => {
    if (teacher?.userId?.firstName && teacher?.userId?.lastName) {
      return `${teacher.userId.firstName} ${teacher.userId.lastName}`;
    }
    return 'No teacher assigned';
  };

  // Fetch class data and teachers
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!classId) {
          setError("Class ID is required");
          return;
        }

        // Fetch class data
        const data = await getClass(classId);
        setClassData(data);
        
        // Set form data
        setFormData({
          name: data.name || "",
          classDescription: data.classDescription || "",
          classCapacity: data.classCapacity || "",
          classTeacherId: data.classTeacherId?._id || "",
        });

        // TODO: Fetch teachers list for dropdown
        // const teachersData = await getTeachers();
        // setTeachers(teachersData);

      } catch (error: any) {
        console.error("❌ Error fetching data:", error);
        setError("Failed to load class details");
        toast.error("Failed to load class details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [classId]);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement update API call
      // await updateClass(classId, formData);
      toast.success("Class updated successfully!");
      router.push(`/classes/${classId}`);
    } catch (error: any) {
      console.error("Error updating class:", error);
      toast.error("Failed to update class");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(`/classes/${classId}`);
  };

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
            <div className="border-b border-gray-200 px-6 py-4">
              <div className="flex space-x-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center p-6 min-h-[60vh]">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-2xl">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Class ID: {classId || 'Not provided'}</p>
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

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center p-6 min-h-[60vh]">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-2xl">
            <div className="text-gray-400 text-4xl mb-4">📚</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Class Not Found</h2>
            <p className="text-gray-600 mb-4">The class you're looking for doesn't exist or has been removed.</p>
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
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="flex-shrink-0">
        <Header />
      </div>

      {/* Navigation Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <button
              onClick={() => router.push("/classes")}
              className="flex items-center hover:text-blue-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Classes
            </button>
            <span className="mx-2">|</span>
            <button
              onClick={() => router.push(`/classes/${classId}`)}
              className="flex items-center hover:text-blue-600 transition-colors"
            >
              <User className="w-4 h-4 mr-1" />
              Class Profile
            </button>
            <span className="mx-2">|</span>
            <span className="text-gray-900 font-medium">Edit Class</span>
            <span className="mx-2 text-gray-400">•</span>
            <span className="text-gray-900 font-semibold text-lg">{getStringValue(classData.name)}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center text-sm font-medium"
            >
              <FiX className="mr-2 w-4 h-4" /> Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center text-sm font-medium"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="mr-2 w-4 h-4" /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="grid grid-cols-2 gap-0">
            <button
              onClick={() => setActiveTab("details")}
              className={`flex items-center justify-center py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "details"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Info className="w-4 h-4 mr-2" />
              Class Details
            </button>
            <button
              onClick={() => setActiveTab("teacher")}
              className={`flex items-center justify-center py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "teacher"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Assign Teacher
            </button>
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Class Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <Info className="w-5 h-5 text-blue-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Edit Class Information</h2>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Class Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Class Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Enter class name (e.g., Grade 1A)"
                          required
                        />
                      </div>

                      {/* Class Capacity */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Class Capacity *
                        </label>
                        <input
                          type="number"
                          value={formData.classCapacity}
                          onChange={(e) => handleInputChange("classCapacity", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Enter maximum number of students"
                          min="1"
                          required
                        />
                      </div>

                      {/* Class Description */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Class Description
                        </label>
                        <textarea
                          value={formData.classDescription}
                          onChange={(e) => handleInputChange("classDescription", e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                          placeholder="Enter class description (optional)"
                        />
                      </div>

                      {/* Current Stats Preview */}
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Class Statistics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-blue-700">Total Courses</p>
                                <p className="text-2xl font-bold text-blue-900">{classData.courses?.length || 0}</p>
                                <p className="text-sm text-blue-600">assigned</p>
                              </div>
                              <BookOpen className="w-8 h-8 text-blue-600" />
                            </div>
                          </div>

                          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-green-700">Capacity</p>
                                <p className="text-2xl font-bold text-green-900">{formData.classCapacity || "0"}</p>
                                <p className="text-sm text-green-600">students</p>
                              </div>
                              <Users className="w-8 h-8 text-green-600" />
                            </div>
                          </div>

                          <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-purple-700">Class Teacher</p>
                                <p className="text-lg font-bold text-purple-900 truncate">
                                  {getTeacherName(classData.classTeacherId)}
                                </p>
                                <p className="text-sm text-purple-600">assigned</p>
                              </div>
                              <User className="w-8 h-8 text-purple-600" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Assign Teacher Tab */}
            {activeTab === "teacher" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg mr-3">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">Assign Class Teacher</h2>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="space-y-6">
                      {/* Current Teacher Display */}
                      {classData.classTeacherId?.userId && (
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 mb-6">
                          <h3 className="text-lg font-medium text-purple-900 mb-4">Current Class Teacher</h3>
                          <div className="flex items-center gap-6">
                            <div className="p-4 bg-purple-200 rounded-full">
                              <User className="w-12 h-12 text-purple-700" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-purple-900 mb-1">
                                {getTeacherName(classData.classTeacherId)}
                              </h4>
                              <p className="text-purple-700 font-medium mb-2">Primary Class Teacher</p>
                              <p className="text-purple-600">{classData.classTeacherId.userId.email}</p>
                              {classData.classTeacherId.specialization && (
                                <p className="text-sm text-purple-600 mt-1">
                                  Specialization: {classData.classTeacherId.specialization}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Teacher Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select New Class Teacher
                        </label>
                        <select
                          value={formData.classTeacherId}
                          onChange={(e) => handleInputChange("classTeacherId", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          <option value="">Select a teacher...</option>
                          {teachers.map((teacher) => (
                            <option key={teacher._id} value={teacher._id}>
                              {getTeacherName(teacher)} - {teacher.specialization || 'No specialization'}
                            </option>
                          ))}
                        </select>
                        <p className="text-sm text-gray-500 mt-2">
                          Choose a teacher to assign as the primary class teacher. This teacher will be responsible for the overall management of this class.
                        </p>
                      </div>

                      {/* Teacher Search/Filter */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-3">Teacher Requirements</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            Only active teachers are available for assignment
                          </li>
                          <li className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            Teachers can be assigned to multiple classes
                          </li>
                          <li className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                            Specialized teachers are recommended for subject-specific classes
                          </li>
                        </ul>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-between pt-6 border-t border-gray-200">
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, classTeacherId: "" }))}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Remove Teacher
                        </button>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setActiveTab("details")}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Back to Details
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

export default EditClass;
