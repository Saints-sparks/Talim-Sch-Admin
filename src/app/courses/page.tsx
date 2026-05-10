"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import toast, { Toaster } from "react-hot-toast";
import {
  deleteCourseService,
  getCoursesBySchool,
  type Course,
} from "../services/subjects.service";

type PopulatedRef = string | { _id?: string; name?: string; code?: string; title?: string };
type CourseRow = Omit<Course, "subjectId" | "teacherId" | "classId"> & {
  subjectId?: PopulatedRef;
  classId?: PopulatedRef;
  teacherId?: string | { _id?: string; userId?: { firstName?: string; lastName?: string; email?: string } };
};

const getRefLabel = (value: PopulatedRef | undefined, fallback = "Not assigned") => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  return value.name || value.title || value.code || value._id || fallback;
};

const getTeacherLabel = (teacher: CourseRow["teacherId"]) => {
  if (!teacher) return "Not assigned";
  if (typeof teacher === "string") return teacher;
  const user = teacher.userId;
  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return name || user?.email || teacher._id || "Not assigned";
};

const CourseManagement = () => {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCourses = async (showToast = false) => {
    setIsRefreshing(true);
    try {
      const data = await getCoursesBySchool();
      setCourses(data as CourseRow[]);
      if (showToast) toast.success("Courses refreshed");
    } catch (error: any) {
      toast.error(error?.message || "Error loading courses");
      setCourses([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      await deleteCourseService(id);
      setCourses((prev) => prev.filter((course) => course._id !== id));
      toast.success("Course deleted successfully");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete course");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      <div className="container mx-auto p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Course Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage courses created under your curriculum subjects.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => fetchCourses(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              <ArrowPathIcon
                className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => router.push("/curriculum/structure?action=add-course")}
              className="flex items-center gap-2 bg-[#154473] hover:bg-[#0f3458] text-white px-4 py-2 rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Add New Course
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <ArrowPathIcon className="h-12 w-12 text-gray-400 animate-spin" />
          </div>
        ) : courses.length > 0 ? (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y text-black divide-gray-200">
                  {courses.map((course) => (
                    <tr key={course._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {course.title || course.name || "Untitled course"}
                        </div>
                        {course.description && (
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {course.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-blue-600 font-medium">
                          {course.courseCode || course.code || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getRefLabel(course.subjectId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getRefLabel(course.classId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getTeacherLabel(course.teacherId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/curriculum/structure?action=edit-course&courseId=${course._id}`
                              )
                            }
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCourse(course._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-sm p-8">
            <p className="text-gray-500 mb-4">No courses found</p>
            <button
              type="button"
              onClick={() => fetchCourses(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
            >
              <ArrowPathIcon
                className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseManagement;
