'use client'

import React, {useState} from "react";
import Header from "@/components/Header";

const AddSubject = () => {

    const [isModalOpen, setIsModalOpen] = useState(false);
  
    const toggleModal = () => {
      setIsModalOpen(!isModalOpen);
    };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <Header user="Administrator" title="Add Subject" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Add New Subject</h1>
      </div>

      {/* Form */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <form>
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <label className="block text-gray-700 font-semibold mb-2">
              Class Name
            </label>
            <input
              type="text"
              placeholder="Enter class name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex-1">
            <label className="block text-gray-700 font-semibold mb-2">
              Class Capacity (Optional)
            </label>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="" disabled selected>
                Choose your class capacity
              </option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
            </select>
          </div>
        </div>

        <div className="mb-4 relative">
          <label className="block text-gray-700 font-semibold mb-2">
            Class Description (Optional)
          </label>
          <textarea
            placeholder="Provide additional notes about the class."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          ></textarea>
        </div>

          {/* Assign Teacher */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
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

          {/* Courses Section */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">
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
            <button
              type="submit"
              className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-blue-700"
            >
              Save
            </button>
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
            <label className="block text-gray-700 font-semibold mb-2">
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
            <label className="block text-gray-700 font-medium mb-2">
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
          <label className="block text-gray-700 font-semibold mb-2">
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
          className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-blue-700"
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
