"use client"; 
import React, { useState } from "react";
import { useRouter } from "next/navigation"; 
import { usePathname } from "next/navigation";
import {
  HiHome,
  HiOutlineCalendar,
  HiOutlineBookOpen,
  HiOutlineArchive,
  HiOutlineUsers,
  HiOutlineChartBar,
  HiOutlineClipboardList,
  HiOutlineUser
} from "react-icons/hi";
import { FaBook } from "react-icons/fa";
import { AiOutlinePlus } from "react-icons/ai";
import { HiOutlineChatAlt2 } from "react-icons/hi";
import Image from 'next/image';


import { MdOutlineMessage, MdOutlineNotifications } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import { FiSettings } from "react-icons/fi";
import { FiChevronDown, FiChevronRight, FiLogOut } from "react-icons/fi";
import { HiOutlineSpeakerphone, HiOutlineClipboard } from "react-icons/hi";
import { AiOutlineCalendar } from "react-icons/ai";


type SidebarProps = {
  className?: string; // Make className optional
};

const Sidebar: React.FC<SidebarProps> = ({ className}) => {
  const [isManageTrackOpen, setIsManageTrackOpen] = useState(false);
  const [isUserTabOpen, setIsUserTabOpen] = useState(false);
  const [isStudentsOpen, setIsStudentsOpen] = useState(false); 
  const pathname = usePathname(); 

  const isActive = (path: string) => pathname === path;

  const router = useRouter(); 

  const handleNavigate = (path: string) => {
    console.log(`Navigating to: ${path}`); 
    router.push(path); 
  };

  return (
    <div
      className={`bg-white text-gray-800 w-64 h-full flex flex-col justify-between ${className}`}
    >

      {/* Main Menu */}
      <div className="border-t-2">      
      <div className="py-10 mx-5 flex items-center justify-right gap-4 cursor-pointer border-b-2">
      <Image src="/icons/talim.svg" alt="School" width={44.29} height={43.23} />
        <span className="text-2xl font-semibold">Talim</span>
      </div>


        <div className="mb-4 border-b border-2 border-solid border-[#F1F1F1] -mx-4"></div>

        {/* School Selector */}
        <div className="flex items-center px-2 py-3 border-2 border-solid border-[#F1F1F1] bg-[#FBFBFB] rounded-md mb-4">
          <Image src="/img/unity.png" alt="School" width={40} height={40} />
          <span className="ml-2 font-medium text-base text-gray-700">Unity Secondary S...</span>
        </div>




        <div
          className={`p-4 flex items-center gap-4 cursor-pointer ${
            isActive("/dashboard") ? "bg-gray-300 text-gray-900 bold" : "hover:bg-gray-200 hover:text-gray-800"
          }`}
         onClick={() => handleNavigate("/dashboard")} // Navigate to the Dashboard page
        >
          <HiHome className="text-xl" />
          <span>Dashboard</span>
        </div>

        {/* Manage & Track */}
        <div>
          <div
              className={`p-4 flex items-center gap-4 cursor-pointer ${
                isActive("/classes") ? "bg-gray-300 text-gray-900 bold" : "hover:bg-gray-200 hover:text-gray-800"
              }`}
            onClick={() => setIsManageTrackOpen(!isManageTrackOpen)}
          >
            <div className="flex items-center gap-4"
             onClick={() => handleNavigate("/classes")} >
              <HiOutlineBookOpen className="text-xl" />
              <span>Classes</span>
            </div>
            {isManageTrackOpen ? <FiChevronDown /> : <FiChevronRight />}
          </div>
          {isManageTrackOpen && (
            <div className="pl-8">
            
              <div
                className="p-3 flex items-center gap-4 hover:bg-gray-200 cursor-pointer"
                onClick={() => setIsStudentsOpen(!isStudentsOpen)}
              >
                <FaBook className="text-lg" />
                <span>Subject</span>
                {isStudentsOpen ? <FiChevronDown /> : <FiChevronRight />}
              </div>
              {isStudentsOpen && (
                <div className="pl-6">
                  <div
                    className="p-3 flex items-center gap-2 hover:bg-gray-200 cursor-pointer rounded-lg"
                    onClick={() => handleNavigate("/subject/add-subject")}
                  >
                    {/* Add Icon */}
                    <AiOutlinePlus size={20} color="#154473" />
                    {/* Text */}
                    <span className="text-gray-700 font-medium">Add Subject</span>
                  </div>
            
                </div>
              )}
              <div
                className="p-3 flex items-center gap-4 hover:bg-gray-200 cursor-pointer"
                onClick={() => handleNavigate("/subject/subject-profile")}
              >
                <HiOutlineChartBar className="text-lg" />
                <span>Subject Profile</span>
              </div>
             
            </div>
          )}
        </div>



        <div>
          <div
              className={`p-3 flex items-center gap-4 cursor-pointer ${
                isActive("/users") ? "bg-gray-300 text-gray-900 bold" : "hover:bg-gray-200 hover:text-gray-800"
              }`}
            onClick={() => setIsUserTabOpen(!isUserTabOpen)}
          >
            <div className="flex items-center gap-4"
             onClick={() => handleNavigate("/users")} >
              <HiOutlineUsers className="text-xl" />
              <span>Users</span>
            </div>
            {isUserTabOpen ? <FiChevronDown /> : <FiChevronRight />}
          </div>
          {isUserTabOpen && (
            <div className="pl-8">
              <div
                className="p-3 flex items-center gap-4 hover:bg-gray-200 cursor-pointer"
                onClick={() => handleNavigate("/users/students/")}
              >
                <HiOutlineUser className="text-lg" />
                <span>Students</span>
              </div>
             
              <div
                className="p-3 flex items-center gap-4 hover:bg-gray-200 cursor-pointer"
                onClick={() => handleNavigate("/users/teachers")}
              >
                <HiOutlineUser className="text-lg" />
                <span>Teachers</span>
              </div>
             
            </div>
          )}
        </div>






        <div
          className={`p-3 hover:bg-gray-200 flex items-center gap-4 cursor-pointer ${
            isActive("/timetable") ? "bg-gray-300 text-gray-900 bold" : "hover:bg-gray-200 hover:text-gray-800"
          }`}
          onClick={() => handleNavigate("/timetable")}
        >
          <AiOutlineCalendar className="text-xl" />
          <span>Timetable</span>
        </div>


        <div
          className={`p-3 hover:bg-gray-200 flex items-center gap-4 cursor-pointer ${
            isActive("/announcements") ? "bg-gray-300 text-gray-900 bold" : "hover:bg-gray-200 hover:text-gray-800"
          }`}
          onClick={() => handleNavigate("/announcements")}
        >
          <HiOutlineSpeakerphone className="text-xl" />
          <span>Announcements</span>
        </div>


        <div
          className={`p-3 hover:bg-gray-200 flex items-center gap-4 cursor-pointer ${
            isActive("/notifications") ? "bg-gray-300 text-gray-900 bold" : "hover:bg-gray-200 hover:text-gray-800"
          }`}
          onClick={() => handleNavigate("/notifications")}
        >
          <MdOutlineNotifications className="text-xl" />
          <span>Notifications</span>
        </div>
        <div
          className={`p-3 hover:bg-gray-200 flex items-center gap-4 cursor-pointer ${
            isActive("/messages") ? "bg-gray-300 text-gray-900 bold" : "hover:bg-gray-200 hover:text-gray-800"
          }`}
          onClick={() => handleNavigate("/messages")}
        >
          <HiOutlineUser className="text-xl" />
          <span>Messages</span>
        </div>

        <div
          className={`p-3 hover:bg-gray-200 flex items-center gap-4 cursor-pointer ${
            isActive("/request-leave") ? "bg-gray-300 text-gray-900 bold" : "hover:bg-gray-200 hover:text-gray-800"
          }`}
          onClick={() => handleNavigate("/request-leave")}
        >
          <HiOutlineClipboard className="text-xl" />
          <span>Request Leave</span>
        </div>

        <div
          className={`p-3 hover:bg-gray-200 flex items-center gap-4 cursor-pointer ${
            isActive("/complaints") ? "bg-gray-300 text-gray-900 bold" : "hover:bg-gray-200 hover:text-gray-800"
          }`}
          onClick={() => handleNavigate("/complaints")}
        >
          <HiOutlineChatAlt2 className="text-xl" />
         
          <span>Complaints</span>
        </div>
        <div
          className={`p-3 hover:bg-gray-200 flex items-center gap-4 cursor-pointer ${
            isActive("/settings") ? "bg-gray-300 text-gray-900 bold" : "hover:bg-gray-200 hover:text-gray-800"
          }`}
          onClick={() => handleNavigate("/settings")}
        >
          <FiSettings className="text-xl" />
          <span>Settings</span>
        </div>
      </div>

       
     

      {/* Profile Section */}
      <div className="p-4 bg-gray-200 flex items-center justify-between">
 {/* Admin Info */}
 <div className="flex items-center gap-4">
        <FaUserCircle className="text-3xl text-gray-600" />
        <div>
          <div className="font-semibold">Logout</div>
          <div className="text-sm text-gray-600">account</div>
        </div>
      </div>

      {/* Logout Icon */}
      <button
        className="text-gray-600 hover:text-gray-800 transition"
        onClick={() => handleNavigate("/")}
        aria-label="Logout"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v9m6.364-5.364a9 9 0 11-12.728 0"
          />
        </svg>
      </button>
      </div>
    </div>
  );
};

export default Sidebar;