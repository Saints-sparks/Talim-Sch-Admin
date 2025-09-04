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
  Users,
  Filter,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  <div className="flex flex-col h-screen bg-background">
    <div className="flex-shrink-0">
      <Header />
    </div>
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
  const [courseMode, setCourseMode] = useState<"add" | "edit">("add");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [activeSubjectForCourse, setActiveSubjectForCourse] =
    useState<Subject | null>(null);

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
    classId: "",
    subjectId: "",
  });

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
    setCourseMode("add");
    setSelectedCourse(null);
    setActiveSubjectForCourse(subject);

    // Reset search states
    setTeacherSearchTerm("");
    setClassSearchTerm("");
    setShowTeacherDropdown(false);
    setShowClassDropdown(false);

    setNewCourse({
      title: "",
      description: "",
      courseCode: "",
      teacherId: "",
      classId: subject.classId || "",
      subjectId: subject._id,
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

  const openEditCourseModal = async (course: Course) => {
    setCourseMode("edit");
    setSelectedCourse(course);

    // Reset search states
    setTeacherSearchTerm("");
    setClassSearchTerm("");
    setShowTeacherDropdown(false);
    setShowClassDropdown(false);

    setNewCourse({
      title: course.title,
      description: course.description,
      courseCode: course.courseCode,
      teacherId: course.teacherId || "",
      classId: course.classId || "",
      subjectId: course.subjectId,
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
      if (typeof window === "undefined" || !mounted) return;

      if (courseMode === "add") {
        await createCourse(newCourse);
      } else if (selectedCourse) {
        await updateCourseService(selectedCourse._id, newCourse);
      }

      toast.success(
        `Course ${courseMode === "add" ? "created" : "updated"} successfully!`
      );
      closeCourseModal();
      fetchSubjects(); // This will now fetch subjects with their courses
    } catch (error: any) {
      console.error(`Error ${courseMode}ing course:`, error);
      toast.error(error.message || `Failed to ${courseMode} course`);
    } finally {
      setIsSubmittingCourse(false);
    }
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

  // Course modal management
  const closeCourseModal = () => {
    setShowCourseModal(false);
    setTeacherSearchTerm("");
    setClassSearchTerm("");
    setShowTeacherDropdown(false);
    setShowClassDropdown(false);
    setIsLoadingTeachers(false);
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

  // Filter functions for searchable dropdowns
  const filteredTeachers = teachers.filter((teacher) => {
    // Add null checks to prevent errors
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
    <div className="flex flex-col h-screen bg-background">
      {/* Fixed Header */}
      <div className="flex-shrink-0">
        <Header />
      </div>

      {/* Fixed Title and Controls */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/curriculum")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
              </Button>
              <div className="hidden sm:block w-px h-6 bg-border" />
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Curriculum Structure
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage subjects and their associated courses
                </p>
              </div>
            </div>
            <Button onClick={openAddSubjectModal} className="sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Subject
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col space-y-4 mt-6 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Subjects List */}
            {filteredSubjects.length > 0 ? (
              <div className="space-y-6">
                {filteredSubjects.map((subject) => (
                  <Card key={subject._id} className="overflow-hidden">
                    {/* Subject Header */}
                    <CardHeader className="pb-4">
                      <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                        <div className="flex items-start space-x-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                            <BookOpen className="h-6 w-6 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-xl">
                              {subject.name}
                            </CardTitle>
                            <CardDescription className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">
                                Code: {subject.code}
                              </Badge>
                              <span className="hidden sm:inline">•</span>
                              <span className="text-sm">
                                Class: {getClassName(subject.classId || "")}
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openAddCourseModal(subject)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Course
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditSubjectModal(subject)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSubject(subject._id)}
                            className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Courses */}
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Courses</h3>
                          {subject.courses && subject.courses.length > 0 && (
                            <Badge variant="secondary">
                              {subject.courses.length} course
                              {subject.courses.length !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>

                        {subject.courses && subject.courses.length > 0 ? (
                          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {subject.courses.map((course) => (
                              <Card
                                key={course._id}
                                className="group hover:shadow-md transition-all duration-200 border-2 hover:border-primary/20"
                              >
                                <CardHeader className="pb-3">
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1 mr-2">
                                      <CardTitle className="text-base line-clamp-1">
                                        {course.title}
                                      </CardTitle>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {course.courseCode}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          openEditCourseModal(course)
                                        }
                                        className="h-8 w-8 p-0"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleDeleteCourse(course._id)
                                        }
                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </CardHeader>

                                <CardContent className="pt-0 space-y-3">
                                  {course.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {course.description}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                    <Users className="w-3 h-3" />
                                    <span className="line-clamp-1">
                                      {getTeacherName(course.teacherId || "")}
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                              <GraduationCap className="w-12 h-12 text-muted-foreground mb-4" />
                              <h4 className="font-semibold mb-2">
                                No courses yet
                              </h4>
                              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                                Start building your curriculum by adding the
                                first course to this subject.
                              </p>
                              <Button
                                onClick={() => openAddCourseModal(subject)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add First Course
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <BookOpen className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold">
                    {searchTerm || selectedClass !== "all"
                      ? "No subjects found"
                      : "No subjects yet"}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                    {searchTerm || selectedClass !== "all"
                      ? "Try adjusting your search or filters to find what you're looking for."
                      : "Get started by creating your first subject to begin building your curriculum structure."}
                  </p>
                  {!searchTerm && selectedClass === "all" && (
                    <Button onClick={openAddSubjectModal} className="mt-6">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Subject
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Subject Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">
                  {subjectMode === "add" ? "Add New Subject" : "Edit Subject"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {subjectMode === "add"
                    ? "Create a new subject to organize your courses."
                    : "Update the subject information."}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSubjectModal(false)}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject-name">
                  Subject Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subject-name"
                  type="text"
                  value={newSubject.name}
                  onChange={(e) =>
                    setNewSubject((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Mathematics"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject-code">
                  Subject Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subject-code"
                  type="text"
                  value={newSubject.code}
                  onChange={(e) =>
                    setNewSubject((prev) => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="e.g., MATH"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject-class">Class (Optional)</Label>
                <Select
                  value={newSubject.classId}
                  onValueChange={(value) =>
                    setNewSubject((prev) => ({ ...prev, classId: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No class assigned</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls._id} value={cls._id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowSubjectModal(false)}
                disabled={isSubmittingSubject}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubjectSubmit}
                disabled={
                  isSubmittingSubject || !newSubject.name || !newSubject.code
                }
              >
                {isSubmittingSubject ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {subjectMode === "add" ? "Creating..." : "Updating..."}
                  </>
                ) : (
                  <>
                    {subjectMode === "add"
                      ? "Create Subject"
                      : "Update Subject"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">
                  {courseMode === "add" ? "Add New Course" : "Edit Course"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {activeSubjectForCourse && courseMode === "add"
                    ? `Create a new course for ${activeSubjectForCourse.name}`
                    : courseMode === "add"
                    ? "Create a new course for this subject"
                    : "Update the course information"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => closeCourseModal()}
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
                    <span className="ml-2 text-sm text-primary">
                      Loading...
                    </span>
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
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto">
                        <div
                          onClick={() => {
                            setNewCourse((prev) => ({
                              ...prev,
                              teacherId: "",
                            }));
                            setTeacherSearchTerm("");
                            setShowTeacherDropdown(false);
                          }}
                          className="px-3 py-2 hover:bg-accent cursor-pointer border-b text-muted-foreground"
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
                              className="px-3 py-2 hover:bg-accent cursor-pointer"
                            >
                              <div className="font-medium">
                                {teacher.firstName} {teacher.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {teacher.email}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-muted-foreground">
                            No teachers found matching "{teacherSearchTerm}"
                          </div>
                        )}
                      </div>
                    )}
                </div>
                {!isLoadingTeachers && teachers.length === 0 && (
                  <div className="flex items-start space-x-2 mt-2 p-3 bg-muted rounded-md">
                    <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
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
                    <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-y-auto">
                      <div
                        onClick={() => {
                          setNewCourse((prev) => ({ ...prev, classId: "" }));
                          setClassSearchTerm("");
                          setShowClassDropdown(false);
                        }}
                        className="px-3 py-2 hover:bg-accent cursor-pointer border-b text-muted-foreground"
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
                            className="px-3 py-2 hover:bg-accent cursor-pointer"
                          >
                            <div className="font-medium">{cls.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Grade {cls.gradeLevel}{" "}
                              {cls.section ? `- Section ${cls.section}` : ""}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-muted-foreground">
                          No classes found matching "{classSearchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {classes.length === 0 && (
                  <div className="flex items-start space-x-2 mt-2 p-3 bg-muted rounded-md">
                    <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      No classes found. Please add classes first.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => closeCourseModal()}
                disabled={isSubmittingCourse}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCourseSubmit}
                disabled={
                  isSubmittingCourse ||
                  !newCourse.title ||
                  !newCourse.courseCode
                }
              >
                {isSubmittingCourse ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {courseMode === "add" ? "Creating..." : "Updating..."}
                  </>
                ) : (
                  <>
                    {courseMode === "add" ? "Create Course" : "Update Course"}
                  </>
                )}
              </Button>
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
