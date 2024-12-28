"use client"; // Import the client hook from Blitz.js
import React, { useState } from "react";
import { useRouter } from "next/navigation"; // Import the useRouter hook
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


import { MdOutlineMessage, MdOutlineNotifications } from "react-icons/md";
import { FaUserCircle } from "react-icons/fa";
import { FiChevronDown, FiChevronRight, FiLogOut } from "react-icons/fi";

type SidebarProps = {
  className?: string; // Make className optional
};

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [isManageTrackOpen, setIsManageTrackOpen] = useState(false);
  const [isCurriculumOpen, setIsCurriculumOpen] = useState(false);
  const [isStudentsOpen, setIsStudentsOpen] = useState(false); // Add state for Student section

  const router = useRouter(); // Initialize the router

  const handleNavigate = (path: string) => {
    console.log(`Navigating to: ${path}`); // Debugging statement
    router.push(path); // Navigate to the specified path
  };

  return (
    <div
      className={`bg-white text-gray-800 w-64 h-full flex flex-col justify-between ${className}`}
    >

      {/* Main Menu */}
      <div className="border-t-2">      
      <div className="py-10 flex items-center justify-center gap-4 cursor-pointer border-b-2">
        <HiHome className="text-xl" />
        <span className="text-2xl font-semibold">Talim</span>
      </div>




        <div
          className="p-6 hover:bg-gray-200 flex items-center gap-4 cursor-pointer"
          onClick={() => handleNavigate("/dashboard")} // Navigate to the Dashboard page
        >
          <HiHome className="text-xl" />
          <span>Dashboard</span>
        </div>

        {/* Manage & Track */}
        <div>
          <div
            className="p-6 hover:bg-gray-200 flex items-center justify-between cursor-pointer"
            onClick={() => setIsManageTrackOpen(!isManageTrackOpen)}
          >
            <div className="flex items-center gap-4"
             onClick={() => handleNavigate("/subjects")} >
              <HiOutlineBookOpen className="text-xl" />
              <span>Subjects</span>
            </div>
            {isManageTrackOpen ? <FiChevronDown /> : <FiChevronRight />}
          </div>
          {isManageTrackOpen && (
            <div className="pl-8">
              <div
                className="p-2 flex items-center gap-4 hover:bg-gray-200 cursor-pointer"
                onClick={() => setIsCurriculumOpen(!isCurriculumOpen)}
              >
                <HiOutlineBookOpen className="text-lg" />
                <span>Curriculum</span>
                {isCurriculumOpen ? <FiChevronDown /> : <FiChevronRight />}
              </div>
              {isCurriculumOpen && (
                <div className="pl-6">
                  <div
                    className="p-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() =>
                      handleNavigate("/managetrack/curriculum/classes")
                    }
                  >
                    Courses
                  </div>
                  <div
                    className="p-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() =>
                      handleNavigate("/managetrack/curriculum/courses")
                    }
                  >
                    Courses
                  </div>
                  <div
                    className="p-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() => handleNavigate("/curriculum/resources")}
                  >
                    Resources
                  </div>
                </div>
              )}
              <div
                className="p-2 flex items-center gap-4 hover:bg-gray-200 cursor-pointer"
                onClick={() => setIsStudentsOpen(!isStudentsOpen)}
              >
                <HiOutlineUsers className="text-lg" />
                <span>Students</span>
                {isStudentsOpen ? <FiChevronDown /> : <FiChevronRight />}
              </div>
              {isStudentsOpen && (
                <div className="pl-6">
                  <div
                    className="p-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() =>
                      handleNavigate("/managetrack/students")
                    }
                  >
                    Overview
                  </div>
                  <div
                    className="p-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() =>
                      handleNavigate("/managetrack/students/studentprofiles")
                    }
                  >
                    Student Profile
                  </div>
                  <div
                    className="p-2 hover:bg-gray-200 cursor-pointer"
                    onClick={() =>
                      handleNavigate("/managetrack/students/enrollment")
                    }
                  >
                    Enrollment
                  </div>
                </div>
              )}
              <div
                className="p-2 flex items-center gap-4 hover:bg-gray-200 cursor-pointer"
                onClick={() => handleNavigate("/manage-track/progress")}
              >
                <HiOutlineChartBar className="text-lg" />
                <span>Progress</span>
              </div>
              <div
                className="p-2 flex items-center gap-4 hover:bg-gray-200 cursor-pointer"
                onClick={() => handleNavigate("/manage-track/attendance")}
              >
                <HiOutlineClipboardList className="text-lg" />
                <span>Attendance</span>
              </div>
            </div>
          )}
        </div>

        <div
          className="p-6 hover:bg-gray-200 flex items-center gap-4 cursor-pointer"
          onClick={() => handleNavigate("/study-box")}
        >
          <HiOutlineArchive className="text-xl" />
          <span>Study Box</span>
        </div>
        <div
          className="p-6 hover:bg-gray-200 flex items-center gap-4 cursor-pointer"
          onClick={() => handleNavigate("/messages")}
        >
          <MdOutlineMessage className="text-xl" />
          <span>Messages</span>
        </div>
        <div
          className="p-6 hover:bg-gray-200 flex items-center gap-4 cursor-pointer"
          onClick={() => handleNavigate("/grades")}
        >
          <HiOutlineChartBar className="text-xl" />
          <span>Grades</span>
        </div>
        <div
          className="p-4 hover:bg-gray-200 flex items-center gap-4 cursor-pointer"
          onClick={() => handleNavigate("/notifications")}
        >
          <MdOutlineNotifications className="text-xl" />
          <span>Notifications</span>
        </div>
        <div
          className="p-6 hover:bg-gray-200 flex items-center gap-4 cursor-pointer"
          onClick={() => handleNavigate("/profile")}
        >
          <HiOutlineUser className="text-xl" />
          <span>Profile</span>
        </div>

        <div
          className="p-6 hover:bg-gray-200 flex items-center gap-4 cursor-pointer"
          onClick={() => handleNavigate("/settings")}
        >
          <HiOutlineClipboardList className="text-xl" />
          <span>Settings</span>
        </div>
      </div>

      {/* Profile Section */}
      <div className="p-4 bg-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <FaUserCircle className="text-3xl text-gray-600" />
          <div>
            <div className="font-semibold">Admin</div>
            <div className="text-sm text-gray-600">Logout</div>
          </div>
        </div>
        <FiLogOut
          className="text-xl cursor-pointer"
          onClick={() => handleNavigate("/logout")}
        />
      </div>
    </div>
  );
};

export default Sidebar;
