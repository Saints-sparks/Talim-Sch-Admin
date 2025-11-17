"use client";

import { useState, useEffect } from "react";

import {
  FiEdit,
  FiTrash,
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
  FiBook,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { getClasses, createClass, Class } from "../services/student.service";
import { getSchoolId } from "../services/school.service";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ClassesSkeleton from "@/components/ClassesSkeleton";

// Add custom styles for text truncation
const customStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Rainbow color palette for cards with reduced thickness
const rainbowColors = [
  {
    bg: "bg-blue-400",
    text: "text-white",
    button: "bg-blue-500 hover:bg-blue-600",
  },
  {
    bg: "bg-green-400",
    text: "text-white",
    button: "bg-green-500 hover:bg-green-600",
  },
  {
    bg: "bg-yellow-400",
    text: "text-gray-800",
    button: "bg-yellow-500 hover:bg-yellow-600",
  },
  {
    bg: "bg-purple-400",
    text: "text-white",
    button: "bg-purple-500 hover:bg-purple-600",
  },
  {
    bg: "bg-pink-400",
    text: "text-white",
    button: "bg-pink-500 hover:bg-pink-600",
  },
  {
    bg: "bg-red-400",
    text: "text-white",
    button: "bg-red-500 hover:bg-red-600",
  },
  {
    bg: "bg-indigo-400",
    text: "text-white",
    button: "bg-indigo-500 hover:bg-indigo-600",
  },
  {
    bg: "bg-teal-400",
    text: "text-white",
    button: "bg-teal-500 hover:bg-teal-600",
  },
  {
    bg: "bg-orange-400",
    text: "text-white",
    button: "bg-orange-500 hover:bg-orange-600",
  },
];

export default function Classes() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    classDescription: "",
    classCapacity: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 8; // Changed to 8 for better 4x2 grid per page
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);

  const totalPages = Math.ceil(classes.length / cardsPerPage);
  const startIndex = (currentPage - 1) * cardsPerPage;
  const endIndex = startIndex + cardsPerPage;
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
    // Reset form when closing modal
    if (!isModalOpen) {
      setFormData({
        name: "",
        classDescription: "",
        classCapacity: "",
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const schoolId = getSchoolId();
        if (!schoolId) {
          throw new Error("School ID is required");
        }

        const classes = await getClasses();
        setClasses(classes);
      } catch (error) {
        console.error("Error fetching classes:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load classes. Please try again later.";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);

      // Create class
      const classData = {
        name: formData.name,
        classCapacity: formData.classCapacity,
        classDescription: formData.classDescription,
      };

      await createClass(classData);

      toast.success("Class created successfully!");
      setIsModalOpen(false);
      setFormData({
        name: "",
        classDescription: "",
        classCapacity: "",
      });
      const classes = await getClasses();
      setClasses(classes);
    } catch (error) {
      console.error("Error creating class:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const getRandomColor = (index: number) => {
    return rainbowColors[index % rainbowColors.length];
  };

  return (
    <>
      <style>{customStyles}</style>
      {isLoading ? (
        <ClassesSkeleton />
      ) : (
        <div className="flex h-screen bg-[#F8F8F8]">
          <main className="flex-grow flex flex-col">
            {/* Navigation Header */}
            <div className="flex items-center justify-between bg-[#F8F8F8] border-b border-gray-200 px-4 sm:px-6 py-4">
              {/* Left Side - Title & Count */}
              <div className="flex items-center space-x-3">
                <h1 className="font-semibold font-manrope text-[19px]">
                  My classes
                </h1>
                <span className="text-[15px] font-semibold bg-white px-3 py-1 rounded-md">
                  {classes.length} Class
                </span>
              </div>

              {/* Right Side - Edit Button */}
              <button
                onClick={() => router.push("/classes/edit")}
                className="flex items-center space-x-2 bg-[#003366] hover:bg-[#002244] text-white font-medium text-sm sm:text-base px-4 py-2 rounded-lg transition"
              >
                <span>Edit Class</span>
                <FiEdit className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-4 sm:p-6">
              {error ? (
                <div className="text-center py-12 flex-1 flex items-center justify-center">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
                    <div className="text-red-600 text-lg font-semibold mb-2">
                      Error Loading Classes
                    </div>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : classes.length === 0 ? (
                <div className="text-center py-12 flex-1 flex items-center justify-center">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
                    <div className="text-gray-400 text-6xl mb-4">🏫</div>
                    <div className="text-gray-600 text-lg font-semibold mb-2">
                      No Classes Found
                    </div>
                    <p className="text-gray-500 mb-4">
                      Get started by creating your first class to organize your
                      students.
                    </p>
                    <button
                      onClick={toggleModal}
                      className="px-4 py-2 bg-[#154473] text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Create First Class
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  {/* Classes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ">
                    {displayedClasses.map((classItem) => (
                      <div
                        key={classItem._id}
                        className="bg-white rounded-2xl border border-gray-100 shadow-md transition-all duration-300"
                      >
                        {/* Top Section */}
                        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100">
                          <h3 className="font-semibold text-[15px]">Class 1</h3>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                router.push(
                                  `/classes/edit-class/${classItem._id}`
                                )
                              }
                              className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-100 transition"
                              title="Edit"
                            >
                              <FiEdit className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              onClick={() => console.log("delete")}
                              className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-100 transition"
                              title="Delete"
                            >
                              <FiTrash className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>
                        </div>

                        {/* Details Section */}
                        <div className="px-4 py-3 space-y-3 text-sm text-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-[15px] font-semibold">
                              Class Name
                            </span>
                            <div className="flex items-center bg-[#F2F2F2] text-[#4D4D4D] px-2 py-1 rounded-md text-[15px] font-semibold">
                              <FiCalendar className="w-3.5 h-3.5 mr-1 text-[#1A1A1A]" />
                              Grade 1
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[15px] font-semibold">
                              Courses
                            </span>
                            <div className="flex items-center bg-[#F2F2F2] text-[#4D4D4D] px-2 py-1 rounded-md text-[15px] font-semibold">
                              <FiBook className="w-3.5 h-3.5 mr-1 text-[#1A1A1A]" />
                              9 courses
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[15px] font-semibold">
                              Students
                            </span>
                            <div className="flex items-center bg-[#F2F2F2] text-[#4D4D4D] px-2 py-1 rounded-md text-[15px] font-semibold">
                              <span>40/50</span>
                              <div className="flex ml-2 -space-x-2">
                                <img
                                  src="/img/classdetail-student1.png"
                                  alt="student image"
                                  className="w-5 h-5 rounded-full border border-white"
                                />
                                <img
                                  src="/img/classdetail-student2.png"
                                  alt="student image"
                                  className="w-5 h-5 rounded-full border border-white"
                                />
                                <img
                                  src="/img/classdetail-student3.png"
                                  alt="student image"
                                  className="w-5 h-5 rounded-full border border-white"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[15px] font-semibold">
                              Last Updated
                            </span>
                            <div className="flex items-center bg-[#F2F2F2] text-[#4D4D4D] px-2 py-1 rounded-md text-[15px] font-semibold">
                              <FiClock className="w-3.5 h-3.5 mr-1 text-[#1A1A1A]" />
                              9/27/2025
                            </div>
                          </div>
                        </div>

                        {/* Manage Button */}
                        <div className="px-4 pb-4">
                          <button
                            onClick={() =>
                              router.push(`/classes/${classItem._id}`)
                            }
                            className="w-full bg-[#E0E0E0] hover:bg-gray-300 text-[15px] font-semibold py-2 rounded-md transition"
                          >
                            Manage Class
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row justify-center items-center mt-6 gap-3 sm:gap-4">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border transition-colors w-full sm:w-auto justify-center ${
                          currentPage === 1
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                        }`}
                      >
                        <FiChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">Prev</span>
                      </button>

                      <span className="text-sm text-gray-600 px-2">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border transition-colors w-full sm:w-auto justify-center ${
                          currentPage === totalPages
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                        }`}
                      >
                        <span className="hidden sm:inline">Next</span>
                        <span className="sm:hidden">Next</span>
                        <FiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* Add Class Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex justify-center sm:justify-end items-end sm:items-stretch"
          onClick={toggleModal}
        >
          <div
            className="h-full w-full sm:w-3/4 md:w-1/2 bg-white p-4 sm:p-6 shadow-lg overflow-y-auto rounded-t-lg sm:rounded-t-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-800">
                Add Class
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl p-1"
                onClick={toggleModal}
                disabled={isCreating}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateClass}>
              <div className="mb-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-gray-700 font-semibold mb-2 text-sm sm:text-base">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter class name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-gray-700 font-semibold mb-2 text-sm sm:text-base">
                    Class Capacity (Optional)
                  </label>
                  <select
                    name="classCapacity"
                    value={formData.classCapacity}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  >
                    <option value="">Choose your class capacity</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                    <option value="45">45</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2 text-sm sm:text-base">
                  Class Description (Optional)
                </label>
                <textarea
                  name="classDescription"
                  placeholder="Provide additional notes about the class."
                  value={formData.classDescription}
                  onChange={handleInputChange}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  rows={3}
                ></textarea>
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6">
                <button
                  type="button"
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm sm:text-base order-2 sm:order-1"
                  onClick={toggleModal}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-[#154473] text-white rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors text-sm sm:text-base order-1 sm:order-2"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white"
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
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
