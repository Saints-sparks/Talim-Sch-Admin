"use client";
import React, { useState, useCallback, memo, useEffect } from "react";
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
import LoadingModal from './LoadingModal';

type SidebarProps = {
  className?: string;
};

interface MenuItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  subItems?: { path: string; label: string }[];
}

const menuSections = [
  {
    title: 'School Management',
    items: [
      { path: '/dashboard', icon: <HiHome className="text-xl" />, label: 'Dashboard' },
      { path: '/classes', icon: <HiOutlineBookOpen className="text-xl" />, label: 'Classes' },
      {
        path: '/users',
        icon: <HiOutlineUsers className="text-xl" />,
        label: 'Users',
        subItems: [
          { path: '/users/students', label: 'Students' },
          { path: '/users/teachers', label: 'Teachers' }
        ]
      }
    ]
  },
  {
    title: 'Communication',
    items: [
      { path: '/announcements', icon: <HiOutlineSpeakerphone className="text-xl" />, label: 'Announcements' },
      { path: '/messages', icon: <FaRegCommentDots className="text-xl" />, label: 'Messages' }
    ]
  }
];

const Sidebar: React.FC<SidebarProps> = memo(({ className }) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isUserTabOpen, setIsUserTabOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isLoading, startLoading, stopLoading } = useLoading();

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

  const toggleSection = useCallback((title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  }, []);

  useEffect(() => {
    stopLoading();
  }, [pathname, stopLoading]);

  return (
    <div className={`bg-[#F8FAFC] text-gray-800 w-64 h-screen flex flex-col justify-between ${className}`}>
      <LoadingModal isLoading={isLoading} />
      <div className="overflow-y-auto flex-1 p-4">
        <div className="border-t-2 rounded-md">
          <div className="py-6 mx-2 flex items-center gap-4 cursor-pointer border-b-2 rounded-md">
            <Image src="/icons/talim.svg" alt="School Logo" width={44} height={43} priority />
            <span className="text-2xl font-semibold text-gray-900">Talim</span>
          </div>

          {menuSections.map(section => (
            <div key={section.title} className="mt-4">
              <div
                className="flex items-center justify-between p-2 text-gray-700 font-medium cursor-pointer"
                onClick={() => toggleSection(section.title)}
              >
                <span>{section.title}</span>
                {openSections[section.title] ? <FiChevronDown /> : <FiChevronRight />}
              </div>
              {openSections[section.title] && section.items.map(item => (
                <React.Fragment key={item.path}>
                  <div
                    className={`p-3 flex items-center gap-4 cursor-pointer rounded-md ${
                      isActive(item.path) ? 'bg-[#154473] text-white' : 'hover:bg-gray-200'
                    }`}
                    onClick={() => handleNavigate(item.path)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.subItems && openSections[section.title] && (
                    <div className="pl-8">
                      {item.subItems.map(subItem => (
                        <div
                          key={subItem.path}
                          className="p-2 flex items-center gap-4 hover:bg-gray-200 cursor-pointer rounded-md"
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