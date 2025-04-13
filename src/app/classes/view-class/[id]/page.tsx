'use client';

import React, { useState, useEffect } from "react";
import {Header} from "@/components/Header";
import { FiEdit, FiArrowLeft, FiUsers, FiBook, FiUser } from "react-icons/fi";
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Header user="Administrator" title="View Class" />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Header user="Administrator" title="View Class" />
        <div className="bg-white rounded-xl shadow-sm p-6 text-center max-w-2xl mx-auto">
          <p className="text-gray-600 mb-6">Class not found</p>
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
      <Header user="Administrator" title="View Class" />

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
            <h2 className="text-2xl font-bold text-gray-900">{classData.name}</h2>
            <p className="text-gray-500 mt-1">
              Last updated: {new Date(classData.updatedAt || classData.createdAt || '').toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => router.push(`/classes/edit-class/${classId}`)}
            className="px-6 py-2 bg-[#154473] text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
            <FiEdit className="mr-2" /> Edit Class
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-[#154473]">
            <div className="flex items-center mb-3">
              <FiUsers className="text-gray-600 mr-2" />
              <h3 className="font-medium text-gray-700">Class Capacity</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {classData.classCapacity || "Not specified"}
            </p>
          </div>

          {classData.assignedTeacher && (
            <div className="bg-gray-50 p-5 rounded-lg border-l-4 border-[#154473]">
              <div className="flex items-center mb-3">
                <FiUser className="text-gray-600 mr-2" />
                <h3 className="font-medium text-gray-700">Assigned Teacher</h3>
              </div>
              <p className="text-xl font-semibold text-gray-900">
                {classData.assignedTeacher}
              </p>
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="flex items-center mb-3">
            <FiBook className="text-gray-600 mr-2" />
            <h3 className="font-medium text-gray-700">Class Description</h3>
          </div>
          <div className="bg-gray-50 p-5 rounded-lg">
            <p className="text-gray-800">
              {classData.classDescription || "No description provided"}
            </p>
          </div>
        </div>

        {classData.courses && classData.courses.length > 0 && (
          <div className="mb-8">
            <h3 className="font-medium text-gray-700 mb-3">Courses</h3>
            <div className="flex flex-wrap gap-3">
              {classData.courses.map((course, index) => (
                <div 
                  key={index}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full flex items-center hover:bg-blue-100 transition-colors duration-200"
                >
                  <FiBook className="mr-2 text-sm" />
                  <span>{course}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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