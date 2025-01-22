"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

const complaints = [
  {
    id: 1,
    author: "John Doe",
    date: "15th August 2024, 03:00 pm",
    profilePhoto: "/img/teacher.jpg",
    complaintImage: "/img/complaint1.jpg",
    message: `The heating system in Classroom A is not functioning properly. It has caused discomfort during lessons.`,
    reactions: { likes: 23, comments: 5 },
  },
  {
    id: 2,
    author: "Jane Smith",
    date: "14th August 2024, 11:45 am",
    profilePhoto: "/img/teacher.jpg",
    complaintImage: "/img/complaint2.jpg",
    message: `The cafeteria food quality has declined significantly. It needs immediate attention.`,
    reactions: { likes: 45, comments: 12 },
  },
];

const Complaints: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    author: "",
    message: "",
    photo: null as File | null,
  });
  const router = useRouter();

  const handleComplaintClick = (id: number) => {
    router.push(`/complaints/${id}`); // Navigate to Complaint Details Page
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewComplaint((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setNewComplaint((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaint.author || !newComplaint.message) {
      alert("All fields are required");
      return;
    }

    console.log("New Complaint Submitted:", newComplaint);
    setIsModalOpen(false);
    setNewComplaint({ author: "", message: "", photo: null }); // Reset form
  };

  return (
    <div className="p-6 bg-gray-100">
      {/* Header */}
      <Header />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Complaints</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700 transition"
        >
          Submit Complaint
        </button>
      </div>

      {/* Complaints List */}
      <div className="space-y-6">
        {complaints.map((complaint) => (
          <div
            key={complaint.id}
            className="bg-white p-6 rounded-md shadow-md flex flex-col gap-4 cursor-pointer hover:bg-gray-50"
            onClick={() => handleComplaintClick(complaint.id)} // Handle click for navigation
          >
            <div className="flex gap-4">
              {/* Profile Photo */}
              <img
                src={complaint.profilePhoto}
                alt={complaint.author}
                className="w-12 h-12 rounded-full object-cover"
              />

              {/* Complaint Content */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold">{complaint.author}</h2>
                    <p className="text-sm text-gray-500">{complaint.date}</p>
                  </div>
                  <div className="text-gray-400 cursor-pointer">•••</div>
                </div>
                <p className="mt-4 text-gray-700 whitespace-pre-line">{complaint.message}</p>
              </div>
            </div>

            {/* Complaint Image */}
            {complaint.complaintImage && (
              <img
                src={complaint.complaintImage}
                alt="Complaint"
                className="w-full h-auto rounded-md object-cover"
              />
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => setIsModalOpen(false)} // Close modal on overlay click
        >
          <div
            className="bg-white rounded-lg w-1/2 shadow-lg"
            onClick={(e) => e.stopPropagation()} // Prevent modal close on content click
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-700">Submit Complaint</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {/* Author Input */}
              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700">
                  Author
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={newComplaint.author}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your name"
                />
              </div>

              {/* Message Input */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Complaint
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={newComplaint.message}
                  onChange={handleInputChange}
                  rows={6}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your complaint"
                ></textarea>
              </div>

              {/* Photo Input */}
              <div>
                <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                  Photo (optional)
                </label>
                <input
                  type="file"
                  id="photo"
                  name="photo"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500"
                />
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700"
              >
                Submit Complaint
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;
