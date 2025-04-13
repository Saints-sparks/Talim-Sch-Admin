"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { toast } from "react-toastify";
import { API_ENDPOINTS } from "@/app/lib/api/config"; // adjust import if needed
import { teacherService } from "../services/teacher.service";

interface TimetableEntry {
  teacherId: string;
  classId: string;
  day: string;
  startTime: string; // in "HH:mm" format
  endTime: string;   // in "HH:mm" format
  subject: string;   // this will hold the selected course's name
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
  const startHour = 8;    // Timetable starting time (8 AM)

  // For current time indicator, using manualTime in 24-hour "HH:mm" format
  const [manualTime, setManualTime] = useState("11:00");
  const [currentTimePosition, setCurrentTimePosition] = useState(0);

  // States for fetched data
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");


  useEffect(() => {
    const fetchTimetableByClass = async () => {
      if (!selectedClassId) return;
  
      try {
        const res = await fetch(`${API_ENDPOINTS.GET_TIMETABLE_BY_CLASS}/${selectedClassId}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch timetable");
  
        const data = await res.json();
        console.log("Fetched timetable:", data);
        setTimetableEntries(Array.isArray(data) ? data : data.data || []);
      } catch (error: any) {
        console.error("Error fetching timetable:", error);
        toast.error(error.message || "Failed to fetch timetable");
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
    courseId: "",  // Selected course name (or id) – dependent on subject selection
  });

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // Calculate current time indicator position
  useEffect(() => {
    const [hours, minutes] = manualTime.split(":").map(Number);
    const timePosition = ((hours - startHour) + minutes / 60) * hourHeight + 65;
    setCurrentTimePosition(timePosition);
  }, [manualTime, hourHeight]);

  // Helper: get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : "",
    };
  };

  // Fetch teachers on mount
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const teachersResponse = await teacherService.getTeachers(1, 100);
        setTeachers(teachersResponse);
        console.log("Teachers:", teachersResponse);
      } catch (error) {
        console.error("Failed to fetch teachers", error);
      }
    };

    fetchTeachers();
  }, []);

  // When modal is open, fetch subjects and classes
  useEffect(() => {
    if (isModalOpen) {
      const fetchData = async () => {
        try {
          const [subjectsRes, classesRes] = await Promise.all([
            fetch(API_ENDPOINTS.GET_SUBJECTS_BY_SCHOOL, { headers: getAuthHeaders() }),
            fetch(API_ENDPOINTS.GET_CLASSES, { headers: getAuthHeaders() }),
          ]);

          const subjectsData = await subjectsRes.json();
          const classesData = await classesRes.json();

          console.log("Subjects data:", subjectsData);
          console.log("Classes data:", classesData);

          setSubjects(Array.isArray(subjectsData) ? subjectsData : subjectsData.data || []);
          setClasses(Array.isArray(classesData) ? classesData : classesData.data || []);
        } catch (error: any) {
          console.error("Error fetching data:", error);
          toast.error(error.message || "Failed to load data");
        }
      };

      fetchData();
    }
  }, [isModalOpen]);

  // Handler for subject change, which then fetches courses by subject
  const handleSubjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subjectId = e.target.value;
    setFormData({ ...formData, subject: subjectId, course: "" }); // Reset course when subject changes
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_COURSES_BY_SUBJECT}/${subjectId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch courses by subject");
      const coursesData = await res.json();
      console.log("Courses by subject data:", coursesData);
      setCourses(Array.isArray(coursesData) ? coursesData : coursesData.data || []);
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
    if (!classId || !day || !startTime || !endTime || !courseId ) {
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
      setTimetableEntries((prev) => [...prev, newEntry]);
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

  return (
    <div className="px-4">
      <div className="mx-auto bg-[#F8F8F8] rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-medium text-gray-800">Timetable</h1>
          <button className="font-bold text-[#154473]" onClick={toggleModal}>
            + Add
          </button>
          <div className="mb-6">
  <label className="block mb-2 font-medium text-gray-700">Select Class</label>
  <select
    value={selectedClassId}
    onChange={(e) => setSelectedClassId(e.target.value)}
    className="px-4 py-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    <option value="" disabled>Select a class</option>
    {classes.map((cls) => (
      <option key={cls._id} value={cls._id}>
        {cls.name}
      </option>
    ))}
  </select>
</div>

        </div>
        <p className="text-gray-500 mb-6">Stay on Track with Your Class Schedule!</p>

        {/* Timetable Grid */}
        {selectedClassId ? (
        <div className="overflow-x-auto border border-gray-300 text-gray-700 rounded-t-3xl max-h-[510px] 2xl:max-h-[800px] overflow-y-scroll">
          {/* Header Row */}
          <div className="grid sticky top-0 z-30" style={{ gridTemplateColumns: "103px repeat(5, 1fr)" }}>
            <div className="font-semibold text-center bg-[#FFFFFF] py-6">Time</div>
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, index) => (
              <div key={index} className="font-semibold text-center bg-[#FFFFFF] py-6 border-l border-gray-300">
                {day}
              </div>
            ))}
          </div>

          {/* Body Grid */}
          <div className="grid relative" style={{ gridTemplateColumns: "103px repeat(5, 1fr)" }}>
            {/* Time labels */}
            <div className="bg-white">
              {["8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM"].map((time, index) => (
                <div key={index} className="flex items-center justify-center border-b border-gray-300" style={{ height: `${hourHeight}px` }}>
                  {time}
                </div>
              ))}
            </div>

            {/* Render timetable entries per day */}
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day, dayIndex) => (
              <div key={dayIndex} className="col-span-1 border-l border-gray-300 relative">
                {timetableEntries
                  .filter((entry) => entry.day === day)
                  .map((entry, entryIndex) => {
                   // Here, startTime and endTime are already formatted as "hh:mm AM/PM"
                   const [startHourStr] = entry.startTime.split(":");
                   const [endHourStr] = entry.endTime.split(":");
                   const startHr = Number(startHourStr);
                   const endHr = Number(endHourStr);
                   const topPosition = (startHr - startHour) * hourHeight + 65;
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
                        <div className="font-semibold">{entry.subject}</div>
                        <div className="text-sm text-gray-500">
                          {entry.startTime} - {entry.endTime}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}

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
              <div className="absolute top-2 left-0 right-0 bg-[#002B5B]" style={{ height: "3px" }} />
            </div>
          </div>
        </div>
        ) : (
          <p className="text-gray-500 mt-8">Please select a class to view the timetable.</p>
        )}
        
      </div>

      {/* Modal for creating a new timetable entry */}
      {isModalOpen && (
        <div
          className={`fixed inset-0 bg-gray-900 bg-opacity-50 z-50 transition-opacity duration-300 ease-in-out ${isModalOpen ? "opacity-100" : "opacity-0"}`}
          onClick={toggleModal}
        >
          <div
            className={`absolute right-0 top-0 h-full w-full md:w-1/2 bg-white p-6 shadow-lg transform transition-transform duration-300 ease-in-out ${isModalOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800">New Timetable Entry</h3>
              <button className="text-gray-500 hover:text-gray-700 text-2xl" onClick={toggleModal}>
                ✕
              </button>
            </div>
            <form className="flex-grow" onSubmit={handleSubmit}>
              <div className="mb-4 gap-4">
                {/* Class Selection */}
                <div className="flex flex-col mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Class</label>
                  <select
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
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
                  <label className="block text-gray-700 font-semibold mb-2">Subject</label>
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
                    <label className="block text-gray-700 font-semibold mb-2">Course</label>
                    <select
                      required
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
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
                  <label className="block text-gray-700 font-semibold mb-2">Day</label>
                  <select
                    required
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                    className="w-full px-4 py-3 border bg-white text-gray-700 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      Select day
                    </option>
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Start Time */}
                <div className="flex flex-col mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">Start Time</label>
                  <input
                    required
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                  />
                </div>
                {/* End Time */}
                <div className="flex flex-col mb-4">
                  <label className="block text-gray-700 font-semibold mb-2">End Time</label>
                  <input
                    required
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
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
                <button type="submit" className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-blue-700">
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
