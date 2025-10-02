"use client";

import React, { useState, useEffect, Suspense } from "react";

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
  Users,
  Filter,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { getSchoolId } from "@/app/services/school.service";
import {
  getClasses,
  getTeachers,
  getSubjectsWithCourses,
  createSubject,
  updateSubject,
  deleteSubject,
  createCourse,
  updateCourseService,
  deleteCourseService,
  Class,
  Subject,
  Teacher,
  Course,
} from "@/app/services/subjects.service";
import CourseModal from "@/components/CourseModal";
import TalimModal from "@/components/ui/TalimModal";

interface NewSubject {
  name: string;
  code: string;
  classId?: string;
}

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex flex-col h-screen bg-background">
    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">
        Loading curriculum structure...
      </p>
    </div>
  </div>
);

// Main component that uses useSearchParams
const CurriculumStructureMain: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialAction = searchParams?.get("action");

  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
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
    classId: "",
  });

  // Course Modal States
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseModalMode, setCourseModalMode] = useState<"add" | "edit">("add");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeSubjectForCourse, setActiveSubjectForCourse] =
    useState<Subject | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchAllData();

      // Handle initial action from URL
      if (initialAction === "add-subject") {
        openAddSubjectModal();
      }
      // For add-course from URL, we need to open with a dummy subject
      // This will be handled after data is loaded in the next useEffect
    }
  }, [mounted, initialAction]);

  // Handle URL action after data is loaded
  useEffect(() => {
    if (!loading && subjects.length > 0) {
      if (initialAction === "add-course") {
        // Open course modal with the first available subject
        const firstSubject = subjects[0];
        if (firstSubject) {
          openAddCourseModal(firstSubject);
        } else {
          toast.error("No subjects available. Please create a subject first.");
        }
      } else if (initialAction === "edit-course") {
        // Handle edit course from URL
        const courseId = searchParams?.get("courseId");
        if (courseId) {
          // Find the course in all subjects
          let foundCourse: Course | null = null;
          for (const subject of subjects) {
            if (subject.courses) {
              foundCourse =
                subject.courses.find((c) => c._id === courseId) || null;
              if (foundCourse) break;
            }
          }

          if (foundCourse) {
            openEditCourseModal(foundCourse);
          } else {
            toast.error("Course not found.");
          }
        }
      }
    }
  }, [loading, initialAction, subjects, searchParams]);

  const fetchAllData = async () => {
    if (typeof window === "undefined" || !mounted) return;

    setLoading(true);
    try {
      await Promise.all([fetchClasses(), fetchSubjects(), fetchTeachers()]);
    } catch (error) {
      console.error("Error in fetchAllData:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    if (typeof window === "undefined" || !mounted) return;

    try {
      const data = await getClasses();
      setClasses(data);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load classes");
    }
  };

  const fetchSubjects = async () => {
    if (typeof window === "undefined" || !mounted) return;

    try {
      const data = await getSubjectsWithCourses();
      setSubjects(data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to load subjects");
    }
  };

  const fetchTeachers = async () => {
    if (typeof window === "undefined" || !mounted) return;

    try {
      const data = await getTeachers();
      setTeachers(data);
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
      classId: subject.classId || "",
    });
    setShowSubjectModal(true);
  };

  const handleSubjectSubmit = async () => {
    if (!newSubject.name || !newSubject.code) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmittingSubject(true);

    try {
      if (typeof window === "undefined" || !mounted) return;

      const schoolId = getSchoolId();
      if (!schoolId) {
        toast.error("School ID not found");
        return;
      }

      if (subjectMode === "add") {
        await createSubject({
          name: newSubject.name,
          code: newSubject.code,
          schoolId: schoolId,
        });
      } else if (selectedSubject) {
        await updateSubject(selectedSubject._id, {
          name: newSubject.name,
          code: newSubject.code,
          schoolId: schoolId,
        });
      }

      toast.success(
        `Subject ${subjectMode === "add" ? "created" : "updated"} successfully!`
      );
      setShowSubjectModal(false);

      fetchSubjects(); // This will now fetch subjects with their courses
    } catch (error: any) {
      console.error(`Error ${subjectMode}ing subject:`, error);
      toast.error(error.message || `Failed to ${subjectMode} subject`);
    } finally {
      setIsSubmittingSubject(false);
    }
  };

  // Course Functions
  const openAddCourseModal = async (subject: Subject) => {
    setCourseModalMode("add");
    setSelectedCourse(null);
    setActiveSubjectForCourse(subject);
    setShowCourseModal(true);
  };

  const openEditCourseModal = async (course: Course) => {
    setCourseModalMode("edit");
    setSelectedCourse(course);
    setActiveSubjectForCourse(null);
    setShowCourseModal(true);
  };

  const handleCourseModalSuccess = () => {
    setShowCourseModal(false);
    fetchSubjects(); // Refresh the subjects with their courses
  };

  // Delete Functions
  const handleDeleteSubject = async (subjectId: string) => {
    if (typeof window === "undefined" || !mounted) return;

    if (
      !window.confirm(
        "Are you sure you want to delete this subject? This will also delete all associated courses."
      )
    ) {
      return;
    }

    try {
      await deleteSubject(subjectId);
      toast.success("Subject deleted successfully!");
      fetchSubjects();
    } catch (error: any) {
      console.error("Error deleting subject:", error);
      toast.error(error.message || "Failed to delete subject");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (typeof window === "undefined" || !mounted) return;

    if (!window.confirm("Are you sure you want to delete this course?")) {
      return;
    }

    try {
      await deleteCourseService(courseId);
      toast.success("Course deleted successfully!");
      fetchSubjects(); // This will refresh subjects with their courses
    } catch (error: any) {
      console.error("Error deleting course:", error);
      toast.error(error.message || "Failed to delete course");
    }
  };

  // Helper Functions
  const getClassName = (classId: string) => {
    const classItem = classes.find((c) => c._id === classId);
    return classItem ? classItem.name : "No Class Assigned";
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t._id === teacherId);
    if (!teacher) return "No Teacher Assigned";

    const firstName = teacher.firstName || "";
    const lastName = teacher.lastName || "";
    return firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : "No Teacher Assigned";
  };

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass =
      selectedClass === "all" || subject.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  if (!mounted || loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Fixed Title and Controls */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 m-6 rounded-2xl">
        {/* Main Header */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col space-y-6">
            {/* Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push("/curriculum")}
                  className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                  title="Back to Curriculum Dashboard"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Curriculum Structure
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage subjects and their associated courses
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-0">
                <button
                  onClick={openAddSubjectModal}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search subjects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                />
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700 flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter by class:
                </span>
                <div className="relative">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 appearance-none cursor-pointer min-w-[180px] pr-10"
                  >
                    <option value="all">All Classes</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 ">
            {/* Subjects List */}
            {filteredSubjects.length > 0 ? (
              <div className="space-y-8">
                {filteredSubjects.map((subject) => (
                  <div
                    key={subject._id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                  >
                    {/* Subject Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-100">
                      <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                        <div className="flex items-start space-x-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
                            <BookOpen className="h-7 w-7 text-white" />
                          </div>
                          <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">
                              {subject.name}
                            </h2>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {subject.code}
                              </span>
                              <span className="text-sm text-gray-600">
                                Class: {getClassName(subject.classId || "")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => openAddCourseModal(subject)}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Course
                          </button>
                          <button
                            onClick={() => openEditSubjectModal(subject)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(subject._id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Courses */}
                    <div className="p-6">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-blue-600" />
                            Courses
                          </h3>
                          {subject.courses && subject.courses.length > 0 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {subject.courses.length} course
                              {subject.courses.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        {subject.courses && subject.courses.length > 0 ? (
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {subject.courses.map((course) => (
                              <div
                                key={course._id}
                                className="group bg-white border-2 border-gray-100 hover:border-blue-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="space-y-2 flex-1 mr-2">
                                    <h4 className="font-semibold text-gray-900 line-clamp-1">
                                      {course.title}
                                    </h4>
                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                                      {course.courseCode}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() =>
                                        openEditCourseModal(course)
                                      }
                                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteCourse(course._id)
                                      }
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  {course.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                      {course.description}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                                    <Users className="w-3.5 h-3.5" />
                                    <span className="line-clamp-1">
                                      {getTeacherName(course.teacherId || "")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12">
                            <div className="text-center">
                              <div className="flex justify-center mb-4">
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                                  <GraduationCap className="w-8 h-8 text-blue-600" />
                                </div>
                              </div>
                              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                No courses yet
                              </h4>
                              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                                Start building your curriculum by adding the
                                first course to this subject.
                              </p>
                              <button
                                onClick={() => openAddCourseModal(subject)}
                                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center mx-auto"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add First Course
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16">
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {searchTerm || selectedClass !== "all"
                      ? "No subjects found"
                      : "No subjects yet"}
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {searchTerm || selectedClass !== "all"
                      ? "Try adjusting your search or filters to find what you're looking for."
                      : "Get started by creating your first subject to begin building your curriculum structure."}
                  </p>
                  {!searchTerm && selectedClass === "all" && (
                    <button
                      onClick={openAddSubjectModal}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center mx-auto"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Add First Subject
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subject Modal */}
      <TalimModal
        isOpen={showSubjectModal}
        onClose={() => setShowSubjectModal(false)}
        title={subjectMode === "add" ? "Add New Subject" : "Edit Subject"}
        subtitle={
          subjectMode === "add"
            ? "Create a new subject to organize your courses"
            : "Update the subject information"
        }
        icon={<BookOpen className="w-5 h-5 text-white" />}
        isSubmitting={isSubmittingSubject}
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
            <button
              type="button"
              onClick={() => setShowSubjectModal(false)}
              disabled={isSubmittingSubject}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubjectSubmit}
              disabled={
                isSubmittingSubject || !newSubject.name || !newSubject.code
              }
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSubmittingSubject ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {subjectMode === "add" ? "Creating..." : "Updating..."}
                </>
              ) : (
                <>
                  {subjectMode === "add" ? "Create Subject" : "Update Subject"}
                </>
              )}
            </button>
          </div>
        }
      >
        {/* Subject Information Section */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-6 uppercase tracking-wide flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            Subject Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Name *
              </label>
              <input
                type="text"
                value={newSubject.name}
                onChange={(e) =>
                  setNewSubject((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Mathematics"
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
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
                onChange={(e) =>
                  setNewSubject((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="e.g., MATH"
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class (Optional)
              </label>
              <div className="relative">
                <select
                  value={newSubject.classId || "none"}
                  onChange={(e) =>
                    setNewSubject((prev) => ({
                      ...prev,
                      classId: e.target.value === "none" ? "" : e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 appearance-none cursor-pointer"
                >
                  <option value="none">No class assigned</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Optionally assign this subject to a specific class
              </p>
            </div>
          </div>
        </div>
      </TalimModal>

      {/* Course Modal */}
      <CourseModal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        onSuccess={handleCourseModalSuccess}
        mode={courseModalMode}
        course={selectedCourse}
        subjectId={activeSubjectForCourse?._id}
        subjectName={activeSubjectForCourse?.name}
        initialClassId={activeSubjectForCourse?.classId || ""}
      />
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
