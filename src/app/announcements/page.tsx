"use client";

// components/Announcement.tsx
import React, { useState } from "react";
import Header from "@/components/Header";

const announcements = [
  {
    id: 1,
    author: "MR. Adeyemo Isaac",
    date: "26th April 2024, 09:00 pm",
    profilePhoto: "/img/teacher.jpg",
    announcementImage: "/img/announcement.jpg",
    message: `Dear Students, Teachers, and Parents,
    
    We are pleased to inform you that the Mid-Term Examinations for Greenfield International Secondary School will begin on Monday, 15th January 2024, and conclude on Friday, 19th January 2024.
    
    All students are required to be present in school and prepared for their respective exams. Detailed examination timetables have been attached for your convenience. Please ensure punctuality and adherence to the school rules during the examination period.
    
    Should you have any questions or require clarification, feel free to contact the school administration.
    
    Thank you for your cooperation.`,
    reactions: { likes: 99, comments: 10 },
  },
  {
    id: 2,
    author: "MR. Adeyemo Isaac",
    date: "26th April 2024, 09:00 pm",
    profilePhoto: "/img/teacher.jpg",
    announcementImage: "/img/announcement1.jpg",
    message: `Dear Students, Teachers, and Parents,
    
    We are pleased to inform you that the Mid-Term Examinations for Greenfield International Secondary School will begin on Monday, 15th January 2024, and conclude on Friday, 19th January 2024.
    
    All students are required to be present in school and prepared for their respective exams. Detailed examination timetables have been attached for your convenience. Please ensure punctuality and adherence to the school rules during the examination period.
    
    Should you have any questions or require clarification, feel free to contact the school administration.
    
    Thank you for your cooperation.`,
    reactions: { likes: 99, comments: 10 },
  },
];

const Announcement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    author: "",
    message: "",
    photo: null as File | null,
    video: null as File | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewAnnouncement((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setNewAnnouncement((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.author || !newAnnouncement.message) {
      alert("All fields are required");
      return;
    }

    console.log("New Announcement:", newAnnouncement);
    setIsModalOpen(false);
    setNewAnnouncement({ author: "", message: "", photo: null, video: null }); // Reset form
  };

  return (
    <div className="p-6 bg-gray-100">
      {/* Header */}
      <Header />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Announcement</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700 transition"
        >
          Create Announcement
        </button>
      </div>

      {/* Announcement List */}
      <div className="space-y-6">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="bg-white p-6 rounded-md shadow-md flex flex-col gap-4"
          >
            <div className="flex gap-4">
              {/* Profile Photo */}
              <img
                src={announcement.profilePhoto}
                alt={announcement.author}
                className="w-12 h-12 rounded-full object-cover"
              />

              {/* Announcement Content */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold">{announcement.author}</h2>
                    <p className="text-sm text-gray-500">{announcement.date}</p>
                  </div>
                  <div className="text-gray-400 cursor-pointer">•••</div>
                </div>
                <p className="mt-4 text-gray-700 whitespace-pre-line">{announcement.message}</p>
              </div>
            </div>

            {/* Announcement Image */}
            {announcement.announcementImage && (
              <img
                src={announcement.announcementImage}
                alt="Announcement"
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
          {/* Prevent modal close on click inside */}
          <div
            className="bg-white rounded-lg w-1/2 shadow-lg"
            onClick={(e) => e.stopPropagation()} // Stop propagation to prevent closing
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-700">Create Announcement</h2>
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
                <label
                  htmlFor="author"
                  className="block text-sm font-medium text-gray-700"
                >
                  Author
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={newAnnouncement.author}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your name"
                />
              </div>

              {/* Message Input */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={newAnnouncement.message}
                  onChange={handleInputChange}
                  rows={6}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Write your announcement"
                ></textarea>
              </div>

              {/* Photo Input */}
              <div>
                <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                  Photo
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

              {/* Video Input */}
              <div>
                <label htmlFor="video" className="block text-sm font-medium text-gray-700">
                  Video
                </label>
                <input
                  type="file"
                  id="video"
                  name="video"
                  accept="video/*"
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
                Post Announcement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcement;
