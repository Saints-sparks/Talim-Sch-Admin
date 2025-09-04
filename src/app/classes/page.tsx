"use client";

import { useState, useEffect } from "react";

import {
  FiEdit,
  FiTrash,
  FiChevronLeft,
  FiChevronRight,
  FiUsers,
  FiBook,
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
        <div className="flex h-screen bg-gray-100">
          <main className="flex-grow flex flex-col">
            {/* Navigation Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-600">
                  <FiBook className="w-4 h-4 mr-2" />
                  <span className="text-gray-900 font-medium">
                    Class Management
                  </span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-gray-900 font-semibold text-lg">
                    All Classes
                  </span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-gray-600">{classes.length} total</span>
                </div>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center text-sm font-medium"
                  onClick={toggleModal}
                >
                  <span className="text-lg mr-2">+</span>
                  Add Class
                </button>
              </div>
            </div>

            <div className="flex-1 p-6">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-4">
                    {displayedClasses.map((classItem, index) => {
                      const colorScheme = getRandomColor(index);
                      return (
                        <div
                          key={classItem._id}
                          className={`${colorScheme.bg} ${colorScheme.text} rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 relative h-[250px] flex flex-col group`}
                        >
                          {/* Class Icon and Actions Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="bg-white bg-opacity-20 rounded-lg p-2">
                              <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                              </svg>
                            </div>

                            {/* Edit/Delete Icons - Show on hover */}
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/classes/edit-class/${classItem._id}`
                                  );
                                }}
                                className="bg-white bg-opacity-20 p-1.5 rounded-full hover:bg-opacity-30 transition-colors"
                                title="Edit Class"
                              >
                                <FiEdit className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white bg-opacity-20 p-1.5 rounded-full hover:bg-opacity-30 transition-colors"
                                title="Delete Class"
                              >
                                <FiTrash className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Class Info */}
                          <div className="flex-1 mb-4">
                            <h3 className="text-lg font-bold mb-2 line-clamp-2">
                              {classItem.name}
                            </h3>
                            <p className="text-sm opacity-90 line-clamp-3">
                              {classItem.classDescription ||
                                "No description provided"}
                            </p>
                          </div>

                          {/* Class Stats */}
                          <div className="flex items-center justify-between mb-4 text-xs opacity-90">
                            <div className="flex items-center">
                              <FiUsers className="w-3 h-3 mr-1" />
                              <span>
                                {classItem.classCapacity || "45"} capacity
                              </span>
                            </div>
                            <div className="flex items-center">
                              <FiBook className="w-3 h-3 mr-1" />
                              <span>0 courses</span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="mt-auto">
                            <button
                              onClick={() =>
                                router.push(`/classes/${classItem._id}`)
                              }
                              className={`w-full ${colorScheme.button} text-white py-2.5 px-3 rounded-lg font-medium transition-colors text-sm hover:transform hover:scale-[1.02]`}
                            >
                              Manage Class
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-6 gap-4">
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          currentPage === 1
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                        }`}
                      >
                        <FiChevronLeft className="w-4 h-4" />
                        Previous
                      </button>

                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          currentPage === totalPages
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                        }`}
                      >
                        Next
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
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex justify-end"
          onClick={toggleModal}
        >
          <div
            className="h-full w-full md:w-1/2 bg-white p-6 shadow-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800">
                Add Class
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700 text-2xl"
                onClick={toggleModal}
                disabled={isCreating}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateClass}>
              <div className="mb-4 flex gap-4">
                <div className="flex-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter class name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-gray-700 font-semibold mb-2">
                    Class Capacity (Optional)
                  </label>
                  <select
                    name="classCapacity"
                    value={formData.classCapacity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-gray-700 font-semibold mb-2">
                  Class Description (Optional)
                </label>
                <textarea
                  name="classDescription"
                  placeholder="Provide additional notes about the class."
                  value={formData.classDescription}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                ></textarea>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  onClick={toggleModal}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
