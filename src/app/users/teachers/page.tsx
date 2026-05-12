"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AddTeacherModal from "@/components/AddTeacherModal";
import TeachersSkeleton from "@/components/TeachersSkeleton";
import { Teacher, teacherService } from "@/app/services/teacher.service";
import { getClasses, type Class } from "@/app/services/student.service";
import { toast } from "@/components/CustomToast";
import { ErrorState, EmptyState } from "@/components/StateComponents";
import { ChevronDown, Search } from "@/components/Icons";
import { Tooltip } from "@/components/ui/Tooltip";

const TeachersPage: React.FC = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const [teachersPerPage, setTeachersPerPage] = useState(9);

  const getTeacherUser = (teacher: Teacher) =>
    typeof teacher.userId === "object" ? teacher.userId : null;
  const getTeacherUserId = (teacher: Teacher) => getTeacherUser(teacher)?._id || teacher._id;
  const getTeacherFirstName = (teacher: Teacher) =>
    getTeacherUser(teacher)?.firstName || teacher.firstName || "";
  const getTeacherLastName = (teacher: Teacher) =>
    getTeacherUser(teacher)?.lastName || teacher.lastName || "";
  const getTeacherEmail = (teacher: Teacher) =>
    getTeacherUser(teacher)?.email || teacher.email || "";
  const getTeacherPhone = (teacher: Teacher) =>
    getTeacherUser(teacher)?.phoneNumber || teacher.phoneNumber || "";
  const getTeacherAvatar = (teacher: Teacher) =>
    teacher.userAvatar || getTeacherUser(teacher)?.userAvatar || "";
  const getAssignedClasses = (teacher: Teacher) =>
    teacher.assignedClasses || [];

  const fetchTeachers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await teacherService.getTeachers(1, 1000);
      const teachersWithProfiles = await Promise.all(
        response.data.map(async (teacher) => {
          const userId = getTeacherUserId(teacher);

          try {
            const profile = await teacherService.getTeacherById(userId);
            return {
              ...teacher,
              assignedClasses:
                profile.classTeacherClasses || profile.assignedClasses || [],
              assignedCourses: profile.assignedCourses || [],
              isFormTeacher: profile.isFormTeacher,
              hasTeacherProfile: true,
            };
          } catch (profileError) {
            return { ...teacher, hasTeacherProfile: false };
          }
        })
      );

      setTeachers(teachersWithProfiles);
      if (response.meta && typeof response.meta.total === "number") {
        setTotalTeachers(response.meta.total);
      } else {
        setTotalTeachers(response.data.length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch teachers");
      toast.error("Failed to fetch teachers");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchClasses = useCallback(async () => {
    try {
      const classes = await getClasses();
      setClasses(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Failed to load classes");
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
    fetchClasses();
  }, [fetchTeachers, fetchClasses]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const toggleMenu = (teacherId: string) => {
    setMenuOpen(menuOpen === teacherId ? null : teacherId);
  };

  const handleViewProfile = (teacher: Teacher) => {
    router.push(`/users/teachers/${getTeacherUserId(teacher)}`);
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setMenuOpen(null);
    router.push(`/users/teachers/${getTeacherUserId(teacher)}/edit`);
  };

  const handleDeactivateTeacher = async (teacher: Teacher) => {
    setMenuOpen(null);
    const userId = getTeacherUserId(teacher);
    const teacherName = `${getTeacherFirstName(teacher)} ${getTeacherLastName(
      teacher
    )}`.trim();

    if (
      !window.confirm(
        `Deactivate ${teacherName || "this teacher"}? They will no longer be able to access the teacher portal.`
      )
    ) {
      return;
    }

    try {
      await teacherService.deactivateTeacher(userId);
      toast.success("Teacher deactivated successfully");
      await fetchTeachers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to deactivate teacher"
      );
    }
  };

  // Filter teachers based on search term, selected class, and status
  const filteredTeachers = teachers.filter((teacher) => {
    const search = searchTerm.trim().toLowerCase();
    const searchableText = [
      getTeacherFirstName(teacher),
      getTeacherLastName(teacher),
      getTeacherEmail(teacher),
      getTeacherPhone(teacher),
    ]
      .join(" ")
      .toLowerCase();
    const nameMatch = !search || searchableText.includes(search);

    const classMatch =
      !selectedClass ||
      getAssignedClasses(teacher).some((cls) => cls._id === selectedClass);

    // Use isActive boolean for status
    const statusMatch =
      !statusFilter ||
      (statusFilter === "active" && teacher.isActive) ||
      (statusFilter === "inactive" && !teacher.isActive);

    return nameMatch && classMatch && statusMatch;
  });

  // Calculate pagination values for filtered results
  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / teachersPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const currentTeachers = filteredTeachers.slice(
    (safeCurrentPage - 1) * teachersPerPage,
    (safeCurrentPage - 1) * teachersPerPage + teachersPerPage
  );
  const showingStart =
    filteredTeachers.length === 0
      ? 0
      : (safeCurrentPage - 1) * teachersPerPage + 1;
  const showingEnd = Math.min(
    (safeCurrentPage - 1) * teachersPerPage + teachersPerPage,
    filteredTeachers.length
  );

  return (
    <div className="min-h-screen p-4 leading-[120%] flex flex-col">
      {/* Title and Controls - Redesigned */}
      <div className="bg-[#F8F8F8] pt-4 x-2 sm:px-6" data-guide="teachers-header">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-[19px] font-semibold ">My Teachers</h1>
            <span className="bg-white border border-[#E4E4E4] text-[15px] font-medium px-3 py-1 rounded-full">
              {totalTeachers} teachers
            </span>
          </div>
          <Tooltip content="Register a teacher account. They will receive login credentials via email." side="top">
          <button
            data-guide="teachers-add"
            onClick={toggleModal}
            className="bg-[#154473] text-white font-medium rounded-lg px-5 py-2 flex items-center gap-2 hover:bg-[#123a5e] transition"
          >
            <span className="text-lg font-bold">+</span> Add Teacher
          </button>
          </Tooltip>
        </div>

        {/* Filters Row */}
        <div className="bg-white rounded-2xl py-3 mt-4 w-fit" data-guide="teachers-filters">
          <div className="flex flex-col md:flex-row gap-3 px-6 py-4">
            {/* Search */}
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
            {/* Class Filter */}
            <div className="relative w-[220px]">
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
            <div className="relative w-[220px]">
              <select
                className="appearance-none bg-white border border-[#E0E0E0] h-[40px] rounded-xl px-4 py-2 pr-8 text-[15px] font-semibold w-[220px] text-[#808080] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <ChevronDown />
              </span>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <AddTeacherModal onClose={toggleModal} onSuccess={fetchTeachers} />
      )}

      {/* Main Content Area - Flex container to push pagination to bottom */}
      <div className="flex flex-col flex-1" data-guide="teachers-list">
        {/* Content Section */}
        {isLoading ? (
          <TeachersSkeleton />
        ) : error ? (
          <ErrorState
            title="Error Loading Teachers"
            message={error}
            onRetry={fetchTeachers}
          />
        ) : filteredTeachers.length === 0 ? (
          <EmptyState
            icon="👨‍🏫"
            title="No Teachers Found"
            message={
              searchTerm || selectedClass || statusFilter
                ? "No teachers match your current search or filter criteria."
                : "Get started by adding your first teacher to the system."
            }
            actionText={
              searchTerm || selectedClass || statusFilter
                ? "Clear Filters"
                : "Add First Teacher"
            }
            onAction={
              searchTerm || selectedClass || statusFilter
                ? () => {
                    setSearchTerm("");
                    setSelectedClass(null);
                    setStatusFilter("");
                    setCurrentPage(1);
                  }
                : toggleModal
            }
          />
        ) : (
          <>
            {/* Teachers Grid - Takes available space */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
              {currentTeachers.map((teacher) => {
                // Use initials if no avatar
                // Prefer teacher.userAvatar, fallback to teacher.userId?.userAvatar, fallback to initials
                const avatarUrl = getTeacherAvatar(teacher);
                const initials = `${getTeacherFirstName(teacher).charAt(
                  0
                )}${getTeacherLastName(teacher).charAt(0)}`.toUpperCase();
                // Pick a color for initials avatar (hash by name)
                const colorList = [
                  "bg-[#154473] text-white",
                  "bg-green-600 text-white",
                  "bg-orange-400 text-white",
                  "bg-purple-500 text-white",
                  "bg-pink-500 text-white",
                  "bg-gray-400 text-white",
                ];
                const colorIdx =
                  Math.abs(
                    (
                      getTeacherFirstName(teacher) || "T"
                    ).charCodeAt(0) +
                      (getTeacherLastName(teacher) || "A").charCodeAt(0)
                  ) % colorList.length;
                const colorClass = colorList[colorIdx];
                return (
                  <div
                    key={teacher._id}
                    className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col items-center relative group transition-shadow hover:shadow-lg"
                  >
                    {/* Three dots menu */}
                    <button
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
                      onClick={() => toggleMenu(teacher._id)}
                    >
                      <span className="text-xl font-bold">⋮</span>
                    </button>
                    {menuOpen === teacher._id && (
                      <div className="absolute right-4 top-12 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                          onClick={() => handleEditTeacher(teacher)}
                        >
                          Edit
                        </button>
                        <Tooltip content="Prevents the teacher from logging in. Their records and history are retained." side="top">
                        <button
                          className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 rounded-b-lg"
                          onClick={() => handleDeactivateTeacher(teacher)}
                          disabled={!teacher.isActive}
                        >
                          Deactivate
                        </button>
                        </Tooltip>
                      </div>
                    )}
                    {/* Avatar or Initials */}
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={`${getTeacherFirstName(teacher)} avatar`}
                        className="w-16 h-16 rounded-full object-cover mb-3"
                      />
                    ) : (
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-3 ${colorClass}`}
                      >
                        {initials}
                      </div>
                    )}
                    <div className="text-center flex flex-col items-center flex-1 w-full">
                      <h3 className="font-semibold text-gray-900 text-base mb-1">
                        {getTeacherFirstName(teacher)} {getTeacherLastName(teacher)}
                      </h3>
                      <div className="flex gap-2 mb-3">
                        {getAssignedClasses(teacher).slice(0, 1).map((cls) => (
                          <Tooltip key={cls._id} content="Classes this teacher is currently assigned to. Manage assignments in the teacher's profile." side="top">
                          <span
                            className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded"
                          >
                            {cls.name}
                          </span>
                          </Tooltip>
                        ))}
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            teacher.isActive
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {teacher.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {!teacher.hasTeacherProfile && (
                        <p className="text-xs text-amber-600 mb-3">
                          Profile setup pending
                        </p>
                      )}
                      <button
                        onClick={() => handleViewProfile(teacher)}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg py-2 mt-auto transition"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination - Modern design */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-gray-200 gap-4 bg-white rounded-lg p-4 shadow-sm">
              {/* Results Info */}
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-medium text-gray-900">
                  {showingStart}
                </span>{" "}
                to{" "}
                <span className="font-medium text-gray-900">
                  {showingEnd}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-900">
                  {filteredTeachers.length}
                </span>{" "}
                teachers
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-3">
                {/* Rows per page */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Show:</span>
                  <select
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={teachersPerPage}
                    onChange={(e) => {
                      setTeachersPerPage(Number(e.target.value));
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
                    disabled={safeCurrentPage === 1}
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
                      } else if (safeCurrentPage <= 3) {
                        pageNum = i + 1;
                      } else if (safeCurrentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = safeCurrentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                            safeCurrentPage === pageNum
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
                    disabled={safeCurrentPage === totalPages}
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

export default TeachersPage;
