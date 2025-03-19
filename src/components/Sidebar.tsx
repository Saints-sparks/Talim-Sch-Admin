"use client";
import React, { useState, useCallback, memo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  HiHome,
  HiOutlineBookOpen,
  HiOutlineUsers,
  HiOutlineSpeakerphone,
  HiOutlineClipboard,
  HiOutlineChatAlt2,
} from "react-icons/hi";
import { FaRegCommentDots, FaUserCircle } from "react-icons/fa";
import { AiOutlineCalendar, AiOutlinePlus } from "react-icons/ai";
import { MdOutlineNotifications } from "react-icons/md";
import { FiSettings, FiChevronDown, FiChevronRight, FiLogOut } from "react-icons/fi";
import Image from "next/image";
import { useLoading } from '@/hooks/useLoading';

type SidebarProps = {
  className?: string;
};

const Sidebar: React.FC<SidebarProps> = memo(({ className }) => {
  const [isUserTabOpen, setIsUserTabOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();

  const isActive = useCallback((path: string) => pathname === path, [pathname]);

  const handleNavigate = useCallback(
    (path: string) => {
      startLoading();
      console.log(`Navigating to: ${path}`);
      router.push(path);
    },
    [router, startLoading]
  );

  const handleLogout = useCallback(() => {
    // Clear user data from localStorage or sessionStorage
    localStorage.removeItem("accessToken"); // Example: Remove the user token
    localStorage.removeItem("refreshToken"); // Example: Remove user-related data

    // Redirect to the login page or home page
    router.push("/"); // Replace "/login" with your login page route
  }, [router]);

  return (
    <div
      className={`bg-white text-gray-800 w-64 h-screen flex flex-col justify-between ${className}`}
    >
      {/* Scrollable Main Menu */}
      <div className="overflow-y-auto flex-1">
        <div className="border-t-2 rounded-md">
          {/* Logo Section */}
          <div className="py-10 mx-5 flex items-center justify-right gap-4 cursor-pointer border-b-2 rounded-md">
            <Image
              src="/icons/talim.svg"
              alt="School Logo"
              width={44.29}
              height={43.23}
              priority
            />
            <span className="text-2xl font-semibold">Talim</span>
          </div>

          <div className="mb-4 border-b border-2 border-solid border-[#F1F1F1] -mx-4"></div>

          {/* School Selector */}
          <div className="flex items-center px-2 py-3 border-2 border-solid border-[#F1F1F1] bg-[#FBFBFB] rounded-md mb-4">
            <Image
              src="/img/unity.png"
              alt="School"
              width={40}
              height={40}
              loading="lazy"
            />
            <span className="ml-2 font-medium text-base text-gray-700">
              Unity Secondary S...
            </span>
          </div>

          {/* Menu Items */}
          {[
            { path: "/dashboard", icon: <HiHome className="text-xl" />, label: "Dashboard" },
            { path: "/classes", icon: <HiOutlineBookOpen className="text-xl" />, label: "Classes" },
            {
              path: "/users",
              icon: <HiOutlineUsers className="text-xl" />,
              label: "Users",
              subItems: [
                { path: "/users/students", label: "Students" },
                { path: "/users/teachers", label: "Teachers" },
              ],
            },
            { path: "/timetable", icon: <AiOutlineCalendar className="text-xl" />, label: "Timetable" },
            { path: "/announcements", icon: <HiOutlineSpeakerphone className="text-xl" />, label: "Announcements" },
            { path: "/notifications", icon: <MdOutlineNotifications className="text-xl" />, label: "Notifications" },
            { path: "/messages", icon: <FaRegCommentDots className="text-xl" />, label: "Messages" },
            { path: "/request-leave", icon: <HiOutlineClipboard className="text-xl" />, label: "Request Leave" },
            { path: "/complaints", icon: <HiOutlineChatAlt2 className="text-xl" />, label: "Complaints" },
            { path: "/settings", icon: <FiSettings className="text-xl" />, label: "Settings" },
          ].map((item) => (
            <React.Fragment key={item.path}>
              <div
                className={`p-5 flex items-center gap-4 cursor-pointer rounded-md ${
                  isActive(item.path) ? "bg-gray-300 text-gray-900 font-bold" : "hover:bg-gray-200 hover:text-gray-800"
                }`}
                onClick={() => {
                  if (item.subItems) {
                    setIsUserTabOpen((prev) => !prev);
                  } else {
                    handleNavigate(item.path);
                  }
                }}
                aria-expanded={item.subItems ? isUserTabOpen : undefined}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.subItems && (isUserTabOpen ? <FiChevronDown /> : <FiChevronRight />)}
              </div>
              {item.subItems && isUserTabOpen && (
                <div className="pl-8">
                  {item.subItems.map((subItem) => (
                    <div
                      key={subItem.path}
                      className="p-3 flex items-center gap-4 hover:bg-gray-200 cursor-pointer rounded-md"
                      onClick={() => handleNavigate(subItem.path)}
                    >
                      <span>{subItem.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Profile Section */}
      <div className="p-4 bg-white flex items-center justify-between rounded-md hover:bg-gray-200">
        {/* Admin Info */}
        <div className="flex items-center gap-4 rounded-md">
          <FaUserCircle className="text-3xl text-gray-600" />
          <div className="rounded-md">
            <div className="font-semibold">Logout</div>
            <div className="text-sm text-gray-600">account</div>
          </div>
        </div>

        {/* Logout Icon */}
        <button
          className="text-gray-600 hover:text-gray-800 transition"
          onClick={() => handleLogout()}
          aria-label="Logout"
        >
          <FiLogOut className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
});

Sidebar.displayName = "Sidebar"; // Add display name for better debugging
export default Sidebar;