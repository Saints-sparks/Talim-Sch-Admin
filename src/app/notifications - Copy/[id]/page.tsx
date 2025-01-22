"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React from "react";

const NotificationDetailsPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notificationId = searchParams.get("id");

  // Dummy data for notification details
  const notification = {
    id: notificationId,
    title: "System Maintenance Scheduled",
    description:
      "The system will be unavailable on Dec 29th from 1:00 AM to 3:00 AM GMT.",
    time: "1:52 AM",
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

      {/* Notification Details */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-4">{notification.title}</h1>
        <p className="text-gray-600 mb-4">{notification.description}</p>
        <p className="text-sm text-gray-500">Time: {notification.time}</p>
      </div>
    </div>
  );
};

export default NotificationDetailsPage;
