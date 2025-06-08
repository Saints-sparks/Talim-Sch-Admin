'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FiEdit } from 'react-icons/fi';
import { teacherService, TeacherById } from '@/app/services/teacher.service';
import {Header} from '@/components/Header';

interface TeacherProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  userAvatar: string;
}
interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string
  role: string
  schoolId: string
  isActive: boolean
}

interface Teacher {
  _id: string
  userId: User
  assignedClasses: string[]
  assignedCourses: string[]
  isFormTeacher: boolean
  highestAcademicQualification: string
  yearsOfExperience: number
  specialization: string
  employmentType: string
  employmentRole: string
  availabilityDays: string[]
  availableTime: string
}

const TeacherProfile = () => {
  const [teacher, setTeacher] = useState<TeacherById | null>(null);
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
        const teachers = await teacherService.getTeacherById(teacherId);
        console.log(teachers, "teachers");

        if (!teachers) {
          throw new Error('Teacher not found');
        }

        const teacherData: TeacherById = {
          _id: teachers._id,
          userId: {
            _id: teachers.userId._id,
            userId: teachers.userId._id,
            email: teachers.userId.email,
            firstName: teachers.userId.firstName,
            lastName: teachers.userId.lastName,
            phoneNumber: teachers.userId.phoneNumber,
            role: teachers.userId.role,
            schoolId: teachers.userId.schoolId,
            isActive: teachers.userId.isActive,
            isEmailVerified: teachers.userId.isEmailVerified || false,
            isTwoFactorEnabled: teachers.userId.isTwoFactorEnabled || false,
            devices: teachers.userId.devices || [],
            id: teachers.userId._id,
            createdAt: teachers.userId.createdAt || new Date().toISOString(),
            updatedAt: teachers.userId.updatedAt || new Date().toISOString(),
            __v: teachers.userId.__v || 0,
          },
          assignedClasses: teachers.assignedClasses,
          assignedCourses: teachers.assignedCourses,
          isFormTeacher: teachers.isFormTeacher,
          highestAcademicQualification: teachers.highestAcademicQualification,
          yearsOfExperience: teachers.yearsOfExperience,
          specialization: teachers.specialization,
          employmentType: teachers.employmentType,
          employmentRole: teachers.employmentRole,
          availabilityDays: teachers.availabilityDays,
          availableTime: teachers.availableTime,
          createdAt: teachers.createdAt || new Date().toISOString(),
          updatedAt: teachers.updatedAt || new Date().toISOString(),
          __v: teachers.__v || 0,
        };
        setTeacher(teacherData);
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
          <button 
            onClick={() => router.push(`/users/teachers/${teacherId}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            <FiEdit /> Edit
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/3">
            <div className="flex flex-col items-center">
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

                <h3 className="text-lg font-semibold mt-6 mb-2">Assigned Courses</h3>
                <div className="space-y-2">
                  {teacher.assignedCourses && teacher.assignedCourses.length > 0 ? (
                    teacher.assignedCourses.map((courseId) => (
                      <div key={courseId} className="bg-gray-50 p-2 rounded">
                        {courseId} {/* Ideally, fetch course name by ID */}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No courses assigned</p>
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