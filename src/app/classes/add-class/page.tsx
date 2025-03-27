'use client';

import React, { useState, FormEvent, ChangeEvent } from "react";
import Header from "@/components/Header";
import axios from "axios";
import { toast } from "react-toastify";
import { Flip } from "react-toastify";

interface FormData {
  className: string;
  classCapacity: string;
  classDescription: string;
  assignedTeacher: string;
  courses: string[];
}

const AddSubject: React.FC = () => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [buttonLoader, setButtonLoader] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    className: "",
    classCapacity: "",
    classDescription: "",
    assignedTeacher: "",
    courses: [],
  });

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setButtonLoader(true);

    try {
      const response = await axios.post(`${baseUrl}/subjects-courses/courses`, formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      toast.success("Subject added successfully", {
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
    } catch (error: any) {
      console.log("Error: " + error)
      setButtonLoader(false);
      const errorMessage =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";
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
      <Header />

      <h1 className="text-2xl font-semibold text-gray-800">Add New Class</h1>

      {/* Form */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 font-semibold mb-2 text-gray-800">
                Class Name
              </label>
              <input
                type="text"
                name="className"
                placeholder="Enter class name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.className}
                onChange={handleChange}
              />
            </div>

            <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2 text-gray-800">
            Class Capacity (Optional)
          </label>
          <select
            name="classCapacity"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.classCapacity} // Controlled by state
            onChange={handleChange}
          >
            <option value="" disabled>
              Choose your class capacity
            </option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
          </select>
        </div>
          </div>

          <div className="mb-4 relative">
            <label className="block text-gray-700 font-semibold mb-2 text-gray-800">
              Class Description (Optional)
            </label>
            <textarea
              name="classDescription"
              placeholder="Provide additional notes about the class."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={formData.classDescription}
              onChange={handleChange}
            ></textarea>
          </div>

          {/* Assign Teacher */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2 text-gray-800">
              Assign Teacher
            </label>
            <select
              name="assignedTeacher"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.assignedTeacher}
              onChange={handleChange}
            >
              <option value="" disabled>
                Select a teacher
              </option>
              <option value="teacher-1" className="text-gray-800">Mr. John Adewale</option>
              <option value="teacher-2" className="text-gray-800">Ms. Sarah Akinola</option>
              <option value="teacher-3" className="text-gray-800">Dr. Peter Okonkwo</option>
            </select>
          </div>

          {/* Courses Section */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2 text-gray-800">
              Courses
            </label>
            <div className="flex flex-wrap gap-5">
              <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
                MTH112
              </span>
              <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
                ENG123
              </span>
              <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
                ENG125
              </span>
              <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
                SCI101
              </span>
            </div>

            <div className="flex flex-wrap gap-5 py-5">
              <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
                MTH112
              </span>
              <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
                ENG123
              </span>
              <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
                ENG125
              </span>
              <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
                SCI101
              </span>
            </div>

            <div className="flex flex-wrap gap-5">
              <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
                MTH112
              </span>
              <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
                ENG123
              </span>
              <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
                ENG125
              </span>
              <span className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
                SCI101
              </span>
            </div>
          </div>

          {/* Add New Course Button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={toggleModal}
              className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-gray-300"
            >
              Add New Course
            </button>
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center mt-6">
            <button
              type="button"
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Cancel
            </button>
            {/* <button onClick={()=> {handle}}
              type="submit"
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
    
            >Edit
            </button> */}

            <a
                href={`/classes/edit-class`} 
                    className="px-3 py-1 bg-white text-[#154473] border border-[#154473] rounded hover:bg-gray-200"
                >
                    Edit 
            </a>
          </div>
        </form>
      </div>
    
 



         {/* Add Class Modal */}
    {isModalOpen && (
  <div
    className={`fixed inset-0 bg-gray-900 bg-opacity-50 z-50 transition-opacity duration-300 ease-in-out ${
      isModalOpen ? "opacity-100" : "opacity-0"
    }`}
    onClick={toggleModal} // Close modal on clicking the overlay
  >
    <div
      className={`absolute right-0 top-0 h-full w-full md:w-1/2 bg-white p-6 shadow-lg transform transition-transform duration-300 ease-in-out ${
        isModalOpen ? "translate-x-0" : "translate-x-full"
      } flex flex-col`}
      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
    >
      {/* Modal Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-gray-800">Add Subjects</h3>
        <button
          className="text-gray-500 hover:text-gray-700 text-2xl"
          onClick={toggleModal}
        >
          ✕
        </button>
      </div>

      {/* Modal Body */}
      <form className="flex-grow">
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <label className="block text-gray-700 font-semibold mb-2 text-gray-800">
              Subject Name
            </label>
            <input
              type="text"
              placeholder="Enter class name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex-1">
            <label className="block text-gray-700 font-semibold mb-2">
            Course Name
            </label>
            <input
              type="text"
              placeholder="e.g: MAT112"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

          {/* Assign Teacher */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2 text-gray-800">
              Assign Teacher
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled selected>
                Select a teacher
              </option>
              <option value="teacher-1">Mr. John Adewale</option>
              <option value="teacher-2">Ms. Sarah Akinola</option>
              <option value="teacher-3">Dr. Peter Okonkwo</option>
            </select>
          </div>
        <div className="mb-4 relative">
          <label className="block text-gray-700 font-semibold mb-2 text-gray-800">
            Subject Description (Optional)
          </label>
          <textarea
            placeholder="Provide additional notes about the class."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          ></textarea>
        </div>
      </form>

      {/* Modal Footer */}
      <div className="flex justify-end gap-4 mt-auto">
        <button
          className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          onClick={toggleModal}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-blue-700 text-gray-800"
        >
          Create
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default AddSubject;
















// // app/manage-track/curriculum/classes/create/page.tsx
// import React from "react";

// const CreateClassPage: React.FC = () => {
//   return (
//     <div className="px-6 py-8">
//       <h1 className="text-2xl font-semibold text-gray-800">Create New Class</h1>
//       <form className="mt-6 space-y-4">
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Class Title</label>
//           <input
//             type="text"
//             className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//             placeholder="Enter class title"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Subject</label>
//           <input
//             type="text"
//             className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//             placeholder="Enter subject"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Duration</label>
//           <input
//             type="text"
//             className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//             placeholder="Enter class duration"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium text-gray-700">Time</label>
//           <input
//             type="text"
//             className="mt-1 block w-full border border-gray-300 rounded-md p-2"
//             placeholder="Enter class time"
//           />
//         </div>
//         <div>
//           <button className="bg-blue-600 text-white px-4 py-2 rounded-md">Create Class</button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default CreateClassPage;
