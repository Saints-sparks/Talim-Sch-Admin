"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AddStudentModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState<number>(0);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const [studentId, setStudentId] = useState<string | null>(null); // Store the student's ID
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    fullName: "",
    parentName: "",
    phoneNumber: "",
    email: "",
    class: "",
    subject: "",
    emailAddress: "",
    dateOfBirth: "",
    relationship: "",
    gender: "",
    qualification: "",
    experience: "",
    specialization: "",
    certification: "",
    achievements: "",
    teacher: "",
    availability: "",
    arrivalTime: "",

  });

  const handleSubmit = async () => {
    try {
      let endpoint = "";
      let method = "POST";
      let body = {};

      switch (currentPage) {
        case 0:
          // Step 1: Create the student
          endpoint = `${baseUrl}/students`;
          method = "POST";
          body = {
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber,
            email: formData.email,
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
          };
          break;

        case 1:
          // Step 2: Add parent/guardian information
          endpoint = `${baseUrl}/students/${studentId}/parent`;
          method = "POST";
          body = {
            parentName: formData.parentName,
            phoneNumber: formData.phoneNumber,
            emailAddress: formData.emailAddress,
            relationship: formData.relationship,
          };
          break;

        case 2:
          // Step 3: Add academic information
          endpoint = `${baseUrl}/students/${studentId}/academic`;
          method = "POST";
          body = {
            class: formData.class,
            subject: formData.subject,
          };
          break;

        case 3:
          // Step 4: Assign teacher to class and subject
          endpoint = `${baseUrl}/students/${studentId}/assign-teacher`;
          method = "POST";
          body = {
            class: formData.class,
            subject: formData.subject,
            teacher: formData.teacher,
          };
          break;

        case 4:
          // Step 5: Set teacher availability
          endpoint = `${baseUrl}/students/${studentId}/availability`;
          method = "POST";
          body = {
            availability: formData.availability,
            arrivalTime: formData.arrivalTime,
          };
          break;

        default:
          throw new Error("Invalid step");
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Failed to save step ${currentPage + 1}`);
      }

      const data = await response.json();

      if (currentPage === 0) {
        // Save the student's ID after the first step
        setStudentId(data.id);
      }

      toast.success(`Step ${currentPage + 1} saved successfully`, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Flip,
      });

      if (currentPage === 4) {
        // Final step: Close the modal and redirect
        onClose();
        router.push("/teacher-profile");
      } else {
        // Move to the next step
        setCurrentPage((prev) => prev + 1);
      }
    } catch (error) {
      
      console.error(`Error saving step ${currentPage + 1}:`, error);
      toast.error(`Failed to save step ${currentPage + 1}`, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Flip,
      });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    if ((e.target as Element).id === "modal-overlay") {
      onClose();
    }
  };

  const renderPageContent = () => {
    switch (currentPage) {
      case 0:
        return (
          <div className="space-y-6">
            <ToastContainer />
            <div className="flex gap-6">
              <input
                type="text"
                name="firstName"
                placeholder="Enter first name"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
                value={formData.firstName}
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Enter last name"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
                value={formData.lastName}
                onChange={handleInputChange}
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
              />
              <input
                type="email"
                name="email"
                placeholder="example@gmail.com"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex gap-6">
              <input
                type="date"
                name="dateOfBirth"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
              />
              <select
                name="gender"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
                value={formData.gender}
                onChange={handleInputChange}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Full Name</label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Phone Number</label>
                <input
                  type="number"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Email Address</label>
                <input
                  type="email"
                  name="emailAddress"
                  value={formData.emailAddress}
                  onChange={handleInputChange}
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Relationship to Student</label>
                <select
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
                >
                  <option value="">Select Relationship</option>
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="flex gap-6">
              <input
                type="text"
                name="class"
                placeholder="Enter Class"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
                value={formData.class}
                onChange={handleInputChange}
              />
              <select
                name="subject"
                className="w-1/2 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400"
                value={formData.subject}
                onChange={handleInputChange}
              >
                <option value="">Select Subject</option>
                <option value="Mathematics">Mathematics</option>
                <option value="English">English</option>
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-2">
                  Subject to Teach
                </label>
                <select
                  name="subject"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.subject}
                  onChange={handleInputChange}
                >
                  <option value="" disabled>
                    Select Subject
                  </option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="English">English</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-2">
                  Assign Teacher To Class
                </label>
                <select
                  name="class"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.class}
                  onChange={handleInputChange}
                >
                  <option value="" disabled>
                    Select Class
                  </option>
                  <option value="JSS 1">JSS 1</option>
                  <option value="JSS 2">JSS 2</option>
                  <option value="JSS 3">JSS 3</option>
                  <option value="SS 1">SS 1</option>
                </select>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-gray-700 font-semibold mb-2">
                Class Teacher Assignment
              </label>
              <select
                name="teacher"
                className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" disabled>
                  Select Teacher
                </option>
                <option value="Mr James Saunders">Mr James Saunders</option>
                <option value="Mrs Lilian Ayo">Mrs Lilian Ayo</option>
                <option value="Miss Deborah Chuka">Miss Deborah Chuka</option>
              </select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-2">
                  Availability
                </label>
                <select
                  name="availability"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Available Days
                  </option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-gray-700 font-semibold mb-2">
                  Arrival Time (Optional)
                </label>
                <select
                  name="arrivalTime"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>
                    Select Time
                  </option>
                  <option value="8:00 AM">8:00 AM</option>
                  <option value="8:30 AM">8:30 AM</option>
                  <option value="9:00 AM">9:00 AM</option>
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      id="modal-overlay"
      className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50"
      onClick={handleOutsideClick}
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
          Step {currentPage + 1}:{" "}
          {currentPage === 0
            ? " Student Personal Details"
            : currentPage === 1
            ? " Parent/Guardian Information"
            : currentPage === 2
            ? " Academic Information"
            : currentPage === 3
            ? " Assign Teacher to a class & a subject"
            : " Set Teacher Availability"}
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
            <button
              onClick={handleSubmit}
              className="bg-[#154473] text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              {currentPage === 4 ? "Save" : "Next"}
            </button>
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
  );
};

export default AddStudentModal;