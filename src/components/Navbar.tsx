'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import { BsCalendar2Date } from 'react-icons/bs';
import { IoMdNotificationsOutline } from 'react-icons/io';

interface SchoolNavbarProps {
  user: string;
  title: string;
}
  const SchoolAdminNavbar: React.FC<SchoolNavbarProps> = ({ user, title }) => {
 const [currentDate, setCurrentDate] = useState("");
  const router = useRouter(); 

  useEffect(() => {
    const date = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    setCurrentDate(date);
  }, []);

  return (
    <div className="flex justify-between items-center mb-8">
      {/* Search Bar with Search Icon */}
      <div className="relative w-1/3">
        <AiOutlineSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
        <input
          type="text"
          placeholder="Search"
          className="w-full pl-10 p-2 border rounded focus:outline-none focus:ring focus:ring-blue-300"
        />
      </div>

      {/* Icons and Profile Section */}
      <div className="flex items-center space-x-6">
        {/* Calendar Icon with Current Date */}
        <div className="flex items-center space-x-2 text-gray-500">
          <BsCalendar2Date className="w-5 h-5" />
          <span>{currentDate}</span>
        </div>

        {/* Notification Icon */}
        <div className="relative cursor-pointer">
          <IoMdNotificationsOutline className="w-6 h-6 text-gray-500" />
          {/* Optional Notification Badge */}
          <span className="absolute top-0 right-0 block w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        </div>

        {/* Profile Picture */}
        <img
          src="../../img/teacher.jpg"
          alt="Profile"
          className="w-10 h-10 rounded-full cursor-pointer"
          onClick={() => router.push("/profile")} // Navigate to the profile page
        />
      </div>
    </div>
  );
};

export default SchoolAdminNavbar;
