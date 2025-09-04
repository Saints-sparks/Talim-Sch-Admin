"use client";

import type React from "react";
import { useState } from "react";
import { createClass } from "../services/student.service";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import DashboardCard from "@/components/DashboardCard";
import ClassTable from "@/components/ClassTable";
import { useDashboard } from "@/hooks/useDashboard";
import { FiBook, FiUsers, FiUser, FiBookOpen } from "react-icons/fi";

const Dashboard = () => {
  const router = useRouter();
  const { dashboardData, isLoading, error, refreshDashboard } = useDashboard();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedCards, setExpandedCards] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    classDescription: "",
    classCapacity: "",
  });

  // Generate cards data from dashboard data
  const cards = dashboardData
    ? [
        {
          id: 1,
          icon: FiBook,
          count: dashboardData.totalClasses,
          label: "Total Number of Classes",
          bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
          iconBg: "bg-blue-200",
          iconColor: "text-blue-700",
          textColor: "text-blue-900",
          details: (
            <>
              <p>
                Here you can see detailed information about all your classes.
              </p>
              {dashboardData.recentClasses.length > 0 ? (
                <ul className="list-disc ml-6 mt-2">
                  {dashboardData.recentClasses.slice(0, 3).map((cls) => (
                    <li key={cls._id} className="mb-1">
                      <span className="font-medium">{cls.name}</span>
                      {cls.studentCount > 0 && (
                        <span className="text-sm text-blue-600 ml-2">
                          ({cls.studentCount} students)
                        </span>
                      )}
                      {cls.classDescription && (
                        <div className="text-sm text-gray-600 ml-2">
                          {cls.classDescription}
                        </div>
                      )}
                    </li>
                  ))}
                  {dashboardData.recentClasses.length > 3 && (
                    <li className="text-sm text-gray-500">
                      And {dashboardData.recentClasses.length - 3} more...
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-gray-500 mt-2">No classes created yet.</p>
              )}
            </>
          ),
        },
        {
          id: 2,
          icon: FiUsers,
          count: dashboardData.totalStudents,
          label: "Total Number of Students",
          bgColor: "bg-gradient-to-br from-green-50 to-green-100",
          iconBg: "bg-green-200",
          iconColor: "text-green-700",
          textColor: "text-green-900",
          details: (
            <>
              <p>
                Here you can see detailed information about all your students.
              </p>
              {dashboardData.studentDistribution.length > 0 ? (
                <ul className="list-disc ml-6 mt-2">
                  {dashboardData.studentDistribution.slice(0, 5).map((dist) => (
                    <li key={dist.className} className="mb-1">
                      <span className="font-medium">{dist.className}</span>:
                      <span className="text-blue-600 ml-1">
                        {dist.studentCount} students
                      </span>
                    </li>
                  ))}
                  {dashboardData.studentDistribution.length > 5 && (
                    <li className="text-sm text-gray-500">
                      And {dashboardData.studentDistribution.length - 5} more
                      classes...
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-gray-500 mt-2">No students enrolled yet.</p>
              )}
            </>
          ),
        },
        {
          id: 3,
          icon: FiUser,
          count: dashboardData.totalTeachers,
          label: "Total Number of Teachers",
          bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
          iconBg: "bg-orange-200",
          iconColor: "text-orange-700",
          textColor: "text-orange-900",
          details: (
            <>
              <p>Here you can see information about your teaching staff.</p>
              <div className="mt-2 text-sm text-gray-600">
                <p>• Active teaching staff: {dashboardData.totalTeachers}</p>
                <p>
                  • Average students per teacher:{" "}
                  {dashboardData.totalTeachers > 0
                    ? Math.round(
                        dashboardData.totalStudents /
                          dashboardData.totalTeachers
                      )
                    : 0}
                </p>
              </div>
            </>
          ),
        },
        {
          id: 4,
          icon: FiBookOpen,
          count: dashboardData.totalSubjects,
          label: "Total Number of Subjects",
          bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
          iconBg: "bg-purple-200",
          iconColor: "text-purple-700",
          textColor: "text-purple-900",
          details: (
            <>
              <p>Here you can see information about subjects offered.</p>
              <div className="mt-2 text-sm text-gray-600">
                <p>• Total subjects/courses: {dashboardData.totalSubjects}</p>
                <p>
                  • Average subjects per class:{" "}
                  {dashboardData.totalClasses > 0
                    ? Math.round(
                        dashboardData.totalSubjects / dashboardData.totalClasses
                      )
                    : 0}
                </p>
              </div>
            </>
          ),
        },
      ]
    : [];

  const toggleExpand = (id: number) => {
    setExpandedCards((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleExpandAll = () => {
    if (expandedCards.length === cards.length) {
      setExpandedCards([]);
    } else {
      setExpandedCards(cards.map((card) => card.id));
    }
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setFormData({
        name: "",
        classDescription: "",
        classCapacity: "",
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);

      const classData = {
        name: formData.name,
        classCapacity: formData.classCapacity,
        classDescription: formData.classDescription,
      };

      await createClass(classData);

      toast.success("Class created successfully!");
      setIsModalOpen(false);
      setFormData({
        name: "",
        classDescription: "",
        classCapacity: "",
      });

      // Refresh dashboard data
      await refreshDashboard();
    } catch (error) {
      console.error("Error creating class:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleView = (classId: string) => {
    router.push(`/classes/view-class/${classId}`);
  };

  const handleEdit = (classId: string) => {
    router.push(`/classes/edit-class/${classId}`);
  };

  const handleDelete = (classId: string) => {
    console.log(`Deleting class with ID: ${classId}`);
    // TODO: Implement delete functionality
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !dashboardData) {
    return (
      <div className="flex h-screen bg-[#F8F8F8] p-2">
        <main className="flex-grow overflow-y-auto">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
              <div className="text-red-600 text-lg font-semibold mb-2">
                Error Loading Dashboard
              </div>
              <p className="text-red-600 mb-4">
                {error || "Failed to load dashboard data"}
              </p>
              <button
                onClick={refreshDashboard}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-[#F8F8F8] p-2">
        {/* Main Content */}
        <main className="flex-grow overflow-y-auto">
          {/* School Info Header */}
          <div className="px-5 py-3 mb-4">
            <h1 className="font-medium text-xl text-[#2F2F2F]">
              {dashboardData.schoolInfo.name} - Dashboard Overview
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {dashboardData.schoolInfo.physicalAddress}
            </p>
          </div>

          {/* Dashboard Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 px-8 items-start">
            {cards.map((card) => (
              <DashboardCard
                key={card.id}
                id={card.id}
                icon={card.icon}
                count={card.count}
                label={card.label}
                details={card.details}
                isExpanded={expandedCards.includes(card.id)}
                onToggle={toggleExpand}
                bgColor={card.bgColor}
                iconBg={card.iconBg}
                iconColor={card.iconColor}
                textColor={card.textColor}
              />
            ))}

            {/* See All / See Less button */}
            {cards.length > 0 && (
              <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-center">
                <button
                  className="py-2 font-bold text-[#154473] hover:text-blue-500 transition duration-200"
                  onClick={toggleExpandAll}
                >
                  {expandedCards.length === cards.length
                    ? "See less"
                    : "See all"}
                </button>
              </div>
            )}
          </section>

          {/* Classes Table */}
          <ClassTable
            classes={dashboardData.recentClasses}
            error={null}
            onAdd={toggleModal}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRetry={refreshDashboard}
          />
        </main>
      </div>

      {/* Add Class Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex justify-end"
          onClick={toggleModal}
        >
          <div
            className="h-full w-full md:w-1/2 bg-white p-6 shadow-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800">
                Add Class
              </h3>
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
                  <label className="block text-gray-700 font-semibold mb-2">
                    Class Name *
                  </label>
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
                  <label className="block text-gray-700 font-semibold mb-2">
                    Class Capacity (Optional)
                  </label>
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
                <label className="block text-gray-700 font-semibold mb-2">
                  Class Description (Optional)
                </label>
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
                  className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  onClick={toggleModal}
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-blue-700 flex items-center justify-center transition-colors"
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
    </>
  );
};

export default Dashboard;
