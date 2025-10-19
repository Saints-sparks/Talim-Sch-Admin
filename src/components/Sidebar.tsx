import type React from "react";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  ChevronDown,
  Home,
  LogOut,
  MessageSquare,
  AlertCircle,
  Speaker,
  Ticket,
  Users,
  Bell,
  CircleUser,
  ClipboardList,
  X,
  GraduationCap,
  School,
  UserCheck,
  Clock,
  Megaphone,
  FileText,
  BarChart3,
} from "lucide-react";

import { cn } from "@/lib/utils";
import SmoothLink from "./SmoothLink";
import { useSidebar } from "@/context/SidebarContext";
import { authService } from "@/app/services/auth.service";
import { API_BASE_URL } from "@/app/lib/api/config";
import {
  BookOpen,
  Calendar2,
  ClipboardClose,
  Dashboard,
  Settings,
  UserGroup,
  VolumeHigh,
} from "./Icons";

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
  const router = useRouter();
  const [expandedUsers, setExpandedUsers] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout } = useAuth();
  const { isMobile, isMobileOpen, setMobileOpen } = useSidebar();

  // Auto-collapse Users submenu when navigating away from users pages
  useEffect(() => {
    if (!pathname.startsWith("/users") && expandedUsers) {
      setExpandedUsers(false);
    }
    // Auto-expand Users submenu when navigating to users pages
    if (pathname.startsWith("/users") && !expandedUsers) {
      setExpandedUsers(true);
    }
  }, [pathname]);

  // Define menu items with better icons and organization
  const menuItems: MenuItem[] = [
    {
      path: "/dashboard",
      icon: <Dashboard isActive={pathname.startsWith("/dashboard")} />,
      label: "Dashboard",
    },
    {
      path: "/classes",
      icon: <BookOpen isActive={pathname.startsWith("/classes")} />,
      label: "Classes",
    },
    {
      path: "/curriculum",
      icon: (
        <GraduationCap
         
          style={{
            color: pathname.startsWith("/curriculum") ? "#003366" : "#929292",
          }}
        />
      ),
      label: "Curriculum",
    },
    {
      path: "/assessments",
      icon: (
        <BarChart3
          className="w-5 h-5"
          style={{
            color: pathname.startsWith("/assessments") ? "#003366" : "#929292",
          }}
        />
      ),
      label: "Assessments",
    },
    {
      path: "/timetable",
      icon: <Calendar2 isActive={pathname.startsWith("/timetable")} />,
      label: "Timetable",
    },
    {
      path: "/users",
      icon: <UserGroup isActive={pathname.startsWith("/users")} />,
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
      path: "/announcements",
      icon: <VolumeHigh isActive={pathname.startsWith("/announcements")} />,
      label: "Announcements",
    },
    {
      path: "/leave-requests",
      icon: (
        <ClipboardClose isActive={pathname.startsWith("/leave-requests")} />
      ),
      label: "Leave Requests",
    },
    // {
    //   path: "/complaints",
    //   icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
    //   label: "Complaints",
    // },
    {
      path: "/settings",
      icon: <Settings isActive={pathname.startsWith("/settings")} />,
      label: "Settings",
    },
  ];

  const handleLinkClick = (itemPath?: string) => {
    // Close Users submenu if navigating to a non-users page
    if (itemPath && !itemPath.startsWith("/users") && expandedUsers) {
      setExpandedUsers(false);
    }

    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleMobileClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Use AuthContext logout method
      await logout();

      // Show success message
      toast.success("Logged out successfully!");

      // Close mobile sidebar if open
      if (isMobile) {
        setMobileOpen(false);
      }

      // Redirect to signin page
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An error occurred during logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const sidebarContent = (
    <>
      {/* Mobile Close Button */}
      {isMobile && (
        <div className="flex justify-end p-4 md:hidden border-b border-gray-100">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Logo Section */}
      <div className="p-[21px] border-b-2 border-[#F3F3F3]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-600 rounded-lg opacity-20"></div>
            <div className="relative bg-[#003366] p-2 rounded-lg">
              <Image
                src="/img/treelogo.svg"
                alt="Talim Logo"
                width={24}
                height={24}
                className="w-6 h-6 filter brightness-0 invert"
              />
            </div>
          </div>
          <div>
            <h1 className="text-[18px] font-semibold text-[#030E18]">Talim</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 space-y-3 mt-4">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            {item.hasDropdown ? (
              <motion.div
                className={cn(
                  "group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 relative",
                  pathname.startsWith("/users") ||
                    (item.hasDropdown && item.expanded)
                    ? "bg-[#BFCCD9] text-[#003366]  border border-[#003366]/20"
                    : "text-[#929292] hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900"
                )}
                onClick={item.onClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-10  rounded-lg transition-all duration-300"
                  )}
                >
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
                <motion.div
                  animate={{ rotate: item.expanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-auto"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.div>
                {/* Active indicator */}
              </motion.div>
            ) : (
              <SmoothLink href={item.path}>
                <motion.div
                  className={cn(
                    "group flex items-center gap-3 px-3 py-1 rounded-xl cursor-pointer transition-all duration-300 relative",
                    pathname.startsWith(item.path)
                      ? "bg-[#BFCCD9] text-[#003366] border border-[#003366]/20"
                      : "text-[#929292] hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900"
                  )}
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleLinkClick(item.path)}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300"
                    )}
                  >
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </motion.div>
              </SmoothLink>
            )}

            {/* Sub-items */}
            <AnimatePresence>
              {item.hasDropdown && item.expanded && item.subItems && (
                <motion.div
                  className="ml-6 mt-2 space-y-1 overflow-hidden"
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
                      transition={{ delay: subIndex * 0.05, duration: 0.2 }}
                    >
                      <SmoothLink href={subItem.path}>
                        <motion.div
                          className={cn(
                            "flex items-center gap-3 py-2 px-4 rounded-lg transition-all duration-200 relative",
                            pathname === subItem.path
                              ? "text-[#003366] bg-blue-50 font-medium"
                              : "text-[#929292] hover:text-gray-900 hover:bg-gray-50"
                          )}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleLinkClick(subItem.path)}
                        >
                          <div className="w-2 h-2 rounded-full bg-current opacity-40"></div>
                          <span className="text-sm">{subItem.label}</span>
                          {/* Active indicator for sub-items */}
                          {pathname === subItem.path && (
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"></div>
                          )}
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

      {/* Logout Section */}
      <div className=" border-t border-gray-100">
        <motion.div
          className={cn(
            "group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300",
            isLoggingOut
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "text-gray-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 hover:text-red-600"
          )}
          whileHover={!isLoggingOut ? { scale: 1.02, x: 2 } : {}}
          whileTap={!isLoggingOut ? { scale: 0.98 } : {}}
          onClick={isLoggingOut ? undefined : handleLogout}
        >
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300",
              isLoggingOut ? "bg-gray-200" : "group-hover:bg-red-100"
            )}
          >
            {isLoggingOut ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
          </div>
          <span className="font-medium">
            {isLoggingOut ? "Logging out..." : "Logout Account"}
          </span>
        </motion.div>
      </div>
    </>
  );

  // Desktop sidebar
  if (!isMobile) {
    return (
      <motion.div
        className="h-screen w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm"
        initial={{ x: -288 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
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
            initial={{ x: -288 }}
            animate={{ x: 0 }}
            exit={{ x: -288 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-200 flex flex-col z-50 md:hidden shadow-2xl"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
