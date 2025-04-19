"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import AddTeacherModal from "@/components/AddTeacherModal"
import { FaSearch } from "react-icons/fa"
import { teacherService, type Teacher } from "@/app/services/teacher.service"
import { getClasses, type Class } from "@/app/services/student.service"
import { toast } from "react-toastify"

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

  const fetchTeachers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (selectedClass) {
        const response = await teacherService.getTeachersByClass(selectedClass, currentPage, 9)
        setTeachers(response.data)
        setTotalTeachers(response.meta.total)
      } else {
        const response = await teacherService.getTeachers(currentPage, 9)
        setTeachers(response.data)
        setTotalTeachers(response.meta.total)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch teachers")
      toast.error("Failed to fetch teachers")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const classes = await getClasses()
      setClasses(classes)
    } catch (error) {
      console.error("Error fetching classes:", error)
      toast.error("Failed to load classes. Please try again later.")
    }
  }

  useEffect(() => {
    fetchTeachers()
    fetchClasses()
  }, [selectedClass])

  useEffect(() => {
    if (selectedClass) {
      fetchTeachers()
    }
  }, [currentPage])

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen)
  }

  const toggleMenu = (teacherId: string) => {
    setMenuOpen(menuOpen === teacherId ? null : teacherId)
  }

  const handleViewProfile = (teacherId: string) => {
    router.push(`/users/teachers/${teacherId}`)
  }

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter((teacher) => {
    const nameMatch = `${teacher.userId.firstName} ${teacher.userId.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    return nameMatch
  })

  // Calculate pagination values
  const teachersPerPage = 9
  const totalPages = Math.ceil(totalTeachers / teachersPerPage)
  const startIndex = (currentPage - 1) * teachersPerPage

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Header />
      <div className="pt-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-x-4 mb-4">
            <h1 className="text-2xl font-semibold text-[#393939]">Teachers</h1>
            <button className="font-bold text-[#393939] px-4 py-1 bg-[#EFEFEF] rounded-full" onClick={toggleModal}>
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
              className="w-full pl-10 p-2 border border-gray-300 rounded text-gray-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
            />
          </div>

          {/* Filter Dropdown */}
          <select
            className="p-2 border border-gray-300 rounded w-32 text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#154473]"
            value={selectedClass || ""}
            onChange={(e) => {
              setSelectedClass(e.target.value || null)
              setCurrentPage(1)
            }}
          >
            <option value="" className="text-gray-500">
              All Classes
            </option>
            {classes.map((cls) => (
              <option key={cls._id} value={cls._id}>
                {cls.name}
              </option>
            ))}
          </select>
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
          <button onClick={fetchTeachers} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Try Again
          </button>
        </div>
      ) : teachers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No teachers found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-7">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher._id}
                className="p-4 border border-gray-200 rounded-[10px] shadow-sm bg-white h-[218px] relative"
              >
                <img
                  src={teacher.userId.userAvatar || "/default-avatar.png"}
                  alt={`${teacher.userId.firstName} ${teacher.userId.lastName}`}
                  className="w-16 h-16 rounded-full mx-auto mb-2"
                />
                <h3 className="text-center text-lg font-semibold text-[#154473]">
                  {teacher.userId.firstName} {teacher.userId.lastName}
                </h3>
                <p className="text-center text-gray-500">
                  {teacher.employmentType} • {teacher.specialization}
                </p>
                <button
                  className="px-4 py-1 mt-4 text-[#434343] border-[#EDEDED] border-2 bg-transparent rounded-[10px] mx-auto block hover:bg-blue-100"
                  onClick={() => handleViewProfile(teacher._id)}
                >
                  View Profile
                </button>
                <div className="absolute top-4 right-8">
                  <button
                    className="text-[#262B2B] font-semibold hover:text-gray-800"
                    onClick={() => toggleMenu(teacher._id)}
                  >
                    &#x22EE; {/* 3-dot menu */}
                  </button>
                  {menuOpen === teacher._id && (
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

          <div className="flex justify-between items-center mt-6">
            <div>
              <span className="text-gray-500">
                Showing {startIndex + 1} - {Math.min(startIndex + teachersPerPage, totalTeachers)} of {totalTeachers}
              </span>
            </div>
            <div className="flex items-center gap-x-2">
              <button
                className="px-3 py-1 bg-[#EFEFEF] border-2 border-[#E4E4E4] text-[#393939] rounded hover:bg-gray-100"
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
        </>
      )}
    </div>
  )
}

export default TeachersPage
