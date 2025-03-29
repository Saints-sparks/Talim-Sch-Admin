'use client';

import React, { useState, FormEvent, ChangeEvent } from "react";
import Header from "@/components/Header";
import axios from "axios";
import { toast, Flip, ToastContainer } from "react-toastify";


interface FormData {
  title: string;
  description: string;
  courseCode: string;
  subjectName: string;
  teacherId: string;
  schoolId: string;
  classId: string;
  teacherRole: string;
}

const AddCourse: React.FC = () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    courseCode: "",
    subjectName: "",
    teacherId: "",
    schoolId: "",
    classId: "",
    teacherRole: "Academic", // Default value
  });

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };


  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      courseCode: "",
      subjectName: "",
      teacherId: "",
      schoolId: "",
      classId: "",
      teacherRole: "Academic",
    });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setButtonLoader(true);
  
    // Retrieve the authorization token from local storage
    const authToken = localStorage.getItem('accessToken');
  
    if (!authToken) {
      toast.error("Authorization token not found. Please log in again.", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Flip,
      });
      setButtonLoader(false);
      return;
    }
  
    try {
      console.log("Request Data:", JSON.stringify(formData, null, 2));
  
      const response = await fetch(`http://localhost:5000/subjects-courses/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) {
        const errorResponse = await response.json(); // Parse the error response
        console.error("Error Response:", errorResponse);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log("Response Data:", data);
  
      toast.success("Course created successfully", {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Flip,
      });
  
      setButtonLoader(false);
      resetForm();
    } catch (error: any) {
      console.log("Error: " + error);
      setButtonLoader(false);
      const errorMessage =
        error.message || "Something went wrong. Please try again.";
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Flip,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <Header user="Administrator" title="Courses" />

      <ToastContainer/>

      <h1 className="text-2xl font-semibold text-gray-800">Add New Course</h1>

      {/* Form */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 font-semibold mb-2">
                Course Title
              </label>
              <input
                type="text"
                name="title"
                placeholder="Enter course title"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div className="flex-1">
              <label className="block text-gray-700 font-semibold mb-2">
                Course Code
              </label>
              <input
                type="text"
                name="courseCode"
                placeholder="Enter course code (e.g., MTH101)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.courseCode}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Subject Name
            </label>
            <input
              type="text"
              name="subjectName"
              placeholder="Enter subject name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.subjectName}
              onChange={handleChange}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Description
            </label>
            <textarea
              name="description"
              placeholder="Enter course description"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={formData.description}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Assign Teacher
            </label>
            <select
              name="teacherId"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.teacherId}
              onChange={handleChange}
            >
              <option value="" disabled>
                Select a teacher
              </option>
              <option value="507f1f77bcf86cd799439031">Mr. John Adewale</option>
              <option value="507f1f77bcf86cd799439051">Ms. Sarah Akinola</option>
              <option value="507f1f77bcf86cd799439061">Dr. Peter Okonkwo</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Select School
            </label>
            <select
              name="schoolId"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.schoolId}
              onChange={handleChange}
            >
              <option value="" disabled>
                Select a School
              </option>
              <option value="887f1f77bcf86cd799439001">Unity Secondary Sch.</option>
              <option value="887f1f77bcf86cd799439201">Treasuredale</option>
              <option value="887f1f77bcf86cd799439501">Play Learn</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Select Class
            </label>
            <select
              name="classId"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.classId}
              onChange={handleChange}
            >
              <option value="" disabled>
                Select a Class
              </option>
              <option value="507f191e810c19729de860ea">JSS 1</option>
              <option value="887f1f77bcf86cd799439201">JSS 2</option>
              <option value="887f1f77bcf86cd799439501">JSS 3</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Teacher Role
            </label>
            <select
              name="teacherRole"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.teacherRole}
              onChange={handleChange}
            >
              <option value="Academic">Academic</option>
              <option value="NonAcademic">Non-Academic</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center mt-6">
            <button
              type="button"
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-blue-700"
              disabled={buttonLoader}
            >
              {buttonLoader ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCourse;