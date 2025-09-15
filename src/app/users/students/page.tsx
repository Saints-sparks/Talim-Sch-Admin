"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  studentService,
  StudentById,
  Class,
  getClasses,
  Student,
  updateStudentStatus,
} from "@/app/services/student.service";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import AddStudentModal from "@/components/AddStudentModal";
import { FaSearch } from "react-icons/fa";
import StudentsSkeleton from "@/components/StudentsSkeleton";
import Avatar from "@/components/Avatar";
import SmoothButton from "@/components/SmoothButton";
import { ErrorState, EmptyState } from "@/components/StateComponents";

const StudentPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (selectedClass) {
        const response = await studentService.getStudentsByClass(
          selectedClass,
          currentPage,
          9
        );
        console.log(response.data);
        setStudents(response.data);
      } else {
        const response = await studentService.getStudents(currentPage, 9);
        setStudents(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch students");
      toast.error("Failed to fetch students");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const classes = await getClasses();
      setClasses(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load classes. Please try again later.");
    }
  };

  const handleViewProfile = (studentId: string) => {
    router.push(`/users/students/${studentId}/view`);
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [currentPage]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const studentsPerPage = 9;
  const filteredStudents = students.filter((student) => {
    const nameMatch = `${student.userId.firstName} ${student.userId.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "active" && student.isActive) ||
      (statusFilter === "inactive" && !student.isActive);

    return nameMatch && statusMatch;
  });

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const currentStudents = filteredStudents.slice(
    startIndex,
    startIndex + studentsPerPage
  );

  const toggleMenu = (studentId: string) => {
    setMenuOpen(menuOpen === studentId ? null : studentId);
  };

  const handleEditStudent = (studentId: string) => {
    router.push(`/users/students/${studentId}/edit`);
  };

  const handleDeactivateStudent = async (studentId: string) => {
    try {
      setMenuOpen(null); // Close the menu
      const result = await updateStudentStatus(studentId, false);
      toast.success(result.message || "Student deactivated successfully");
      fetchStudents(); // Refresh the list
    } catch (error) {
      console.error("Error deactivating student:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to deactivate student";
      toast.error(errorMessage);
    }
  };

  const handleActivateStudent = async (studentId: string) => {
    try {
      setMenuOpen(null); // Close the menu
      const result = await updateStudentStatus(studentId, true);
      toast.success(result.message || "Student activated successfully");
      fetchStudents(); // Refresh the list
    } catch (error) {
      console.error("Error activating student:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to activate student";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 flex flex-col">
      {/* Refined Header Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 mt-5">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <span className="text-xl">👨‍🎓</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  Students
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  Manage student information and records
                </p>
              </div>
            </div>

            <button
              onClick={toggleModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium text-sm"
            >
              <span className="text-base">+</span>
              <span>Add Student</span>
            </button>
          </div>
        </div>{" "}
        {/* Refined Search and Filter Section */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Clean Search Bar */}
            <div className="relative flex-1 max-w-sm">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <FaSearch className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Simple Class Filter */}
            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow cursor-pointer min-w-[140px]"
                value={selectedClass || ""}
                onChange={(e) => {
                  setSelectedClass(e.target.value || null);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow cursor-pointer min-w-[120px]"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(
                    e.target.value as "all" | "active" | "inactive"
                  );
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Simple Results Counter */}
            {filteredStudents.length > 0 && (
              <div className="text-sm text-gray-600 flex items-center gap-1">
                <span className="font-medium">{filteredStudents.length}</span>
                <span>
                  {statusFilter === "active"
                    ? "active"
                    : statusFilter === "inactive"
                    ? "inactive"
                    : ""}{" "}
                  students
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && <AddStudentModal onClose={toggleModal} />}

      {/* Main Content Area - Flex container to push pagination to bottom */}
      <div className="flex flex-col flex-1">
        {/* Content Section */}
        {isLoading ? (
          <StudentsSkeleton />
        ) : error ? (
          <ErrorState
            title="Error Loading Students"
            message={error}
            onRetry={fetchStudents}
          />
        ) : students.length === 0 ? (
          <EmptyState
            icon="👨‍🎓"
            title="No Students Found"
            message={
              searchTerm || selectedClass
                ? "No students match your current search or filter criteria."
                : "There are no students in the system yet."
            }
            actionText={
              searchTerm || selectedClass
                ? "Clear Filters"
                : "Add First Student"
            }
            onAction={
              searchTerm || selectedClass
                ? () => {
                    setSearchTerm("");
                    setSelectedClass(null);
                    setCurrentPage(1);
                  }
                : toggleModal
            }
          />
        ) : (
          <>
            {/* Clean Students Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1">
              {currentStudents.map((student, index) => (
                <motion.div
                  key={student._id}
                  className={`bg-white rounded-lg border p-5 relative h-fit transition-all duration-200 ${
                    student.isActive
                      ? "border-gray-200 hover:border-gray-300 hover:shadow-md"
                      : "border-gray-300 bg-gray-50 opacity-75"
                  }`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                >
                  {/* Simple Menu Button */}
                  <div className="absolute top-4 right-4 z-20">
                    <button
                      className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
                      onClick={() => toggleMenu(student._id)}
                    >
                      <span className="text-gray-400 hover:text-gray-600 font-bold text-sm">
                        ⋮
                      </span>
                    </button>
                    {menuOpen === student._id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                        <button
                          onClick={() => handleEditStudent(student._id)}
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Edit Student
                        </button>
                        {student.isActive ? (
                          <button
                            onClick={() => handleDeactivateStudent(student._id)}
                            className="block w-full px-4 py-2 text-left text-sm text-orange-600 hover:bg-orange-50 transition-colors"
                          >
                            Deactivate Student
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateStudent(student._id)}
                            className="block w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 transition-colors"
                          >
                            Activate Student
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Clean Student Avatar */}
                  <div className="flex justify-center mb-4 relative">
                    <Avatar
                      src={student.userId.userAvatar}
                      firstName={student.userId.firstName}
                      lastName={student.userId.lastName}
                      size="lg"
                    />
                    {/* Status indicator */}
                    <div
                      className={`absolute -bottom-1 right-14 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white ${
                        student.isActive ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          student.isActive ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Enhanced Student Info */}
                  <div className="text-center space-y-3">
                    <div>
                      <h3
                        className={`font-semibold text-lg mb-1 ${
                          student.isActive ? "text-gray-900" : "text-gray-500"
                        }`}
                      >
                        {`${student.userId.firstName} ${student.userId.lastName}`}
                      </h3>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {student.gradeLevel}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            student.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {student.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {typeof student.studentId === "string" &&
                        student.studentId && (
                          <p
                            className={`text-xs ${
                              student.isActive
                                ? "text-blue-600"
                                : "text-gray-400"
                            }`}
                          >
                            ID: {student.studentId}
                          </p>
                        )}
                    </div>

                    {/* Conditional Action Button */}
                    <button
                      onClick={() => handleViewProfile(student._id)}
                      className="w-full border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-600 hover:text-blue-600 py-2 rounded-lg font-medium transition-all text-sm"
                    >
                      View Profile
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Enhanced Pagination - Modern Talim Design */}
            <div className="mt-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="flex flex-col lg:flex-row justify-between items-center px-8 py-6 gap-6">
                  {/* Results Info */}
                  <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-xl">
                    Showing{" "}
                    <span className="font-semibold text-blue-600">
                      {startIndex + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-blue-600">
                      {Math.min(
                        startIndex + studentsPerPage,
                        filteredStudents.length
                      )}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-blue-600">
                      {filteredStudents.length}
                    </span>{" "}
                    students
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Rows per page */}
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="font-medium">Show:</span>
                      <select
                        className="bg-white border-2 border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                        value={studentsPerPage}
                        onChange={(e) => {
                          // Handle rows per page change
                          // setStudentsPerPage(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        <option value="4">4</option>
                        <option value="9">9</option>
                        <option value="18">18</option>
                        <option value="27">27</option>
                      </select>
                    </div>

                    {/* Page Navigation */}
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                        disabled={currentPage === 1}
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                          />
                        </svg>
                      </motion.button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: Math.min(totalPages, 5) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <motion.button
                                key={pageNum}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-10 h-10 text-sm rounded-xl font-medium transition-all flex items-center justify-center ${
                                  currentPage === pageNum
                                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                {pageNum}
                              </motion.button>
                            );
                          }
                        )}
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                        disabled={currentPage === totalPages}
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(prev + 1, totalPages)
                          )
                        }
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentPage;
