import { API_ENDPOINTS } from '@/app/lib/api/config';
import { Course } from '@/app/services/subjects.service';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

interface AddCourseModalProps {
  courses: Course[];
  onClose: () => void;
  onAddCourses: (selectedCourseIds: string[]) => void;
  initialSelectedCourses?: string[];
  classId: string;
}

const AddCourseModal: React.FC<AddCourseModalProps> = ({
  courses,
  onClose,
  onAddCourses,
  initialSelectedCourses = [],
  classId,
}) => {
  const [selectedCourses, setSelectedCourses] = useState<string[]>(initialSelectedCourses);
  const [isLoading, setIsLoading] = useState(false);

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
      
      console.log("Sending data:", {
        courseIds: selectedCourses
      }); // Debug log

      // Fixed: Use courseIds instead of assignedCourses
      const response = await fetch(`${API_ENDPOINTS.UPDATE_COURSES_BY_CLASS(classId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseIds: selectedCourses, // Changed from assignedCourses to courseIds
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.message || 'Failed to update courses');
      }

      const responseData = await response.json();
      console.log('Success response:', responseData);

      // Call the onAddCourses callback with selected course IDs
      onAddCourses(selectedCourses);
      toast.success('Courses added successfully');
      onClose();
    } catch (error: any) {
      console.error('Error adding courses:', error);
      toast.error(error.message || 'Failed to add courses');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedCourses.length === courses.length) {
      // If all are selected, deselect all
      setSelectedCourses([]);
    } else {
      // Select all courses
      setSelectedCourses(courses.map(course => course._id));
    }
  };

  const isAllSelected = selectedCourses.length === courses.length && courses.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50">
      <div className="bg-white h-full w-full md:w-1/2 rounded-l-lg shadow-lg p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Add Courses to Class</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-xl"
            disabled={isLoading}
          >
            &times;
          </button>
        </div>

        {/* Selected count and select all */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {selectedCourses.length} of {courses.length} courses selected
            </span>
            {courses.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={isLoading}
              >
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-2">No courses available</p>
              <p className="text-sm text-gray-500">Please create some courses first</p>
            </div>
          ) : (
            courses.map((course) => (
              <div 
                key={course._id} 
                className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 transition ${
                  selectedCourses.includes(course._id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <input
                  type="checkbox"
                  id={course._id}
                  checked={selectedCourses.includes(course._id)}
                  onChange={() => handleCourseToggle(course._id)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label htmlFor={course._id} className="flex-1 cursor-pointer">
                  <div className="font-medium text-gray-900">
                    {course.code} - {course.name}
                  </div>
                  {course.description && (
                    <div className="text-sm text-gray-600 mt-1">
                      {course.description}
                    </div>
                  )}
                </label>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#154473] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            disabled={isLoading || selectedCourses.length === 0}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Adding...
              </div>
            ) : (
              `Add ${selectedCourses.length} Course${selectedCourses.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCourseModal;