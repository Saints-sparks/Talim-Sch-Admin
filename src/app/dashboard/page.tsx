"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { FiChevronRight, FiChevronDown, FiEdit, FiTrash, FiPlus } from "react-icons/fi"
import { Header } from "@/components/Header"
import Image from "next/image"
import { getClasses, createClass, type Class } from "../services/student.service"
import { getSchoolId } from "../services/school.service"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useRouter } from "next/navigation"

const Dashboard = () => {
  const router = useRouter()
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    classDescription: "",
    classCapacity: "",
  })

  // Cards data with dynamic counts
  const cards = [
    {
      id: 1,
      icon: "/icons/book-saved.svg",
      count: classes.length.toString(),
      label: "Total Number of Classes",
      details: (
        <>
          <p>Here you can see detailed information about all your classes.</p>
          <ul className="list-disc ml-6">
            {classes.slice(0, 3).map((cls) => (
              <li key={cls._id}>
                {cls.name}: {cls.classDescription || "No description"}
              </li>
            ))}
            {classes.length > 3 && <li>And {classes.length - 3} more...</li>}
          </ul>
        </>
      ),
    },
    {
      id: 2,
      icon: "/icons/profile-2user.svg",
      count: "520", // This would be dynamic in a real implementation
      label: "Total Number of Students",
      details: (
        <>
          <p>Here you can see detailed information about all your students.</p>
          <ul className="list-disc ml-6">
            <li>Grade 1: 100 students</li>
            <li>Grade 2: 150 students</li>
            <li>Grade 3: 270 students</li>
          </ul>
        </>
      ),
    },
    {
      id: 3,
      icon: "/icons/book-saved.svg",
      count: "234", // This would be dynamic in a real implementation
      label: "Total Number of Subjects",
      details: (
        <>
          <p>Here you can see detailed information about all your subjects.</p>
          <ul className="list-disc ml-6">
            <li>Mathematics</li>
            <li>Science</li>
            <li>History</li>
          </ul>
        </>
      ),
    },
  ]

  const [expandedCards, setExpandedCards] = useState<number[]>([])

  const toggleExpand = (id: number) => {
    setExpandedCards((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  const toggleExpandAll = () => {
    if (expandedCards.length === cards.length) {
      setExpandedCards([])
    } else {
      setExpandedCards(cards.map((card) => card.id))
    }
  }

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen)
    if (!isModalOpen) {
      setFormData({
        name: "",
        classDescription: "",
        classCapacity: "",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsCreating(true)

      // Create class
      const classData = {
        name: formData.name,
        classCapacity: Number.parseInt(formData.classCapacity),
        classDescription: formData.classDescription,
        schoolId: getSchoolId()!,
        assignedCourses: [],
      }

      await createClass(classData)

      toast.success("Class created successfully!")
      setIsModalOpen(false)
      setFormData({
        name: "",
        classDescription: "",
        classCapacity: "",
      })

      // Refresh classes
      fetchClasses()
    } catch (error) {
      console.error("Error creating class:", error)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsCreating(false)
    }
  }

  const fetchClasses = async () => {
    setIsLoading(true)
    try {
      const schoolId = getSchoolId()
      if (!schoolId) {
        toast.error("School ID is required")
        return
      }

      const fetchedClasses = await getClasses()
      setClasses(fetchedClasses)
    } catch (error) {
      console.error("Error fetching classes:", error)
      toast.error("Failed to load classes. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  const handleView = (classId: string) => {
    router.push(`/classes/view-class/${classId}`)
  }

  const handleEdit = (classId: string) => {
    router.push(`/classes/edit-class/${classId}`)
  }

  const handleDelete = (classId: string) => {
    // Implement delete functionality
    console.log(`Deleting class with ID: ${classId}`)
    // You would typically show a confirmation dialog and then call an API
  }

  return (
    <div className="flex h-screen bg-[#F8F8F8] p-2">
      {/* Main Content */}
      <main className="flex-grow overflow-y-auto">
        {/* Header */}
        <Header />
        <h1 className="font-medium text-xl py-5 px-5 text-[#2F2F2F]">Class Overview</h1>

        {/* Class Overview Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 px-8 items-start">
          {cards.map((card) => (
            <div key={card.id} className="bg-white p-6 shadow rounded-2xl flex flex-col">
              <div className="flex items-center gap-5 pt-5">
                <div className="border-2 rounded-[10px] p-2 border-[#F1F1F1]">
                  <Image src={card.icon || "/placeholder.svg"} alt="icon" width={32} height={32} />
                </div>
                <div className="flex flex-col">
                  <p className="text-[30px] font-medium text-[#030E18]">{card.count}</p>
                  <p className="text-[#878787] text-[16px] font-medium">{card.label}</p>
                </div>
              </div>

              <div className="pt-4 border-b-2 border-[#F1F1F1]"></div>

              <div
                onClick={() => toggleExpand(card.id)}
                className="flex items-center justify-between mt-4 cursor-pointer text-gray-800"
              >
                <span className="font-bold text-[#606060] hover:text-blue-700 transition-colors duration-200">
                  {expandedCards.includes(card.id) ? "See less" : "See more"}
                </span>
                {expandedCards.includes(card.id) ? (
                  <FiChevronDown className="text-xl" />
                ) : (
                  <FiChevronRight className="text-xl" />
                )}
              </div>

              {expandedCards.includes(card.id) && <div className="mt-4 text-gray-800">{card.details}</div>}
            </div>
          ))}

          {/* See All / See Less button */}
          <div className="col-span-1 md:col-span-3 flex justify-center">
            <button
              className="py-2 font-bold text-[#154473] hover:text-blue-500 transition duration-200"
              onClick={toggleExpandAll}
            >
              {expandedCards.length === cards.length ? "See less" : "See all"}
            </button>
          </div>
        </section>

        {/* Classes Table */}
        <div className="px-8">
          <section className="bg-white shadow rounded-[20px] p-6">
            <div className="">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Classes</h3>
                <button
                  className="flex items-center font-bold text-[#154473] hover:text-blue-500 transition duration-200"
                  onClick={toggleModal}
                >
                  <FiPlus className="mr-2" /> Add Class
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#154473]"></div>
                </div>
              ) : classes.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No classes found. Click "Add Class" to create your first class.
                </div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 text-gray-800">Class Name</th>
                      <th className="text-left py-2 px-4 text-gray-800">Capacity</th>
                      <th className="text-left py-2 px-4 text-gray-800">Description</th>
                      <th className="text-left py-2 px-4 text-gray-800">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((item) => (
                      <tr key={item._id} className="border-b hover:bg-gray-50 transition-colors duration-200">
                        <td className="py-2 px-4 text-gray-800">{item.name}</td>
                        <td className="py-2 px-4 text-gray-800">{item.classCapacity || "N/A"}</td>
                        <td className="py-2 px-4 text-gray-800">{item.classDescription || "N/A"}</td>
                        <td className="py-2 px-4 flex justify-between">
                          <button
                            className="px-9 py-1 bg-[#0033661A] border-[#00336626] border text-[#003366] rounded hover:bg-blue-600 hover:text-white"
                            onClick={() => handleView(item._id)}
                          >
                            View
                          </button>
                          <div>
                            <button
                              className="ml-2 px-2 py-1 text-gray-500 hover:text-gray-700"
                              onClick={() => handleEdit(item._id)}
                            >
                              <FiEdit className="text-xl" />
                            </button>
                            <button
                              className="ml-2 px-2 py-1 text-red-500 hover:text-red-700"
                              onClick={() => handleDelete(item._id)}
                            >
                              <FiTrash className="text-xl" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Add Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex justify-end" onClick={toggleModal}>
          <div
            className="h-full w-full md:w-1/2 bg-white p-6 shadow-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800">Add Class</h3>
              <button
                className="text-gray-500 hover:text-gray-700 text-2xl"
                onClick={toggleModal}
                disabled={isCreating}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateClass}>
              <div className="mb-4 flex gap-4">
                <div className="flex-1">
                  <label className="block text-gray-700 font-semibold mb-2">Class Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter class name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-gray-700 font-semibold mb-2">Class Capacity (Optional)</label>

                  <select
                    name="classCapacity"
                    value={formData.classCapacity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="" disabled>
                      Choose your class capacity
                    </option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="30">30</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Class Description (Optional)</label>
                <textarea
                  name="classDescription"
                  placeholder="Provide additional notes about the class."
                  value={formData.classDescription}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                ></textarea>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  onClick={toggleModal}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
