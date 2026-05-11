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
import { Tooltip } from "@/components/ui/Tooltip";
import AddClassModal from "@/components/AddClassModal";
import { useDashboard } from "@/hooks/useDashboard";
import { Book, BookOpen, Profile, Profile2User } from "@/components/Icons";
import { LayoutDashboard, TrendingUp } from "lucide-react";
import SetupProgressWidget from "@/components/SetupProgressWidget";

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
          icon: <Book />,
          count: dashboardData.totalClasses,
          label: "Total Number of Classes",
          tooltip: "Click to view and manage all classes.",
        },
        {
          id: 2,
          icon: <Profile2User />,
          count: dashboardData.totalStudents,
          label: "Total Number of Students",
          tooltip: "Click to view the full student directory.",
        },
        {
          id: 3,
          icon: <Profile />,
          count: dashboardData.totalTeachers,
          label: "Total Number of Teachers",
          tooltip: "Click to view the full teacher directory.",
        },
        {
          id: 4,
          icon: <BookOpen />,
          count: dashboardData.totalSubjects,
          label: "Total Number of Subjects",
          tooltip: "Click to view your curriculum (subjects and courses).",
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
      <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <main className="flex-grow overflow-y-auto">
          <div className="text-center py-12">
            <div className="bg-white border border-red-200 rounded-2xl shadow-xl p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="text-red-600 text-xl font-bold mb-2">
                Error Loading Dashboard
              </div>
              <p className="text-red-600 mb-6">
                {error || "Failed to load dashboard data"}
              </p>
              <button
                onClick={refreshDashboard}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
      <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Main Content */}
        <main className="flex-grow overflow-y-auto">
          {/* Enhanced Header with Talim Styling */}
          <div className="flex-shrink-0 bg-[#003366] m-6 rounded-2xl">
            <div className="px-6 py-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <LayoutDashboard className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    School Overview
                  </h1>
                  <p className="text-blue-100 mt-1">
                    Monitor your school's performance and key metrics
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Setup progress widget — visible until onboarding is complete */}
          <div className="px-6 mb-6">
            <SetupProgressWidget />
          </div>

          {/* Enhanced Dashboard Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-6">
            {cards.map((card) => (
              <Tooltip key={card.id} content={card.tooltip}>
              <div
                onClick={() => handleCardNavigation(card.id)}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      {card.label}
                    </p>
                    <p className="text-3xl font-bold bg-[#003366] bg-clip-text text-transparent">
                      {card.count}
                    </p>
                  </div>
                  <div className="p-3 bg-[#003366] rounded-xl shadow-lg group-hover:shadow-blue-300 transition-shadow duration-300">
                    <div className="h-6 w-6 text-white [&>svg]:w-6 [&>svg]:h-6 [&>svg]:text-white [&>svg>path]:stroke-white [&>svg>path]:fill-white">
                      {card.icon}
                    </div>
                  </div>
                </div>
              </div>
              </Tooltip>
            ))}
          </section>

          {/* Enhanced Classes Table Section */}
          <div className="px-6 pb-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-[#003366]" />
                  Recent Classes
                </h2>
              </div>
              <ClassTable
                classes={dashboardData.recentClasses}
                error={null}
                onAdd={toggleModal}
                onView={handleView}
                onEdit={handleEdit}
                onRetry={refreshDashboard}
              />
            </div>
          </div>
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