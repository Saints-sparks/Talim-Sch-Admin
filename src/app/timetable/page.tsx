"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/app/lib/api/config"; // adjust import if needed
import { teacherService } from "../services/teacher.service";
import { BookOpen, Calendar, Clock, MapPin, Users } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

interface TimetableEntry {
  time: string;
  startTime: string;
  endTime: string;
  course: string;
  subject: string;
  class: string;
}

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Course {
  _id: string;
  title: string;
}

interface Class {
  _id: string;
  name: string;
}

interface Subject {
  _id: string;
  name: string;
}

const Timetable = () => {
  const hourHeight = 120; // Height for each hour (in pixels)
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(17);
  const [visibleDays, setVisibleDays] = useState([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ]);

  const [manualTime, setManualTime] = useState("10:32");
  const [currentTimePosition, setCurrentTimePosition] = useState(0);

  const [timetableEntries, setTimetableEntries] = useState<
    Record<string, TimetableEntry[]>
  >({});
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [isLoadingClasses, setIsLoadingClasses] = useState(false);
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(false);
  const [timetableError, setTimetableError] = useState<string | null>(null);

  // NEW: friendly flag for "no timetable created" (404)
  const [noTimetable, setNoTimetable] = useState(false);

  const TIME_SLOTS = [
    "08:00 AM - 09:00 AM",
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "12:00 PM - 01:00 PM",
    "01:00 PM - 02:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
    "04:00 PM - 05:00 PM",
  ];
  const [isMobileView, setIsMobileView] = useState(false);

  const parseTime = (timeStr: string): number => {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) {
      hours += 12;
    }
    if (modifier === "AM" && hours === 12) {
      hours = 0;
    }

    return hours + minutes / 60;
  };

  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoadingClasses(true);
      try {
        const response = await apiClient.get(API_ENDPOINTS.GET_CLASSES);

        if (!response.ok) throw new Error("Failed to fetch classes");

        const classesData = await response.json();
        console.log("Classes data:", classesData);

        setClasses(
          Array.isArray(classesData) ? classesData : classesData.data || []
        );
      } catch (error: any) {
        console.error("Error fetching classes:", error);
        toast.error(error.message || "Failed to load classes");
      } finally {
        setIsLoadingClasses(false);
      }
    };

    fetchClasses();
  }, []);

  useEffect(() => {
    const fetchTimetableByClass = async () => {
      if (!selectedClassId) return;

      setIsLoadingTimetable(true);
      setTimetableError(null);
      setNoTimetable(false); // reset friendly flag when (re)fetching
      console.log("Fetching timetable for class:", selectedClassId);
      const url = `${API_ENDPOINTS.GET_TIMETABLE_BY_CLASS}/${selectedClassId}`;

      try {
        const res = await apiClient.get(url);

        if (res.status === 404) {
          // Friendly handling for "no timetable created yet"
          setTimetableEntries({});
          setNoTimetable(true);
          setTimetableError(null);
          console.info("No timetable exists for this class (404).");
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch timetable");

        const data = await res.json();
        console.log("Fetched timetable:", data);

        // Mapping the data to fix key names and format if necessary:
        const formattedTimetable = Object.keys(data).reduce((acc, day) => {
          acc[day] = data[day].map((entry: any) => ({
            ...entry,
            startTime: entry.startTIme || entry.startTime,
          }));
          return acc;
        }, {} as Record<string, TimetableEntry[]>);

        setTimetableEntries(formattedTimetable);
        setNoTimetable(false);
      } catch (error: any) {
        console.error("Error fetching timetable:", error);
        setTimetableError(error.message || "Failed to fetch timetable");
        toast.error(error.message || "Failed to fetch timetable");
      } finally {
        setIsLoadingTimetable(false);
      }
    };

    fetchTimetableByClass();
  }, [selectedClassId]);

  // Modal state and form inputs.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    classId: "",
    day: "",
    startTime: "",
    endTime: "",
    subject: "",
    courseId: "",
  });

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  useEffect(() => {
    const [hours, minutes] = manualTime.split(":").map(Number);
    if (hours >= startHour && hours <= endHour) {
      const timePosition = (hours - startHour + minutes / 60) * hourHeight + 65;
      setCurrentTimePosition(timePosition);
    }
  }, [manualTime, hourHeight, startHour]);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      slots.push(`${displayHour} ${period}`);
    }
    return slots;
  };

  // Auth headers are now handled automatically by apiClient

  const getTotalScheduledClasses = () => {
    return Object.values(timetableEntries).reduce(
      (total: number, dayEntries) =>
        total + (Array.isArray(dayEntries) ? dayEntries.length : 0),
      0
    );
  };

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const teachersResponse = await teacherService.getTeachers(1, 100);
        setTeachers(
          Array.isArray(teachersResponse.data)
            ? teachersResponse.data.map((teacher: any) => ({
                _id: teacher._id,
                firstName: teacher.firstName,
                lastName: teacher.lastName,
              }))
            : []
        );
        console.log("Teachers:", teachersResponse);
      } catch (error) {
        console.error("Failed to fetch teachers", error);
      }
    };

    fetchTeachers();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      const fetchSubjects = async () => {
        try {
          const subjectsRes = await apiClient.get(
            API_ENDPOINTS.GET_SUBJECTS_BY_SCHOOL
          );

          const subjectsData = await subjectsRes.json();
          console.log("Subjects data:", subjectsData);

          setSubjects(
            Array.isArray(subjectsData) ? subjectsData : subjectsData.data || []
          );
        } catch (error: any) {
          console.error("Error fetching subjects:", error);
          toast.error(error.message || "Failed to load subjects");
        }
      };

      fetchSubjects();
    }
  }, [isModalOpen]);

  const handleSubjectChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const subjectId = e.target.value;
    setFormData({ ...formData, subject: subjectId, courseId: "" });
    try {
      const res = await apiClient.get(
        `${API_ENDPOINTS.GET_COURSES_BY_SUBJECT}/${subjectId}`
      );
      if (!res.ok) throw new Error("Failed to fetch courses by subject");
      const coursesData = await res.json();
      console.log("Courses by subject data:", coursesData);
      setCourses(
        Array.isArray(coursesData) ? coursesData : coursesData.data || []
      );
    } catch (error: any) {
      console.error("Error fetching courses by subject:", error);
      toast.error(error.message || "Failed to fetch courses");
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { classId, day, startTime, endTime, courseId } = formData;
    if (!classId || !day || !startTime || !endTime || !courseId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const payload = {
      classId,
      courseId,
      day,
      startTime: formatTime(startTime),
      endTime: formatTime(endTime),
    };

    try {
      const res = await apiClient.post(
        API_ENDPOINTS.CREATE_TIMETABLE_ENTRY,
        payload
      );
      if (!res.ok) {
        throw new Error("Failed to create timetable entry");
      }
      const newEntry = await res.json();

      // After creating an entry, ensure noTimetable is cleared (a timetable now exists)
      setNoTimetable(false);

      setTimetableEntries((prev) => {
        const updatedEntries = { ...prev };
        if (!updatedEntries[newEntry.day]) {
          updatedEntries[newEntry.day] = [];
        }
        updatedEntries[newEntry.day].push(newEntry);
        return updatedEntries;
      });
      toast.success("Timetable entry created successfully");
      toggleModal();
      setFormData({
        classId: "",
        day: "",
        startTime: "",
        endTime: "",
        subject: "",
        courseId: "",
      });
      setCourses([]);
    } catch (error: any) {
      console.error("Error creating timetable entry:", error);
      toast.error(error.message || "Failed to create timetable entry");
    }
  };

  const getTimetableEntry = (day: string, timeSlot: string) => {
    const dayEntries = timetableEntries[day] || [];

    let entry = dayEntries.find((entry) => {
      const startTime = entry.startTime || "";
      const exactMatch =
        entry.time === timeSlot ||
        `${startTime} - ${entry.endTime}` === timeSlot;
      return exactMatch;
    });

    if (entry) return entry;

    const slotStart = timeSlot.split(" - ")[0];
    const slotStartHour = parseInt(slotStart.split(":")[0]);
    const slotStartMinute = parseInt(slotStart.split(":")[1].split(" ")[0]);

    entry = dayEntries.find((entry) => {
      const startTime = entry.startTime || "";
      if (!startTime) return false;

      const entryStartHour = parseInt(startTime.split(":")[0]);
      const entryStartMinute = parseInt(startTime.split(":")[1].split(" ")[0]);

      const match =
        entryStartHour === slotStartHour &&
        Math.abs(entryStartMinute - slotStartMinute) <= 30;

      return match;
    });

    return entry;
  };

  // Skeleton loader component
  const TimetableSkeleton = () => (
    <div className="flex flex-col items-center justify-center py-20 px-6 bg-gradient-to-br from-white to-blue-50 rounded-xl border border-[#F0F0F0] shadow-sm">
      <div className="relative mb-6">
        <div className="w-20 h-20 border-4 border-blue-100 rounded-full"></div>
        <div className="w-20 h-20 border-4 border-[#003366] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
      </div>
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Loading Your Timetable
        </h3>
        <p className="text-gray-600 max-w-md">
          Please wait while we fetch your class schedule for this week...
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-[#003366] rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-[#003366] rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-[#003366] rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <svg
            className="w-10 h-10 text-white"
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
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          No Class Selected
        </h3>
        <p className="text-gray-600 text-center max-w-md mb-8 leading-relaxed">
          Please select a class from the dropdown above to view the timetable
          schedule. You can also create new timetable entries by clicking the
          "Add Entry" button.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={toggleModal}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Timetable Entry
          </button>
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
            // try reloading
            setTimetableError(null);
            if (selectedClassId) {
              // trigger re-fetch by toggling selectedClassId (or simply call fetch)
              setSelectedClassId((s) => s + "");
            }
          }}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }
        .time-slot-hover:hover {
          background-color: #f8fafc;
        }
        .timetable-entry:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
      `}</style>
      <div className="min-h-screen bg-[#F8F8F8] p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Class Timetable
                </h1>
                <p className="text-gray-600 text-sm sm:text-base">
                  Manage and view class schedules with ease
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end w-full lg:w-auto">
                {/* Class Selection */}
                <div className="min-w-[200px] w-full sm:w-auto">
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Select Class
                  </label>
                  <div className="relative">
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full px-4 py-3 pr-10 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
                      disabled={isLoadingClasses}
                    >
                      <option value="">
                        {isLoadingClasses
                          ? "Loading classes..."
                          : "Choose a class"}
                      </option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <button
                  onClick={toggleModal}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium shadow-md hover:shadow-lg"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Entry
                </button>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          {selectedClassId && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                View Options
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Day Filter */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Days Filter
                  </label>
                  <div className="relative">
                    <select
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "all") {
                          setVisibleDays([
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                          ]);
                        } else if (value === "weekdays") {
                          setVisibleDays([
                            "Monday",
                            "Tuesday",
                            "Wednesday",
                            "Thursday",
                            "Friday",
                          ]);
                        } else if (value === "mon-wed") {
                          setVisibleDays(["Monday", "Tuesday", "Wednesday"]);
                        } else if (value === "thu-fri") {
                          setVisibleDays(["Thursday", "Friday"]);
                        }
                      }}
                      className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
                    >
                      <option value="all">All Days</option>
                      <option value="weekdays">Weekdays</option>
                      <option value="mon-wed">Mon - Wed</option>
                      <option value="thu-fri">Thu - Fri</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Start Hour */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Start Hour
                  </label>
                  <div className="relative">
                    <select
                      value={startHour}
                      onChange={(e) => setStartHour(Number(e.target.value))}
                      className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i === 0
                            ? "12 AM"
                            : i > 12
                            ? `${i - 12} PM`
                            : `${i} ${i === 12 ? "PM" : "AM"}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* End Hour */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    End Hour
                  </label>
                  <div className="relative">
                    <select
                      value={endHour}
                      onChange={(e) => setEndHour(Number(e.target.value))}
                      className="w-full px-3 py-2 pr-10 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors appearance-none"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i} disabled={i <= startHour}>
                          {i === 0
                            ? "12 AM"
                            : i > 12
                            ? `${i - 12} PM`
                            : `${i} ${i === 12 ? "PM" : "AM"}`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timetable Content */}

          {!selectedClassId ? (
            <EmptyState />
          ) : isLoadingTimetable ? (
            <TimetableSkeleton />
          ) : noTimetable ? (
            // NEW: Friendly UI when API returned 404 / no timetable created yet
            <NoTimetableState />
          ) : timetableError ? (
            // Real error UI
            <TimetableErrorPanel message={timetableError} />
          ) : (
            /* Desktop / Mobile timetable rendering (unchanged) */
            <div className="bg-white rounded-xl border border-[#F0F0F0] overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              {isMobileView ? (
                <div className="p-4 space-y-4">
                  {visibleDays.map((day) => {
                    const allDayEntries = timetableEntries[day] || [];
                    const dayEntries = TIME_SLOTS.map((timeSlot) => ({
                      timeSlot,
                      entry: getTimetableEntry(day, timeSlot),
                    })).filter((item) => item.entry);

                    return (
                      <div
                        key={day}
                        className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-[#003366] rounded-lg flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-[#003366]">
                            {day}
                          </h3>
                          <div className="flex-1 h-px bg-[#003366]/20"></div>
                          <span className="text-sm text-gray-600">
                            {allDayEntries.length} classes
                          </span>
                        </div>

                        {allDayEntries.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p>No classes scheduled</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {allDayEntries.map((entry, index) => (
                              <div
                                key={index}
                                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-[#003366]" />
                                    <div>
                                      <h4 className="font-semibold text-gray-900">
                                        {entry.course}
                                      </h4>
                                      <p className="text-sm text-gray-600">
                                        {entry.subject}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-medium text-[#003366]">
                                      {entry.time}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {entry.startTime} - {entry.endTime}
                                    </div>
                                  </div>
                                </div>

                                {entry.class && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Users className="w-4 h-4" />
                                    <span>{entry.class}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                        <th className="px-4 py-4 text-left font-semibold text-gray-700 min-w-[140px] border-r border-gray-300">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-600" />
                            Time Slot
                          </div>
                        </th>
                        {visibleDays.map((day) => (
                          <th
                            key={day}
                            className="px-4 py-4 text-center font-semibold text-gray-700 border-r border-gray-200"
                          >
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-lg">{day}</span>
                              <div className="w-8 h-1 bg-[#003366] rounded-full"></div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TIME_SLOTS.map((timeSlot, index) => (
                        <tr
                          key={timeSlot}
                          className={`border-b border-gray-100 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50/30 transition-colors`}
                        >
                          <td className="px-4 py-6 font-semibold text-gray-700 border-r-2 border-gray-200 bg-gray-50/50">
                            <div className="flex flex-col items-center gap-1 text-center">
                              <div className="text-sm font-bold text-[#003366]">
                                {timeSlot}
                              </div>
                              <div className="w-16 h-px bg-gray-300"></div>
                              <div className="text-xs text-gray-500">
                                Slot {index + 1}
                              </div>
                            </div>
                          </td>
                          {visibleDays.map((day) => {
                            const entry = getTimetableEntry(day, timeSlot);
                            return (
                              <td
                                key={`${day}-${timeSlot}`}
                                className="px-2 md:px-4 py-4 md:py-6 border-r border-gray-200"
                              >
                                {entry ? (
                                  <div className="bg-gradient-to-br from-[#003366] to-[#004080] text-white rounded-xl p-3 md:p-4 hover:from-[#002244] hover:to-[#003366] transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <BookOpen className="w-3 h-3 md:w-4 md:h-4 text-blue-200" />
                                        <div className="font-semibold text-xs md:text-sm">
                                          {entry.course}
                                        </div>
                                      </div>
                                      <Clock className="w-3 h-3 text-blue-200" />
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
                                      <div className="text-xs text-blue-100 font-medium">
                                        {entry.subject}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <Users className="w-3 h-3 text-blue-200" />
                                      <div className="text-xs text-blue-200">
                                        {entry.class}
                                      </div>
                                    </div>

                                    <div className="mt-2 pt-2 border-t border-blue-400/30">
                                      <div className="text-xs text-blue-200 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        <span className="hidden md:inline">
                                          {entry.time}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-20 md:h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:from-gray-100 hover:to-gray-200 transition-all duration-200">
                                    <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded-full flex items-center justify-center mb-1">
                                      <Clock className="w-3 h-3 md:w-4 md:h-4 text-gray-400" />
                                    </div>
                                    <span className="text-gray-400 text-xs font-medium">
                                      Free
                                    </span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t-2 border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-10 h-10 bg-[#003366] rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-[#003366]">
                        {getTotalScheduledClasses()}
                      </div>
                      <div className="text-sm text-gray-600">
                        classes scheduled this week
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-br from-[#003366] to-[#004080] rounded shadow-sm"></div>
                      <span className="text-sm font-medium text-gray-700">
                        Scheduled Class
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-br from-gray-200 to-gray-300 rounded border border-gray-400"></div>
                      <span className="text-sm font-medium text-gray-700">
                        Free Period
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal omitted for brevity — unchanged from your original component */}
        {isModalOpen && (
          <div
            className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 ease-in-out ${
              isModalOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={toggleModal}
          >
            <div
              className={`absolute right-0 top-0 h-full w-full md:w-1/2 lg:w-2/5 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
                isModalOpen ? "translate-x-0" : "translate-x-full"
              } flex flex-col`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">
                      New Timetable Entry
                    </h3>
                    <p className="text-blue-100 text-sm">
                      Add a new class session to the schedule
                    </p>
                  </div>
                  <button
                    className="text-blue-100 hover:text-white text-2xl p-2 rounded-lg hover:bg-blue-500 transition-colors"
                    onClick={toggleModal}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {/* Class Selection */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-3 text-sm uppercase tracking-wide">
                      Select Class
                    </label>
                    <select
                      required
                      value={formData.classId}
                      onChange={(e) =>
                        setFormData({ ...formData, classId: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    >
                      <option value="" disabled>
                        Choose a class
                      </option>
                      {classes.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subject Selection */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-3 text-sm uppercase tracking-wide">
                      Subject
                    </label>
                    <select
                      required
                      value={formData.subject}
                      onChange={handleSubjectChange}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    >
                      <option value="" disabled>
                        Choose a subject
                      </option>
                      {subjects.map((subject) => (
                        <option key={subject._id} value={subject._id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Course Selection */}
                  {formData.subject && (
                    <div>
                      <label className="block text-gray-700 font-semibold mb-3 text-sm uppercase tracking-wide">
                        Course
                      </label>
                      <select
                        required
                        value={formData.courseId}
                        onChange={(e) =>
                          setFormData({ ...formData, courseId: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      >
                        <option value="" disabled>
                          Choose a course
                        </option>
                        {courses.map((course) => (
                          <option key={course._id} value={course._id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Day Selection */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-3 text-sm uppercase tracking-wide">
                      Day of Week
                    </label>
                    <select
                      required
                      value={formData.day}
                      onChange={(e) =>
                        setFormData({ ...formData, day: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                    >
                      <option value="" disabled>
                        Choose a day
                      </option>
                      {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                      ].map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Time Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-3 text-sm uppercase tracking-wide">
                        Start Time
                      </label>
                      <input
                        required
                        type="time"
                        value={formData.startTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startTime: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-semibold mb-3 text-sm uppercase tracking-wide">
                        End Time
                      </label>
                      <input
                        required
                        type="time"
                        value={formData.endTime}
                        onChange={(e) =>
                          setFormData({ ...formData, endTime: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="bg-white border-t border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
                    onClick={toggleModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Create Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Timetable;
