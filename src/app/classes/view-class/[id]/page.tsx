'use client';

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { FiEdit, FiArrowLeft } from "react-icons/fi";
import { useRouter, useParams } from "next/navigation";
import { getClass } from '../../../services/student.service';
import { toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

interface ClassDetails {
  _id: string;
  name: string;
  classCapacity: string;
  classDescription: string;
  assignedTeacher?: string;
  courses?: string[];
  createdAt?: string;
  updatedAt?: string;
}

const ViewClass: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const classId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [classData, setClassData] = useState<ClassDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        if (!classId) {
          toast.error("Class ID is required");
          router.push("/classes");
          return;
        }

        const data = await getClass(classId);
        setClassData(data);
      } catch (error) {
        console.error("Error fetching class:", error);
        toast.error("Failed to load class details");
        router.push("/classes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassData();
  }, [classId, router]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Header />
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-500 mb-4">Class not found</p>
          <button
            onClick={() => router.push("/classes")}
            className="px-4 py-2 bg-[#154473] text-white rounded-lg hover:bg-blue-700 flex items-center mx-auto"
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
          className="mr-4 p-2 rounded-full hover:bg-gray-200"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800">Class: {classData.name}</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold">{classData.name}</h2>
          <button
            onClick={() => router.push(`/classes/edit-class/${classId}`)}
            className="px-4 py-2 bg-[#154473] text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <FiEdit className="mr-2" /> Edit
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 font-semibold mb-2">
                Class Name
              </label>
              <input
                type="text"
                readOnly
                value={classData.name}
                className="w-full px-4 py-3  rounded-lg bg-gray-400"
              />
            </div>

            <div className="flex-1">
              <label className="block text-gray-700 font-semibold mb-2">
                Class Capacity
              </label>
              <select
                name="classCapacity"
                disabled
                value={classData.classCapacity || ""}
                className="w-full px-4 py-3 rounded-lg bg-gray-400"
              >
                <option value="">{classData.classCapacity || "Not specified"}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray font-semibold mb-2">
              Class Description
            </label>
            <textarea
              readOnly
              value={classData.classDescription || "No description provided"}
              className="w-full px-4 py-3  rounded-lg bg-gray-400 min-h-[100px]"
            />
          </div>

          {classData.assignedTeacher && (
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Assigned Teacher
              </label>
              <select
                disabled
                value={classData.assignedTeacher}
                className="w-full px-4 py-3 border rounded-lg bg-gray-400"
              >
                <option>{classData.assignedTeacher}</option>
              </select>
            </div>
          )}

          {classData.courses && classData.courses.length > 0 && (
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Courses
              </label>
              <div className="flex flex-wrap gap-2">
                {classData.courses.map((course, index) => (
                  <span 
                    key={index}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg"
                  >
                    {course}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => router.push("/classes")}
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Back to Classes
            </button>
            <button
              onClick={() => router.push(`/classes/edit-class/${classId}`)}
              className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-blue-700"
            >
              Edit Class
            </button>
          </div>
        </div>
      </div>

      {/* Add Course Modal (kept from your design) */}
      {isModalOpen && (
        <div
          className={`fixed inset-0 bg-gray-900 bg-opacity-50 z-50 transition-opacity duration-300 ease-in-out ${
            isModalOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={toggleModal}
        >
          <div
            className={`absolute right-0 top-0 h-full w-full md:w-1/2 bg-white p-6 shadow-lg transform transition-transform duration-300 ease-in-out ${
              isModalOpen ? "translate-x-0" : "translate-x-full"
            } flex flex-col`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal content remains the same as in your design */}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewClass;