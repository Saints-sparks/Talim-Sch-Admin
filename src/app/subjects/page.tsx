'use client';

import React from "react";
import { useRouter } from "next/navigation";

import { HiPlus, HiTrash } from "react-icons/hi";
import Header from "@/components/Header";

const Subjects: React.FC = () => {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    console.log(`Navigating to: ${path}`); // Debugging statement
    router.push(path); // Navigate to the specified path
  };

  // Sample Subject Data
  const subjects = [
    { id: 1, name: "Mathematics", code: "MATH101", teacher: "Mr. John Doe", enrolled: 45, date: "01 August 2024" },
    { id: 2, name: "English", code: "ENG202", teacher: "Ms. Jane Smith", enrolled: 40, date: "01 August 2024" },
    { id: 3, name: "Biology", code: "BIO301", teacher: "Dr. Sarah Connor", enrolled: 35, date: "01 August 2024" },
    { id: 4, name: "Physics", code: "PHY101", teacher: "Mr. Alan Turing", enrolled: 50, date: "01 August 2024" },
    { id: 5, name: "Chemistry", code: "CHEM201", teacher: "Dr. Marie Curie", enrolled: 30, date: "01 August 2024" },
    { id: 6, name: "History", code: "HIST302", teacher: "Ms. Emily Bronte", enrolled: 20, date: "01 August 2024" },
    { id: 7, name: "Geography", code: "GEO101", teacher: "Mr. Marco Polo", enrolled: 25, date: "01 August 2024" },
  ];

  return (
    <div className="p-6 space-y-1 bg-[#F8F8F8]">
      {/* Header */}
      <Header user={"Administrator"} tent={"Subject Management"} />

      {/* Add Subject Button */}
      <div className="flex justify-between items-center mb-6 p-6">
        <h1 className="text-2xl font-semibold">Manage all subjects in the Learning Management System</h1>
        <button
          className="px-4 py-2 bg-[#154473] text-white rounded flex items-center"
          onClick={() => handleNavigate("/add-subject")}
        >
          <HiPlus className="w-5 h-5 mr-2" />
          Add Subject
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">S/N</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Subject Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Subject Code</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Teacher</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Enrolled Students</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Created Date</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject, index) => (
              <tr key={subject.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-3 text-gray-800 text-sm">{index + 1}</td>
                <td className="px-6 py-3 text-gray-800 text-sm">{subject.name}</td>
                <td className="px-6 py-3 text-gray-800 text-sm">{subject.code}</td>
                <td className="px-6 py-3 text-gray-800 text-sm">{subject.teacher}</td>
                <td className="px-6 py-3 text-gray-800 text-sm">{subject.enrolled}</td>
                <td className="px-6 py-3 text-gray-800 text-sm">{subject.date}</td>
                <td className="px-6 py-3">
                  <button className="text-red-500 hover:text-red-700">
                    <HiTrash className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Subjects;
