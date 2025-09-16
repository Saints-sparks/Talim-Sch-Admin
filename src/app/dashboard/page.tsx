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
import AddClassModal from "@/components/AddClassModal";
import { useDashboard } from "@/hooks/useDashboard";
import { FiBook, FiUsers, FiUser, FiBookOpen } from "react-icons/fi";

const Dashboard = () => {
  const router = useRouter();
  const { dashboardData, isLoading, error, refreshDashboard } = useDashboard();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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

  // Navigation handlers for metric cards
  const handleCardNavigation = (cardId: number) => {
    switch (cardId) {
      case 1: // Total Number of Classes
        router.push("/classes");
        break;
      case 2: // Total Number of Students
        router.push("/users/students");
        break;
      case 3: // Total Number of Teachers
        router.push("/users/teachers");
        break;
      case 4: // Total Number of Subjects
        router.push("/curriculum");
        break;
      default:
        break;
    }
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleCreateClass = async (classData: {
    name: string;
    classCapacity: string;
    classDescription: string;
  }) => {
    try {
      setIsCreating(true);

      await createClass(classData);

      toast.success("Class created successfully!");
      setIsModalOpen(false);

      // Refresh dashboard data
      await refreshDashboard();
    } catch (error) {
      console.error("Error creating class:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
      throw error; // Re-throw so the modal can handle it
    } finally {
      setIsCreating(false);
    }
  };

  const handleView = (classId: string) => {
    router.push(`/classes/${classId}`);
  };

  const handleEdit = (classId: string) => {
    router.push(`/classes/edit-class/${classId}`);
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
                onNavigate={handleCardNavigation}
                bgColor={card.bgColor}
                iconBg={card.iconBg}
                iconColor={card.iconColor}
                textColor={card.textColor}
              />
            ))}
          </section>

          {/* Classes Table */}
          <ClassTable
            classes={dashboardData.recentClasses}
            error={null}
            onAdd={toggleModal}
            onView={handleView}
            onEdit={handleEdit}
            onRetry={refreshDashboard}
          />
        </main>
      </div>

      {/* Add Class Modal */}
      <AddClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateClass}
        isCreating={isCreating}
      />
    </>
  );
};

export default Dashboard;
