'use client';

import React, { useState, useEffect } from 'react';
import { studentService, StudentById, Class, getClasses, Student } from '@/app/services/student.service';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import {Header} from '@/components/Header';
import AddStudentModal from '@/components/AddStudentModal';
import { FaSearch } from 'react-icons/fa';

const StudentPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (selectedClass) {
        const response = await studentService.getStudentsByClass(selectedClass, currentPage, 9);
        console.log(response.data);
        setStudents(response.data);

      } else {
        const response = await studentService.getStudents(currentPage, 9);
        setStudents(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
      toast.error('Failed to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const classes = await getClasses();
      setClasses(classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to load classes. Please try again later.');
    }
  };

  const handleViewProfile = (studentId: string) => {
    router.push(`/users/students/${studentId}`);
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

  const teachersPerPage = 9; // Number of cards per page
  const filteredTeachers = students.filter((student) => {
    const nameMatch = `${student.userId.firstName} ${student.userId.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return nameMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage);
  const startIndex = (currentPage - 1) * teachersPerPage;
  const currentTeachers = filteredTeachers.slice(
    startIndex,
    startIndex + teachersPerPage
  );

  const toggleMenu = (studentId: string) => {
    setMenuOpen(menuOpen === studentId ? null : studentId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <Header  />
      <div className="mb-6 mt-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-x-4 mb-4">
            <h1 className="text-2xl font-semibold text-[#393939]">Student</h1>
            <button
              className="font-bold text-[#393939] px-4 py-1 bg-[#EFEFEF] rounded-full"
              onClick={toggleModal}
            >
              + Add
            </button>
          </div>

          {/* Search Bar with Icon */}
          <div className="relative w-80">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
              <FaSearch /> {/* React Icon for search */}
            </span>
            <input
              type="text"
              placeholder="Search for students"
              className="w-full pl-10 p-2 border border-gray-300 rounded text-gray-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to the first page after search
              }}
            />
          </div>

          {/* Filter Dropdown */}
          <select
            className="p-2 border border-gray-300 rounded w-32 text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#154473]"
            value={selectedClass || ''}
            onChange={(e) => {
              setSelectedClass(e.target.value || null);
              setCurrentPage(1); // Reset to the first page after filter change
            }}
          >
            <option value="" className="text-gray-500">All Classes</option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white w-96 rounded-lg shadow-lg p-6">
            <AddStudentModal onClose={toggleModal} />
          </div>
        </div>
      )}

      {/* Cards Section */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchStudents}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No students found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {currentTeachers.map((student) => (
            <div
              key={student._id}
              className="p-4 border border-gray-200 rounded-[10px] shadow-sm bg-white relative"
            >
              <img
                src={student.userId.userAvatar || '/default-avatar.png'}
                alt={`${student.userId.firstName} ${student.userId.lastName}`}
                className="w-16 h-16 rounded-full mx-auto mb-2 text-gray-500"
              />
              <h3 className="text-center text-lg font-semibold text-[#154473]">{`${student.userId.firstName} ${student.userId.lastName}`}</h3>
              <p className="text-center text-gray-500">{student.gradeLevel}</p>
              <button
                className="px-4 py-1 mt-4 rounded-[10px] border-[#EDEDED] border-2 bg-transparent  mx-auto block hover:bg-blue-100"
                onClick={() => handleViewProfile(student._id)}
              >
                <span className="text-[#434343]">View Profile</span>
              </button>
              <div className="absolute top-4 right-8">
                <button
                  className="text-[#262B2B] font-semibold hover:text-gray-800"
                  onClick={() => toggleMenu(student._id)}
                >
                  &#x22EE; {/* 3-dot menu */}
                </button>
                {menuOpen === student._id && (
                  <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded shadow-lg">
                    <button className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 text-gray-500">
                      Edit
                    </button>
                    <button className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 text-gray-500">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Section */}
      <div className="flex justify-between items-center mt-6">
        <div>
          <span className="text-gray-500">
            Showing {startIndex + 1} -{' '}
            {Math.min(startIndex + teachersPerPage, filteredTeachers.length)} of{' '}
            {filteredTeachers.length}
          </span>
        </div>
        <div className="flex items-center gap-x-2">
          <button
            className="px-3 py-1 bg-[#EFEFEF] border-2 border-[#E4E4E4] text-[#393939]  rounded hover:bg-gray-100"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            Previous
          </button>
          <span className="text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-3 py-1 bg-[#EFEFEF] border-2 border-[#E4E4E4] text-[#393939] rounded hover:bg-gray-100"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentPage;
