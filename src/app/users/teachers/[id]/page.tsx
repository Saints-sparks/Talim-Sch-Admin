// src/app/users/teachers/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiEdit, FiSave } from 'react-icons/fi';
import { teacherService, Teacher } from '@/app/services/teacher.service';
import {Header} from '@/components/Header';

const TeacherProfile = () => {
  const [editMode, setEditMode] = useState(false);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;

  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await teacherService.getTeacherById(teacherId);
        setTeacher(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch teacher');
      } finally {
        setIsLoading(false);
      }
    };

    if (teacherId) {
      fetchTeacher();
    }
  }, [teacherId]);

  const handleSave = () => {
    setEditMode(false);
    // Add update logic here
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Header />
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/users/teachers')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Teachers
          </button>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Header />
        <div className="text-center py-12">
          <p className="text-gray-600">Teacher not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Header />
      
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-end mb-4">
          {editMode ? (
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FiSave /> Save
            </button>
          ) : (
            <button 
              onClick={() => setEditMode(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              <FiEdit /> Edit
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3">
            <div className="flex flex-col items-center">
              <img
                src={teacher.userId.userAvatar || '/default-avatar.png'}
                alt={`${teacher.userId.firstName} ${teacher.userId.lastName}`}
                className="w-32 h-32 rounded-full mb-4"
              />
              <h2 className="text-xl font-bold text-center">
                {teacher.userId.firstName} {teacher.userId.lastName}
              </h2>
              <p className="text-gray-500 text-center">
                {teacher.specialization}
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Contact Information</h3>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Email:</span> {teacher.userId.email}
                </p>
                <p>
                  <span className="font-medium">Phone:</span> {teacher.userId.phoneNumber}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Professional Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                    <p>{teacher.employmentType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <p>{teacher.employmentRole}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Qualification</label>
                    <p>{teacher.highestAcademicQualification}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Experience</label>
                    <p>{teacher.yearsOfExperience} years</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Schedule</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Availability Days</label>
                    <p>{teacher.availabilityDays.join(', ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Available Time</label>
                    <p>{teacher.availableTime}</p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mt-6 mb-2">Assigned Classes</h3>
                <div className="space-y-2">
                  {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
                    teacher.assignedClasses.map((classItem) => (
                      <div key={classItem._id} className="bg-gray-50 p-2 rounded">
                        {classItem.name}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No classes assigned</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;