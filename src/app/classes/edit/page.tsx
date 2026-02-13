"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiEdit, FiChevronLeft, FiGrid } from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Class, getClasses } from "@/app/services/student.service";

export default function EditClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const data = await getClasses();
        setClasses(data);
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Failed to load classes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClasses();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading classes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="m-6 rounded-2xl" style={{ background: 'linear-gradient(to right, #003366, #004488)' }}>
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <FiGrid className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Edit Classes
                </h1>
                <p className="text-blue-100 mt-1">
                  Select a class to edit its details
                </p>
              </div>
            </div>

            <button
              onClick={() => router.push("/classes")}
              className="flex items-center gap-2 px-6 py-2.5 bg-white/10 backdrop-blur-sm text-white text-sm font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/30"
            >
              <FiChevronLeft className="h-4 w-4" />
              Back to Classes
            </button>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="px-6 pb-6">
        {classes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <FiGrid className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Classes Found
            </h3>
            <p className="text-gray-600">
              Create a class first before editing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {classes.map((classItem) => (
              <div
                key={classItem._id}
                className="bg-white rounded-2xl border-2 border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => router.push(`/classes/edit-class/${classItem._id}`)}
              >
                {/* Card Header */}
                <div className="px-4 py-3" style={{ background: 'linear-gradient(to right, #003366, #004488)' }}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-lg">
                      {classItem.name}
                    </h3>
                    <FiEdit className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Courses</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {classItem.assignedCourses?.length || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Capacity</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {classItem.classCapacity || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Teacher</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {classItem.classTeacherId ? "Assigned" : "None"}
                    </span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-4 pb-4">
                  <button
                    className="w-full text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:opacity-90"
                    style={{ background: 'linear-gradient(to right, #003366, #004488)' }}
                  >
                    Edit Class
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}