"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { FiEdit, FiArrowLeft, FiBook } from "react-icons/fi";
import { useRouter, useParams } from "next/navigation";
import { getClass } from "../../services/student.service"; // adjust the path if needed
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface ClassDetails {
  _id: string;
  name: string;
  schoolId: string;
  classTeacherId: string;
  assignedCourses: string[];
  classDescription: string;
  classCapacity: string;
}

const ViewClass: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const classId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [classData, setClassData] = useState<ClassDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Helper function to safely extract string values from potentially nested objects
  const getStringValue = (value: any): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'object' && value !== null) {
      return value.name || value.title || value._id || 'Unknown';
    }
    return value?.toString() || 'Unknown';
  };

  useEffect(() => {
    const fetchClassData = async () => {
      console.log("🔍 ViewClass component loaded");
      console.log("🔍 Params:", params);
      console.log("🔍 Class ID:", classId);

      try {
        if (!classId) {
          setError("Class ID is required");
          return;
        }

        console.log("🚀 Fetching class data for ID:", classId);
        const data = await getClass(classId);
        console.log("✅ Class data received:", data);

        setClassData(data);
      } catch (error: any) {
        console.error("❌ Error fetching class:", error);
        setError("Failed to load class details");
        toast.error("Failed to load class details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassData();
  }, [classId, params]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-gray-600">Loading class details...</p>
        </div>
      </div>
    );
  }

  // If there's an error, show error message with a "Back to Classes" button
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Header />
        <div className="bg-white rounded-xl shadow-sm p-6 text-center max-w-2xl mx-auto">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Class ID: {classId || 'Not provided'}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => router.push("/classes")}
                className="px-6 py-2 bg-[#154473] text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
              >
                <FiArrowLeft className="mr-2" /> Back to Classes
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If there is no class data found
  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Header />
        <div className="bg-white rounded-xl shadow-sm p-6 text-center max-w-2xl mx-auto">
          <div className="text-gray-400 text-4xl mb-4">📚</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Class Not Found</h2>
          <p className="text-gray-600 mb-4">The class you're looking for doesn't exist or has been removed.</p>
          <p className="text-sm text-gray-500 mb-6">Class ID: {classId}</p>
          <button
            onClick={() => router.push("/classes")}
            className="px-6 py-2 bg-[#154473] text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center mx-auto"
          >
            <FiArrowLeft className="mr-2" /> Back to Classes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Header />

      <div className="flex items-center mb-6">
        <button
          onClick={() => router.push("/classes")}
          className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800">Class Details</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {getStringValue(classData.name)}
            </h2>
            <div className="mt-3 space-y-2">
              <p className="text-gray-500">
                <span className="font-medium">School ID:</span> {getStringValue(classData.schoolId)}
              </p>
              <p className="text-gray-500">
                <span className="font-medium">Class Teacher ID:</span> {getStringValue(classData.classTeacherId)}
              </p>
              <p className="text-gray-500">
                <span className="font-medium">Class Description:</span> {getStringValue(classData.classDescription) || 'No description provided'}
              </p>
              <p className="text-gray-500">
                <span className="font-medium">Class Capacity:</span> {getStringValue(classData.classCapacity)} students
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/classes/edit-class/${classId}`)}
            className="px-6 py-2 bg-[#154473] text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
            <FiEdit className="mr-2" /> Edit Class
          </button>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Assigned Courses</h3>
          {classData.assignedCourses && classData.assignedCourses.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {classData.assignedCourses.map((courseId, index) => (
                <div
                  key={index}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full flex items-center hover:bg-blue-100 transition-colors duration-200"
                >
                  <FiBook className="mr-2 text-sm" />
                  <span>{getStringValue(courseId)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <FiBook className="text-gray-400 text-2xl mx-auto mb-2" />
              <p className="text-gray-600">No courses assigned to this class yet.</p>
              <p className="text-sm text-gray-500 mt-1">Courses can be assigned through the edit page.</p>
            </div>
          )}
        </div>

        {/* Additional Info Section */}
        <div className="mb-8 bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Class Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Class ID:</span>
              <p className="text-gray-800 font-mono">{getStringValue(classData._id)}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Total Capacity:</span>
              <p className="text-gray-800">{getStringValue(classData.classCapacity)} students</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Assigned Courses:</span>
              <p className="text-gray-800">{classData.assignedCourses?.length || 0} courses</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => router.push("/classes")}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Back to Classes
          </button>
          <div className="flex gap-4">
            <button
              onClick={() => router.push(`/classes/edit-class/${classId}`)}
              className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Edit Class Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewClass;