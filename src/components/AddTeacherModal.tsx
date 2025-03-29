'use client'

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast, Flip, ToastContainer } from 'react-toastify'
import { usePageIndicator } from "@/app/context/PageIndicatorContext";
import { registerTeacher, createTeacherProfile } from '../app/services/teacher.service';
import { getClasses } from '../app/services/student.service';
import { getSchoolId } from '../app/services/school.service';

interface Class {
  _id: string;
  name: string;
}

const AddTeacherModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "defaultPassword", // Consider making this configurable or removing it
    firstName: "",
    lastName: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    highestAcademicQualification: "",
    yearsOfExperience: 0,
    specialization: "",
    employmentType: "",
    employmentRole: "",
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
        setUserId(userId);
        setCurrentStep(1);
      } else {
        if (!userId) throw new Error('User ID not found');
        const profileData = {
          userId: userId,
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
        await createTeacherProfile(profileData);
        onClose();
        router.push('/teachers');
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

  const handleOutsideClick = (e: React.MouseEvent) => {
    if ((e.target as Element).id === "modal-overlay") {
      onClose();
    }
  };

  const renderPageContent = () => {
    if (currentPage === 0) {
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
    }

    if (currentPage === 1) {
      return (
        <div className="space-y-6">
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
                required
              >
                <option value="">Select Qualification</option>
                <option value="Bachelors">Bachelors Degree</option>
                <option value="Masters">Masters Degree</option>
                <option value="PhD">PhD</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-gray-700 font-semibold mb-2">
                Years of Teaching Experience
              </label>
              <select
                name="yearsOfExperience"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.yearsOfExperience}
                onChange={handleInputChange}
                required
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
              Specialization/Subject Experience
            </label>
            <input
              type="text"
              name="specialization"
              placeholder="Enter specialization"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
              value={formData.specialization}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
      );
    }

    if (currentPage === 2) {
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
                required
              >
                <option value="">Select Employment Type</option>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Contract">Contract</option>
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
                required
              >
                <option value="">Select Role</option>
                <option value="Class Teacher">Class Teacher</option>
                <option value="Subject Teacher">Subject Teacher</option>
                <option value="Head of Department">Head of Department</option>
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
    }

    if (currentPage === 3) {
      return (
        <div className="space-y-6">
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
                required
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
                required
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
        </div>
      );
    }

    if (currentPage === 4) {
      return (
        <div className="space-y-6">
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
        </div>
      );
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} transition={Flip} />
      <div
        id="modal-overlay"
        className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50"
        onClick={handleOutsideClick}
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
            Step {currentPage + 1}: 
            {currentPage === 0 ? " Teacher's Personal Details" :
            currentPage === 1 ? " Teacher's Qualifications & Experience" :
            currentPage === 2 ? " Teacher's Employment Details" :
            currentPage === 3 ? " Assign Teacher to a class & a subject" :
            " Set Teacher Availability"}        
          </p>
          {renderPageContent()}

          <div className="absolute bottom-10 left-0 right-0 px-10">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 0))}
                className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-400"
                disabled={currentPage === 0}
              >
                Back
              </button>
              {currentPage === 4 ? (
                <button
                  onClick={handleSubmit}
                  className="bg-[#154473] text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentPage((prev: number) => prev + 1)}
                  className="bg-[#154473] text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
                >
                  Next
                </button>
              )}
            </div>

            <div className="flex justify-center mt-4">
              {[0, 1, 2, 3, 4].map((page) => (
                <div
                  key={page}
                  className={`h-2 w-2 mx-1 rounded-full ${
                    currentPage === page ? "bg-[#154473]" : "bg-gray-300"
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddTeacherModal;














// 'use client'

// import React, { useState } from "react";
// import { useRouter } from "next/navigation";
// import { usePageIndicator } from "@/app/context/PageIndicatorContext";

// const AddTeacherModal: React.FC<{ onClose: () => void, onNext: () => void; }> = ({ onClose, onNext }) => {
//   const router = useRouter();
//   const [currentPage, setCurrentPage] = useState<number>(0); 
//   const [formData, setFormData] = useState({
//     firstName: "",
//     lastName: "",
//     phoneNumber: "",
//     email: "",
//     dateOfBirth: "",
//     gender: "",
//     qualification: "",
//     experience: "",
//     specialization: "",
//     certification: "",
//     achievements: "",
//   });

//   const handleInputChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
//   ) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   const handleSubmit = () => {
//     console.log("Form Data:", formData);
//     onClose(); // Close the modal after saving
//     router.push('/teacher-profile')
//   };

//   const handleOutsideClick = (e: React.MouseEvent) => {
//     if ((e.target as Element).id === "modal-overlay") {
//       onClose();
//     }
//   };

//   const renderPageContent = () => {
//     if (currentPage === 0) {
//       return (
//         <div className="space-y-6">
//           <div className="flex gap-6">
//             <input
//               type="text"
//               name="firstName"
//               placeholder="Enter first name"
//               className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
//               value={formData.firstName}
//               onChange={handleInputChange}
//             />
//             <input
//               type="text"
//               name="lastName"
//               placeholder="Enter last name"
//               className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
//               value={formData.lastName}
//               onChange={handleInputChange}
//             />
//           </div>

//           <div className="flex gap-6">
//             <input
//               type="tel"
//               name="phoneNumber"
//               placeholder="+234XXXXXXX"
//               className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
//               value={formData.phoneNumber}
//               onChange={handleInputChange}
//             />
//             <input
//               type="email"
//               name="email"
//               placeholder="example@gmail.com"
//               className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
//               value={formData.email}
//               onChange={handleInputChange}
//             />
//           </div>

//           <div className="flex gap-6">
//             <input
//               type="date"
//               name="dateOfBirth"
//               className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
//               value={formData.dateOfBirth}
//               onChange={handleInputChange}
//             />
//             <select
//               name="gender"
//               className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
//               value={formData.gender}
//               onChange={handleInputChange}
//             >
//               <option value="">Select gender</option>
//               <option value="Male">Male</option>
//               <option value="Female">Female</option>
//             </select>
//           </div>
//         </div>
//       );
//     }

//     if (currentPage === 1) {
//       return (
//         <div className="space-y-6">
//           <div className="flex gap-6">
//             <div className="flex-1">
//               <label className="block text-gray-700 font-semibold mb-2">
//                 Employment Type
//               </label>
//               <select
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="" disabled selected>
//                   Select an Employment Type
//                 </option>
//                 <option value="Part-Time">Part-Time</option>
//                 <option value="Full-Time">Full-Time</option>
//               </select>
//             </div>

//             <div className="flex-1">
//               <label className="block text-gray-700 font-semibold mb-2">
//                 Years of Teaching Experience
//               </label>
//               <select
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="" disabled selected>
//                   Number of Years Experience
//                 </option>
//                 <option value="1">1</option>
//                 <option value="2">2</option>
//                 <option value="3">3</option>
//                 <option value="4">4</option>
//                 <option value="5">5</option>
//               </select>
//             </div>
//           </div>

//           <label className="block text-gray-700 font-semibold mb-2">
//             Specialization/Subject Experience
//           </label>
//           <input
//             type="text"
//             name="specialization"
//             placeholder="Enter specialization"
//             className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
//             value={formData.specialization}
//             onChange={handleInputChange}
//           />
//         </div>
//       );
//     }

//     if (currentPage === 2) {
//       return (
//         <div className="space-y-6">
//           <div className="flex gap-6">
//             <div className="flex-1">
//               <label className="block text-gray-700 font-semibold mb-2">
//                 Employment Type
//               </label>
//               <select
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="" disabled selected>
//                   Select an Employment Type
//                 </option>
//                 <option value="Part-Time">Part-Time</option>
//                 <option value="Full-Time">Full-Time</option>
//               </select>
//             </div>

//             <div className="flex-1">
//               <label className="block text-gray-700 font-semibold mb-2">
//                 Classroom Role
//               </label>
//               <select
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="" disabled selected>
//                   Select Role
//                 </option>
//                 <option value="Teacher 1">Teacher 1</option>
//                 <option value="Teacher 2">Teacher 2</option>
//               </select>
//             </div>
//           </div>
//         </div>
//       );
//     }

//     if (currentPage === 3) {
//       return (
//         <div className="space-y-6">
//           <div className="flex gap-6">
//             <div className="flex-1">
//               <label className="block text-gray-700 font-semibold mb-2">
//                 Subject to Teach
//               </label>
//               <select
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="" disabled selected>
//                   Select Subject
//                 </option>
//                 <option value="Mathematics">Mathematics</option>
//                 <option value="English">English</option>
//               </select>
//             </div>

//             <div className="flex-1">
//               <label className="block text-gray-700 font-semibold mb-2">
//                 Assign Teacher To Class
//               </label>
//               <select
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="" disabled selected>
//                   Select Class
//                 </option>
//                 <option value="JSS 1">JSS 1</option>
//                 <option value="JSS 2">JSS 2</option>
//                 <option value="JSS 3">JSS 3</option>
//                 <option value="SS 1">SS 1</option>
//               </select>
//             </div>
//           </div>

//           <div className="flex-1">
//             <label className="block text-gray-700 font-semibold mb-2">
//               Class Teacher Assignment
//             </label>
//             <select
//               className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="" disabled selected>
//                 Select Teacher
//               </option>
//               <option value="Mr James Saunders">Mr James Saunders</option>
//               <option value="Mrs Lilian Ayo">Mrs Lilian Ayo</option>
//               <option value="Miss Deborah Chuka">Miss Deborah Chuka</option>
//             </select>
//           </div>
//         </div>
//       );
//     }

//     if (currentPage === 4) {
//       return (
//         <div className="space-y-6">
//           <div className="flex gap-6">
//             <div className="flex-1">
//               <label className="block text-gray-700 font-semibold mb-2">
//                 Availability
//               </label>
//               <select
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="" disabled selected>
//                   Available Days
//                 </option>
//                 <option value="Monday">Monday</option>
//                 <option value="Tuesday">Tuesday</option>
//                 <option value="Wednesday">Wednesday</option>
//                 <option value="Thursday">Thursday</option>
//                 <option value="Friday">Friday</option>
//               </select>
//             </div>

//             <div className="flex-1">
//               <label className="block text-gray-700 font-semibold mb-2">
//                 Arrival Time (Optional)
//               </label>
//               <select
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="" disabled selected>
//                   Select Time
//                 </option>
//                 <option value="8:00 AM">8:00 AM</option>
//                 <option value="8:30 AM">8:30 AM</option>
//                 <option value="9:00 AM">9:00 AM</option>
//               </select>
//             </div>
//           </div>
//         </div>
//       );
//     }
//   };

//   return (
//     <div
//       id="modal-overlay"
//       className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50"
//       onClick={handleOutsideClick}
//     >
//       <div className="bg-white h-full w-1/2 rounded-l-lg shadow-lg p-10 space-y-6 relative">
//         <div className="flex justify-between items-center mb-6">
//           <h2 className="text-2xl font-bold text-gray-800">Add Teacher</h2>
//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-800 text-xl"
//           >
//             &times;
//           </button>
//         </div>
//         <p className="text-base text-gray-600">
//           Step {currentPage + 1}: 
//           {currentPage === 0 ? " Teacher's Personal Details" :
//           currentPage === 1 ? " Teacher's Qualifications & Experience" :
//           currentPage === 2 ? " Teacher's Employment Details" :
//           currentPage === 3 ? " Assign Teacher to a class & a subject" :
//           " Set Teacher Availability"}        
//         </p>
//         {renderPageContent()}

//         <div className="absolute bottom-10 left-0 right-0 px-10">
//           <div className="flex justify-between items-center">
//             <button
//               onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 0))}
//               className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-400"
//               disabled={currentPage === 0}
//             >
//               Back
//             </button>
//             {currentPage === 4 ? (
//               <button
//                 onClick={handleSubmit}
//                 className="bg-[#154473] text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
//               >
//                 Save
//               </button>
//             ) : (
//               <button
//                 onClick={() => setCurrentPage((prev: number) => prev + 1)}
//                 className="bg-[#154473] text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
//               >
//                 Next
//               </button>
//             )}
//           </div>

//           <div className="flex justify-center mt-4">
//             {[0, 1, 2, 3, 4].map((page) => (
//               <div
//                 key={page}
//                 className={`h-2 w-2 mx-1 rounded-full ${
//                   currentPage === page ? "bg-[#154473]" : "bg-gray-300"
//                 }`}
//               ></div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddTeacherModal;
