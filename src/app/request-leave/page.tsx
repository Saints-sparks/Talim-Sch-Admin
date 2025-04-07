"use client";

import React from "react";
import Header from "@/components/Header";
import { useRouter } from "next/navigation";

const RequestLeavePage: React.FC = () => {
    const router = useRouter()

  const handleApprove = () => {
    alert("Leave request approved!");
    router.push("/request-approved")
  };

  const handleReject = () => {
    alert("Leave request rejected!");
  };

  return (
    <div className="p-6 bg-gray-100 h-full">
        <Header user="Administrator" title="Request Leave" />
      {/* Page Title */}
      <h1 className="text-2xl font-semibold mb-6">Student Request Leave</h1>

      {/* Card */}
      <div className="bg-white shadow-md rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <img
            src="/img/student.jpg" // Example student profile image
            alt="Sarah Johnson"
            className="w-16 h-16 rounded-full object-cover mr-4"
          />
          <div>
            <h2 className="text-lg font-semibold">Sarah Johnson</h2>
            <span className="text-sm text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
              Pending
            </span>
          </div>
        </div>

        {/* Request Details */}
        <div className="border rounded-md p-4">
          <div className="flex justify-left  items-center mb-4">
            <span className="text-sm font-medium text-gray-500">Grade:</span>
            <span className="text-sm px-4 text-gray-800">Grade 8</span>
          </div>
          <div className="flex justify-left  items-center mb-4">
            <span className="text-sm font-medium text-gray-500">Parent:</span>
            <span className="text-sm px-4 text-gray-800">Michael Johnson</span>
          </div>
          <div className="flex justify-left  items-center mb-4">
            <span className="text-sm font-medium text-gray-500">Date:</span>
            <span className="text-sm px-4 text-gray-800">10/01/2025 - 12/01/2025</span>
          </div>
          <div className="flex justify-left  items-start">
            <span className="text-sm font-medium text-gray-500">Description:</span>
            <span className="text-sm px-4 text-gray-800">Family wedding</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={handleReject}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-red-700 hover:text-white transition"
          >
            Reject
          </button>
          <button
            onClick={handleApprove}
            className="px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-gray-700 transition"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestLeavePage;
