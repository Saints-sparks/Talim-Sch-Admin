// src/app/users/teachers/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {Header} from '@/components/Header';
import AddTeacherModal from '@/components/AddTeacherModal';
import { FaSearch } from 'react-icons/fa';
import { teacherService, Teacher } from '@/app/services/teacher.service';

const TeachersPage: React.FC = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await teacherService.getTeachers(currentPage, 9);
      setTeachers(response.data);
      setTotalTeachers(response.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teachers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [currentPage]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const filteredTeachers = teachers.filter((teacher) =>
    `${teacher.userId.firstName} ${teacher.userId.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleViewProfile = (teacherId: string) => {
    router.push(`/users/teachers/${teacherId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Header />
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-x-4 mb-4">
            <h1 className="text-2xl font-semibold text-gray-800">Teachers</h1>
            <button
              className="font-bold text-white px-4 py-1 bg-[#154473] rounded"
              onClick={toggleModal}
            >
              + Add
            </button>
          </div>

          <div className="relative w-80">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
              <FaSearch />
            </span>
            <input
              type="text"
              placeholder="Search for teachers"
              className="w-full pl-10 p-2 border border-gray-300 rounded"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50">
          <div className="bg-white h-full w-1/2 rounded-l-lg shadow-lg p-6">
            <AddTeacherModal onClose={toggleModal} onSuccess={fetchTeachers} />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchTeachers}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher._id}
                className="p-4 border border-gray-200 rounded shadow-sm bg-white relative"
              >
                <img
                  src={teacher.userId.userAvatar || '/default-avatar.png'}
                  alt={`${teacher.userId.firstName} ${teacher.userId.lastName}`}
                  className="w-16 h-16 rounded-full mx-auto mb-2"
                />
                <h3 className="text-center text-lg font-semibold text-[#154473]">
                  {teacher.userId.firstName} {teacher.employmentRole}
                </h3>
                <p className="text-center text-gray-500">
                  {teacher.employmentType} • {teacher.specialization}
                </p>
                <button
                  className="px-4 py-1 mt-4 text-white bg-[#154473] rounded mx-auto block hover:bg-blue-700"
                  onClick={() => handleViewProfile(teacher._id)}
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-6">
            <div>
              <span className="text-gray-500">
                Showing {(currentPage - 1) * 9 + 1} -{' '}
                {Math.min(currentPage * 9, totalTeachers)} of {totalTeachers}
              </span>
            </div>
            <div className="flex items-center gap-x-2">
              <button
                className="px-3 py-1 bg-[#154473] text-white rounded hover:bg-blue-700"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              <span className="text-gray-500">
                Page {currentPage} of {Math.ceil(totalTeachers / 9)}
              </span>
              <button
                className="px-3 py-1 bg-[#154473] text-white rounded hover:bg-blue-700"
                disabled={currentPage === Math.ceil(totalTeachers / 9)}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TeachersPage;