"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

const ComplaintDetailsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const complaintId = searchParams.get("id");

  // Dummy data for complaint details
  const complaint = {
    id: complaintId,
    title: "Complaint about cafeteria food",
    author: "Jane Smith",
    date: "14th August 2024, 11:45 am",
    message: `The cafeteria food quality has declined significantly over the past month. Immediate action is needed to improve the food standards for students.`,
    reactions: { likes: 45, comments: 12 },
    complaintImage: "/img/complaint2.jpg",
  };

  return (
    <div className="p-6 bg-gray-100 h-full">
      {/* Back Button */}
      <button
        className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        onClick={() => router.back()}
      >
        Back
      </button>

      {/* Complaint Details */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-4">{complaint.title}</h1>
        <p className="text-sm text-gray-500 mb-2">{complaint.date}</p>
        <p className="text-lg font-semibold mb-4">By: {complaint.author}</p>
        <p className="text-gray-600 mb-4">{complaint.message}</p>
        {complaint.complaintImage && (
          <img
            src={complaint.complaintImage}
            alt="Complaint"
            className="w-full h-auto rounded-md object-cover"
          />
        )}
      </div>
    </div>
  );
};

export default ComplaintDetailsPage;
