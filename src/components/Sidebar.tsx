"use client";

import type React from "react";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Calendar,
  ChevronDown,
  Home,
  LogOut,
  MessageSquare,
  AlertCircle,
  Settings,
  Speaker,
  Ticket,
  Users,
  Bell,
  CircleUser,
  ClipboardList,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import SmoothLink from "./SmoothLink";
import { useSidebar } from "@/context/SidebarContext";

interface MenuItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  hasDropdown?: boolean;
  expanded?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  subItems?: { path: string; label: string }[];
}

type SidebarProps = React.ComponentProps<"nav"> & {
  className?: string;
};

export default function Sidebar({ className, ...rest }: SidebarProps) {
  const pathname = usePathname();
  const [expandedUsers, setExpandedUsers] = useState(false);
  const { isMobile, isMobileOpen, setMobileOpen } = useSidebar();

  // Define menu items
  const menuItems: MenuItem[] = [
    {
      path: "/dashboard",
      icon: <Home className="w-5 h-5" />,
      label: "Dashboard",
    },
    {
      path: "/classes",
      icon: <BookOpen className="w-5 h-5" />,
      label: "Classes",
    },
    {
      path: "/assessments",
      icon: <ClipboardList className="w-5 h-5 text-purple-600" />,
      label: "Assessments",
    },
    {
      path: "/users",
      icon: <Users className="w-5 h-5" />,
      label: "Users",
      hasDropdown: true,
      expanded: expandedUsers,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        setExpandedUsers(!expandedUsers);
      },
      subItems: [
        { path: "/users/students", label: "Students" },
        { path: "/users/teachers", label: "Teachers" },
      ],
    },
    {
      path: "/timetable",
      icon: <Calendar className="w-5 h-5" />,
      label: "Timetable",
    },
    {
      path: "/announcements",
      icon: <Speaker className="w-5 h-5" />,
      label: "Announcements",
    },
    {
      path: "/leave-requests",
      icon: <Ticket className="w-5 h-5" />,
      label: "Request leave",
    },
    {
      path: "/complaints",
      icon: <AlertCircle className="w-5 h-5" />,
      label: "Complaints",
    },
    {
      path: "/settings",
      icon: <Settings className="w-5 h-5" />,
      label: "Settings",
    },
    {
      path: "/curriculum",
      icon: <BookOpen className="w-5 h-5" />,
      label: "Curriculum",
    },
  ];

  const handleLinkClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const sidebarContent = (
    <>
      {/* Mobile Close Button */}
      {isMobile && (
        <div className="flex justify-end p-4 md:hidden">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Logo */}
      <div className={cn("p-4", isMobile && "pt-0")}>
        <div className="flex items-center gap-2">
          <Image
            src="/img/treelogo.svg"
            alt="Talim Logo"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="text-lg font-medium text-gray-900">Talim</span>
        </div>
      </div>

      {/* School */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 p-2 rounded">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <CircleUser className="w-5 h-5 text-blue-900" />
          </div>
          <span className="text-sm text-gray-800 font-medium">
            Unity Secondary School
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 space-y-4">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
          >
            {item.hasDropdown ? (
              <motion.div
                className={cn(
                  "flex items-center gap-3 mx-2 px-3 py-2 rounded-md cursor-pointer transition-all duration-200",
                  pathname === item.path || (item.hasDropdown && item.expanded)
                    ? "bg-blue-50 text-blue-900 font-medium shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
                onClick={item.onClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {item.icon}
                <span className="text-[16px]">{item.label}</span>
                <motion.div
                  animate={{ rotate: item.expanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="ml-auto w-4 h-4" />
                </motion.div>
              </motion.div>
            ) : (
              <SmoothLink href={item.path}>
                <motion.div
                  className={cn(
                    "flex items-center gap-3 mx-2 px-3 py-2 rounded-md cursor-pointer transition-all duration-200",
                    pathname === item.path
                      ? "bg-blue-50 text-blue-900 font-medium shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLinkClick}
                >
                  {item.icon}
                  <span className="text-[16px]">{item.label}</span>
                  {item.badge && (
                    <motion.div
                      className="ml-auto w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                    >
                      <span className="text-sm text-white">{item.badge}</span>
                    </motion.div>
                  )}
                </motion.div>
              </SmoothLink>
            )}

            {/* Sub-items */}
            <AnimatePresence>
              {item.hasDropdown && item.expanded && item.subItems && (
                <motion.div
                  className="ml-10 mt-1 overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {item.subItems.map((subItem, subIndex) => (
                    <motion.div
                      key={subItem.path}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: subIndex * 0.02, duration: 0.15 }}
                    >
                      <SmoothLink href={subItem.path}>
                        <motion.div
                          className={cn(
                            "text-[16px] font-[500] py-1 px-2 rounded-md mb-3 transition-all duration-200",
                            pathname === subItem.path
                              ? "text-blue-900 font-medium bg-blue-50"
                              : "text-gray-600 hover:text-blue-900 hover:bg-blue-50"
                          )}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleLinkClick}
                        >
                          {subItem.label}
                        </motion.div>
                      </SmoothLink>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Logout */}
      <div className="p-4 border-t">
        <motion.div
          className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-md cursor-pointer transition-all duration-200"
          whileHover={{ scale: 1.02, x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLinkClick}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout Account</span>
        </motion.div>
      </div>
    </>
  );

  // Desktop sidebar
  if (!isMobile) {
    return (
      <motion.div
        className="h-screen w-64 bg-white border-r border-r-blue-100 flex flex-col"
        initial={{ x: -260 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {sidebarContent}
      </motion.div>
    );
  }

  // Mobile sidebar
  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            id="mobile-sidebar"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed left-0 top-0 h-full w-64 bg-white border-r border-r-blue-100 flex flex-col z-50 md:hidden shadow-xl"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
