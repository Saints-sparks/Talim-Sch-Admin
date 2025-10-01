"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Search, X, AlertCircle, Loader2, BookOpen, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  getTeachers,
  getClasses,
  updateCourseService,
  createCourse,
  Class,
  Teacher,
} from "@/app/services/subjects.service";

// Custom Course interface that can handle both string and object forms
interface CourseForModal {
  _id: string;
  title: string;
  description: string;
  courseCode: string;
  teacherId?: string | { _id: string; userId?: any };
  subjectId?: string | { _id: string; name?: string; code?: string };
  classId?: string;
  schoolId?: string;
}

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "add" | "edit";
  course?: CourseForModal | null;
  subjectId?: string;
  subjectName?: string;
  initialClassId?: string;
}

interface NewCourse {
  title: string;
  description: string;
  courseCode: string;
  teacherId: string;
  classId: string;
  subjectId: string;
}

const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  course,
  subjectId,
  subjectName,
  initialClassId,
}) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Search states for dropdowns
  const [teacherSearchTerm, setTeacherSearchTerm] = useState("");
  const [classSearchTerm, setClassSearchTerm] = useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  const [newCourse, setNewCourse] = useState<NewCourse>({
    title: "",
    description: "",
    courseCode: "",
    teacherId: "",
    classId: initialClassId || "",
    subjectId: subjectId || "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && mounted) {
      fetchData();

      if (mode === "edit" && course) {
        setNewCourse({
          title: course.title,
          description: course.description,
          courseCode: course.courseCode,
          teacherId:
            typeof course.teacherId === "string"
              ? course.teacherId
              : (course.teacherId as any)?._id || "",
          classId: course.classId || initialClassId || "",
          subjectId:
            typeof course.subjectId === "string"
              ? course.subjectId
              : (course.subjectId as any)?._id || subjectId || "",
        });
      } else if (mode === "add") {
        setNewCourse({
          title: "",
          description: "",
          courseCode: "",
          teacherId: "",
          classId: initialClassId || "",
          subjectId: subjectId || "",
        });
      }

      // Reset search states
      setTeacherSearchTerm("");
      setClassSearchTerm("");
      setShowTeacherDropdown(false);
      setShowClassDropdown(false);
    }
  }, [isOpen, mode, course, subjectId, initialClassId, mounted]);

  const fetchData = async () => {
    if (typeof window === "undefined" || !mounted) return;

    try {
      setIsLoadingTeachers(true);
      const [teachersData, classesData] = await Promise.all([
        getTeachers(),
        getClasses(),
      ]);
      setTeachers(teachersData);
      setClasses(classesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load teachers and classes");
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  const handleSubmit = async () => {
    if (!newCourse.title || !newCourse.courseCode || !newCourse.subjectId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      if (typeof window === "undefined" || !mounted) return;

      if (mode === "add") {
        await createCourse(newCourse);
      } else if (mode === "edit" && course) {
        await updateCourseService(course._id, newCourse);
      }

      toast.success(
        `Course ${mode === "add" ? "created" : "updated"} successfully!`
      );

      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error(`Error ${mode}ing course:`, error);
      toast.error(error.message || `Failed to ${mode} course`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTeacherSearchTerm("");
    setClassSearchTerm("");
    setShowTeacherDropdown(false);
    setShowClassDropdown(false);
    setIsLoadingTeachers(false);
    onClose();
  };

  // Filter functions for searchable dropdowns
  const filteredTeachers = teachers.filter((teacher) => {
    if (!teacher) return false;

    const firstName = teacher.firstName || "";
    const lastName = teacher.lastName || "";
    const email = teacher.email || "";

    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const emailLower = email.toLowerCase();
    const searchLower = teacherSearchTerm.toLowerCase();

    return fullName.includes(searchLower) || emailLower.includes(searchLower);
  });

  const filteredClasses = classes.filter((cls) => {
    if (!cls) return false;

    const searchLower = classSearchTerm.toLowerCase();
    const name = cls.name || "";
    const gradeLevel = cls.gradeLevel || "";

    return (
      name.toLowerCase().includes(searchLower) ||
      gradeLevel.toLowerCase().includes(searchLower)
    );
  });

  // Get selected teacher/class display names
  const getSelectedTeacherDisplay = () => {
    if (!newCourse.teacherId) return "";
    const teacher = teachers.find((t) => t._id === newCourse.teacherId);
    if (!teacher) return "";

    const firstName = teacher.firstName || "";
    const lastName = teacher.lastName || "";
    return firstName || lastName ? `${firstName} ${lastName}`.trim() : "";
  };

  const getSelectedClassDisplay = () => {
    if (!newCourse.classId) return "";
    const cls = classes.find((c) => c._id === newCourse.classId);
    return cls ? cls.name : "";
  };

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white relative overflow-hidden flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {mode === "add" ? "Add New Course" : "Edit Course"}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {mode === "add" && subjectName
                    ? `Create a new course for ${subjectName}`
                    : mode === "add"
                    ? "Create a new course"
                    : "Update the course information"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <div className="space-y-8">
              {/* Course Information Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-6 uppercase tracking-wide flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Course Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      value={newCourse.title}
                      onChange={(e) =>
                        setNewCourse((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      placeholder="e.g., Algebra I"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
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
                      onChange={(e) =>
                        setNewCourse((prev) => ({
                          ...prev,
                          courseCode: e.target.value,
                        }))
                      }
                      placeholder="e.g., MATH101"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newCourse.description}
                      onChange={(e) =>
                        setNewCourse((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Enter course description..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Assignment Information Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-6 uppercase tracking-wide flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Assignment Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assigned Teacher
                      {isLoadingTeachers && (
                        <span className="ml-2 text-sm text-blue-600">
                          Loading...
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          value={
                            showTeacherDropdown
                              ? teacherSearchTerm
                              : getSelectedTeacherDisplay()
                          }
                          onChange={(e) => {
                            setTeacherSearchTerm(e.target.value);
                            setShowTeacherDropdown(true);
                          }}
                          onFocus={() => {
                            setShowTeacherDropdown(true);
                            setTeacherSearchTerm("");
                          }}
                          onBlur={() => {
                            setTimeout(
                              () => setShowTeacherDropdown(false),
                              150
                            );
                          }}
                          placeholder={
                            isLoadingTeachers
                              ? "Loading teachers..."
                              : teachers.length === 0
                              ? "No teachers available"
                              : "Search and select a teacher..."
                          }
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400"
                          disabled={isLoadingTeachers || teachers.length === 0}
                        />
                      </div>
                      {showTeacherDropdown &&
                        !isLoadingTeachers &&
                        teachers.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            <div
                              onClick={() => {
                                setNewCourse((prev) => ({
                                  ...prev,
                                  teacherId: "",
                                }));
                                setTeacherSearchTerm("");
                                setShowTeacherDropdown(false);
                              }}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 text-gray-500 text-sm"
                            >
                              Clear selection
                            </div>
                            {filteredTeachers.length > 0 ? (
                              filteredTeachers.map((teacher) => (
                                <div
                                  key={teacher._id}
                                  onClick={() => {
                                    setNewCourse((prev) => ({
                                      ...prev,
                                      teacherId: teacher._id,
                                    }));
                                    setTeacherSearchTerm("");
                                    setShowTeacherDropdown(false);
                                  }}
                                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors"
                                >
                                  <div className="font-medium text-gray-900">
                                    {teacher.firstName} {teacher.lastName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {teacher.email}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-gray-500 text-sm">
                                No teachers found matching "{teacherSearchTerm}"
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                    {!isLoadingTeachers && teachers.length === 0 && (
                      <div className="flex items-start space-x-2 mt-2 p-3 bg-gray-50 rounded-xl">
                        <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div className="text-sm text-gray-600">
                          No teachers found. Please add teachers first.
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class
                    </label>
                    {mode === "edit" ? (
                      // In edit mode, show the class as read-only
                      <div>
                        <input
                          type="text"
                          value={getSelectedClassDisplay()}
                          readOnly
                          disabled
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl cursor-not-allowed text-gray-500"
                          placeholder="Class is fixed for existing courses"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Class cannot be changed for existing courses
                        </p>
                      </div>
                    ) : (
                      // In add mode, show the searchable dropdown
                      <div className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            type="text"
                            value={
                              showClassDropdown
                                ? classSearchTerm
                                : getSelectedClassDisplay()
                            }
                            onChange={(e) => {
                              setClassSearchTerm(e.target.value);
                              setShowClassDropdown(true);
                            }}
                            onFocus={() => {
                              setShowClassDropdown(true);
                              setClassSearchTerm("");
                            }}
                            onBlur={() => {
                              setTimeout(
                                () => setShowClassDropdown(false),
                                150
                              );
                            }}
                            placeholder={
                              classes.length === 0
                                ? "No classes available"
                                : "Search and select a class..."
                            }
                            className="pl-10"
                            disabled={classes.length === 0}
                          />
                        </div>
                        {showClassDropdown && classes.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-md max-h-60 overflow-y-auto">
                            <div
                              onClick={() => {
                                setNewCourse((prev) => ({
                                  ...prev,
                                  classId: "",
                                }));
                                setClassSearchTerm("");
                                setShowClassDropdown(false);
                              }}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b text-gray-500"
                            >
                              Clear selection
                            </div>
                            {filteredClasses.length > 0 ? (
                              filteredClasses.map((cls) => (
                                <div
                                  key={cls._id}
                                  onClick={() => {
                                    setNewCourse((prev) => ({
                                      ...prev,
                                      classId: cls._id,
                                    }));
                                    setClassSearchTerm("");
                                    setShowClassDropdown(false);
                                  }}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                >
                                  <div className="font-medium">{cls.name}</div>
                                  <div className="text-sm text-gray-500">
                                    Grade {cls.gradeLevel}{" "}
                                    {cls.section
                                      ? `- Section ${cls.section}`
                                      : ""}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-gray-500">
                                No classes found matching "{classSearchTerm}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    {classes.length === 0 && (
                      <div className="flex items-start space-x-2 mt-2 p-3 bg-gray-50 rounded-xl">
                        <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div className="text-sm text-gray-600">
                          No classes found. Please add classes first.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={
                  isSubmitting || !newCourse.title || !newCourse.courseCode
                }
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "add" ? "Creating..." : "Updating..."}
                  </>
                ) : (
                  <>{mode === "add" ? "Create Course" : "Update Course"}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseModal;
