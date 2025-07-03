"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/Header"
import AddTeacherModal from "@/components/AddTeacherModal"
import TeachersSkeleton from "@/components/TeachersSkeleton"
import { FaSearch } from "react-icons/fa"
import { Teacher, teacherService } from "@/app/services/teacher.service"
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
    const nameMatch = `${teacher.userId.firstName} ${teacher.userId.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    
    const classMatch = !selectedClass || 
      (teacher.assignedClasses?.some(cls => cls._id === selectedClass) ?? false)
    
    return nameMatch && classMatch
  })

  // Calculate pagination values for filtered results
  const currentTeachers = filteredTeachers
  const totalPages = Math.ceil(totalTeachers / teachersPerPage)
  const startIndex = (currentPage - 1) * teachersPerPage
  const endIndex = Math.min(startIndex + teachersPerPage, currentTeachers.length)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Header />
      <div className="pt-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-x-4">
            <h1 className="text-2xl font-semibold text-[#393939]">Teachers</h1>
            <button 
              className="font-bold text-[#393939] px-4 py-1 bg-[#EFEFEF] rounded-full hover:bg-gray-200 transition-colors"
              onClick={toggleModal}
            >
              + Add
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                <FaSearch />
              </span>
              <input
                type="text"
                placeholder="Search for teachers"
                className="w-full pl-10 p-2 border border-gray-300 rounded text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#154473]"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>

            {/* <select
              className="p-2 border border-gray-300 rounded text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#154473] w-full md:w-48"
              value={selectedClass || ""}
              onChange={(e) => {
                setSelectedClass(e.target.value || null)
                setCurrentPage(1)
              }}
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name}
                </option>
              ))}
            </select> */}
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50">
            <div className="bg-white h-full w-full md:w-1/2 rounded-l-lg shadow-lg p-6 overflow-y-auto">
              <AddTeacherModal onClose={toggleModal} onSuccess={fetchTeachers} />
            </div>
          </div>
        )}

        {isLoading ? (
          <TeachersSkeleton />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchTeachers} 
              className="mt-4 px-4 py-2 bg-[#154473] text-white rounded hover:bg-[#0d2e4d] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : currentTeachers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No teachers found matching your criteria</p>
            <button 
              onClick={() => {
                setSearchTerm("")
                setSelectedClass(null)
                setCurrentPage(1)
              }}
              className="mt-2 px-4 py-2 text-[#154473] border border-[#154473] rounded hover:bg-blue-50 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentTeachers.slice(startIndex, endIndex).map((teacher) => (
                <div
                  key={teacher._id}
                  className="p-4 border border-gray-200 rounded-[10px] shadow-sm bg-white h-[218px] relative hover:shadow-md transition-shadow"
                >
                  <img
                    src="/default-avatar.png"
                    alt={`${teacher.userId.firstName} ${teacher.userId.lastName}`}
                    className="w-16 h-16 rounded-full mx-auto mb-2 object-cover"
                  />
                  <h3 className="text-center text-lg font-semibold text-[#154473]">
                    {teacher.firstName} {teacher.lastName}
                  </h3>
                  <p className="text-center text-gray-500 text-sm">
                    {teacher.email} • {teacher.role}
                  </p>
                 
                  <button
                    className="px-4 py-1 mt-4 text-[#434343] border-[#EDEDED] border-2 bg-transparent rounded-[10px] mx-auto block hover:bg-blue-100 transition-colors"
                    onClick={() => handleViewProfile(teacher._id)}
                  >
                    View Profile
                  </button>
                  <div className="absolute top-4 right-4">
                    <button
                      className="text-[#262B2B] font-semibold hover:text-gray-800 p-1"
                      onClick={() => toggleMenu(teacher._id)}
                    >
                      &#x22EE;
                    </button>
                    {menuOpen === teacher._id && (
                      <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-10">
                        <button 
                          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => {
                            toggleMenu(teacher._id)
                            // Add edit functionality here
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
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
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
              <div>
                <span className="text-gray-500">
                  Showing {startIndex + 1} - {endIndex} of {currentTeachers.length}
                </span>
              </div>
              <div className="flex items-center gap-x-2">
                <button
                  className="px-3 py-1 bg-[#EFEFEF] border-2 border-[#E4E4E4] text-[#393939] rounded hover:bg-gray-100 disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  Previous
                </button>
                <span className="text-gray-500">
                  Page {currentPage} of {Math.ceil(currentTeachers.length / teachersPerPage)}
                </span>
                <button
                  className="px-3 py-1 bg-[#EFEFEF] border-2 border-[#E4E4E4] text-[#393939] rounded hover:bg-gray-100 disabled:opacity-50"
                  disabled={currentPage >= Math.ceil(currentTeachers.length / teachersPerPage)}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default TeachersPage