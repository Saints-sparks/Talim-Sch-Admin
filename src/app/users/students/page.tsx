"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  studentService,
  StudentById,
  Class,
  getClasses,
  Student,
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
    return nameMatch;
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

  return (
    <div className="min-h-screen bg-[#F8F8F8] p-4 sm:p-6 flex flex-col">
      {/* Title and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 mt-5 gap-4 sm:gap-0">
        <div className="flex items-center gap-x-4">
          <h1 className="text-lg sm:text-xl font-medium text-gray-800">
            Students
          </h1>
          <SmoothButton
            onClick={toggleModal}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-gray-600 font-medium hover:text-gray-900"
          >
            <span className="text-lg">+</span>
            <span className="hidden sm:inline">Add</span>
          </SmoothButton>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <FaSearch size={16} />
            </span>
            <input
              type="text"
              placeholder="Search for students"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Class Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            value={selectedClass || ""}
            onChange={(e) => {
              setSelectedClass(e.target.value || null);
              setCurrentPage(1);
            }}
          >
            <option value="">Select class</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>
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
            {/* Students Grid - Takes available space */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 flex-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {currentStudents.map((student, index) => (
                <motion.div
                  key={student._id}
                  className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 relative h-fit hover:shadow-md transition-shadow duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  whileHover={{ y: -2 }}
                >
                  {/* Three dots menu */}
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                    <button
                      className="text-gray-400 hover:text-gray-600 p-1"
                      onClick={() => toggleMenu(student._id)}
                    >
                      <span className="text-lg font-bold">⋮</span>
                    </button>
                    {menuOpen === student._id && (
                      <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg">
                          Edit
                        </button>
                        <button className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 rounded-b-lg">
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Student Avatar */}
                  <div className="flex justify-center mb-3 sm:mb-4">
                    <Avatar
                      src={student.userId.userAvatar}
                      firstName={student.userId.firstName}
                      lastName={student.userId.lastName}
                      size="md"
                    />
                  </div>

                  {/* Student Info */}
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">
                      {`${student.userId.firstName} ${student.userId.lastName}`}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                      {student.gradeLevel}
                    </p>

                    {/* View Profile Button */}
                    <SmoothButton
                      onClick={() => handleViewProfile(student._id)}
                      variant="outline"
                      className="w-full text-gray-700 border-gray-300 hover:bg-gray-50 text-xs sm:text-sm py-2"
                    >
                      View Profile
                    </SmoothButton>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination - Modern design */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-gray-200 gap-4 bg-white rounded-lg p-4 shadow-sm">
              {/* Results Info */}
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-medium text-gray-900">
                  {startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-gray-900">
                  {Math.min(
                    startIndex + studentsPerPage,
                    filteredStudents.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-900">
                  {filteredStudents.length}
                </span>{" "}
                students
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-3">
                {/* Rows per page */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Show:</span>
                  <select
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <div className="flex items-center gap-1">
                  <button
                    className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    className="p-2 rounded-md border border-gray-300 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
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
                  </button>
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
