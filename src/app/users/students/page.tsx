'use client';

import React, { useState, useEffect } from 'react';
import { studentService, StudentById, Class, getClasses, Student } from '@/app/services/student.service';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Header } from '@/components/Header';
import AddStudentModal from '@/components/AddStudentModal';
import { FaSearch } from 'react-icons/fa';
import StudentsSkeleton from '@/components/StudentsSkeleton';
import Avatar from '@/components/Avatar';

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
        <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
            {/* Header Section */}
            <Header />
            
            {/* Title and Controls */}
            <div className="flex items-center justify-between mb-6 mt-5">
                <div className="flex items-center gap-x-4">
                    <h1 className="text-xl font-medium text-gray-800">Students</h1>
                    <button
                        className="flex items-center gap-2 text-gray-600 font-medium"
                        onClick={toggleModal}
                    >
                        <span className="text-lg">+</span>
                        Add
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                            <FaSearch size={16} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search for students"
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    {/* Class Filter */}
                    <select
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedClass || ''}
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
                    <div className="text-center py-12 flex-1 flex items-center justify-center">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                            <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Students</div>
                            <p className="text-red-600 mb-4">{error}</p>
                            <button
                                onClick={fetchStudents}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : students.length === 0 ? (
                    <div className="text-center py-12 flex-1 flex items-center justify-center">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
                            <div className="text-gray-400 text-6xl mb-4">👨‍🎓</div>
                            <div className="text-gray-600 text-lg font-semibold mb-2">No Students Found</div>
                            <p className="text-gray-500 mb-4">
                                {searchTerm || selectedClass
                                    ? 'No students match your current search or filter criteria.'
                                    : 'There are no students in the system yet.'}
                            </p>
                            {(searchTerm || selectedClass) ? (
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setSelectedClass(null);
                                        setCurrentPage(1);
                                    }}
                                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            ) : (
                                <button
                                    onClick={toggleModal}
                                    className="px-4 py-2 bg-[#154473] text-white rounded hover:bg-blue-700 transition-colors"
                                >
                                    Add First Student
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Students Grid - Takes available space */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
                            {currentStudents.map((student) => (
                                <div
                                    key={student._id}
                                    className="bg-white rounded-lg border border-gray-200 p-6 relative h-fit"
                                >
                                    {/* Three dots menu */}
                                    <div className="absolute top-4 right-4">
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
                                    <div className="flex justify-center mb-4">
                                        <Avatar
                                            src={student.userId.userAvatar}
                                            firstName={student.userId.firstName}
                                            lastName={student.userId.lastName}
                                            size="md"
                                        />
                                    </div>

                                    {/* Student Info */}
                                    <div className="text-center">
                                        <h3 className="font-medium text-gray-900 mb-1">
                                            {`${student.userId.firstName} ${student.userId.lastName}`}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-4">{student.gradeLevel}</p>
                                        
                                        {/* View Profile Button */}
                                        <button
                                            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                                            onClick={() => handleViewProfile(student._id)}
                                        >
                                            View Profile
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination - Fixed at bottom matching Figma design */}
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>Row per page</span>
                                <select 
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>
                                    Showing {startIndex + 1} - {Math.min(startIndex + studentsPerPage, filteredStudents.length)} of {filteredStudents.length}
                                </span>
                                
                                <div className="flex items-center gap-2">
                                    <select 
                                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        value={currentPage}
                                        onChange={(e) => setCurrentPage(Number(e.target.value))}
                                    >
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <option key={page} value={page}>
                                                {page}
                                            </option>
                                        ))}
                                    </select>
                                    <span>of page {totalPages}</span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                    <button
                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    >
                                        ‹
                                    </button>
                                    <button
                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    >
                                        ›
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
