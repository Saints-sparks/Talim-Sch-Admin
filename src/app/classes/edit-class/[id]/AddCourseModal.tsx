import { API_ENDPOINTS } from '@/app/lib/api/config';
import { Course } from '@/app/services/subjects.service';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

interface AddCourseModalProps {
  courses: Course[];
  onClose: () => void;
  onAddCourses: (selectedCourseIds: string[]) => void;
  initialSelectedCourses?: string[];
  classId: string; // Add classId to the props
}

const AddCourseModal: React.FC<AddCourseModalProps> = ({
  courses,
  onClose,
  onAddCourses,
  initialSelectedCourses = [],
  classId, // Destructure classId from props
}) => {
  const [selectedCourses, setSelectedCourses] = useState<string[]>(initialSelectedCourses);
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmit = async () => {
    if (selectedCourses.length === 0) {
      toast.error('Please select at least one course');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      // Make API call to update the class with selected courses
      const response = await fetch(`${API_ENDPOINTS.UPDATE_COURSES_BY_CLASS(classId)}`, {
        method: 'PUT', // or 'POST' depending on your API
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseIds: selectedCourses,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update courses');
      }

      // Call the onAddCourses callback with selected course IDs
      onAddCourses(selectedCourses);
      toast.success('Courses added successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to add courses');
      console.error('Error adding courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50">
      <div className="bg-white h-full w-full md:w-1/2 rounded-l-lg shadow-lg p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Add Courses</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-xl"
            disabled={isLoading}
          >
            &times;
          </button>
        </div>
        <div className="space-y-4">
          {courses.length === 0 ? (
            <p className="text-gray-600">No courses available</p>
          ) : (
            courses.map((course) => (
              <div key={course._id} className="flex items-center">
                <input
                  type="checkbox"
                  id={course._id}
                  checked={selectedCourses.includes(course._id)}
                  onChange={() => handleCourseToggle(course._id)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label htmlFor={course.courseCode} className="text-gray-700">
                  {course.code} - {course.name}
                </label>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#154473] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Adding...' : 'Add Courses'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCourseModal;