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
import { Book, BookOpen, Profile, Profile2User } from "@/components/Icons";

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
          
        },
        {
          id: 2,
          icon: <Profile2User />,
          count: dashboardData.totalStudents,
          label: "Total Number of Students",
          
        },
        {
          id: 3,
          icon: <Profile />,
          count: dashboardData.totalTeachers,
          label: "Total Number of Teachers",
          
        },
        {
          id: 4,
          icon: <BookOpen />,
          count: dashboardData.totalSubjects,
          label: "Total Number of Subjects",
          
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
      <div className="flex h-screen  p-2">
        {/* Main Content */}
        <main className="flex-grow overflow-y-auto">
          {/* School Info Header */}
          <div className="px-5 py-3 mb-4">
            <h1 className="font-medium text-[20px] text-[#2F2F2F]">
              School Overview
            </h1>
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
                
                onNavigate={handleCardNavigation}
               
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
