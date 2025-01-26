'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { FaSearch } from "react-icons/fa";

const notifications = [
  {
    id: 1,
    title: "System Maintenance Scheduled",
    description: "The system will be unavailable on Dec 29th from 1:00 AM to 3:00 AM GMT.",
    time: "1:52 AM",
  },
  {
    id: 2,
    title: "Timetable Uploaded Successfully",
    description: "The timetable for Class B has been successfully updated.",
    time: "1:52 AM",
  },
  {
    id: 3,
    title: "School Fees deadline",
    description: "The school fees deadline has been increased by two weeks.",
    time: "1:52 AM",
  },
  {
    id: 4,
    title: "School Fees deadline",
    description: "The school fees deadline has been increased by two weeks.",
    time: "1:52 AM",
  },
  {
    id: 5,
    title: "Timetable Uploaded Successfully",
    description: "The timetable for Class B has been successfully updated.",
    time: "1:52 AM",
  },
  {
    id: 6,
    title: "School Fees deadline",
    description: "The school fees deadline has been increased by two weeks.",
    time: "1:52 AM",
  },
  {
    id: 7,
    title: "System Maintenance Scheduled",
    description: "The system will be unavailable on Dec 29th from 1:00 AM to 3:00 AM GMT.",
    time: "1:52 AM",
  },
  {
    id: 8,
    title: "Timetable Uploaded Successfully",
    description: "The timetable for Class B has been successfully updated.",
    time: "1:52 AM",
  },
  {
    id: 9,
    title: "School Fees deadline",
    description: "The school fees deadline has been increased by two weeks.",
    time: "1:52 AM",
  },
  {
    id: 10,
    title: "School Fees deadline",
    description: "The school fees deadline has been increased by two weeks.",
    time: "1:52 AM",
  },
  {
    id: 11,
    title: "Timetable Uploaded Successfully",
    description: "The timetable for Class B has been successfully updated.",
    time: "1:52 AM",
  },
  {
    id: 12,
    title: "School Fees deadline",
    description: "The school fees deadline has been increased by two weeks.",
    time: "1:52 AM",
  },
  // Add more notifications as needed...
];

const NotificationsPage: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter notifications based on the search query
  const filteredNotifications = notifications.filter(
    (notification) =>
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNotificationClick = (id: number) => {
    router.push(`/notifications/${id}`);
  };

  return (
    <div className="p-6 bg-gray-100 h-full">
      <Header />
  
      <div className="flex justify-between items-center mb-6">
        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-800">Notifications</h1>

        {/* Search Bar with Icon */}
        <div className="relative w-80">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
            <FaSearch /> {/* React Icon for search */}
          </span>
          <input
            type="text"
            placeholder="Search for students"
            className="w-full pl-10 p-2 border border-gray-300 rounded"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
          />
        </div>
      </div>



      <div className="bg-white shadow-md rounded-lg">
        {/* Table Header */}
        <div className="flex items-center border-b border-gray-200 px-6 py-3">
          <input type="checkbox" className="mr-4" />
          <div className="flex-1 text-sm font-medium text-gray-600">Title</div>
          <div className="flex-1 text-sm font-medium text-gray-600">Description</div>
          <div className="text-sm font-medium text-gray-600">Time</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <div
                key={index}
                className="flex items-center px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleNotificationClick(notification.id)}
              >
                <input type="checkbox" className="mr-4" />
                <div className="flex-1 text-sm text-gray-800 font-medium">
                  {notification.title}
                </div>
                <div className="flex-1 text-sm text-gray-600">{notification.description}</div>
                <div className="text-sm text-gray-500">{notification.time}</div>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-sm text-gray-600">
              No notifications match your search.
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center px-6 py-4">
        <div className="text-sm text-gray-600">Showing {filteredNotifications.length} of {notifications.length}</div>
        <div className="flex items-center gap-4">
          <button className="text-sm text-gray-600 hover:text-gray-800">{"<"}</button>
          <span className="text-sm text-gray-600">1</span>
          <button className="text-sm text-gray-600 hover:text-gray-800">{">"}</button>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
