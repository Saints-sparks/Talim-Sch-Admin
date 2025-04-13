"use client";
import { getCoursesBySubject } from "@/app/services/subjects.service";
import React, { useEffect, useState } from "react";
// import { getCoursesBySubject } from "@/services/courseService"; // adjust path as needed

interface Course {
  _id: string;
  title: string;
  description: string;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  courses?: Course[]; // Make optional since we fetch it
}

interface SubjectsTableProps {
  subjects: Subject[];
  onEdit: (subject: Subject) => void;
  onDelete: (subjectId: string) => void;
  onEditCourse: (subjectId: string, course: Course) => void;
  onAddCourse: (subject: { _id: string; name: string }) => void;
  onDeleteCourse: (subjectId: string, courseId: string) => void;
}

const SubjectsTable: React.FC<SubjectsTableProps> = ({
  subjects,
  onEdit,
  onDelete,
  onEditCourse,
  onAddCourse,
  onDeleteCourse,
}) => {
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(
    null
  );
  const [subjectCourses, setSubjectCourses] = useState<
    Record<string, Course[]>
  >({});
  const [loading, setLoading] = useState<string | null>(null);

  const toggleExpand = async (subjectId: string) => {
    const isCurrentlyExpanded = expandedSubjectId === subjectId;
    console.log(subjectId);

    if (!isCurrentlyExpanded) {
      console.log(isCurrentlyExpanded);
      
      if (!subjectCourses[subjectId]) {
        console.log(subjectCourses[subjectId]);
        
        setLoading(subjectId);
        try {
          console.log("Fetching courses for subject:", subjectId);
          
          const courses = await getCoursesBySubject(subjectId);
          console.log(courses);
          
          setSubjectCourses((prev) => ({ ...prev, [subjectId]: courses }));
        } catch (err) {
          console.error("Failed to fetch courses", err);
        } finally {
          setLoading(null);
        }
      }
      setExpandedSubjectId(subjectId);
    } else {
      setExpandedSubjectId(null);
    }
  };

  return (
    <div className="overflow-x-auto bg-white shadow rounded-md">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
          <tr>
            <th className="px-6 py-3">Subject Name</th>
            <th className="px-6 py-3">Subject Code</th>
            <th className="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => (
            <React.Fragment key={subject._id}>
              <tr className="hover:bg-gray-50 text-gray-600">
                <td className="px-6 py-4">{subject.name}</td>
                <td className="px-6 py-4">{subject.code}</td>
                <td className="px-6 py-4 space-x-2">
                  <button
                    onClick={() => toggleExpand(subject._id)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {expandedSubjectId === subject._id
                      ? "Hide Courses"
                      : "View Courses"}
                  </button>
                  <button
                    onClick={() => onEdit(subject)}
                    className="text-sm text-green-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(subject._id)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>

              {expandedSubjectId === subject._id && (
                <tr>
                  <td colSpan={3} className="px-6 py-2 bg-gray-50">
                    {loading === subject._id ? (
                      <p className="text-gray-600 text-sm">
                        Loading courses...
                      </p>
                    ) : (
                      <ul className="pl-4 list-disc text-sm text-gray-700 space-y-2">
                        {(subjectCourses[subject._id] || []).map((course) => (
                          <li
                            key={course._id}
                            className="flex flex-col sm:flex-row sm:items-start justify-between bg-white p-3 border rounded shadow-sm gap-2 sm:gap-0"
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800 truncate max-w-full">
                                {course.title}
                              </p>
                              <p className="text-gray-600 text-sm line-clamp-2 sm:line-clamp-1 max-w-[90vw] sm:max-w-[600px]">
                                {course.description}
                              </p>
                            </div>
                            <div className="flex sm:flex-col items-start sm:items-end gap-2 sm:space-y-1 shrink-0">
                              <button
                                className="text-blue-500 text-sm hover:underline"
                                onClick={() =>
                                  onEditCourse(subject._id, course)
                                }
                              >
                                Edit
                              </button>
                              <button
                                className="text-red-500 text-sm hover:underline"
                                onClick={() =>
                                  onDeleteCourse(subject._id, course._id)
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        ))}
                        <button
                          className="mt-3 text-sm text-green-600 hover:underline"
                          onClick={() => onAddCourse(subject)}
                        >
                          + Add Course
                        </button>
                      </ul>
                    )}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubjectsTable;
