"use client";

import { useState, useEffect } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  FiEdit,
  FiTrash,
  FiChevronLeft,
  FiChevronRight,
  FiBook,
  FiCalendar,
  FiClock,
  FiPlus,
  FiGrid,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import { getClasses, createClass, Class } from "../services/student.service";
import { getSchoolId } from "../services/school.service";
import { toast } from "@/components/CustomToast";
import ClassesSkeleton from "@/components/ClassesSkeleton";
import { ErrorState, EmptyState } from "@/components/StateComponents";
import { InlineSpinner } from "@/components/ui/loading";

const GRADE_OPTIONS = Array.from({ length: 12 }, (_, index) => `Grade ${index + 1}`);

export default function Classes() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    gradeLevel: "",
    classDescription: "",
    classCapacity: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 8;
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
    if (!isModalOpen) {
      setFormData({
        name: "",
        gradeLevel: "",
        classDescription: "",
        classCapacity: "",
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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

      const classData = {
        name: formData.name,
        gradeLevel: formData.gradeLevel,
        classCapacity: formData.classCapacity,
        classDescription: formData.classDescription,
      };

      await createClass(classData);

      toast.success("Class created successfully!");
      setIsModalOpen(false);
      setFormData({
        name: "",
        gradeLevel: "",
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

  // Calculate stats
  const totalStudents = classes.reduce((acc, c) => acc + (c.students?.length || 0), 0);
  const totalCourses = classes.reduce((acc, c) => acc + (c.courses?.length || 0), 0);
  const avgCapacity =
    classes.length > 0
      ? Math.round(
          classes.reduce((acc, c) => acc + (parseInt(c.classCapacity) || 0), 0) / classes.length
        )
      : 0;

  return (
    <>
      {isLoading ? (
        <ClassesSkeleton />
      ) : (
        <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          {/* Enhanced Header with Talim Styling */}
          <div
            data-guide="classes-header"
            className="flex-shrink-0 m-6 rounded-2xl"
            style={{ background: "linear-gradient(to right, #003366, #004488)" }}
          >
            <div className="px-6 py-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <FiGrid className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Class Management</h1>
                    <p className="text-blue-100 mt-1">Manage and organize your classes</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Tooltip
                    content="Create a new class. You can assign students, teachers, and courses to it afterwards."
                    side="top"
                  >
                    <button
                      data-guide="classes-create"
                      onClick={toggleModal}
                      className="inline-flex items-center px-6 py-2.5 text-sm font-semibold rounded-xl hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      style={{ backgroundColor: "white", color: "#003366" }}
                    >
                      <FiPlus className="h-4 w-4 mr-2" />
                      Add Class
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Content Area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <div className="px-6" data-guide="classes-overview">
                {/* Enhanced Stats Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"></div>

                {/* Error State */}
                {error ? (
                  <ErrorState
                    title="Error Loading Classes"
                    message={error}
                    onRetry={() => window.location.reload()}
                  />
                ) : classes.length === 0 ? (
                  /* Empty State */
                  <div data-guide="classes-list">
                    <EmptyState
                      icon="🏫"
                      title="No Classes Found"
                      message="Get started by creating your first class to organize your students."
                      actionText="Create Your First Class"
                      onAction={toggleModal}
                    />
                  </div>
                ) : (
                  /* Classes Grid */
                  <div className="space-y-6">
                    <div
                      data-guide="classes-list"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                      {displayedClasses.map((classItem, index) => (
                        <div
                          key={classItem._id}
                          className="group bg-white rounded-2xl border-2 border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                          style={
                            {
                              borderColor: "transparent",
                              "--hover-border-color": "#003366",
                            } as React.CSSProperties
                          }
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#003366")}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.borderColor = "rgb(229, 231, 235)")
                          }
                        >
                          {/* Card Header */}
                          <div
                            className="px-4 py-3"
                            style={{ background: "linear-gradient(to right, #003366, #004488)" }}
                          >
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold text-white text-lg">
                                {classItem.name || "Class 1"}
                              </h3>
                              <div className="flex items-center gap-2">
                                <Tooltip
                                  content="Update the class name, grade level, capacity, or description."
                                  side="top"
                                >
                                  <button
                                    onClick={() =>
                                      router.push(`/classes/edit-class/${classItem._id}`)
                                    }
                                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm transition"
                                    aria-label={`Edit ${classItem.name || "class"}`}
                                  >
                                    <FiEdit className="w-4 h-4 text-white" />
                                  </button>
                                </Tooltip>
                                <Tooltip
                                  content="Remove this class record when it is no longer needed."
                                  side="top"
                                >
                                  <button
                                    onClick={() => console.log("delete")}
                                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm transition"
                                    aria-label={`Delete ${classItem.name || "class"}`}
                                  >
                                    <FiTrash className="w-4 h-4 text-white" />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          </div>

                          {/* Card Body */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-700">Grade Level</span>
                              <div className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                                <FiCalendar
                                  className="w-3.5 h-3.5 mr-1.5"
                                  style={{ color: "#003366" }}
                                />
                                <span className="text-sm font-semibold text-gray-800">
                                  {classItem.gradeLevel || "Grade 1"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-700">Courses</span>
                              <div className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                                <FiBook className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                                <span className="text-sm font-semibold text-gray-800">
                                  {classItem.courses?.length || 0} courses
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-700">Students</span>
                              <div className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                                <span className="text-sm font-semibold text-gray-800 mr-2">
                                  {classItem.students?.length || 0}/{classItem.classCapacity || 50}
                                </span>
                                <div className="flex -space-x-2">
                                  {(classItem.students || [])
                                    .slice(0, 3)
                                    .map((student: any, i: number) => {
                                      const avatar =
                                        student.userId?.userAvatar || student.userAvatar;
                                      const first =
                                        student.userId?.firstName || student.firstName || "";
                                      return avatar ? (
                                        <img
                                          key={student._id || i}
                                          src={avatar}
                                          alt={first}
                                          className="w-5 h-5 rounded-full border-2 border-white object-cover"
                                        />
                                      ) : (
                                        <div
                                          key={student._id || i}
                                          className="w-5 h-5 rounded-full border-2 border-white bg-[#003366] flex items-center justify-center text-[7px] font-bold text-white"
                                        >
                                          {first.charAt(0).toUpperCase() || "?"}
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium text-gray-700">
                                Last Updated
                              </span>
                              <div className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                                <FiClock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                                <span className="text-sm font-semibold text-gray-800">
                                  {new Date(classItem.updatedAt || Date.now()).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer */}
                          <div className="px-4 pb-4">
                            <Tooltip
                              content="Open class details to manage students, courses, and teacher relationships."
                              side="top"
                            >
                              <button
                                onClick={() => router.push(`/classes/${classItem._id}`)}
                                className="w-full text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:opacity-90"
                                style={{
                                  background: "linear-gradient(to right, #003366, #004488)",
                                }}
                              >
                                Manage Class
                              </button>
                            </Tooltip>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Enhanced Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center gap-4 py-6">
                        <button
                          onClick={handlePrevPage}
                          disabled={currentPage === 1}
                          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                            currentPage === 1
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 shadow-sm hover:shadow-md"
                          }`}
                          style={currentPage !== 1 ? { borderColor: "#003366" } : {}}
                        >
                          <FiChevronLeft className="w-5 h-5" />
                          Previous
                        </button>

                        <div
                          className="px-6 py-3 text-white font-semibold rounded-xl shadow-lg"
                          style={{ background: "linear-gradient(to right, #003366, #004488)" }}
                        >
                          Page {currentPage} of {totalPages}
                        </div>

                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                            currentPage === totalPages
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 shadow-sm hover:shadow-md"
                          }`}
                          style={currentPage !== totalPages ? { borderColor: "#003366" } : {}}
                        >
                          Next
                          <FiChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={toggleModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              className="sticky top-0 px-6 py-5 rounded-t-2xl"
              style={{ background: "linear-gradient(to right, #003366, #004488)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                    <FiPlus className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Create New Class</h3>
                </div>
                <button
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  onClick={toggleModal}
                  disabled={isCreating}
                >
                  <span className="text-white text-2xl">✕</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateClass} className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">Class Name *</label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter class name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <Tooltip
                      content="Optional grouping (e.g. Grade 1–12). Used for filtering and reporting."
                      side="right"
                    >
                      <label className="block text-gray-700 font-semibold mb-2">
                        Grade Level *
                      </label>
                    </Tooltip>
                    <select
                      name="gradeLevel"
                      value={formData.gradeLevel}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Select grade</option>
                      {GRADE_OPTIONS.map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Tooltip
                      content="Maximum students that can be enrolled. Students beyond this limit will be flagged during enrolment."
                      side="right"
                    >
                      <label className="block text-gray-700 font-semibold mb-2">
                        Class Capacity *
                      </label>
                    </Tooltip>
                    <select
                      name="classCapacity"
                      value={formData.classCapacity}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Choose capacity</option>
                      <option value="10">10 Students</option>
                      <option value="20">20 Students</option>
                      <option value="30">30 Students</option>
                      <option value="45">45 Students</option>
                      <option value="50">50 Students</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Class Description
                  </label>
                  <textarea
                    name="classDescription"
                    placeholder="Provide additional notes about the class"
                    value={formData.classDescription}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    rows={4}
                  ></textarea>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-300"
                  onClick={toggleModal}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center hover:opacity-90"
                  style={{ background: "linear-gradient(to right, #003366, #004488)" }}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <InlineSpinner label="Creating Class..." className="text-white" />
                  ) : (
                    <>
                      <FiPlus className="mr-2 h-5 w-5" />
                      Create Class
                    </>
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
