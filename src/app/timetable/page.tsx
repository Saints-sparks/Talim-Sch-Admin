"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/app/lib/api/config"; // adjust import if needed
import { teacherService } from "../services/teacher.service";

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
    // add other properties if needed
}

interface Course {
    _id: string;
    title: string;
    // add other properties if needed
}

interface Class {
    _id: string;
    name: string;
    // add other properties if needed
}

interface Subject {
    _id: string;
    name: string;
}

const Timetable = () => {
    const hourHeight = 130; // Height for each hour (in pixels)
    const startHour = 8; // Timetable starting time (8 AM)

    // For current time indicator, using manualTime in 24-hour "HH:mm" format
    const [manualTime, setManualTime] = useState("11:00");
    const [currentTimePosition, setCurrentTimePosition] = useState(0);

    // States for fetched data
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

    // Fetch classes on component mount
    useEffect(() => {
        const fetchClasses = async () => {
            setIsLoadingClasses(true);
            try {
                const response = await fetch(API_ENDPOINTS.GET_CLASSES, {
                    headers: getAuthHeaders(),
                });

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
            console.log(selectedClassId);
            const url = `${API_ENDPOINTS.GET_TIMETABLE_BY_CLASS}/${selectedClassId}`;

            try {
                const res = await fetch(url, {
                    headers: getAuthHeaders(),
                });
                if (!res.ok) throw new Error("Failed to fetch timetable");

                const data = await res.json();
                console.log("Fetched timetable:", data);

                // Mapping the data to fix key names and format if necessary:
                const formattedTimetable = Object.keys(data).reduce((acc, day) => {
                    // Transform each entry in the array
                    acc[day] = data[day].map((entry: any) => ({
                        // Spread all original properties; then override keys if needed
                        ...entry,
                        // Fix the key name from "startTIme" to "startTime"
                        startTime: entry.startTIme || entry.startTime,
                    }));
                    return acc;
                }, {} as Record<string, TimetableEntry[]>);

                setTimetableEntries(formattedTimetable);
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
    // Note: "subject" now holds the selected subject's ID while "course" holds the selected course's name (or ID, as needed).
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        classId: "",
        day: "",
        startTime: "",
        endTime: "",
        subject: "", // Selected subject ID
        courseId: "", // Selected course name (or id) – dependent on subject selection
    });

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    // Calculate current time indicator position
    useEffect(() => {
        const [hours, minutes] = manualTime.split(":").map(Number);
        const timePosition = (hours - startHour + minutes / 60) * hourHeight + 65;
        setCurrentTimePosition(timePosition);
    }, [manualTime, hourHeight]);

    // Helper: get auth headers
    const getAuthHeaders = () => {
        const token = localStorage.getItem("accessToken");
        return {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
        };
    };

    // Fetch teachers on mount
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

    // When modal is open, fetch subjects only (classes are now loaded on mount)
    useEffect(() => {
        if (isModalOpen) {
            const fetchSubjects = async () => {
                try {
                    const subjectsRes = await fetch(API_ENDPOINTS.GET_SUBJECTS_BY_SCHOOL, {
                        headers: getAuthHeaders(),
                    });

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

    // Handler for subject change, which then fetches courses by subject
    const handleSubjectChange = async (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        const subjectId = e.target.value;
        setFormData({ ...formData, subject: subjectId, courseId: "" }); // Reset courseId when subject changes
        try {
            const res = await fetch(
                `${API_ENDPOINTS.GET_COURSES_BY_SUBJECT}/${subjectId}`,
                {
                    method: "GET",
                    headers: getAuthHeaders(),
                }
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
        // Ensure two-digit hour format if needed (e.g., "08" if required)
        const formattedHour = hour < 10 ? `0${hour}` : hour.toString();
        return `${formattedHour}:${minute} ${ampm}`;
    };

    // Handle form submission to create a new timetable entry
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const { classId, day, startTime, endTime, courseId } = formData;
        if (!classId || !day || !startTime || !endTime || !courseId) {
            toast.error("Please fill in all required fields.");
            return;
        }

        // Prepare the payload per expected API schema
        const payload = {
            classId,
            courseId, // Use the course id from formData.course
            day,
            startTime: formatTime(startTime), // Format to "hh:mm AM/PM"
            endTime: formatTime(endTime),
        };

        try {
            const res = await fetch(API_ENDPOINTS.CREATE_TIMETABLE_ENTRY, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                throw new Error("Failed to create timetable entry");
            }
            const newEntry = await res.json();
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
            // Reset form inputs and courses list
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

    // Skeleton loader component
    const TimetableSkeleton = () => (
        <div className="overflow-x-auto border border-gray-300 text-gray-700 rounded-t-3xl max-h-[510px] 2xl:max-h-[800px] overflow-y-scroll">
            {/* Header Row */}
            <div
                className="grid sticky top-0 z-30"
                style={{ gridTemplateColumns: "103px repeat(5, 1fr)" }}
            >
                <div className="font-semibold text-center bg-[#FFFFFF] py-6">
                    Time
                </div>
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                    (day, index) => (
                        <div
                            key={index}
                            className="font-semibold text-center bg-[#FFFFFF] py-6 border-l border-gray-300"
                        >
                            {day}
                        </div>
                    )
                )}
            </div>

            {/* Body Grid with Skeleton */}
            <div
                className="grid relative"
                style={{ gridTemplateColumns: "103px repeat(5, 1fr)" }}
            >
                {/* Time labels */}
                <div className="bg-white">
                    {[
                        "8 AM",
                        "9 AM",
                        "10 AM",
                        "11 AM",
                        "12 PM",
                        "1 PM",
                        "2 PM",
                    ].map((time, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-center border-b border-gray-300"
                            style={{ height: `${hourHeight}px` }}
                        >
                            {time}
                        </div>
                    ))}
                </div>

                {/* Skeleton entries per day */}
                {[0, 1, 2, 3, 4].map((dayIndex) => (
                    <div
                        key={dayIndex}
                        className="col-span-1 border-l border-gray-300 relative"
                    >
                        {/* Random skeleton blocks */}
                        {[0, 1, 2].map((blockIndex) => (
                            <div
                                key={blockIndex}
                                className="absolute left-0 right-0 m-1 p-2 rounded shadow-md bg-gray-200 animate-pulse"
                                style={{
                                    top: `${65 + blockIndex * 150 + Math.random() * 50}px`,
                                    height: `${80 + Math.random() * 40}px`,
                                }}
                            >
                                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                                <div className="h-3 bg-gray-300 rounded mb-1"></div>
                                <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );

    // Empty state component
    const EmptyState = () => (
        <div className="flex flex-col items-center justify-center py-20 px-6 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <svg
                    className="w-12 h-12 text-blue-400"
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
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Class Selected
            </h3>
            <p className="text-gray-500 text-center max-w-md mb-6">
                Please select a class from the dropdown above to view the timetable schedule.
                You can also create new timetable entries by clicking the "Add" button.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={toggleModal}
                    className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-[#0f3358] transition-colors duration-200 flex items-center gap-2"
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
    );

    return (
        <div className="px-4">
            <div className="mx-auto bg-[#F8F8F8] rounded-lg p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-medium text-gray-800">Timetable</h1>
                        <p className="text-gray-500">
                            Stay on Track with Your Class Schedule!
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="min-w-[200px]">
                            <label className="block mb-2 font-medium text-gray-700">
                                Select Class
                            </label>
                            <select
                                value={selectedClassId}
                                onChange={(e) => setSelectedClassId(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={isLoadingClasses}
                            >
                                <option value="">
                                    {isLoadingClasses ? "Loading classes..." : "Select a class"}
                                </option>
                                {classes.map((cls) => (
                                    <option key={cls._id} value={cls._id}>
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="font-bold text-[#154473] hover:text-[#0f3358] transition-colors duration-200 mt-6 sm:mt-0"
                            onClick={toggleModal}
                        >
                            + Add
                        </button>
                    </div>
                </div>

                {/* Timetable Content */}
                {!selectedClassId ? (
                    <EmptyState />
                ) : isLoadingTimetable ? (
                    <TimetableSkeleton />
                ) : timetableError ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 bg-white rounded-lg border-2 border-red-200">
                        <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                            <svg
                                className="w-12 h-12 text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-red-700 mb-2">
                            Error Loading Timetable
                        </h3>
                        <p className="text-red-600 text-center max-w-md mb-6">
                            {timetableError}
                        </p>
                        <button
                            onClick={() => {
                                setTimetableError(null);
                                if (selectedClassId) {
                                    // Trigger refetch by changing the state
                                    const currentId = selectedClassId;
                                    setSelectedClassId("");
                                    setTimeout(() => setSelectedClassId(currentId), 100);
                                }
                            }}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-gray-300 text-gray-700 rounded-t-3xl max-h-[510px] 2xl:max-h-[800px] overflow-y-scroll">
                        {/* Header Row */}
                        <div
                            className="grid sticky top-0 z-30"
                            style={{ gridTemplateColumns: "103px repeat(5, 1fr)" }}
                        >
                            <div className="font-semibold text-center bg-[#FFFFFF] py-6">
                                Time
                            </div>
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                                (day, index) => (
                                    <div
                                        key={index}
                                        className="font-semibold text-center bg-[#FFFFFF] py-6 border-l border-gray-300"
                                    >
                                        {day}
                                    </div>
                                )
                            )}
                        </div>

                        {/* Body Grid */}
                        <div
                            className="grid relative"
                            style={{ gridTemplateColumns: "103px repeat(5, 1fr)" }}
                        >
                            {/* Time labels */}
                            <div className="bg-white">
                                {[
                                    "8 AM",
                                    "9 AM",
                                    "10 AM",
                                    "11 AM",
                                    "12 PM",
                                    "1 PM",
                                    "2 PM",
                                ].map((time, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-center border-b border-gray-300"
                                        style={{ height: `${hourHeight}px` }}
                                    >
                                        {time}
                                    </div>
                                ))}
                            </div>

                            {/* Render timetable entries per day */}
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                                (day, dayIndex) => (
                                    <div
                                        key={dayIndex}
                                        className="col-span-1 border-l border-gray-300 relative"
                                    >
                                        {(timetableEntries[day] || []).map((entry, entryIndex) => {
                                            const startHr = parseTime(entry.startTime);
                                            const endHr = parseTime(entry.endTime);
                                            const topPosition =
                                                (startHr - startHour) * hourHeight + 65;
                                            const entryHeight = (endHr - startHr) * hourHeight - 16;

                                            return (
                                                <div
                                                    key={entryIndex}
                                                    className="absolute left-0 right-0 m-1 p-2 rounded shadow-md bg-white flex flex-col items-center justify-center text-center"
                                                    style={{
                                                        top: `${topPosition}px`,
                                                        height: `${entryHeight}px`,
                                                        border: "1px solid #154473",
                                                    }}
                                                >
                                                    <div className="font-semibold">{entry.course}</div>
                                                    <div className="text-sm text-gray-500">
                                                        {entry.subject}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {entry.startTime} - {entry.endTime}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )
                            )}

                            {/* Dynamic Time Indicator */}
                            <div
                                className="absolute left-[110px] w-[88%] 2xl:w-[93%]"
                                style={{
                                    top: `${currentTimePosition - 7}px`,
                                    zIndex: 20,
                                }}
                            >
                                <div className="absolute top-[-6px] left-[-87px] px-3 py-1 flex items-center justify-center bg-[#002B5B] text-white font-medium rounded-full">
                                    {manualTime}
                                </div>
                                <div
                                    className="absolute left-[-8px] right-0 h-2 w-2 rounded-full bg-[#002B5B]"
                                    style={{ top: "5.4px" }}
                                />
                                <div
                                    className="absolute top-2 left-0 right-0 bg-[#002B5B]"
                                    style={{ height: "3px" }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for creating a new timetable entry */}
            {isModalOpen && (
                <div
                    className={`fixed inset-0 bg-gray-900 bg-opacity-50 z-50 transition-opacity duration-300 ease-in-out ${isModalOpen ? "opacity-100" : "opacity-0"
                        }`}
                    onClick={toggleModal}
                >
                    <div
                        className={`absolute right-0 top-0 h-full w-full md:w-1/2 bg-white p-6 shadow-lg transform transition-transform duration-300 ease-in-out ${isModalOpen ? "translate-x-0" : "translate-x-full"
                            } flex flex-col`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-semibold text-gray-800">
                                New Timetable Entry
                            </h3>
                            <button
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                                onClick={toggleModal}
                            >
                                ✕
                            </button>
                        </div>
                        <form className="flex-grow" onSubmit={handleSubmit}>
                            <div className="mb-4 gap-4">
                                {/* Class Selection */}
                                <div className="flex flex-col mb-4">
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Class
                                    </label>
                                    <select
                                        required
                                        value={formData.classId}
                                        onChange={(e) =>
                                            setFormData({ ...formData, classId: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border bg-white text-gray-700 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="" disabled>
                                            Select class
                                        </option>
                                        {classes.map((cls) => (
                                            <option key={cls._id} value={cls._id}>
                                                {cls.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/* Subject Selection */}
                                <div className="flex flex-col mb-4">
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Subject
                                    </label>
                                    <select
                                        required
                                        value={formData.subject}
                                        onChange={handleSubjectChange}
                                        className="w-full px-4 py-3 border bg-white text-gray-700 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="" disabled>
                                            Select subject
                                        </option>
                                        {subjects.map((subject) => (
                                            <option key={subject._id} value={subject._id}>
                                                {subject.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {/* Render Course Selection only if a subject is selected */}
                                {formData.subject && (
                                    <div className="flex flex-col mb-4">
                                        <label className="block text-gray-700 font-semibold mb-2">
                                            Course
                                        </label>
                                        <select
                                            required
                                            value={formData.courseId}
                                            onChange={(e) =>
                                                setFormData({ ...formData, courseId: e.target.value })
                                            }
                                            className="w-full px-4 py-3 border bg-white text-gray-700 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="" disabled>
                                                Select course
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
                                <div className="flex flex-col mb-4">
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Day
                                    </label>
                                    <select
                                        required
                                        value={formData.day}
                                        onChange={(e) =>
                                            setFormData({ ...formData, day: e.target.value })
                                        }
                                        className="w-full px-4 py-3 border bg-white text-gray-700 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="" disabled>
                                            Select day
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
                                {/* Start Time */}
                                <div className="flex flex-col mb-4">
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        Start Time
                                    </label>
                                    <input
                                        required
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) =>
                                            setFormData({ ...formData, startTime: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                                    />
                                </div>
                                {/* End Time */}
                                <div className="flex flex-col mb-4">
                                    <label className="block text-gray-700 font-semibold mb-2">
                                        End Time
                                    </label>
                                    <input
                                        required
                                        type="time"
                                        value={formData.endTime}
                                        onChange={(e) =>
                                            setFormData({ ...formData, endTime: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 mt-auto">
                                <button
                                    type="button"
                                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                    onClick={toggleModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-blue-700"
                                >
                                    Save
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
