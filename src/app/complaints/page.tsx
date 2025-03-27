"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { complaintService } from "@/app/services/complaint.service";
import { getLocalStorageItem } from "../utils/localStorage";
import { User } from "../types/user";
import Toast from '../components/Toast';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newComplaint, setNewComplaint] = useState({
    subject: "",
    description: "",
    attachment: null as File | null,
  });
  const router = useRouter();

  const handleComplaintClick = (ticket: string) => {
    router.push(`/complaints/${ticket}`);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComplaint.subject || !newComplaint.description) {
      toast.error("Subject and description are required");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create complaint
      const complaint = await complaintService.createComplaint({
        subject: newComplaint.subject,
        description: newComplaint.description,
        attachment: "https://cdn.pixabay.com/photo/2023/02/15/10/22/backlinks-7791410_1280.jpg"
      });

      toast.success("Complaint submitted successfully!");
      setIsModalOpen(false);
      setNewComplaint({ subject: "", description: "", attachment: null });
    } catch (error) {
      console.error("Error creating complaint:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100">
      <ToastContainer />
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
            onClick={() => handleComplaintClick(complaint.id.toString())}
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
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-lg w-1/2 shadow-lg"
            onClick={(e) => e.stopPropagation()}
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
              {/* Subject Input */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={newComplaint.subject}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter complaint subject"
                />
              </div>

              {/* Description Input */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={newComplaint.description}
                  onChange={handleInputChange}
                  rows={6}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your complaint in detail"
                ></textarea>
              </div>

              {/* Attachment Input */}
              <div>
                <label htmlFor="attachment" className="block text-sm font-medium text-gray-700">
                  Attachment (optional)
                </label>
                <input
                  type="file"
                  id="attachment"
                  name="attachment"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500"
                />
              </div>

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
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-[#154473] text-white rounded-md transition ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;
