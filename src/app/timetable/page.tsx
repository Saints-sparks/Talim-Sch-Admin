"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/CustomToast";
import { API_ENDPOINTS } from "@/app/lib/api/config";
import { RefreshCw } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { BookOpen, Copy, Download, Flash, Trash } from "@/components/Icons";
import { Tooltip } from "@/components/ui/Tooltip";
import * as XLSX from "xlsx";

interface TimetableEntry {
  _id?: string;
  time: string;
  startTime: string;
  startTIme?: string; // Handle legacy backend typo
  endTime: string;
  course: string;
  subject: string;
  class: string;
  courseId: string;
  subjectId: string;
  day: string;
  teacherName?: string;
}

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Course {
  _id: string;
  title: string;
  description?: string;
  subjectId: string | { _id: string; name?: string; code?: string };
  teacherId?:
    | string
    | {
        _id?: string;
        userId?: {
          firstName?: string;
          lastName?: string;
          email?: string;
        };
      };
  courseCode?: string;
}

interface Class {
  _id: string;
  name: string;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  courses?: Course[];
}

const Timetable = () => {
  // State management
  const [selectedClass, setSelectedClass] = useState("2025/2026 - First Term");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<
    Record<string, TimetableEntry[]>
  >({});
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(false);
  const [timetableError, setTimetableError] = useState<string | null>(null);
  const [noTimetable, setNoTimetable] = useState(false);
  const [draggedCourse, setDraggedCourse] = useState<Course | null>(null);
  // Ref so getCourseTeacherName always reads the latest teacher data even inside
  // async callbacks that captured a stale closure.
  const teacherMapRef = React.useRef<Map<string, string>>(new Map());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingEntry, setIsCreatingEntry] = useState(false);
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [visibleDays, setVisibleDays] = useState([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ]);
  const [formData, setFormData] = useState({
    day: "",
    startTime: "",
    endTime: "",
    courseId: "",
  });

  // Time slots configuration - extending to 3pm
  const timeSlots = [
    { label: "8:00 - 9:00", start: "8:00", end: "9:00" },
    { label: "9:00 - 10:00", start: "9:00", end: "10:00" },
    { label: "10:00 - 11:00", start: "10:00", end: "11:00" },
    { label: "11:00 - 12:00", start: "11:00", end: "12:00" },
    { label: "12:00 - 13:00", start: "12:00", end: "13:00" },
    { label: "13:00 - 14:00", start: "13:00", end: "14:00" },
    { label: "14:00 - 15:00", start: "14:00", end: "15:00" },
  ];

  // Get a color scheme for each course
  const getColorScheme = (index?: number) => {
    const colors = [
      {
        bg: "bg-[#FAEBEB]",
        border: "border-[#CC3333]",
        dash: "border-dashed",
      },
      {
        bg: "bg-[#FF9933]/15",
        border: "border-[#FF9933]",
        dash: "border-dashed",
      },
      {
        bg: "bg-[#D6EDE1]",
        border: "border-[#2E8B57]",
        dash: "border-dashed",
      },
      {
        bg: "bg-[#6A5ACD]/15",
        border: "border-[#6A5ACD]",
        dash: "border-dashed",
      },
      {
        bg: "bg-[#FFF7E5]",
        border: "border-[#FFB400]",
        dash: "border-dashed",
      },
    ];

    // Handle undefined or null index
    if (index === undefined || index === null) {
      return colors[0]; // Return default color scheme
    }

    // Use the provided index (should already be random from caller)
    return colors[index % colors.length];
  };

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const getCourseSubjectId = (course: Course) =>
    typeof course.subjectId === "string" ? course.subjectId : course.subjectId?._id;

  const getCourseSubjectName = (course: Course) =>
    typeof course.subjectId === "string"
      ? "Subject"
      : course.subjectId?.name || course.subjectId?.code || "Subject";

  const getCourseTeacherName = (course?: Course | null) => {
    if (!course?.teacherId) return "Unassigned";

    // teacherId is a plain string ID — look it up in the teacher map ref (always current)
    if (typeof course.teacherId === "string") {
      return teacherMapRef.current.get(course.teacherId) || "Unassigned";
    }

    // teacherId is a populated object
    const user = course.teacherId.userId;
    const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
    return name || user?.email || "Unassigned";
  };

  const normalizeTimeForDisplay = (time: string) => {
    if (!time) return "";
    if (time.includes("AM") || time.includes("PM")) return time;
    const [hourStr, minute = "00"] = time.split(":");
    return `${hourStr.padStart(2, "0")}:${minute}`;
  };

  const formatSlotTimeForApi = (time: string) => {
    const [hourStr, minute = "00"] = time.split(":");
    return `${hourStr.padStart(2, "0")}:${minute}`;
  };

  const buildLocalEntry = (
    savedEntry: any,
    course: Course,
    day: string,
    startTime: string,
    endTime: string
  ): TimetableEntry => ({
    _id: savedEntry?._id,
    time: `${startTime} - ${endTime}`,
    startTime,
    endTime,
    course: course.title,
    subject: getCourseSubjectName(course),
    class: selectedClassId,
    courseId: course._id,
    subjectId: getCourseSubjectId(course) || "",
    day,
    teacherName: getCourseTeacherName(course),
  });

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const fetchClasses = useCallback(async () => {
    setIsLoadingClasses(true);
    try {
      const response = await apiClient.get(API_ENDPOINTS.GET_CLASSES);
      if (!response.ok) throw new Error("Failed to fetch classes");
      const classesData = await response.json();
      const classesArray = Array.isArray(classesData)
        ? classesData
        : classesData.data || [];
      setClasses(classesArray);

      if (classesArray.length > 0 && !selectedClassId) {
        setSelectedClassId(classesArray[0]._id);
      }
    } catch (error: any) {
      console.error("Error fetching classes:", error);
      toast.error(error.message || "Failed to load classes");
    } finally {
      setIsLoadingClasses(false);
    }
  }, [selectedClassId]);

  const fetchCoursesByClass = useCallback(async () => {
    if (!selectedClassId) return;

    setIsLoadingSubjects(true);
    try {
      const [coursesResponse, teachersResponse] = await Promise.all([
        apiClient.get(API_ENDPOINTS.GET_COURSES_BY_CLASS(selectedClassId)),
        apiClient.get(API_ENDPOINTS.GET_TEACHERS),
      ]);

      if (!coursesResponse.ok) throw new Error("Failed to fetch courses for class");

      const coursesData = await coursesResponse.json();
      const coursesArray = Array.isArray(coursesData)
        ? coursesData
        : coursesData.data || [];

      // Build a teacher ID → display name map so getCourseTeacherName
      // can resolve plain string teacherIds without a populated object.
      if (teachersResponse.ok) {
        const teachersData = await teachersResponse.json();
        const teachersArray = Array.isArray(teachersData)
          ? teachersData
          : teachersData.data || [];
        const map = new Map<string, string>();
        teachersArray.forEach((t: any) => {
          const userId = t._id || t.id;
          if (!userId) return;
          // Teacher records have userId nested with firstName/lastName
          const user = typeof t.userId === "object" ? t.userId : null;
          const firstName = user?.firstName || t.firstName || "";
          const lastName = user?.lastName || t.lastName || "";
          const name = `${firstName} ${lastName}`.trim() || t.email || "Teacher";
          map.set(userId, name);
          // Also index by the inner userId string in case teacherId matches it
          if (user?._id) map.set(user._id, name);
        });
        teacherMapRef.current = map;
      }

      const subjectsMap = new Map<string, Subject>();
      coursesArray.forEach((course: Course) => {
        const subjectId = getCourseSubjectId(course);
        if (!subjectId) return;
        if (!subjectsMap.has(subjectId)) {
          subjectsMap.set(subjectId, {
            _id: subjectId,
            name: getCourseSubjectName(course),
            code:
              typeof course.subjectId === "string"
                ? ""
                : course.subjectId?.code || "",
            courses: [],
          });
        }
        subjectsMap.get(subjectId)?.courses?.push(course);
      });

      setSubjects(Array.from(subjectsMap.values()));
      setCourses(coursesArray);
    } catch (error: any) {
      console.error("Error fetching courses for class:", error);
      toast.error(error.message || "Failed to load courses for this class");
    } finally {
      setIsLoadingSubjects(false);
    }
  }, [selectedClassId]);

  const fetchTimetableByClass = useCallback(
    async (showToast = false) => {
      if (!selectedClassId) return;

      setIsLoadingTimetable(true);
      setTimetableError(null);
      setNoTimetable(false);

      try {
        const res = await apiClient.get(
          API_ENDPOINTS.GET_TIMETABLE_BY_CLASS(selectedClassId)
        );

        if (res.status === 404) {
          setTimetableEntries({});
          setNoTimetable(true);
          setTimetableError(null);
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch timetable");

        const data = await res.json();
        const formattedTimetable = Object.keys(data).reduce((acc, day) => {
          acc[day] = data[day].map((entry: any) => {
            // Resolve teacherName from the teacher map when the backend omits it
            // or when it still shows as "Unassigned teacher"
            let teacherName = entry.teacherName;
            if (!teacherName || teacherName === "Unassigned teacher" || teacherName === "Unassigned") {
              // Try to look up by courseId in the loaded courses list
              const matchedCourse = courses.find((c) => c._id === entry.courseId);
              if (matchedCourse) {
                teacherName = getCourseTeacherName(matchedCourse);
              }
            }
            return {
              ...entry,
              startTime: entry.startTime || entry.startTIme,
              teacherName: teacherName || "Unassigned",
            };
          });
          return acc;
        }, {} as Record<string, TimetableEntry[]>);

        setTimetableEntries(formattedTimetable);
        setNoTimetable(Object.keys(formattedTimetable).length === 0);
        if (showToast) toast.success("Timetable refreshed");
      } catch (error: any) {
        console.error("Error fetching timetable:", error);
        setTimetableError(error.message || "Failed to fetch timetable");
        toast.error(error.message || "Failed to fetch timetable");
      } finally {
        setIsLoadingTimetable(false);
      }
    },
    [selectedClassId]
  );

  const refreshTimetablePage = useCallback(async () => {
    await Promise.all([fetchClasses(), fetchCoursesByClass(), fetchTimetableByClass(true)]);
  }, [fetchClasses, fetchCoursesByClass, fetchTimetableByClass]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    fetchCoursesByClass().then(() => fetchTimetableByClass());
  }, [fetchCoursesByClass, fetchTimetableByClass]);

  // Drag and drop handlers
  const handleDragStart = (course: Course) => {
    setDraggedCourse(course);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (
    e: React.DragEvent,
    day: string,
    timeSlot: (typeof timeSlots)[0]
  ) => {
    e.preventDefault();

    if (!draggedCourse || !selectedClassId) return;

    try {
      const payload = {
        classId: selectedClassId,
        courseId: draggedCourse._id,
        day,
        startTime: formatSlotTimeForApi(timeSlot.start),
        endTime: formatSlotTimeForApi(timeSlot.end),
      };

      const res = await apiClient.post(
        API_ENDPOINTS.CREATE_TIMETABLE_ENTRY,
        payload
      );
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to create timetable entry");
      }
      const savedEntry = await res.json();

      const startTime = formatSlotTimeForApi(timeSlot.start);
      const endTime = formatSlotTimeForApi(timeSlot.end);
      const newEntry = buildLocalEntry(savedEntry, draggedCourse, day, startTime, endTime);

      setTimetableEntries((prev) => ({
        ...prev,
        [day]: [...(prev[day] || []), newEntry],
      }));
      setNoTimetable(false);

      // Show success message
      toast.success(`${draggedCourse.title} added to ${day} at ${timeSlot.label}`);
    } catch (error: any) {
      console.error("Error adding timetable entry:", error);
      toast.error(error.message || "Failed to add timetable entry");
    } finally {
      setDraggedCourse(null);
    }
  };

  // Get entry for a specific time slot
  const getEntryForSlot = (day: string, timeSlot: (typeof timeSlots)[0]) => {
    const dayEntries = timetableEntries[day] || [];

    // Helper function to convert 12-hour format to 24-hour format for comparison
    const convertTo24Hour = (time12h: string) => {
      const [time, modifier] = time12h.split(" ");
      let [hours, minutes] = time.split(":");
      if (hours === "12") {
        hours = "00";
      }
      if (modifier === "PM" && hours !== "12") {
        hours = (parseInt(hours, 10) + 12).toString();
      }
      if (modifier === "AM" && hours === "12") {
        hours = "00";
      }
      // Remove leading zero for single digit hours to match our timeSlot format
      return `${parseInt(hours, 10)}:${minutes}`;
    };

    // Helper function to normalize time format (remove leading zeros)
    const normalizeTime = (timeStr: string) => {
      if (!timeStr) return "";
      // Handle AM/PM format
      if (timeStr.includes("AM") || timeStr.includes("PM")) {
        return convertTo24Hour(timeStr);
      }
      // Handle 24-hour format - remove leading zeros
      const [hours, minutes] = timeStr.split(":");
      return `${parseInt(hours, 10)}:${minutes}`;
    };

    return dayEntries.find((entry) => {
      const entryStart = normalizeTime(entry.startTIme || entry.startTime);
      const entryEnd = normalizeTime(entry.endTime);
      const slotStart = timeSlot.start;
      const slotEnd = timeSlot.end;

      return entryStart === slotStart && entryEnd === slotEnd;
    });
  };

  // Remove entry from timetable
  const removeEntry = async (day: string, timeSlot: (typeof timeSlots)[0]) => {
    try {
      const dayEntries = timetableEntries[day] || [];

      // Find the entry that matches this time slot using the same logic as getEntryForSlot
      const entryToDelete = dayEntries.find((entry) => {
        const entryStart = normalizeTime(entry.startTIme || entry.startTime);
        const entryEnd = normalizeTime(entry.endTime);
        const slotStart = timeSlot.start;
        const slotEnd = timeSlot.end;

        return entryStart === slotStart && entryEnd === slotEnd;
      });

      if (!entryToDelete) {
        toast.error("Entry not found");
        return;
      }

      // Helper function to normalize time format (same as in getEntryForSlot)
      function normalizeTime(timeStr: string) {
        if (!timeStr) return "";
        // Handle AM/PM format
        if (timeStr.includes("AM") || timeStr.includes("PM")) {
          const [time, modifier] = timeStr.split(" ");
          let [hours, minutes] = time.split(":");
          if (hours === "12") {
            hours = "00";
          }
          if (modifier === "PM" && hours !== "12") {
            hours = (parseInt(hours, 10) + 12).toString();
          }
          if (modifier === "AM" && hours === "12") {
            hours = "00";
          }
          // Remove leading zero for single digit hours to match our timeSlot format
          return `${parseInt(hours, 10)}:${minutes}`;
        }
        // Handle 24-hour format - remove leading zeros
        const [hours, minutes] = timeStr.split(":");
        return `${parseInt(hours, 10)}:${minutes}`;
      }

      if (!entryToDelete._id) {
        toast.error("This timetable entry cannot be deleted because its ID is missing");
        return;
      }

      const deleteRes = await apiClient.delete(
        API_ENDPOINTS.DELETE_TIMETABLE_ENTRY(entryToDelete._id)
      );
      if (!deleteRes.ok) {
        const errorData = await deleteRes.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to delete timetable entry");
      }

      // Update local state - remove the specific entry
      setTimetableEntries((prev) => ({
        ...prev,
        [day]: (prev[day] || []).filter((entry) => entry !== entryToDelete),
      }));

      toast.success("Entry removed from timetable");
    } catch (error: any) {
      console.error("Error removing timetable entry:", error);
      toast.error(error.message || "Failed to remove timetable entry");
    }
  };

  const formatTime = (timeStr: string): string => {
    const [hourStr, minute] = timeStr.split(":");
    let hour = Number(hourStr);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    const formattedHour = hour < 10 ? `0${hour}` : hour.toString();
    return `${formattedHour}:${minute} ${ampm}`;
  };

  const handleCreateEntryFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) {
      toast.error("Please select a class first");
      return;
    }

    const selectedCourse = courses.find((course) => course._id === formData.courseId);
    if (!selectedCourse) {
      toast.error("Please select a subject/course");
      return;
    }

    if (!formData.day || !formData.startTime || !formData.endTime) {
      toast.error("Please fill all timetable fields");
      return;
    }

    setIsCreatingEntry(true);
    try {
      const payload = {
        classId: selectedClassId,
        courseId: selectedCourse._id,
        day: formData.day,
        startTime: formData.startTime,
        endTime: formData.endTime,
      };

      const res = await apiClient.post(API_ENDPOINTS.CREATE_TIMETABLE_ENTRY, payload);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to create timetable entry");
      }

      const savedEntry = await res.json();
      const newEntry = buildLocalEntry(
        savedEntry,
        selectedCourse,
        formData.day,
        formData.startTime,
        formData.endTime
      );

      setTimetableEntries((prev) => ({
        ...prev,
        [formData.day]: [...(prev[formData.day] || []), newEntry],
      }));
      setNoTimetable(false);
      setIsModalOpen(false);
      setFormData({ day: "", startTime: "", endTime: "", courseId: "" });
      toast.success("Timetable entry added");
    } catch (error: any) {
      toast.error(error.message || "Failed to create timetable entry");
    } finally {
      setIsCreatingEntry(false);
    }
  };

  const applyTemplate = async () => {
    if (!selectedClassId) {
      toast.error("Please select a class first");
      return;
    }
    if (courses.length === 0) {
      toast.error("No courses available for this class");
      return;
    }
    if (Object.values(timetableEntries).some((entries) => entries.length > 0)) {
      const shouldContinue = window.confirm(
        "This will add template entries to the current timetable. Existing entries will be kept. Continue?"
      );
      if (!shouldContinue) return;
    }

    setIsApplyingTemplate(true);
    let createdCount = 0;
    try {
      for (let dayIndex = 0; dayIndex < weekDays.length; dayIndex += 1) {
        const day = weekDays[dayIndex];
        for (let slotIndex = 0; slotIndex < Math.min(timeSlots.length, courses.length); slotIndex += 1) {
          const course = courses[(slotIndex + dayIndex) % courses.length];
          const slot = timeSlots[slotIndex];
          const res = await apiClient.post(API_ENDPOINTS.CREATE_TIMETABLE_ENTRY, {
            classId: selectedClassId,
            courseId: course._id,
            day,
            startTime: formatSlotTimeForApi(slot.start),
            endTime: formatSlotTimeForApi(slot.end),
          });

          if (res.ok) {
            createdCount += 1;
          }
        }
      }

      await fetchTimetableByClass();
      if (createdCount > 0) {
        toast.success(`Template applied with ${createdCount} timetable entries`);
      } else {
        toast.info("No template entries were added. The timetable may already be full or have conflicts.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to apply timetable template");
      await fetchTimetableByClass();
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  // Skeleton loader component
  const TimetableSkeleton = () => (
    <div className="bg-white rounded-2xl border border-[#F0F0F0]">
      {/* Grid Header Skeleton */}
      <div className="grid grid-cols-6 border-b border-gray-200">
        <div className="p-4">
          <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
        </div>
        {weekDays.map((day) => (
          <div key={day} className="p-4 text-center">
            <div className="h-5 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Grid Body Skeleton */}
      {timeSlots.map((timeSlot, timeIndex) => (
        <div
          key={timeSlot.label}
          className="grid grid-cols-6 border-b border-[#F0F0F0] last:border-b-0"
        >
          <div className="p-4 border-r border-[#F0F0F0] flex items-center justify-center">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
          {weekDays.map((day) => (
            <div
              key={`${day}-${timeSlot.label}`}
              className="p-2 border-r border-[#F0F0F0] last:border-r-0 h-[121px]"
            >
              <div className="h-full border border-dashed border-[#E0E0E0] bg-[#F8F8F8] rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-12 bg-gray-100 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Loading message at bottom */}
      <div className="text-center py-6 border-t border-[#F0F0F0]">
        <div className="flex items-center justify-center gap-2 text-[#4D4D4D]">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-[15px] font-medium">Loading timetable...</span>
        </div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="bg-white rounded-2xl border border-[#F0F0F0]">
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="w-16 h-16 border-2 border-[#E0E0E0] rounded-lg flex items-center justify-center mb-6 bg-[#F8F8F8]">
          <svg
            className="w-8 h-8 text-[#4D4D4D]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-[19px] font-semibold text-[#1A1A1A] mb-3">
          No Class Selected
        </h3>
        <p className="text-[#4D4D4D] text-center max-w-md mb-8 text-[15px] leading-relaxed">
          Please select a class from the dropdown above to view the timetable
          schedule and start managing your class sessions.
        </p>
        <div className="text-center">
          <div className="text-[13px] text-[#808080] font-medium">
            Select a class to get started
          </div>
        </div>
      </div>
    </div>
  );

  // NEW: Friendly "no timetable yet" state — replace placeholder SVG with the one you'll provide
  const NoTimetableState = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="mb-6">
          {/* Replace the <svg> below with your provided empty-state SVG */}
          <svg
            width="160"
            height="120"
            viewBox="0 0 160 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <rect width="160" height="120" rx="12" fill="#F1F5F9" />
            <g transform="translate(28,28)">
              <rect width="104" height="16" rx="4" fill="#E6EEF9" />
              <rect y="28" width="72" height="12" rx="3" fill="#EBF1F8" />
              <rect y="48" width="84" height="12" rx="3" fill="#EBF1F8" />
              <circle cx="90" cy="40" r="10" fill="#DDEFFD" />
            </g>
          </svg>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          No Timetable Yet
        </h3>
        <p className="text-gray-600 text-center max-w-md mb-6 leading-relaxed">
          It looks like a timetable hasn't been created for this class yet. You
          can create one now — it'll only take a moment.
        </p>
        <div className="flex gap-3">
          <button
            onClick={toggleModal}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-md"
          >
            Add Timetable Entry
          </button>
        </div>
      </div>
    </div>
  );

  // Error panel for real errors (not 404)
  const TimetableErrorPanel = ({ message }: { message: string }) => (
    <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8">
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-red-700 mb-3">
          Error Loading Timetable
        </h3>
        <p className="text-red-600 text-center max-w-md mb-8">{message}</p>
        <button
          onClick={() => {
            setTimetableError(null);
            fetchTimetableByClass(true);
          }}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg"
        >
          Retry
        </button>
      </div>
    </div>
  );

  // Download timetable as Excel file
  const downloadTimetable = () => {
    if (!selectedClassId || Object.keys(timetableEntries).length === 0) {
      toast.error("No timetable data to download");
      return;
    }

    try {
      // Find the selected class name
      const selectedClassName =
        classes.find((cls) => cls._id === selectedClassId)?.name ||
        "Unknown Class";

      // Create worksheet data
      const wsData: any[][] = [];

      // Header row
      const headerRow = ["Time", ...weekDays];
      wsData.push(headerRow);

      // Data rows for each time slot
      timeSlots.forEach((timeSlot) => {
        const row = [timeSlot.label];

        weekDays.forEach((day) => {
          const entry = getEntryForSlot(day, timeSlot);
          if (entry) {
            row.push(
              `${entry.course}\n(${entry.subject})\n${
                entry.teacherName || "Unassigned teacher"
              }`
            );
          } else {
            row.push("");
          }
        });

        wsData.push(row);
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Time column
        { wch: 20 }, // Monday
        { wch: 20 }, // Tuesday
        { wch: 20 }, // Wednesday
        { wch: 20 }, // Thursday
        { wch: 20 }, // Friday
      ];
      ws["!cols"] = colWidths;

      // Set row heights for better readability
      const rowHeights = wsData.map((_, index) => ({
        hpt: index === 0 ? 20 : 60,
      }));
      ws["!rows"] = rowHeights;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Timetable");

      // Generate filename with class name and date
      const fileName = `${selectedClassName}_Timetable_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      // Download file
      XLSX.writeFile(wb, fileName);

      toast.success("Timetable downloaded successfully!");
    } catch (error: any) {
      console.error("Error downloading timetable:", error);
      toast.error("Failed to download timetable");
    }
  };

  return (
    <div className="min-h-screen leading-[120%] p-8">
      {/* Header */}
      <div className=" ">
        <div className="flex items-center justify-between" data-guide="timetable-header">
          <div>
            <h1 className="text-[19px] font-semibold ">Class Timetable</h1>
          </div>
          <div className="flex items-center gap-2" data-guide="timetable-actions">
            <Tooltip content="Reload classes, courses, and the selected class timetable after curriculum changes." side="top">
            <button
              onClick={refreshTimetablePage}
              disabled={isLoadingTimetable || isLoadingSubjects || isLoadingClasses}
              className="bg-white border border-[#E0E0E0] font-semibold rounded-xl h-full flex items-center gap-2 px-4 py-2 text-[#1A1A1A] hover:text-gray-900 transition-colors disabled:opacity-60"
              title="Refresh timetable"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  isLoadingTimetable || isLoadingSubjects || isLoadingClasses
                    ? "animate-spin"
                    : ""
                }`}
              />
            </button>
            </Tooltip>
            <Tooltip content="Download the timetable as an Excel file for printing or sharing." side="top">
            <button
              onClick={downloadTimetable}
              className="bg-white border border-[#E0E0E0] font-semibold rounded-xl h-full flex items-center gap-2 px-2 py-2 text-[#1A1A1A] hover:text-gray-900 transition-colors"
            >
              Download
              <Download />
            </button>
            </Tooltip>
          </div>
        </div>

        {/* Class Selection */}
        <div className=" bg-white gap-4 p-4 mt-4 mb-6 border border-[#F2F2F2] rounded-xl" data-guide="timetable-controls">
          <div className="bg-[#F8F8F8] border border-[#F2F2F2] flex p-6 gap-4 items-center rounded-lg">
            <div className="relative">
              <Tooltip content="This should match the active academic period for the timetable you are building." side="right">
              <label className="block text-[15px] font-semibold text-[#4D4D4D] mb-1">
                Session/Term
              </label>
              </Tooltip>
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="appearance-none border border-[#E0E0E0] bg-transparent rounded-xl px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option>2025/2026 - First Term</option>
                  <option>2025/2026 - Second Term</option>
                  <option>2025/2026 - Third Term</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="relative">
              <Tooltip content="Narrow the timetable to one class." side="right">
              <label className="block text-[15px] font-semibold text-[#4D4D4D] mb-1">
                Class
              </label>
              </Tooltip>
              <div className="relative">
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="appearance-none border border-[#E0E0E0] bg-transparent rounded-xl px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoadingClasses}
                >
                  <option value="">Select a class...</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <Tooltip content="Duplicate this session to another day without re-entering all details." side="top">
            <button
              onClick={applyTemplate}
              disabled={isApplyingTemplate || courses.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-white text-[15px] font-semibold border border-[#E0E0E0] rounded-xl hover:bg-blue-50 transition-colors mt-6 disabled:opacity-60"
            >
              <Copy />
              {isApplyingTemplate ? "Applying..." : "Copy from Template"}
            </button>
            </Tooltip>
            <Tooltip content="Schedule a course session for a specific class, day, and time." side="top">
            <button
              onClick={toggleModal}
              disabled={!selectedClassId || courses.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-[#003366] text-white text-[15px] font-semibold border border-[#003366] rounded-xl hover:bg-[#002244] transition-colors mt-6 disabled:opacity-60"
            >
              Add Entry
            </button>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-4 h-[calc(100vh-200px)]">
        {/* Subjects Sidebar */}
        <div className="w-[182px] bg-white border border-[#F0F0F0] flex flex-col rounded-2xl" data-guide="timetable-subjects">
          <div className="p-4">
            <h2 className="font-semibold text-[15px]">Subject</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {isLoadingSubjects ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-8 bg-gray-100 rounded"></div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-12 h-12 border-2 border-[#E0E0E0] rounded-lg flex items-center justify-center mb-4 bg-[#F8F8F8]">
                  <BookOpen />
                </div>

                <p className="text-[13px] text-[#4D4D4D] text-center leading-relaxed">
                  No courses found for this class.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {courses.map((course) => (
                  <Tooltip
                    key={course._id}
                    content="Drag this course into an empty timetable slot. Its assigned teacher follows it automatically."
                    side="right"
                  >
                  <div
                    draggable
                    onDragStart={() => handleDragStart(course)}
                    className="w-[142px] h-[100px] bg-[#F2F2F2] border border-[#E0E0E0] rounded-xl flex px-2 justify-center flex-col cursor-move hover:bg-gray-100 transition-colors border border-gray-200 hover:shadow-sm"
                  >
                    <BookOpen />
                    <div className="flex items-center gap-2 text-[15px] font-semibold">
                      {course.title}
                    </div>
                    <div className="text-[15px] font-medium mt-1">
                      {getCourseTeacherName(course)}
                    </div>
                  </div>
                  </Tooltip>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="flex-1 overflow-auto" data-guide="timetable-grid">
          {!selectedClassId ? (
            <EmptyState />
          ) : isLoadingTimetable ? (
            <TimetableSkeleton />
          ) : timetableError ? (
            <TimetableErrorPanel message={timetableError} />
          ) : (
            <div className="bg-white rounded-2xl border border-[#F0F0F0]">
              {noTimetable && (
                <div className="mx-4 mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  No timetable yet. Drag a course into a slot, use Add Entry,
                  or copy from the template to get started.
                </div>
              )}
              {/* Grid Header */}
              <div className="grid grid-cols-6 border-b border-gray-200">
                <div className="p-4 font-medium text-[15px] text-[#030E18]">
                  Time
                </div>
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="p-4 font-medium text-[#030E18] text-center text-[15px]  last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid Body */}
              {timeSlots.map((timeSlot, timeIndex) => (
                <div
                  key={timeSlot.label}
                  className="grid grid-cols-6 border-b border-[#F0F0F0]last:border-b-0"
                >
                  <div className="p-4 font-medium text-[#4D4D4D] text-[15px] flex items-center justify-center border-r border-[#F0F0F0]">
                    {timeSlot.label}
                  </div>
                  {weekDays.map((day) => {
                    const entry = getEntryForSlot(day, timeSlot);
                    return (
                      <div
                        key={`${day}-${timeSlot.label}`}
                        className="p-2 border-r border-[#F0F0F0] last:border-r-0 h-[121px] relative"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, day, timeSlot)}
                      >
                        {entry ? (
                          (() => {
                            const colorScheme = getColorScheme(
                              Math.floor(Math.random() * 5)
                            );
                            return (
                              <div
                                className={`${colorScheme.bg} border ${colorScheme.border} ${colorScheme.dash} rounded-lg px-3 py-4 h-full flex flex-col justify-between relative group`}
                              >
                                <BookOpen />

                                <div className="flex  gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div
                                      className={`text-[15px] font-semibold truncate`}
                                    >
                                      {entry.course}
                                    </div>
                                    <div
                                      className={`text-[15px] font-medium truncate`}
                                    >
                                      {entry.teacherName || "Unassigned teacher"}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeEntry(day, timeSlot)}
                                  className="absolute top-2 right-2 w-6 h-6 bg-white text-white rounded-full flex items-center justify-center hover:bg-red-600 "
                                >
                                  <Trash />
                                </button>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="h-full border border-dashed border-[#E0E0E0] bg-[#F2F2F2] rounded-lg flex items-center justify-center hover:border-blue-300 hover:bg-blue-50 transition-colors">
                            <div className="text-[15px] flex flex-col gap-3 text-[#4D4D4D] font-medium justify-center items-center">
                              <Flash />
                              Drop here
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={toggleModal}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-[#030E18]">
                Add Timetable Entry
              </h2>
              <p className="mt-1 text-sm text-[#4D4D4D]">
                Schedule a registered course for the selected class.
              </p>
            </div>

            <form className="space-y-4 p-6" onSubmit={handleCreateEntryFromModal}>
              <div>
                <label className="mb-1 block text-sm font-semibold text-[#4D4D4D]">
                  Subject/Course
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, courseId: e.target.value }))
                  }
                  className="w-full rounded-xl border border-[#E0E0E0] px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.title} - {getCourseTeacherName(course)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-[#4D4D4D]">
                  Day
                </label>
                <select
                  value={formData.day}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, day: e.target.value }))
                  }
                  className="w-full rounded-xl border border-[#E0E0E0] px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a day</option>
                  {weekDays.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Tooltip content="Use 24-hour format (e.g. 09:00 – 10:00). Overlapping entries for the same class will be flagged." side="right">
                  <label className="mb-1 block text-sm font-semibold text-[#4D4D4D]">
                    Start Time
                  </label>
                  </Tooltip>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        startTime: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-[#E0E0E0] px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <Tooltip content="Use 24-hour format (e.g. 09:00 – 10:00). Overlapping entries for the same class will be flagged." side="right">
                  <label className="mb-1 block text-sm font-semibold text-[#4D4D4D]">
                    End Time
                  </label>
                  </Tooltip>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endTime: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-[#E0E0E0] px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={toggleModal}
                  disabled={isCreatingEntry}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingEntry}
                  className="rounded-xl bg-[#003366] px-5 py-2.5 font-semibold text-white hover:bg-[#002244] disabled:opacity-60"
                >
                  {isCreatingEntry ? "Adding..." : "Add Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetable;
