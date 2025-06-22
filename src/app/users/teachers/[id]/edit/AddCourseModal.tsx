import { teacherService } from '@/app/services/teacher.service';
import { Course } from '@/app/services/subjects.service';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

interface AddCourseModalProps {
  courses: Course[];
  onClose: () => void;
  onAddCourses: (selectedCourseIds: string[]) => void;
  initialSelectedCourses?: string[];
  teacherId: string;
}

const AddCourseModal: React.FC<AddCourseModalProps> = ({
  courses,
  onClose,
  onAddCourses,
  initialSelectedCourses = [],
  teacherId,
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
      // Check if token exists
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error('Please login again');
        return;
      }

      // Call the updated service method with selected courses
      const teacher = await teacherService.updateTeacherByCourse(teacherId, selectedCourses);
      
      // If we reach here, it means the update was successful
      console.log('Update successful:', teacher);

      // Call the onAddCourses callback with selected course IDs
      onAddCourses(selectedCourses);
      toast.success('Courses added successfully');
      onClose();
      
      // Optional: Reload page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error: any) {
      // Handle specific error cases
      if (error.message.includes('Authentication failed')) {
        toast.error('Session expired. Please login again.');
        // Optional: Redirect to login
        // window.location.href = '/login';
      } else {
        toast.error(error.message || 'Failed to add courses');
      }
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
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Select courses to assign to this teacher.
          </p>
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
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label htmlFor={course._id} className="text-gray-700 cursor-pointer">
                  <span className="font-medium">{course.courseCode}</span> - {course.title}
                </label>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#154473] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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