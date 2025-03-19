"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { registerStudent, createStudentProfile, getClasses } from '../app/services/student.service';
import { getSchoolId } from '../app/services/school.service';

interface Class {
  _id: string;
  name: string;
}

const AddStudentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    classId: "",
    gradeLevel: "",
    parentContact: {
      fullName: "",
      phoneNumber: "",
      email: "",
      relationship: ""
    }
  });

  useEffect(() => {
    const fetchClasses = async () => {
      const schoolId = getSchoolId();
      if (!schoolId) {
        toast.error('School ID is required');
        return;
      }
  
      try {
        const classes = await getClasses(); // Ensure this function accepts schoolId
        setClasses(classes);
      } catch (error) {
        console.error('Error fetching classes:', error);
        toast.error('Failed to load classes');
      }
    };
  
    fetchClasses();
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const schoolId = getSchoolId();
      
      if (!schoolId) throw new Error('School ID not found');

      if (currentStep === 0) {
        const registrationData = {
          email: formData.email,
          password: formData.password,
          role: 'student',
          schoolId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber
        };
        const { userId } = await registerStudent(registrationData);
        setUserId(userId);
        setCurrentStep(1);
      } else {
        if (!userId) throw new Error('User ID not found');
        const profileData = {
          userId: userId!, // Ensure userId is properly passed to createStudentProfile
          classId: formData.classId,
          gradeLevel: formData.gradeLevel,
          parentContact: formData.parentContact
        };
        await createStudentProfile(profileData);
        onClose();
        router.push('/students');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'parentContact') return;
    setFormData({ ...formData, [name]: value });
  };

  const handleParentContactChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      parentContact: { ...formData.parentContact, [name]: value }
    });
  };

  const renderPageContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="flex gap-6">
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 text-gray-900"
                value={formData.email}
                onChange={handleInputChange}
              />
              <input
                type="password"
                name="password"
                placeholder="Enter password"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 text-gray-900"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex gap-6">
              <input
                type="text"
                name="firstName"
                placeholder="Enter first name"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 text-gray-900"
                value={formData.firstName}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Enter last name"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 text-gray-900"
                value={formData.lastName}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex gap-6">
              <input
                type="tel"
                name="phoneNumber"
                placeholder="+234XXXXXXX"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 text-gray-900"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="flex gap-6">
              <select
                name="classId"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 text-gray-900"
                value={formData.classId}
                onChange={handleInputChange}
              >
                <option value="">Select Class</option>
                {classes.map((classItem) => (
                  <option key={classItem._id} value={classItem._id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="gradeLevel"
                placeholder="Enter grade level"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 text-gray-900"
                value={formData.gradeLevel}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Parent Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.parentContact.fullName}
                  onChange={handleParentContactChange}
                  placeholder="Enter parent full name"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300 text-gray-900"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Parent Phone Number</label>
                <input
                  type="number"
                  name="phoneNumber"
                  value={formData.parentContact.phoneNumber}
                  onChange={handleParentContactChange}
                  placeholder="Enter parent phone number"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300 text-gray-900"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Parent Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.parentContact.email}
                  onChange={handleParentContactChange}
                  placeholder="Enter parent email address"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300 text-gray-900"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Relationship to Student</label>
                <select
                  name="relationship"
                  value={formData.parentContact.relationship}
                  onChange={handleParentContactChange}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300 text-gray-900"
                >
                  <option value="">Select Relationship</option>
                  <option value="FATHER">Father</option>
                  <option value="MOTHER">Mother</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleBackClick = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div
      id="modal-overlay"
      className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50"
      onClick={(e) => {
        if ((e.target as Element).id === "modal-overlay") {
          onClose();
        }
      }}
    >
      <div className="bg-white h-full w-1/2 rounded-l-lg shadow-lg p-10 space-y-6 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Add Student</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl"
          >
            &times;
          </button>
        </div>
        <p className="text-base text-gray-600">
          Step {currentStep + 1}:{" "}
          {currentStep === 0 ? " Student Registration" : " Student Profile"}
        </p>
        {renderPageContent()}

        <div className="absolute bottom-10 left-0 right-0 px-10">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBackClick}
              className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-400"
              disabled={currentStep === 0}
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="bg-[#154473] text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
              disabled={isLoading}
            >
              {currentStep === 1 ? "Save" : "Next"}
            </button>
          </div>

          <div className="flex justify-center mt-4">
            {[0, 1].map((page) => (
              <div
                key={page}
                className={`h-2 w-2 mx-1 rounded-full ${
                  currentStep === page ? "bg-[#154473]" : "bg-gray-300"
                }`}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudentModal;