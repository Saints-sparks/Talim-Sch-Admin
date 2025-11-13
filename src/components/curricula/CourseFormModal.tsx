"use client";
import React, { useState, useEffect } from "react";
import { teacherService } from "@/app/services/teacher.service";
import { toast } from "react-toastify";

// Define a type for Class from your API
interface Class {
  _id: string;
  name: string;
}

// Import the Teacher type from the teacher service to ensure consistency
import type { Teacher } from "@/app/services/teacher.service";

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (course: {
    title: string;
    description: string;
    courseCode: string;
    teacherId: string;
    classId: string;
    subjectId: string;
    // schoolId: string;
  }) => void;
  initialData?: {
    title: string;
    description: string;
    courseCode?: string;
    teacherId?: string;
    classId?: string;
  };
  mode: "add" | "edit";
  classList: Class[];
  subjectId: string; // Pass the subject's id or name from the Curriculum page
}

const CourseFormModal: React.FC<CourseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  classList,
  subjectId,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Fetch teachers when the modal is opened.
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        // Adjust page and limit as needed.
        const teachersResponse = await teacherService.getTeachers(1, 100);
        setTeachers(teachersResponse.data);
      } catch (error) {
        console.error("Failed to fetch teachers", error);
      }
    };

    if (isOpen) {
      fetchTeachers();
    }
  }, [isOpen]);

  // Initialize form fields using initialData (for edit mode)
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setCourseCode(initialData.courseCode || "");
      setSelectedTeacherId(initialData.teacherId || "");
      setSelectedClassId(initialData.classId || "");
    } else {
      setTitle("");
      setDescription("");
      setCourseCode("");
      setSelectedTeacherId("");
      setSelectedClassId("");
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    // Validate required fields
    if (
      title.trim() &&
      description.trim() &&
      courseCode.trim() &&
      selectedTeacherId &&
      selectedClassId
    ) {
      // Extract the schoolId from the user in local storage.
      // This assumes the schoolId is stored in a format like:
      // "ObjectId('679129f2b04329dea7b1f5f4')"
      try {
        const userString = localStorage.getItem("user");
        if (!userString) {
          toast.error("User data not found. Please log in again.");
          return;
        }

        const user = JSON.parse(userString);
        const schoolIdMatch = user.schoolId?.match(/ObjectId\('(.+?)'\)/);
        const extractedSchoolId = schoolIdMatch ? schoolIdMatch[1] : null;

        if (!extractedSchoolId) {
          toast.error("Could not determine school ID");
          return;
        }

        // Compose the payload with the schoolId added.
        onSubmit({
          title,
          description,
          courseCode,
          teacherId: selectedTeacherId,
          classId: selectedClassId,
          subjectId,
          // schoolId: extractedSchoolId,
        });

        onClose();
      } catch (error) {
        console.error("Error parsing user data:", error);
        toast.error("Error accessing user data. Please log in again.");
      }
    } else {
      toast.error("Please fill in all required fields.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white p-6 rounded-md w-[90%] max-w-md text-gray-600">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          {mode === "add" ? "Add Course" : "Edit Course"}
        </h2>
        <input
          className="w-full mb-4 border rounded px-3 py-2"
          type="text"
          placeholder="Course Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="w-full mb-4 border rounded px-3 py-2"
          type="text"
          placeholder="Course Code"
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
        />
        <textarea
          className="w-full mb-4 border rounded px-3 py-2"
          placeholder="Course Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Teacher Dropdown */}
        <select
          className="w-full mb-4 border rounded px-3 py-2"
          value={selectedTeacherId}
          onChange={(e) => setSelectedTeacherId(e.target.value)}
        >
          <option value="" disabled>
            Select Teacher
          </option>
          {teachers.map((teacher) => (
            <option key={teacher._id} value={teacher._id}>
              {teacher.firstName} {teacher.lastName}
            </option>
          ))}
        </select>

        {/* Class Dropdown */}
        <select
          className="w-full mb-4 border rounded px-3 py-2"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
        >
          <option value="" disabled>
            Select Class
          </option>
          {classList.map((cls) => (
            <option key={cls._id} value={cls._id}>
              {cls.name}
            </option>
          ))}
        </select>

        <div className="flex justify-end space-x-3">
          <button className="text-gray-600" onClick={onClose}>
            Cancel
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleSubmit}
          >
            {mode === "add" ? "Add" : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseFormModal;
