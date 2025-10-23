"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  studentService,
  Class,
  getClasses,
  Student,
} from "@/app/services/student.service";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AddStudentModal from "@/components/AddStudentModal";
import StudentsSkeleton from "@/components/StudentsSkeleton";
import Avatar from "@/components/Avatar";
import { ErrorState, EmptyState } from "@/components/StateComponents";
import { ChevronDown, Search } from "@/components/Icons";

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

  const studentsPerPage = 12;
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

  // Removed menu and edit/deactivate/activate handlers as per new UI

  return (
    <div className="min-h-screen p-4 sm:p-6 flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-[19px] font-semibold leading-[120%] flex items-center gap-3">
            My Students
            <span className="bg-white border border-[#E4E4E4] leading-[120%] text-[15px] font-semibold px-3 py-1 rounded-xl">
              {students.length.toLocaleString()} Students
            </span>
          </h1>
        </div>
        <button
          onClick={toggleModal}
          className="mt-4 sm:mt-0 bg-[#003366] leading-[120%] hover:bg-blue-800 text-white px-6 py-2 rounded-lg font-semibold text-[15px] flex items-center gap-2 shadow-sm"
        >
          <span className="text-lg font-bold">+</span> Add Student
        </button>
      </div>
      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl py-3 mb-6 w-fit">
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            {/* Clean Search Bar */}
            {/* Search Bar */}
            <div className="relative flex-1 w-[220px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
               <Search />
              </span>
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 placeholder-[#B3B3B3] placeholder:font-medium pr-4 py-2 bg-white border border-[#E0E0E0] rounded-xl text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Simple Class Filter */}
            {/* Class Filter */}
            <div className="relative w-[220px] leading-[120%]">
              <select
                className="appearance-none bg-white border border-[#E0E0E0] h-[40px] rounded-xl px-4 py-2 pr-8 text-[15px] font-semibold w-[220px] text-[#808080] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <ChevronDown />
              </span>
            </div>

            {/* Status Filter */}
            {/* Status Filter */}
            <div className="relative w-[191px]">
              <select
                className="appearance-none w-[191px] h-[40px] bg-white border border-[#E0E0E0] rounded-xl px-4 py-2 pr-8 text-[15px] font-semibold text-[#808080] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(
                    e.target.value as "all" | "active" | "inactive"
                  );
                  setCurrentPage(1);
                }}
              >
                <option value="all">Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <ChevronDown />
              </span>
            </div>

            {/* Results Counter (hidden, badge is in header) */}
          </div>
        </div>
      </div>

      {isModalOpen && <AddStudentModal onClose={toggleModal} />}

      <div className="flex-1">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentStudents.map((student, index) => (
              <motion.div
                key={student._id}
                className="bg-white rounded-2xl w-[266px] h-[250px] border border-[#F0F0F0] p-6 flex flex-col items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
              >
                <Avatar
                  src={student.userId.userAvatar}
                  firstName={student.userId.firstName}
                  lastName={student.userId.lastName}
                  className="w-[80px] h-[80px]"
                />
                <div className="mt-4 text-center leading-[120%]">
                  <div className="font-semibold text-[15px]">
                    {student.userId.firstName} {student.userId.lastName}
                  </div>
                  <div className="flex justify-center gap-1 mt-2">
                    <span className="bg-[#F2F2F2] border border-[#E0E0E0] text-[12px] px-3 py-1 rounded-xl">
                      {student.gradeLevel}
                    </span>
                    <span
                      className="text-[12px] font-semibold px-2 py-1 border border-[#003366]/30 rounded-xl text-[#003366] bg-[#003366]/10"
                    >
                      {student.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleViewProfile(student._id)}
                    className="mt-4 w-full bg-[#F2F2F2] border border-[#E0E0E0] hover:border-blue-400 font-semibold py-2 rounded-xl transition-colors text-sm"
                  >
                    View Profile
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
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
                  })}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-xl bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
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
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPage;
