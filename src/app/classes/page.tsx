
'use client';

import { useState } from "react";
import Header from "@/components/Header";
import { FiEdit, FiTrash } from "react-icons/fi";
import { useRouter } from "next/navigation";

export default function Classes() {
  const router = useRouter();
  const [classes] = useState([
    { name: "Grade 1", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 2", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 3", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 4", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 5", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 6", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 7", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 8", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 9", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 10", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 11", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 12", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 13", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 14", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 15", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 16", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 17", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 18", capacity: "40/50", subjects: "Mathematics, Science..." },
    { name: "Grade 19", capacity: "40/50", subjects: "Mathematics, Science..." },
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const totalPages = Math.ceil(classes.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const displayedClasses = classes.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const navigateToAddSubject = () => {
    router.push("/add-subject"); 
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <main className="flex-grow p-8">
        <Header />
        <h1 className="font-semibold text-3xl py-5 px-5">Class Overview</h1>

        {/* Classes Table */}
        <section className="bg-white shadow rounded p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Classes</h3>
            <button
              className="font-bold text-[#154473]"
              onClick={toggleModal}
            >
              + Add
            </button>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Class Name</th>
                <th className="text-left py-2 px-4">Capacity</th>
                <th className="text-left py-2 px-4">Subjects Assigned</th>
                <th className="text-left py-2 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedClasses.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">{item.name}</td>
                  <td className="py-2 px-4">{item.capacity}</td>
                  <td className="py-2 px-4">{item.subjects}</td>
                  <td className="py-2 px-4">
                    <button className="px-3 py-1 bg-[#154473] text-white rounded hover:bg-blue-600">
                      View
                    </button>
                    <button className="ml-2 px-2 py-1 text-gray-500 hover:text-gray-700">
                      <FiEdit className="text-xl" />
                    </button>
                    <button className="ml-2 px-2 py-1 text-red-500 hover:text-red-700">
                      <FiTrash className="text-xl" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <button
              className={`px-3 py-1 border rounded ${
                currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "text-blue-500 hover:bg-gray-100"
              }`}
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              &lt; Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className={`px-3 py-1 border rounded ${
                currentPage === totalPages ? "text-gray-300 cursor-not-allowed" : "text-blue-500 hover:bg-gray-100"
              }`}
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next &gt;
            </button>
          </div>
        </section>
      </main>

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
        <h3 className="text-2xl font-semibold text-gray-800">Add Class</h3>
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

          {/* Saving Indicator */}
          <div className="absolute right-2 bottom-3 flex items-center gap-2 text-gray-600">
            <svg
              className="animate-spin h-5 w-5 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291a8.001 8.001 0 01-1.528-9.707l-3.464 2A12.014 12.014 0 006 17.291z"
              ></path>
            </svg>
            <span>Saving</span>
          </div>
        </div>

        <div className="mb-4">
          <button
            type="button"
            onClick={navigateToAddSubject}
            className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Add New Subjects
          </button>
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
}

