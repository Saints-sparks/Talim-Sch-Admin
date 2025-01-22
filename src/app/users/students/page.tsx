'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import StudentGrid from "@/components/StudentGrid";
import AddStudentModal from "@/components/AddStudentModal";

const Users = () => {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // const handleNext = () => {
  //   router.push('/qualifications')
   
  // };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <Header />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Students</h1>
        <button
          onClick={toggleModal}
          className="bg-[#154473] text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Student
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <StudentGrid />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50">
          <div className="bg-white h-full w-1/2 rounded-l-lg shadow-lg p-6">
            <AddStudentModal onNext={toggleModal} onClose={toggleModal} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
