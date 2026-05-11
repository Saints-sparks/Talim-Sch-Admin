"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";

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
  Users,
  Filter,
  Loader2,
  ChevronDown,
  ChevronRight,
  LayoutList,
} from "lucide-react";
import { getSchoolId } from "@/app/services/school.service";
import {
  getClasses,
  getTeachers,
  getSubjectsWithCourses,
  deleteCourseService,
  createSubject,
  updateSubject,
  deleteSubject,
  Class,
  Subject,
  Teacher,
  Course,
} from "@/app/services/subjects.service";
import CourseModal from "@/components/CourseModal";
import TalimModal from "@/components/ui/TalimModal";
import DeleteConfirmModal from "@/components/curricula/DeleteConfirmModal";
import { Tooltip } from "@/components/ui/Tooltip";

interface NewSubject {
  name: string;
  code: string;
  classId?: string;
}

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex flex-col h-screen bg-background">
    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-[#003366]" />
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
  const handledActionRef = useRef<string | null>(null);

  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

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

  // Delete Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

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
    }
  }, [mounted, initialAction]);

  // Handle URL action after data is loaded
  useEffect(() => {
    if (!loading && subjects.length > 0 && initialAction && handledActionRef.current !== initialAction) {
      handledActionRef.current = initialAction;
      if (initialAction === "add-course") {
        const firstSubject = subjects[0];
        if (firstSubject) {
          openAddCourseModal(firstSubject);
        } else {
          toast.error("No subjects available. Please create a subject first.");
        }
      } else if (initialAction === "edit-course") {
        const courseId = searchParams?.get("courseId");
        if (courseId) {
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
      fetchSubjects();
    } catch (error: any) {
      console.error(`Error ${subjectMode}ing subject:`, error);
      toast.error(error.message || `Failed to ${subjectMode} subject`);
    } finally {
      setIsSubmittingSubject(false);
    }
  };

  // Delete Subject Functions
  const handleDeleteSubject = (subject: Subject) => {
    setSubjectToDelete(subject);
    setShowDeleteModal(true);
  };

  const confirmDeleteSubject = async () => {
    if (!subjectToDelete) return;

    try {
      await deleteSubject(subjectToDelete._id);
      toast.success(`"${subjectToDelete.name}" deleted successfully!`);
      setShowDeleteModal(false);
      setSubjectToDelete(null);
      await fetchSubjects();
    } catch (error: any) {
      console.error("Error deleting subject:", error);
      toast.error(error.message || "Failed to delete subject");
    }
  };

  const cancelDeleteSubject = () => {
    setShowDeleteModal(false);
    setSubjectToDelete(null);
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
    if (initialAction) {
      handledActionRef.current = null;
      router.replace("/curriculum/structure");
    }
    fetchSubjects();
  };

  const closeCourseModal = () => {
    setShowCourseModal(false);
    if (initialAction) {
      handledActionRef.current = null;
      router.replace("/curriculum/structure");
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
      fetchSubjects();
    } catch (error: any) {
      console.error("Error deleting course:", error);
      toast.error(error.message || "Failed to delete course");
    }
  };

  // Toggle accordion
  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
  };

  // Helper Functions
  const getClassName = (classId: string) => {
    const classItem = classes.find((c) => c._id === classId);
    return classItem ? classItem.name : null;
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find((t) => t._id === teacherId);
    if (!teacher) return "No teacher";

    const firstName = teacher.firstName || "";
    const lastName = teacher.lastName || "";
    return firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : "No teacher";
  };

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass =
      selectedClass === "all" || subject.classId === selectedClass;
    return matchesSearch && matchesClass;
  });

  const totalCourses = subjects.reduce(
    (sum, s) => sum + (s.courses?.length || 0),
    0
  );

  if (!mounted || loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/curriculum")}
              className="flex items-center justify-center w-9 h-9 text-gray-500 hover:text-[#003366] hover:bg-[#003366]/5 rounded-lg transition-all"
              title="Back to Curriculum"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#003366]">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Curriculum Structure</h1>
              <p className="text-sm text-gray-500">Manage subjects and their associated courses</p>
            </div>
          </div>
          <Tooltip content="Create a new subject area. You can add courses to it afterwards." side="top">
          <button
            onClick={openAddSubjectModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Subject
          </button>
          </Tooltip>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#003366]/10 flex items-center justify-center flex-shrink-0">
              <LayoutList className="w-4 h-4 text-[#003366]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
              <p className="text-xs text-gray-500">Total Subjects</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#003366]/10 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-4 h-4 text-[#003366]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
              <p className="text-xs text-gray-500">Total Courses</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-9 h-9 rounded-lg bg-[#003366]/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-[#003366]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{classes.length}</p>
              <p className="text-xs text-gray-500">Classes</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search subjects by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] text-sm text-gray-900 placeholder-gray-400 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] text-sm text-gray-900 transition-all min-w-[160px]"
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subjects List */}
        {filteredSubjects.length > 0 ? (
          <div className="space-y-2">
            {filteredSubjects.map((subject) => {
              const isExpanded = expandedSubjects.has(subject._id);
              const courseCount = subject.courses?.length || 0;
              const className = getClassName(subject.classId || "");

              return (
                <div
                  key={subject._id}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                >
                  {/* Subject Row */}
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    {/* Expand toggle */}
                    <button
                      onClick={() => toggleSubject(subject._id)}
                      className="flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    {/* Subject icon */}
                    <div className="w-8 h-8 rounded-lg bg-[#003366]/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-[#003366]" />
                    </div>

                    {/* Subject info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm truncate">
                          {subject.name}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-[#003366]/10 text-[#003366]">
                          {subject.code}
                        </span>
                        {className && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                            {className}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Course count badge */}
                    <span className="text-xs text-gray-500 flex-shrink-0 hidden sm:block">
                      {courseCount} {courseCount === 1 ? "course" : "courses"}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Tooltip content="Create a course within the selected subject. Choose which class it belongs to." side="top">
                      <button
                        onClick={(e) => { e.stopPropagation(); openAddCourseModal(subject); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors text-xs font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add Course</span>
                      </button>
                      </Tooltip>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditSubjectModal(subject); }}
                        className="p-1.5 text-gray-400 hover:text-[#003366] hover:bg-[#003366]/5 rounded-lg transition-all"
                        title="Edit subject"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <Tooltip content="Deleting a subject removes all its courses. This cannot be undone." side="top">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSubject(subject); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete subject"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Courses panel (accordion) */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50">
                      {courseCount > 0 ? (
                        <div className="divide-y divide-gray-100">
                          {subject.courses!.map((course) => (
                            <div
                              key={course._id}
                              className="flex items-center gap-3 px-5 py-3 hover:bg-white transition-colors"
                            >
                              <div className="w-7 h-7 rounded-md bg-[#003366]/5 flex items-center justify-center flex-shrink-0">
                                <GraduationCap className="w-3.5 h-3.5 text-[#003366]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-gray-900 text-sm truncate">
                                    {course.title}
                                  </span>
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                    {course.courseCode}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Users className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500 truncate">
                                    {getTeacherName(course.teacherId || "")}
                                  </span>
                                </div>
                              </div>
                              {course.description && (
                                <p className="text-xs text-gray-500 line-clamp-1 hidden md:block max-w-xs flex-shrink-0">
                                  {course.description}
                                </p>
                              )}
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => openEditCourseModal(course)}
                                  className="p-1.5 text-gray-400 hover:text-[#003366] hover:bg-[#003366]/5 rounded-lg transition-all"
                                  title="Edit course"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCourse(course._id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Delete course"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {/* Add course row */}
                          <div className="px-5 py-2.5">
                            <button
                              onClick={() => openAddCourseModal(subject)}
                              className="flex items-center gap-1.5 text-xs text-[#003366] hover:text-[#002244] font-medium transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add another course
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 flex flex-col items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#003366]/10 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-[#003366]" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-700">No courses yet</p>
                            <p className="text-xs text-gray-500 mt-0.5">Add the first course to this subject</p>
                          </div>
                          <button
                            onClick={() => openAddCourseModal(subject)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors text-sm font-medium"
                          >
                            <Plus className="w-4 h-4" />
                            Add Course
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#003366]/10 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-[#003366]" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {searchTerm || selectedClass !== "all"
                    ? "No subjects found"
                    : "No subjects yet"}
                </h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  {searchTerm || selectedClass !== "all"
                    ? "Try adjusting your search or filters to find what you're looking for."
                    : "Get started by creating your first subject to begin building your curriculum structure."}
                </p>
              </div>
              {!searchTerm && selectedClass === "all" && (
                <button
                  onClick={openAddSubjectModal}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors font-medium text-sm shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add First Subject
                </button>
              )}
            </div>
          </div>
        )}
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
              className="px-6 py-3 bg-[#003366] text-white rounded-xl hover:bg-[#002244] transition-all duration-200 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
            <BookOpen className="w-4 h-4 text-[#003366]" />
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
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-gray-900 placeholder-gray-400"
                required
              />
            </div>

            <div>
              <Tooltip content="A short unique identifier for the subject (e.g. MTH, ENG). Used on reports and timetables." side="right">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Code *
              </label>
              </Tooltip>
              <input
                type="text"
                value={newSubject.code}
                onChange={(e) =>
                  setNewSubject((prev) => ({ ...prev, code: e.target.value }))
                }
                placeholder="e.g., MATH"
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-gray-900 placeholder-gray-400"
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
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-gray-900 appearance-none cursor-pointer"
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={cancelDeleteSubject}
        onConfirm={confirmDeleteSubject}
        message={`Are you sure you want to delete "${subjectToDelete?.name}"? This will also delete all associated courses.`}
      />

      {/* Course Modal */}
      <CourseModal
        isOpen={showCourseModal}
        onClose={closeCourseModal}
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
