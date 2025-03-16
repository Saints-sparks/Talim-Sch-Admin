'use client';

import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';

const Subject = () => {
  const router = useRouter();

  // Dummy data for the subject
  const subject = {
    id: 1,
    name: 'Mathematics',
    code: 'MATH101',
    class: 'Grade 10',
    teacher: 'John Doe',
    courses: [
      { id: 1, name: 'Algebra', description: 'Introduction to algebraic equations' },
      { id: 2, name: 'Geometry', description: 'Study of shapes and spatial relationships' },
      { id: 3, name: 'Calculus', description: 'Fundamentals of differential and integral calculus' },
    ],
  };

  const handleBack = () => {
    router.back(); // Navigate back to the previous page
  };

  return (
    <div className="bg-gray-100 min-h-screen p-8">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="flex items-center text-[#154473] hover:text-blue-700 transition-colors duration-200 mb-4"
        >
          <FiArrowLeft className="mr-2" /> Back
        </button>

        {/* Subject Header */}
        <div className="border-b pb-4 mb-6">
          <h1 className="text-2xl font-semibold text-[#154473]">{subject.name}</h1>
          <p className="text-gray-600">{subject.code}</p>
        </div>

        {/* Class and Teacher Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-lg font-semibold text-[#154473]">Class</h2>
            <p className="text-gray-700">{subject.class}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#154473]">Assigned Teacher</h2>
            <p className="text-gray-700">{subject.teacher}</p>
          </div>
        </div>

        {/* List of Courses */}
        <div>
          <h2 className="text-lg font-semibold text-[#154473] mb-4">Courses</h2>
          <div className="space-y-4">
            {subject.courses.map((course) => (
              <div key={course.id} className="p-4 bg-gray-50 rounded-lg shadow-sm">
                <h3 className="font-semibold text-[#154473]">{course.name}</h3>
                <p className="text-gray-600">{course.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subject;