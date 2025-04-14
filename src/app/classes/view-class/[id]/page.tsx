"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { FiEdit, FiArrowLeft, FiBook } from "react-icons/fi";
import { useRouter, useParams } from "next/navigation";
import { getClass } from "../../../services/student.service"; // adjust the path if needed
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

  useEffect(() => {
    const fetchClassData = async () => {
      console.log("Fetching class data");
      
      console.log(classId);
      try {
        if (!classId) {
          setError("Class ID is required");
          return;
        }

        const data = await getClass(classId);
        
        setClassData(data);
      } catch (error: any) {
        console.error("Error fetching class:", error);
        setError("Failed to load class details");
        toast.error("Failed to load class details");
        // Remove automatic redirection so the error message is rendered
        // router.push("/classes"); 
      } finally {
        setIsLoading(false);
      }
    };

    fetchClassData();
  }, []);

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

  // If there's an error, show error message with a "Back to Classes" button
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Header user="Administrator" title="View Class" />
        <div className="bg-white rounded-xl shadow-sm p-6 text-center max-w-2xl mx-auto">
          <p className="text-gray-600 mb-6">{error}</p>
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

  // If there is no class data found
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
              School ID: {classData.schoolId}
            </p>
            <p className="text-gray-500 mt-1">
              Class Teacher ID: {classData.classTeacherId}
            </p>
            <p className="text-gray-500 mt-1">
              Class Description: {classData.classDescription}
            </p>
            <p className="text-gray-500 mt-1">
              Class Capacity: {classData.classCapacity}
            </p>
          </div>
          <button
            onClick={() => router.push(`/classes/edit-class/${classId}`)}
            className="px-6 py-2 bg-[#154473] text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
            <FiEdit className="mr-2" /> Edit Class
          </button>
        </div>

        <div className="mb-8">
          <h3 className="font-medium text-gray-700 mb-3">Assigned Courses</h3>
          {classData.assignedCourses && classData.assignedCourses.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {classData.assignedCourses.map((courseId, index) => (
                <div
                  key={index}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full flex items-center hover:bg-blue-100 transition-colors duration-200"
                >
                  <FiBook className="mr-2 text-sm" />
                  <span>{courseId}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No courses assigned</p>
          )}
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
