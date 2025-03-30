'use client';

import React, { useState, useEffect } from 'react';
import { FiUpload, FiEdit2, FiSave } from 'react-icons/fi';
import { studentService } from '@/app/services/student.service';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import {toast, Flip} from 'react-toastify'

const StudentProfile = () => {
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const params = useParams();
  const studentId = params.id;
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const student = await studentService.getStudentById(studentId);
        console.log("Student: " + student)
        
        // Map the response to your frontend structure
        setProfileData({
          // Personal Details
        //   firstName: student.userId?.firstName || '',
          lastName: student.userId?.lastName || '',
          phoneNumber: student.userId?.phoneNumber || '',
          email: student.userId?.email || '',
          dateOfBirth: student.dateOfBirth || '',
          gender: student.gender || '',
          profileImage: student.userId?.userAvatar || '',
  
          // Parent/Guardian Information
          parentName: student.parentContact?.fullName || '',
          parentPhone: student.parentContact?.phoneNumber || '',
          parentEmail: student.parentContact?.email || '',
          relationship: student.parentContact?.relationship || '',
          parentAddress: student.address || '',
  
          // Academic Information
          studentId: student._id || '',
          className: student.classId?.name || '',
          enrollmentDate: student.enrollmentDate || '',
          subjects: student.assignedSubjects || [],
          attendance: student.attendance || ''
        });
        
      } catch (err) {
        setError(err.message);
        // Optionally redirect if student not found
        if (err.message.includes('not found')) {
          router.push('/students');
        }
      } finally {
        setIsLoading(false);
      }
    };
  
    if (studentId) {
      fetchStudentData();
    }
  }, [studentId]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setEditMode(false);
    // API save logic would go here
  };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }
    
    if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
    if (!profileData) return <div className="text-center py-8">No student data found</div>;

    switch (activeTab) {
      case 'personal':
        return (
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="mb-6">
              <h3 className="text-md font-medium text-gray-700 mb-3">Profile Picture</h3>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {profileData.profileImage ? (
                    <img src={profileData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-400 text-xl">
                      {profileData.firstName?.charAt(0)}{profileData.lastName?.charAt(0)}
                    </span>
                  )}
                </div>
                <label className="cursor-pointer">
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          setProfileData(prev => ({ ...prev, profileImage: event.target.result }));
                        };
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100">
                    <FiUpload /> Upload Photo
                  </div>
                </label>
              </div>
            </div>

            {/* Personal Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'First Name', name: 'firstName', type: 'text', placeholder: 'Enter first name' },
                { label: 'Last Name', name: 'lastName', type: 'text', placeholder: 'Enter last name' },
                { label: 'Phone Number', name: 'phoneNumber', type: 'tel', placeholder: 'e.g +2345255364' },
                { label: 'Email Address', name: 'email', type: 'email', placeholder: 'e.g 123@gmail.com' },
                { label: 'Date of Birth', name: 'dateOfBirth', type: 'text', placeholder: 'DD.MM.YYYY' },
                { 
                  label: 'Gender', 
                  name: 'gender', 
                  type: 'select',
                  options: ['Male', 'Female', 'Other', 'October'] 
                }
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  {editMode ? (
                    field.type === 'select' ? (
                      <select
                        name={field.name}
                        value={profileData[field.name] || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        {field.options.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        value={profileData[field.name] || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder={field.placeholder}
                      />
                    )
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-md">
                      {profileData[field.name] || 'Not specified'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'parent':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Full Name', name: 'parentName', type: 'text' },
                { label: 'Phone Number', name: 'parentPhone', type: 'tel' },
                { label: 'Email Address', name: 'parentEmail', type: 'email' },
                { label: 'Relationship', name: 'relationship', type: 'text' },
                { label: 'Address', name: 'parentAddress', type: 'text', colSpan: 'md:col-span-2' }
              ].map((field) => (
                <div key={field.name} className={field.colSpan || ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  {editMode ? (
                    <input
                      type={field.type}
                      name={field.name}
                      value={profileData[field.name] || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-md">
                      {profileData[field.name] || 'Not specified'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'academic':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { label: 'Student ID', name: 'studentId', type: 'text' },
                { label: 'Class', name: 'className', type: 'text' },
                { label: 'Enrollment Date', name: 'enrollmentDate', type: 'text' },
                { label: 'Attendance', name: 'attendance', type: 'text' },
                { 
                  label: 'Subjects', 
                  name: 'subjects', 
                  type: 'text',
                  display: Array.isArray(profileData.subjects) ? profileData.subjects.join(', ') : ''
                }
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  {editMode ? (
                    <input
                      type={field.type}
                      name={field.name}
                      value={field.display || profileData[field.name] || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="px-4 py-2 bg-gray-50 rounded-md">
                      {field.display || profileData[field.name] || 'Not specified'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user="Administrator" title="Student Profile" />
      
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
        {/* Edit/Save Button */}
        {!isLoading && !error && profileData && (
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
                <FiEdit2 /> Edit
              </button>
            )}
          </div>
        )}

        {/* Horizontal Tabs */}
        {!isLoading && !error && profileData && (
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'personal', label: 'Personal Details' },
                { id: 'parent', label: 'Parent/Guardian' },
                { id: 'academic', label: 'Academic Information' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-4">
          {renderTabContent()}
        </div>

        {/* Footer */}
        {!isLoading && !error && profileData && (
          <div className="mt-10 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                <p className="text-lg font-semibold text-gray-800">
                  {profileData.firstName} {profileData.lastName}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                Student ID: {profileData.studentId}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;