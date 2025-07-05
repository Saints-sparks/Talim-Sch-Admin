"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Header } from "@/components/Header";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen, 
  GraduationCap,
  ChevronLeft,
  X,
  Settings,
  Users
} from "lucide-react";
import { API_ENDPOINTS } from "@/app/lib/api/config";
import { getSchoolId } from "@/app/services/school.service";

interface Class {
  _id: string;
  name: string;
  gradeLevel: string;
  section?: string;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  schoolId: string;
  classId?: string;
  courses?: Course[];
  createdAt?: string;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  courseCode: string;
  subjectId: string;
  teacherId?: string;
  classId?: string;
  createdAt?: string;
}

interface Teacher {
  _id: string;
  userId: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface NewSubject {
  name: string;
  code: string;
  classId?: string;
}

interface NewCourse {
  title: string;
  description: string;
  courseCode: string;
  teacherId: string;
  classId: string;
  subjectId: string;
}

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex flex-col h-screen bg-gray-100">
    <div className="flex-shrink-0">
      <Header />
    </div>
    <div className="flex-1 flex justify-center items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#154473]"></div>
    </div>
  </div>
);

// Main component that uses useSearchParams
const CurriculumStructureMain: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAction = searchParams?.get('action');

  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");

  // Subject Modal States
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectMode, setSubjectMode] = useState<"add" | "edit">("add");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isSubmittingSubject, setIsSubmittingSubject] = useState(false);
  const [newSubject, setNewSubject] = useState<NewSubject>({
    name: "",
    code: "",
    classId: ""
  });

  // Course Modal States
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseMode, setCourseMode] = useState<"add" | "edit">("add");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [activeSubjectForCourse, setActiveSubjectForCourse] = useState<Subject | null>(null);
  const [newCourse, setNewCourse] = useState<NewCourse>({
    title: "",
    description: "",
    courseCode: "",
    teacherId: "",
    classId: "",
    subjectId: ""
  });

  useEffect(() => {
    fetchAllData();
    
    // Handle initial action from URL
    if (initialAction === "add-subject") {
      openAddSubjectModal();
    } else if (initialAction === "add-course") {
      // For add-course from URL, we need to open with a dummy subject
      // This will be handled after data is loaded
      // setShowCourseModal(true); // Remove direct modal opening
    }
  }, [initialAction]);

  // Handle URL action after data is loaded
  useEffect(() => {
    if (!loading && initialAction === "add-course" && subjects.length > 0) {
      // Open course modal with the first available subject
      const firstSubject = subjects[0];
      if (firstSubject) {
        openAddCourseModal(firstSubject);
      } else {
        toast.error("No subjects available. Please create a subject first.");
      }
    }
  }, [loading, initialAction, subjects]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchClasses(),
        fetchSubjects(),
        fetchTeachers()
      ]);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_ENDPOINTS.GET_CLASSES}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch classes");
      const data = await response.json();
      setClasses(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_ENDPOINTS.GET_SUBJECTS_BY_SCHOOL}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch subjects");
      const data = await response.json();
      setSubjects(Array.isArray(data) ? data : data.data || []);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      console.log("Fetching teachers from:", `${API_ENDPOINTS.GET_TEACHERS}`);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_ENDPOINTS.GET_TEACHERS}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("Teachers response status:", response.status);
      
      if (!response.ok) throw new Error("Failed to fetch teachers");
      const data = await response.json();
      console.log("Teachers response data:", data);
      
      const teachersArray = Array.isArray(data) ? data : data.data || [];
      console.log("Setting teachers array with length:", teachersArray.length);
      setTeachers(teachersArray);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      toast.error("Failed to load teachers");
    }
  };

  // Subject Functions
  const openAddSubjectModal = () => {
    setSubjectMode("add");
    setSelectedSubject(null);
    setNewSubject({ name: "", code: "", classId: "" });
    setShowSubjectModal(true);
  };

  const openEditSubjectModal = (subject: Subject) => {
    setSubjectMode("edit");
    setSelectedSubject(subject);
    setNewSubject({
      name: subject.name,
      code: subject.code,
      classId: subject.classId || ""
    });
    setShowSubjectModal(true);
  };

  const handleSubjectSubmit = async () => {
    if (!newSubject.name || !newSubject.code) {
      toast.error("Please fill in all required fields");
      return;
    }

    console.log("Submitting subject:", {
      name: newSubject.name,
      code: newSubject.code,
      classId: newSubject.classId
    });
    setIsSubmittingSubject(true);

    try {
      const schoolId = getSchoolId();
      const token = localStorage.getItem("accessToken");
      const url = subjectMode === "add" 
        ? API_ENDPOINTS.CREATE_SUBJECT
        : `https://talimbe-v2-li38.onrender.com/subjects/${selectedSubject?._id}`;
      
      const method = subjectMode === "add" ? "POST" : "PUT";
      console.log(`Making ${method} request to:`, url);
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newSubject.name,
          code: newSubject.code,
          schoolId: schoolId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        
        // Handle specific error messages from backend
        if (response.status === 409) {
          throw new Error(errorData?.message || `Subject with code '${newSubject.code}' already exists`);
        }
        
        throw new Error(errorData?.message || `Failed to ${subjectMode} subject`);
      }

      toast.success(`Subject ${subjectMode === "add" ? "created" : "updated"} successfully!`);
      setShowSubjectModal(false);
      fetchSubjects(); // Refresh the list
    } catch (error: any) {
      console.error(`Error ${subjectMode}ing subject:`, error);
      toast.error(error.message || `Failed to ${subjectMode} subject`);
    } finally {
      setIsSubmittingSubject(false);
    }
  };

  // Course Functions
  const openAddCourseModal = async (subject: Subject) => {
    console.log("Opening add course modal for subject:", subject.name);
    console.log("Current teachers count:", teachers.length);
    
    setCourseMode("add");
    setSelectedCourse(null);
    setActiveSubjectForCourse(subject);
    setNewCourse({
      title: "",
      description: "",
      courseCode: "",
      teacherId: "",
      classId: subject.classId || "",
      subjectId: subject._id
    });
    
    setShowCourseModal(true);
    
    // Ensure teachers are always fetched when opening the modal
    setIsLoadingTeachers(true);
    try {
      await fetchTeachers();
      console.log("Teachers after fetch:", teachers.length);
    } catch (error) {
      console.error("Error fetching teachers for course modal:", error);
      toast.error("Failed to load teachers");
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  const openEditCourseModal = async (course: Course) => {
    setCourseMode("edit");
    setSelectedCourse(course);
    setNewCourse({
      title: course.title,
      description: course.description,
      courseCode: course.courseCode,
      teacherId: course.teacherId || "",
      classId: course.classId || "",
      subjectId: course.subjectId
    });
    
    setShowCourseModal(true);
    
    // Ensure teachers are always fetched when opening the modal
    setIsLoadingTeachers(true);
    try {
      await fetchTeachers();
    } catch (error) {
      console.error("Error fetching teachers for course modal:", error);
      toast.error("Failed to load teachers");
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  const handleCourseSubmit = async () => {
    if (!newCourse.title || !newCourse.courseCode || !newCourse.subjectId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmittingCourse(true);
    try {
      const token = localStorage.getItem("accessToken");
      const url = courseMode === "add" 
        ? "https://talimbe-v2-li38.onrender.com/courses"
        : `https://talimbe-v2-li38.onrender.com/courses/${selectedCourse?._id}`;
      
      const method = courseMode === "add" ? "POST" : "PUT";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCourse),
      });

      if (!response.ok) throw new Error(`Failed to ${courseMode} course`);

      toast.success(`Course ${courseMode === "add" ? "created" : "updated"} successfully!`);
      setShowCourseModal(false);
      fetchSubjects(); // Refresh to get updated courses
    } catch (error: any) {
      console.error(`Error ${courseMode}ing course:`, error);
      toast.error(error.message || `Failed to ${courseMode} course`);
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  // Delete Functions
  const handleDeleteSubject = async (subjectId: string) => {
    if (!window.confirm("Are you sure you want to delete this subject? This will also delete all associated courses.")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`https://talimbe-v2-li38.onrender.com/subjects/${subjectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete subject");

      toast.success("Subject deleted successfully!");
      fetchSubjects();
    } catch (error: any) {
      console.error("Error deleting subject:", error);
      toast.error(error.message || "Failed to delete subject");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm("Are you sure you want to delete this course?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`https://talimbe-v2-li38.onrender.com/courses/${courseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete course");

      toast.success("Course deleted successfully!");
      fetchSubjects();
    } catch (error: any) {
      console.error("Error deleting course:", error);
      toast.error(error.message || "Failed to delete course");
    }
  };

  // Helper Functions
  const getClassName = (classId: string) => {
    const classItem = classes.find(c => c._id === classId);
    return classItem ? classItem.name : "No Class Assigned";
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher ? `${teacher.userId.firstName} ${teacher.userId.lastName}` : "No Teacher Assigned";
  };

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === "all" || subject.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <Header />
      </div>

      {/* Fixed Title and Controls */}
      <div className="flex-shrink-0 px-6 py-4 bg-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/curriculum")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Curriculum Structure</h1>
          </div>
          <button
            onClick={openAddSubjectModal}
            className="flex items-center gap-2 px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Classes</option>
            {classes.map(cls => (
              <option key={cls._id} value={cls._id}>{cls.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden px-6">
        <div className="h-full overflow-y-auto pb-6">
          {/* Subjects List */}
          {filteredSubjects.length > 0 ? (
            <div className="space-y-6">
              {filteredSubjects.map((subject) => (
                <div key={subject._id} className="bg-white rounded-lg shadow-sm">
                  {/* Subject Header */}
                  <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900">{subject.name}</h2>
                        <p className="text-gray-600">Code: {subject.code} • Class: {getClassName(subject.classId || "")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openAddCourseModal(subject)}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Add Course
                      </button>
                      <button
                        onClick={() => openEditSubjectModal(subject)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubject(subject._id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Courses */}
                  <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Courses</h3>
                    {subject.courses && subject.courses.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {subject.courses.map((course) => (
                          <div
                            key={course._id}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{course.title}</h4>
                                <p className="text-sm text-gray-600">{course.courseCode}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditCourseModal(course)}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCourse(course._id)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                            {course.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {course.description}
                              </p>
                            )}
                            <div className="text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                <Users className="w-3 h-3" />
                                <span>{getTeacherName(course.teacherId || "")}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No courses added yet</p>
                        <button
                          onClick={() => openAddCourseModal(subject)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Add First Course
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedClass !== "all"
                  ? "Try adjusting your search or filters."
                  : "Get started by creating your first subject."}
              </p>
              {!searchTerm && selectedClass === "all" && (
                <button
                  onClick={openAddSubjectModal}
                  className="px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700"
                >
                  Add First Subject
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {subjectMode === "add" ? "Add New Subject" : "Edit Subject"}
              </h2>
              <button
                onClick={() => setShowSubjectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Mathematics"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Code *
                </label>
                <input
                  type="text"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g., MATH"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class (Optional)
                </label>
                <select
                  value={newSubject.classId}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, classId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a class</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowSubjectModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isSubmittingSubject}
              >
                Cancel
              </button>
              <button
                onClick={handleSubjectSubmit}
                disabled={isSubmittingSubject}
                className="px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingSubject ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {subjectMode === "add" ? "Creating..." : "Updating..."}
                  </div>
                ) : (
                  subjectMode === "add" ? "Create Subject" : "Update Subject"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                {courseMode === "add" ? "Add New Course" : "Edit Course"}
                {activeSubjectForCourse && courseMode === "add" && (
                  <span className="text-sm font-normal text-gray-500 block">
                    to {activeSubjectForCourse.name}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setShowCourseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Title *
                </label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Algebra I"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Code *
                </label>
                <input
                  type="text"
                  value={newCourse.courseCode}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, courseCode: e.target.value }))}
                  placeholder="e.g., MATH101"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter course description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Teacher
                  {isLoadingTeachers && (
                    <span className="ml-2 text-sm text-blue-600">Loading...</span>
                  )}
                </label>
                <select
                  value={newCourse.teacherId}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, teacherId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoadingTeachers}
                >
                  <option value="">
                    {isLoadingTeachers 
                      ? "Loading teachers..." 
                      : teachers.length === 0 
                        ? "No teachers available" 
                        : "Select a teacher"
                    }
                  </option>
                  {!isLoadingTeachers && teachers.map(teacher => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.userId.firstName} {teacher.userId.lastName} ({teacher.userId.email})
                    </option>
                  ))}
                </select>
                {!isLoadingTeachers && teachers.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    No teachers found. Please add teachers first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class
                </label>
                <select
                  value={newCourse.classId}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, classId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a class</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowCourseModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isSubmittingCourse}
              >
                Cancel
              </button>
              <button
                onClick={handleCourseSubmit}
                disabled={isSubmittingCourse}
                className="px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingCourse ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {courseMode === "add" ? "Creating..." : "Updating..."}
                  </div>
                ) : (
                  courseMode === "add" ? "Create Course" : "Update Course"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main wrapper component with Suspense
const CurriculumStructurePage: React.FC = () => {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CurriculumStructureMain />
    </Suspense>
  );
};

export default CurriculumStructurePage;