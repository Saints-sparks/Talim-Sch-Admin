"use client";
import React, { useState, useEffect } from "react";
import { Class, getClasses } from "@/app/services/student.service";
import { toast } from "react-toastify";
import FloatingHeader from "@/components/curricula/FloatingHeader";
import SubjectsTable from "@/components/curricula/SubjectsTable";
import SubjectFormModal from "@/components/curricula/SubjectFormModal";
import CourseFormModal from "@/components/curricula/CourseFormModal";
import {
  createSubject,
  getSubjectsBySchool,
} from "../services/subjects.service";
import { API_ENDPOINTS } from "../lib/api/config";

const CurriculumPage = () => {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseMode, setCourseMode] = useState<"add" | "edit">("add");
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [activeSubject, setActiveSubject] = useState<{ _id: string; name: string } | null>(null)

  useEffect(() => {
    // Fetch classes from the backend
    const fetchClasses = async () => {
      try {
        const response = await getClasses();
        setClasses(response);
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Failed to load classes. Please try again later.");
      }
    };

    fetchClasses();
  }, []);

  // Fetch subjects for the selected class
  useEffect(() => {
    if (selectedClass) {
      const fetchSubjects = async () => {
        try {
          const subjectsData = await getSubjectsBySchool(); // Use the service here

          // Filter subjects to match the selected class
          const filteredSubjects = subjectsData.filter(
            (subject: any) => subject.classId === selectedClass
          );
          console.log("Fetched subjects:", subjectsData);
          console.log("Selected class:", selectedClass);

          console.log("Filtered subjects:", filteredSubjects);

          setSubjects(subjectsData); // Set filtered subjects
        } catch (error) {
          console.error("Error fetching subjects:", error);
          toast.error("Failed to load subjects. Please try again later.");
        }
      };

      fetchSubjects();
    }
  }, [selectedClass]);

  const openAddModal = () => {
    setFormMode("add");
    setSelectedSubject(null);
    setShowFormModal(true);
  };

  const openEditModal = (subject: any) => {
    setFormMode("edit");
    setSelectedSubject(subject);
    setShowFormModal(true);
  };

  const handleAddOrEdit = async (data: {
    name: string;
    code: string;
    classId: string;
  }) => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const schoolIdMatch = user.schoolId?.match(/ObjectId\('(.+?)'\)/);
    const extractedSchoolId = schoolIdMatch?.[1];

    if (!extractedSchoolId) {
      toast.error("Could not determine school ID");
      return;
    }
    console.log(extractedSchoolId);

    try {
      if (formMode === "add") {
        // const schoolId = localStorage.getItem('schoolId'); // or however you store it
        // if (!user.schoolId) throw new Error('Missing school ID');
        // console.log(user.schoolId._id);

        const newSubject = await createSubject({
          name: data.name,
          code: data.code,
          schoolId: extractedSchoolId,
        });
        console.log("New subject created:", newSubject);

        setSubjects((prev) => [
          ...prev,
          { ...newSubject, classId: data.classId, courses: [] },
        ]);
        toast.success("Subject created successfully");
      } else if (formMode === "edit" && selectedSubject) {
        // You can implement update logic here once the API supports it
        toast.info("Edit subject not implemented with API yet");
      }

      setShowFormModal(false);
    } catch (error: any) {
      console.error("Error adding/updating subject:", error);
      toast.error(error.message || "Failed to save subject");
    }
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== subjectId));
  };

  const handleAddCourse = (subject: { _id: string; name: string }) => {
    setCourseMode("add");
    setSelectedCourse(null);
    setActiveSubject(subject);
    setShowCourseModal(true);
  };

  const handleEditCourse = (
    subjectId: string,
    course: any
  ) => {
    setCourseMode("edit");
    setSelectedCourse(course);
    setActiveSubjectId(subjectId);
    setShowCourseModal(true);
  };

  const handleSubmitCourse = async (courseData: { 
    title: string; 
    description: string; 
    courseCode: string; 
    teacherId: string; 
    classId: string;
    // teacherRole: string;
    subjectId: string;
    // schoolId: string;
  }) => {
    try {
      console.log("Submitting course data:", courseData);
      console.log(activeSubject)
      
      // Example: using fetch to send the data. Adjust as needed.
      const response = await fetch(API_ENDPOINTS.CREATE_COURSE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify(courseData)
      });
      if (!response.ok) {
        throw new Error("Failed to create course");
      }
      // If successful, update your state and notify the user.
      toast.success("Course created successfully");
      // Update subjects state with the new course here...
    } catch (error: any) {
      console.error("Error creating course:", error);
      toast.error(error.message || "Failed to create course");
    }
  };
  

  const handleDeleteCourse = (subjectId: string, courseId: string) => {
    setSubjects((prevSubjects) =>
      prevSubjects.map((subject) => {
        if (subject.id !== subjectId) return subject;

        const filteredCourses = subject.courses.filter(
          (course: { id: string }) => course.id !== courseId
        );
        return { ...subject, courses: filteredCourses };
      })
    );
  };

  return (
    <div>
      <FloatingHeader
        selectedClass={selectedClass}
        classList={classes}
        onSelectClass={(selected) => setSelectedClass(selected)}
      />

      <div className="p-6">
        {!selectedClass ? (
          <p className="text-gray-500 text-center mt-20">
            Please select a class to view its curriculum.
          </p>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <button
                onClick={openAddModal}
                className="bg-[#154473] hover:bg-blue-900  text-white px-4 py-2 rounded"
              >
                + Add Subject
              </button>
            </div>

            <SubjectsTable
              subjects={subjects}
              onEdit={openEditModal}
              onDelete={handleDeleteSubject}
              onEditCourse={handleEditCourse}
              onAddCourse={handleAddCourse}
              onDeleteCourse={handleDeleteCourse}
            />
          </>
        )}
      </div>

      <SubjectFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSubmit={handleAddOrEdit}
        initialData={selectedSubject || undefined}
        mode={formMode}
        classList={classes}
      />
      <CourseFormModal
        isOpen={showCourseModal}
        onClose={() => {
          setShowCourseModal(false);
          setSelectedCourse(null);
          setActiveSubject(null);
        }}
        onSubmit={handleSubmitCourse}
        initialData={selectedCourse || undefined}
        mode={courseMode}
        classList={classes}
        subjectId={activeSubject ? activeSubject._id : ""}
      />
    </div>
  );
};

export default CurriculumPage;
