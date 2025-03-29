'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import AddTeacherModal from '@/components/AddTeacherModal';
import { FaSearch } from 'react-icons/fa';

interface Teacher {
  id: number;
  name: string;
  grade: string;
  imageUrl: string;
}

const TeachersPage: React.FC = () => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };


  const teachersPerPage = 9; // Number of cards per page
  const teachers: Teacher[] = Array.from({ length: 100 }, (_, index) => ({
    id: index + 1,
    name: `Mr. Emeka Adewale ${index + 1}`,
    grade: `Grade ${((index % 6) + 1).toString()}`,
    imageUrl: '/img/teacher.jpg', // Replace with actual image URL
  }));

  // Filter teachers based on the search term
  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage);
  const startIndex = (currentPage - 1) * teachersPerPage;
  const currentTeachers = filteredTeachers.slice(
    startIndex,
    startIndex + teachersPerPage
  );

  const toggleMenu = (id: number) => {
    setMenuOpen((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <Header user="Administrator" title="Teachers" />
      <div className="mb-6">
      <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-x-4 mb-4">
        <h1 className="text-2xl font-semibold text-gray-800">Teachers</h1>
        <button
          className="font-bold text-[#154473] px-4 py-1 bg-gray-200 rounded"
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
            className="w-full pl-10 p-2 border border-gray-300 rounded"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset to the first page after search
            }}
          />
        </div>

        {/* Filter Dropdown */}
        <select
          className="p-2 border border-gray-300 rounded w-32"
          onChange={(e) => console.log(`Selected class: ${e.target.value}`)}
        >
          <option value="">Select class</option>
          <option value="Grade 1">Grade 1</option>
          <option value="Grade 2">Grade 2</option>
          <option value="Grade 3">Grade 3</option>
          <option value="Grade 4">Grade 4</option>
          <option value="Grade 5">Grade 5</option>
          <option value="Grade 6">Grade 6</option>
        </select>
      </div>
    </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50">
          <div className="bg-white h-full w-1/2 rounded-l-lg shadow-lg p-6">
            <AddTeacherModal onNext={toggleModal} onClose={toggleModal} />
          </div>
        </div>
      )}

    

      {/* Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {currentTeachers.map((teacher) => (
          <div
            key={teacher.id}
            className="p-4 border border-gray-200 rounded shadow-sm bg-white relative"
          >
            <img
              src={teacher.imageUrl}
              alt={teacher.name}
              className="w-16 h-16 rounded-full mx-auto mb-2"
            />
            <h3 className="text-center text-lg font-semibold">{teacher.name}</h3>
            <p className="text-center text-gray-500">{teacher.grade}</p>
            <button className="px-4 py-1 mt-4 text-[#154473] bg-white rounded mx-auto block">
              View Profile
            </button>
            <div className="absolute top-2 right-2">
              <button
                className="text-gray-600 hover:text-gray-800"
                onClick={() => toggleMenu(teacher.id)}
              >
                &#x22EE; {/* 3-dot menu */}
              </button>
              {menuOpen === teacher.id && (
                <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded shadow-lg">
                  <button className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                    Edit
                  </button>
                  <button className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100">
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Section */}
      <div className="flex justify-between items-center mt-6">
        <div>
          <span>
            Showing {startIndex + 1} -{' '}
            {Math.min(startIndex + teachersPerPage, filteredTeachers.length)} of{' '}
            {filteredTeachers.length}
          </span>
        </div>
        <div className="flex items-center gap-x-2">
          <button
            className="px-3 py-1 bg-gray-200 rounded"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-3 py-1 bg-gray-200 rounded"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeachersPage;
