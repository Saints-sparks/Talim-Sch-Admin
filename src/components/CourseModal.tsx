"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Search, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full max-h-[90vh] overflow-y-auto bg-white">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              {mode === "add" ? "Add New Course" : "Edit Course"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "add" && subjectName
                ? `Create a new course for ${subjectName}`
                : mode === "add"
                ? "Create a new course"
                : "Update the course information"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course-title">
                Course Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="course-title"
                type="text"
                value={newCourse.title}
                onChange={(e) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="e.g., Algebra I"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-code">
                Course Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="course-code"
                type="text"
                value={newCourse.courseCode}
                onChange={(e) =>
                  setNewCourse((prev) => ({
                    ...prev,
                    courseCode: e.target.value,
                  }))
                }
                placeholder="e.g., MATH101"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-description">Description</Label>
            <Textarea
              id="course-description"
              value={newCourse.description}
              onChange={(e) =>
                setNewCourse((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Enter course description..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned-teacher">
              Assigned Teacher
              {isLoadingTeachers && (
                <span className="ml-2 text-sm text-primary">Loading...</span>
              )}
            </Label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
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
                    setTimeout(() => setShowTeacherDropdown(false), 150);
                  }}
                  placeholder={
                    isLoadingTeachers
                      ? "Loading teachers..."
                      : teachers.length === 0
                      ? "No teachers available"
                      : "Search and select a teacher..."
                  }
                  className="pl-10"
                  disabled={isLoadingTeachers || teachers.length === 0}
                />
              </div>
              {showTeacherDropdown &&
                !isLoadingTeachers &&
                teachers.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-md max-h-60 overflow-y-auto">
                    <div
                      onClick={() => {
                        setNewCourse((prev) => ({
                          ...prev,
                          teacherId: "",
                        }));
                        setTeacherSearchTerm("");
                        setShowTeacherDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b text-gray-500"
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
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <div className="font-medium">
                            {teacher.firstName} {teacher.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {teacher.email}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500">
                        No teachers found matching "{teacherSearchTerm}"
                      </div>
                    )}
                  </div>
                )}
            </div>
            {!isLoadingTeachers && teachers.length === 0 && (
              <div className="flex items-start space-x-2 mt-2 p-3 bg-gray-100 rounded-md">
                <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="text-sm text-gray-600">
                  No teachers found. Please add teachers first.
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned-class">Class</Label>
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
                    setTimeout(() => setShowClassDropdown(false), 150);
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
                      setNewCourse((prev) => ({ ...prev, classId: "" }));
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
                          {cls.section ? `- Section ${cls.section}` : ""}
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
            {classes.length === 0 && (
              <div className="flex items-start space-x-2 mt-2 p-3 bg-gray-100 rounded-md">
                <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="text-sm text-gray-600">
                  No classes found. Please add classes first.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !newCourse.title || !newCourse.courseCode}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "add" ? "Creating..." : "Updating..."}
              </>
            ) : (
              <>{mode === "add" ? "Create Course" : "Update Course"}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CourseModal;
