"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { Header } from "@/components/Header";
import { FiArrowLeft, FiUsers, FiBook } from "react-icons/fi";
import { useRouter, useParams } from "next/navigation";
import { getClass, editClass } from "../../../services/student.service";
import { getSchoolId } from "../../../services/school.service";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";

interface FormData {
  name: string;
  classCapacity: string;
  classDescription: string;
  schoolId: string;
}

const EditClass: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const classId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    classCapacity: "",
    classDescription: "",
    schoolId: "",
  });

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        if (!classId) {
          toast.error("Class ID is required");
          router.push("/classes");
          return;
        }

        const data = await getClass(classId);
        setFormData({
          name: data.name,
          classCapacity: data.classCapacity || "",
          classDescription: data.classDescription || "",
          schoolId: data.schoolId || "",
        });
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

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!classId) {
        throw new Error("Class ID is missing");
      }
      const schoolId = getSchoolId();
      if (!schoolId) {
        toast.error("School ID is required");
        return;
      }

      const updateData = {
        name: formData.name,
        classCapacity: formData.classCapacity,
        classDescription: formData.classDescription,
        schoolId: schoolId,
      };

      const response = await editClass(classId, updateData);

      if (response) {
        toast.success("Class updated successfully!");
        router.push(`/classes/view-class/${classId}`);
      } else {
        throw new Error("Failed to update class");
      }
    } catch (error: any) {
      console.error("Error updating class:", error);
      toast.error(error.message || "Failed to update class");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCourse = () => {
    router.push("/courses");
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Header />

      <div className="flex items-center mb-8">
        <button
          onClick={() => router.push(`/classes/view-class/${classId}`)}
          className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <h1 className="text-2xl font-semibold text-gray-800">Edit Class</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-gray-700 font-medium mb-2 flex items-center">
                <FiUsers className="mr-2 text-gray-600" />
                Class Name *
              </label>
              <input
                type="text"
                name="name"
                placeholder="Enter class name"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-gray-700 font-medium mb-2 flex items-center">
                <FiUsers className="mr-2 text-gray-600" />
                Class Capacity
              </label>
              <select
                name="classCapacity"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none transition-all duration-200"
                value={formData.classCapacity}
                onChange={handleChange}
              >
                <option value="" className="text-gray-400">
                  Select capacity
                </option>
                <option value="10">10 students</option>
                <option value="20">20 students</option>
                <option value="30">30 students</option>
                <option value="40">40 students</option>
                <option value="50">50 students</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-gray-700 font-medium mb-2 flex items-center">
              <FiBook className="mr-2 text-gray-600" />
              Class Description
            </label>
            <textarea
              name="classDescription"
              placeholder="Provide additional notes about the class..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 min-h-[120px]"
              rows={4}
              value={formData.classDescription}
              onChange={handleChange}
            />
          </div>

          <div className="flex items-center gap-x-4 mb-4">
            <h1 className="text-2xl font-semibold text-gray-800">Add Course</h1>
            <Link
              href="/courses"
              className="font-bold text-[#154473] px-4 py-1 bg-gray-200 rounded"
            >
              + Add
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push(`/classes/view-class/${classId}`)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-[#154473] text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
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
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClass;
