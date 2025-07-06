"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Header } from "@/components/Header"
import AddTeacherModal from "@/components/AddTeacherModal"
import TeachersSkeleton from "@/components/TeachersSkeleton"
import { FaSearch } from "react-icons/fa"
import { Teacher, teacherService } from "@/app/services/teacher.service"
import { getClasses, type Class } from "@/app/services/student.service"
import { toast } from "react-toastify"
import Avatar from "@/components/Avatar"
import SmoothButton from "@/components/SmoothButton"
import { ErrorState, EmptyState } from "@/components/StateComponents"

const TeachersPage: React.FC = () => {
    const router = useRouter()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [teachers, setTeachers] = useState<Teacher[]>([])
    const [totalTeachers, setTotalTeachers] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [classes, setClasses] = useState<Class[]>([])
    const [selectedClass, setSelectedClass] = useState<string | null>(null)
    const [menuOpen, setMenuOpen] = useState<string | null>(null)

    const teachersPerPage = 9

    const fetchTeachers = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await teacherService.getTeachers(currentPage, teachersPerPage)
            console.log(response.data)
            setTeachers(response.data)

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch teachers")
            toast.error("Failed to fetch teachers")
        } finally {
            setIsLoading(false)
        }
    }, [currentPage])

    const fetchClasses = useCallback(async () => {
        try {
            const classes = await getClasses()
            setClasses(classes)
        } catch (error) {
            console.error("Error fetching classes:", error)
            toast.error("Failed to load classes")
        }
    }, [])

    useEffect(() => {
        fetchTeachers()
        fetchClasses()
    }, [fetchTeachers, fetchClasses])

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen)
    }

    const toggleMenu = (teacherId: string) => {
        setMenuOpen(menuOpen === teacherId ? null : teacherId)
    }

    const handleViewProfile = (teacherId: string) => {
        router.push(`/users/teachers/${teacherId}`)
    }

    // Filter teachers based on search term and selected class
    const filteredTeachers = teachers.filter((teacher) => {
        const nameMatch = `${teacher.userId?.firstName || teacher.firstName} ${teacher.userId?.lastName || teacher.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())

        const classMatch = !selectedClass ||
            (teacher.assignedClasses?.some(cls => cls._id === selectedClass) ?? false)

        return nameMatch && classMatch
    })

    // Calculate pagination values for filtered results
    const totalPages = Math.ceil(filteredTeachers.length / teachersPerPage)
    const startIndex = (currentPage - 1) * teachersPerPage
    const currentTeachers = filteredTeachers.slice(
        startIndex,
        startIndex + teachersPerPage
    )

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex flex-col">
            {/* Header Section */}
            <Header />
            
            {/* Title and Controls */}
            <div className="flex items-center justify-between mb-6 mt-5">
                <div className="flex items-center gap-x-4">
                    <h1 className="text-xl font-medium text-gray-800">Teachers</h1>
                    <SmoothButton
                        onClick={toggleModal}
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 text-gray-600 font-medium hover:text-gray-900"
                    >
                        <span className="text-lg">+</span>
                        Add
                    </SmoothButton>
                </div>

                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                            <FaSearch size={16} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search for teacher"
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value)
                                setCurrentPage(1)
                            }}
                        />
                    </div>

                    {/* Class Filter */}
                    <select
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={selectedClass || ''}
                        onChange={(e) => {
                            setSelectedClass(e.target.value || null)
                            setCurrentPage(1)
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

            {isModalOpen && <AddTeacherModal onClose={toggleModal} onSuccess={fetchTeachers} />}

            {/* Main Content Area - Flex container to push pagination to bottom */}
            <div className="flex flex-col flex-1">
                {/* Content Section */}
                {isLoading ? (
                    <TeachersSkeleton />
                ) : error ? (
                    <ErrorState
                        title="Error Loading Teachers"
                        message={error}
                        onRetry={fetchTeachers}
                    />
                ) : teachers.length === 0 ? (
                    <EmptyState
                        icon="👨‍🏫"
                        title="No Teachers Found"
                        message={
                            searchTerm || selectedClass
                                ? 'No teachers match your current search or filter criteria.'
                                : 'Get started by adding your first teacher to the system.'
                        }
                        actionText={
                            searchTerm || selectedClass 
                                ? "Clear Filters" 
                                : "Add First Teacher"
                        }
                        onAction={
                            searchTerm || selectedClass 
                                ? () => {
                                    setSearchTerm('');
                                    setSelectedClass(null);
                                    setCurrentPage(1);
                                  }
                                : toggleModal
                        }
                    />
                ) : (
                    <>
                        {/* Teachers Grid - Takes available space */}
                        <motion.div 
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            {currentTeachers.map((teacher, index) => (
                                <motion.div
                                    key={teacher._id}
                                    className="bg-white rounded-lg border border-gray-200 p-6 relative h-fit hover:shadow-md transition-shadow duration-200"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.2 }}
                                    whileHover={{ y: -2 }}
                                >
                                    {/* Three dots menu */}
                                    <div className="absolute top-4 right-4">
                                        <button
                                            className="text-gray-400 hover:text-gray-600 p-1"
                                            onClick={() => toggleMenu(teacher._id)}
                                        >
                                            <span className="text-lg font-bold">⋮</span>
                                        </button>
                                        {menuOpen === teacher._id && (
                                            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                                <button
                                                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                                                    onClick={() => {
                                                        toggleMenu(teacher._id)
                                                        // Add edit functionality here
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 rounded-b-lg"
                                                    onClick={() => {
                                                        toggleMenu(teacher._id)
                                                        // Add delete functionality here
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Teacher Avatar */}
                                    <div className="flex justify-center mb-4">
                                        <Avatar
                                            src={teacher.userId?.userAvatar}
                                            firstName={teacher.userId?.firstName || teacher.firstName}
                                            lastName={teacher.userId?.lastName || teacher.lastName}
                                            size="md"
                                        />
                                    </div>

                                    {/* Teacher Info */}
                                    <div className="text-center">
                                        <h3 className="font-medium text-gray-900 mb-1">
                                            {teacher.userId?.firstName || teacher.firstName} {teacher.userId?.lastName || teacher.lastName}
                                        </h3>
                                        <p className="text-sm text-gray-500 mb-4">
                                            {teacher.email} • {teacher.role}
                                        </p>
                                        
                                        {/* View Profile Button */}
                                        <SmoothButton
                                            onClick={() => handleViewProfile(teacher._id)}
                                            variant="outline"
                                            className="w-full text-gray-700 border-gray-300 hover:bg-[#BFCCD9]"
                                        >
                                            View Profile
                                        </SmoothButton>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Pagination - Fixed at bottom matching Figma design */}
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>Row per page</span>
                                <select 
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    value={teachersPerPage}
                                    onChange={(e) => {
                                        // Handle rows per page change
                                        // setTeachersPerPage(Number(e.target.value));
                                        setCurrentPage(1)
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
                                    Showing {startIndex + 1} - {Math.min(startIndex + teachersPerPage, filteredTeachers.length)} of {filteredTeachers.length}
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
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    >
                                        ‹
                                    </button>
                                    <button
                                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
    )
}

export default TeachersPage