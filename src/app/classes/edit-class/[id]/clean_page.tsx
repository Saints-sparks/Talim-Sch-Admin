"use client";

import React, { useState, useEffect } from "react";

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
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";
import { getClass, updateClass, assignTeacherToClass } from "../../../services/student.service";
import { getTeachers } from "../../../services/subjects.service";
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
}

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  userId?: string;
}

const EditClassPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  // Basic class state
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState("");
  const [classDescription, setClassDescription] = useState("");
  const [classCapacity, setClassCapacity] = useState("");

  // Teacher assignment state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [assigningTeacher, setAssigningTeacher] = useState(false);

  // Filter teachers based on search
  const filteredTeachers = teachers.filter(teacher => {
    const fullName = `${teacher.firstName} ${teacher.lastName}`.toLowerCase();
    const email = teacher.email.toLowerCase();
    const search = teacherSearch.toLowerCase();
    return fullName.includes(search) || email.includes(search);
  });

  // Helper functions
  const getTeacherDisplayName = (teacher: Teacher) => {
    return `${teacher.firstName} ${teacher.lastName}`;
  };

  const getTeacherEmail = (teacher: Teacher) => {
    return teacher.email;
  };

  const getCurrentTeacherDisplayName = () => {
    if (!classDetails?.classTeacherId) return "No teacher assigned";
    return `${classDetails.classTeacherId.userId.firstName} ${classDetails.classTeacherId.userId.lastName}`;
  };

  const getCurrentTeacherEmail = () => {
    if (!classDetails?.classTeacherId) return "";
    return classDetails.classTeacherId.userId.email;
  };

  // Load class details
  useEffect(() => {
    const fetchClassDetails = async () => {
      try {
        setLoading(true);
        const data = await getClass(id);
        setClassDetails(data);
        setClassName(data.name);
        setClassDescription(data.classDescription);
        setClassCapacity(data.classCapacity);
      } catch (error) {
        console.error("Error fetching class details:", error);
        toast.error("Failed to load class details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClassDetails();
    }
  }, [id]);

  // Load teachers
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoadingTeachers(true);
        const teacherData = await getTeachers();
        setTeachers(teacherData);
      } catch (error) {
        console.error("Error fetching teachers:", error);
        toast.error("Failed to load teachers");
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, []);

  // Handle class update
  const handleUpdateClass = async () => {
    try {
      const updateData = {
        name: className,
        classDescription,
        classCapacity,
      };

      await updateClass(id, updateData);
      toast.success("Class updated successfully!");
      
      // Refresh class details
      const updatedData = await getClass(id);
      setClassDetails(updatedData);
    } catch (error) {
      console.error("Error updating class:", error);
      toast.error("Failed to update class");
    }
  };

  // Handle teacher assignment
  const handleAssignTeacher = async () => {
    if (!selectedTeacher) {
      toast.error("Please select a teacher to assign");
      return;
    }

    try {
      setAssigningTeacher(true);
      await assignTeacherToClass(id, selectedTeacher._id);
      toast.success("Teacher assigned successfully!");
      
      // Refresh class details to show updated teacher
      const updatedData = await getClass(id);
      setClassDetails(updatedData);
      
      // Reset teacher selection
      setSelectedTeacher(null);
      setTeacherSearch("");
      setShowTeacherDropdown(false);
    } catch (error) {
      console.error("Error assigning teacher:", error);
      toast.error("Failed to assign teacher");
    } finally {
      setAssigningTeacher(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading class details...</div>
        </div>
      </div>
    );
  }

  if (!classDetails) {
    return (
      <div className="min-h-screen bg-gray-50">
        
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Failed to load class details</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back to Classes
            </button>
            
            <nav className="space-y-2">
              <div className="flex items-center px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg">
                <Settings className="w-5 h-5 mr-3" />
                Edit Class
              </div>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Edit Class: {classDetails.name}
              </h1>
              <p className="text-gray-600">
                Modify class details and manage teacher assignments
              </p>
            </div>

            {/* Class Information Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center mb-6">
                <Info className="w-6 h-6 text-indigo-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Class Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter class name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Capacity *
                  </label>
                  <input
                    type="number"
                    value={classCapacity}
                    onChange={(e) => setClassCapacity(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter class capacity"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Description
                  </label>
                  <textarea
                    value={classDescription}
                    onChange={(e) => setClassDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter class description"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleUpdateClass}
                  className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <FiSave className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>
            </div>

            {/* Current Teacher Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center mb-6">
                <User className="w-6 h-6 text-indigo-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Current Class Teacher</h2>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {getCurrentTeacherDisplayName()}
                    </h3>
                    {classDetails.classTeacherId && (
                      <p className="text-sm text-gray-600">{getCurrentTeacherEmail()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Assign Teacher Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <GraduationCap className="w-6 h-6 text-indigo-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Assign New Teacher</h2>
              </div>

              <div className="space-y-4">
                {/* Teacher Search and Dropdown */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Teacher *
                  </label>
                  <div className="relative">
                    <div className="flex">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={teacherSearch}
                          onChange={(e) => setTeacherSearch(e.target.value)}
                          onFocus={() => setShowTeacherDropdown(true)}
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          placeholder="Search teachers by name or email..."
                        />
                        <button
                          onClick={() => setShowTeacherDropdown(!showTeacherDropdown)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                          {showTeacherDropdown ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Dropdown */}
                    {showTeacherDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {loadingTeachers ? (
                          <div className="p-4 text-center text-gray-500">Loading teachers...</div>
                        ) : filteredTeachers.length > 0 ? (
                          filteredTeachers.map((teacher) => (
                            <button
                              key={teacher._id}
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setTeacherSearch(getTeacherDisplayName(teacher));
                                setShowTeacherDropdown(false);
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">
                                {getTeacherDisplayName(teacher)}
                              </div>
                              <div className="text-sm text-gray-600">
                                {getTeacherEmail(teacher)}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            No teachers found matching your search
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Teacher Display */}
                {selectedTeacher && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {getTeacherDisplayName(selectedTeacher)}
                          </h4>
                          <p className="text-sm text-gray-600">{getTeacherEmail(selectedTeacher)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTeacher(null);
                          setTeacherSearch("");
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Assign Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleAssignTeacher}
                    disabled={!selectedTeacher || assigningTeacher}
                    className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {assigningTeacher ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 mr-2" />
                        Assign Teacher
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Course Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
              <div className="flex items-center mb-6">
                <BookOpen className="w-6 h-6 text-indigo-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">Associated Courses</h2>
              </div>

              {classDetails.courses && classDetails.courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classDetails.courses.map((course) => (
                    <div key={course._id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-1">{course.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{course.courseCode}</p>
                      <p className="text-xs text-gray-500">{course.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No courses associated with this class yet.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditClassPage;
