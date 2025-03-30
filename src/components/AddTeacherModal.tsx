'use client'

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, Flip, ToastContainer } from 'react-toastify'
import { registerTeacher, createTeacherProfile } from '../app/services/teacher.service';
import { getClasses } from '../app/services/student.service';
import { getSchoolId } from '../app/services/school.service';

interface Class {
  _id: string;
  name: string;
}

const ACADEMIC_QUALIFICATIONS = [
  "Graduate",
  "Postgraduate",
  "Doctorate",
  "Other"
] as const;

const EMPLOYMENT_TYPES = [
  "Fulltime",
  "Parttime",
] as const;

const EMPLOYMENT_ROLES = [
  "Academic",
] as const;

const AddTeacherModal: React.FC<{
  onClose: () => void;
  onSuccess?: () => Promise<void>;
}> = ({ onClose, onSuccess }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [formData, setFormData] = useState({
    // Step 0: Registration data
    email: "",
    password: "defaultPassword", // Consider generating a random temp password
    firstName: "",
    lastName: "",
    phoneNumber: "",
    
    // Step 1: Personal details
    dateOfBirth: "",
    gender: "",
    highestAcademicQualification: "Graduate",
    yearsOfExperience: 0,
    specialization: "",
    
    // Step 2: Employment details
    employmentType: "Fulltime",
    employmentRole: "Academic",
    availabilityDays: [] as string[],
    availableTime: "",
    isFormTeacher: false,
    assignedClasses: [] as string[],
    assignedCourses: [] as string[],
  });

  useEffect(() => {
    const fetchClasses = async () => {
      const schoolId = getSchoolId();
      if (!schoolId) {
        toast.error('School ID is required');
        return;
      }

      try {
        const classes = await getClasses();
        setClasses(classes);
      } catch (error) {
        console.log('Error fetching classes:', error);
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
        // First step - register the teacher
        const registrationData = {
          email: formData.email,
          password: formData.password,
          role: 'teacher',
          schoolId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber
        };
        const { userId } = await registerTeacher(registrationData);
        if(userId) {
          console.log("Created user Id: " + userId);
          toast.success("Teacher account created successfully");
        }
        setUserId(userId);
        setCurrentStep(1);
      } else if (currentStep === 1) {
        // Move to next step without submitting
        setCurrentStep(2);
      } else {
        // Final step - create teacher profile
        if (!userId) throw new Error('User ID not found');
        
        const profileData = {
          userId,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          highestAcademicQualification: formData.highestAcademicQualification,
          yearsOfExperience: formData.yearsOfExperience,
          specialization: formData.specialization,
          employmentType: formData.employmentType,
          employmentRole: formData.employmentRole,
          availabilityDays: formData.availabilityDays,
          availableTime: formData.availableTime,
          isFormTeacher: formData.isFormTeacher,
          assignedClasses: formData.assignedClasses,
          assignedCourses: formData.assignedCourses
        };
        
        await createTeacherProfile(userId, profileData);
        toast.success("Teacher Profile created successfully");
        router.push('/users/teachers');
        if (onSuccess) await onSuccess();

      }
 
    } catch (error) {
      console.log('Error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter(option => option.selected)
      .map(option => option.value);
    
    setFormData({ ...formData, [name]: selectedValues });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="flex gap-6">
              <input
                type="text"
                name="firstName"
                placeholder="Enter first name"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Enter last name"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="flex gap-6">
              <input
                type="tel"
                name="phoneNumber"
                placeholder="+234XXXXXXX"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
              />
              <input
                type="email"
                name="email"
                placeholder="example@gmail.com"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
          <div className="flex gap-6">
            <input
              type="date"
              name="dateOfBirth"
              className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              required
            />
            <select
              name="gender"
              className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
              value={formData.gender}
              onChange={handleInputChange}
              required
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="flex gap-6">
              <input
                type="date"
                name="dateOfBirth"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
              />
              <select
                name="gender"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex gap-6">
              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-2">
                  Highest Academic Qualification
                </label>
                <select
                  name="highestAcademicQualification"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.highestAcademicQualification}
                  onChange={handleInputChange}
                >
                  {ACADEMIC_QUALIFICATIONS.map(qualification => (
                    <option key={qualification} value={qualification}>
                      {qualification}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-2">
                  Years of Experience
                </label>
                <select
                  name="yearsOfExperience"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.yearsOfExperience}
                  onChange={handleInputChange}
                >
                  <option value={0}>Select years</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(year => (
                    <option key={year} value={year}>{year} {year === 1 ? 'year' : 'years'}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Specialization
              </label>
              <input
                type="text"
                name="specialization"
                placeholder="Enter specialization"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
                value={formData.specialization}
                onChange={handleInputChange}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex gap-6">
            <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-2">
                  Employment Type
                </label>
                <select
                  name="employmentType"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.employmentType}
                  onChange={handleInputChange}
                >
                  {EMPLOYMENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-2">
                  Employment Role
                </label>
                <select
                  name="employmentRole"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.employmentRole}
                  onChange={handleInputChange}
                >
                  {EMPLOYMENT_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-2">
                  Subject to Teach
                </label>
                <select
                  name="assignedCourses"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.assignedCourses[0] || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Select Subject</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="English">English</option>
                  <option value="Science">Science</option>
                  <option value="History">History</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-2">
                  Assign Teacher To Class
                </label>
                <select
                  name="assignedClasses"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.assignedClasses[0] || ""}
                  onChange={handleInputChange}
                >
                  <option value="">Select Class</option>
                  {classes.map((classItem) => (
                    <option key={classItem._id} value={classItem._id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-2">
                  Availability Days
                </label>
                <select
                  name="availabilityDays"
                  multiple
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.availabilityDays}
                  onChange={handleMultiSelectChange}
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-2">
                  Available Time
                </label>
                <select
                  name="availableTime"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.availableTime}
                  onChange={handleInputChange}
                >
                  <option value="">Select Time</option>
                  <option value="8:00 AM - 2:00 PM">8:00 AM - 2:00 PM</option>
                  <option value="9:00 AM - 3:00 PM">9:00 AM - 3:00 PM</option>
                  <option value="10:00 AM - 4:00 PM">10:00 AM - 4:00 PM</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isFormTeacher"
                id="isFormTeacher"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.isFormTeacher}
                onChange={handleCheckboxChange}
              />
              <label htmlFor="isFormTeacher" className="ml-2 block text-gray-700">
                This teacher is a form teacher
              </label>
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

  const getStepLabel = () => {
    switch (currentStep) {
      case 0: return "Basic Information";
      case 1: return "Qualifications";
      case 2: return "Employment Details";
      default: return "";
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
          <h2 className="text-2xl font-bold text-gray-800">Add Teacher</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl"
          >
            &times;
          </button>
        </div>
        <p className="text-base text-gray-600">
          Step {currentStep + 1} of 3: {getStepLabel()}
        </p>
        {renderStepContent()}

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
              {currentStep === 2 ? "Save" : "Next"}
            </button>
          </div>

          <div className="flex justify-center mt-4">
            {[0, 1, 2].map((step) => (
              <div
                key={step}
                className={`h-2 w-2 mx-1 rounded-full ${
                  currentStep === step ? "bg-[#154473]" : "bg-gray-300"
                }`}
              ></div>
            ))}
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={5000} transition={Flip} />
    </div>
  );
};

export default AddTeacherModal;