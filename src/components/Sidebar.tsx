import type React from "react";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
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
  const [user, setUser] = useState<any>(null);
  const { isMobile, isMobileOpen, setMobileOpen } = useSidebar();

  // Get user information from localStorage
  useEffect(() => {
    const getUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
      }
    };

    getUserFromStorage();

    // Listen for storage changes (in case user data is updated elsewhere)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        getUserFromStorage();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Define menu items with better icons and organization
  const menuItems: MenuItem[] = [
    {
      path: "/dashboard",
      icon: <Home className="w-5 h-5 text-blue-600" />,
      label: "Dashboard",
    },
    {
      path: "/classes",
      icon: <School className="w-5 h-5 text-emerald-600" />,
      label: "Classes",
    },
    {
      path: "/curriculum",
      icon: <BookOpen className="w-5 h-5 text-teal-600" />,
      label: "Curriculum",
    },
    {
      path: "/assessments",
      icon: <BarChart3 className="w-5 h-5 text-purple-600" />,
      label: "Assessments",
    },
    {
      path: "/timetable",
      icon: <Calendar className="w-5 h-5 text-indigo-600" />,
      label: "Timetable",
    },
    {
      path: "/users",
      icon: <Users className="w-5 h-5 text-orange-600" />,
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
      icon: <Megaphone className="w-5 h-5 text-red-600" />,
      label: "Announcements",
    },
    {
      path: "/leave-requests",
      icon: <Clock className="w-5 h-5 text-yellow-600" />,
      label: "Leave Requests",
    },
    // {
    //   path: "/complaints",
    //   icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
    //   label: "Complaints",
    // },
    {
      path: "/settings",
      icon: <Settings className="w-5 h-5 text-gray-600" />,
      label: "Settings",
    },
  ];

  const handleLinkClick = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Get the access token from localStorage
      const accessToken = localStorage.getItem("accessToken");

      if (accessToken) {
        // Call the logout API
        try {
          const response = await fetch(
            `${
              process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5005"
            }/auth/logout`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
            }
          );

          if (!response.ok) {
            console.warn(
              "Logout API call failed, but proceeding with local cleanup"
            );
          }
        } catch (apiError) {
          console.warn(
            "Logout API call failed, but proceeding with local cleanup:",
            apiError
          );
        }
      }

      // Clear all authentication data from localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");

      // Clear any other stored user data
      localStorage.clear();

      // Show success message
      toast.success("Logged out successfully!");

      // Close mobile sidebar if open
      if (isMobile) {
        setMobileOpen(false);
      }

      // Redirect to signin page
      router.push("/signin");
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
      <div className={cn("p-6", isMobile && "pt-4")}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-600 rounded-lg blur-sm opacity-20"></div>
            <div className="relative bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg">
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
            <h1 className="text-xl font-bold text-gray-900">Talim</h1>
            <p className="text-xs text-gray-500">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
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
                    ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100"
                    : "text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900"
                )}
                onClick={item.onClick}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300",
                    pathname.startsWith("/users") ||
                      (item.hasDropdown && item.expanded)
                      ? "bg-white shadow-sm"
                      : "group-hover:bg-white group-hover:shadow-sm"
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
                {(pathname.startsWith("/users") ||
                  (item.hasDropdown && item.expanded)) && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"></div>
                )}
              </motion.div>
            ) : (
              <SmoothLink href={item.path}>
                <motion.div
                  className={cn(
                    "group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 relative",
                    pathname === item.path
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100"
                      : "text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900"
                  )}
                  whileHover={{ scale: 1.02, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLinkClick}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300",
                      pathname === item.path
                        ? "bg-white shadow-sm"
                        : "group-hover:bg-white group-hover:shadow-sm"
                    )}
                  >
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <motion.div
                      className="ml-auto w-6 h-6 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                    >
                      <span className="text-xs text-white font-semibold">
                        {item.badge}
                      </span>
                    </motion.div>
                  )}
                  {/* Active indicator */}
                  {pathname === item.path && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"></div>
                  )}
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
                              ? "text-blue-700 bg-blue-50 font-medium"
                              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                          )}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleLinkClick}
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
