import type React from "react";

import { useState, useEffect } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/CustomToast";
import { useAuth } from "@/context/AuthContext";
import { useWebSocketContext } from "@/context/WebSocketContext";
import { chatService } from "@/services/chatServices";
import {
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import SmoothLink from "./SmoothLink";
import { useSidebar } from "@/context/SidebarContext";
import {
  BookOpen,
  Calendar2,
  Chart2,
  ChevronDown,
  ClipboardClose,
  Dashboard,
  Note,
  Power,
  Settings,
  Message,
  UserGroup,
  VolumeHigh,
} from "./Icons";

interface MenuItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  badge?: number;
  hasDropdown?: boolean;
  expanded?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  subItems?: { path: string; label: string; tooltip: string }[];
}

type SidebarProps = React.ComponentProps<"nav"> & {
  className?: string;
};

export default function Sidebar({ className, ...rest }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedUsers, setExpandedUsers] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const { user, logout } = useAuth();
  const { onUnreadMessagesUpdate } = useWebSocketContext();
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

  useEffect(() => {
    if (!user) {
      setUnreadMessageCount(0);
      return;
    }

    let isActive = true;

    chatService
      .getUnreadMessageCount()
      .then((count) => {
        if (isActive) setUnreadMessageCount(count);
      })
      .catch(() => {
        if (isActive) setUnreadMessageCount(0);
      });

    const unsubscribe = onUnreadMessagesUpdate((data) => {
      if (typeof data.unreadCount === "number") {
        setUnreadMessageCount(data.unreadCount);
      }
    });

    const handleLocalUnreadUpdate = (event: Event) => {
      const unreadCount = (event as CustomEvent<{ unreadCount?: number }>).detail
        ?.unreadCount;

      if (typeof unreadCount === "number") {
        setUnreadMessageCount(unreadCount);
      }
    };

    window.addEventListener("talim:chat-unread-count", handleLocalUnreadUpdate);

    return () => {
      isActive = false;
      window.removeEventListener(
        "talim:chat-unread-count",
        handleLocalUnreadUpdate
      );
      unsubscribe();
    };
  }, [user, onUnreadMessagesUpdate]);

  // Define menu items with better icons and organization
  const menuItems: MenuItem[] = [
    {
      path: "/dashboard",
      icon: <Dashboard isActive={pathname.startsWith("/dashboard")} />,
      label: "Dashboard",
      tooltip: "Dashboard",
    },
    {
      path: "/classes",
      icon: <BookOpen isActive={pathname.startsWith("/classes")} />,
      label: "Classes",
      tooltip: "Classes",
    },
    {
      path: "/curriculum",
      icon: (
        <Note isActive={pathname.startsWith("/curriculum")} />
      ),
      label: "Curriculum",
      tooltip: "Curriculum (Subjects & Courses)",
    },
    {
      path: "/assessments",
      icon: (
        <Chart2 isActive={pathname.startsWith("/assessments")} />
      ),
      label: "Assessments",
      tooltip: "Assessments",
    },
    {
      path: "/timetable",
      icon: <Calendar2 isActive={pathname.startsWith("/timetable")} />,
      label: "Timetable",
      tooltip: "Timetable",
    },
    {
      path: "/users",
      icon: <UserGroup isActive={pathname.startsWith("/users")} />,
      label: "Users",
      tooltip: "Users",
      hasDropdown: true,
      expanded: expandedUsers,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        setExpandedUsers(!expandedUsers);
      },
      subItems: [
        { path: "/users/students", label: "Students", tooltip: "Student Directory" },
        { path: "/users/teachers", label: "Teachers", tooltip: "Teacher Directory" },
      ],
    },
    {
      path: "/announcements",
      icon: <VolumeHigh isActive={pathname.startsWith("/announcements")} />,
      label: "Announcements",
      tooltip: "Announcements",
    },
    {
      path: "/leave-requests",
      icon: (
        <ClipboardClose isActive={pathname.startsWith("/leave-requests")} />
      ),
      label: "Leave Requests",
      tooltip: "Leave Requests",
    },
    // {
    //   path: "/complaints",
    //   icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
    //   label: "Complaints",
      {
        path: "/messages",
        icon: <Message isActive={pathname.startsWith("/messages")} />,
        label: "Messages",
        tooltip: "Messages",
        badge: unreadMessageCount,
      },
    // },
    {
      path: "/settings",
      icon: <Settings isActive={pathname.startsWith("/settings")} />,
      label: "Settings",
      tooltip: "Academic Year & Term Settings",
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
      <div className="flex-1 overflow-y-auto scrollbar-hide px-3 space-y-1 mt-3">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            {item.hasDropdown ? (
              <Tooltip content={item.tooltip} side="right">
              <motion.div
                className={cn(
                  "group flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-200 relative",
                  pathname.startsWith("/users") ||
                    (item.hasDropdown && item.expanded)
                    ? "bg-[#003366]/20 text-[#003366]"
                    : "text-[#4A5568] hover:bg-gray-100 hover:text-[#030E18]"
                )}
                onClick={item.onClick}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-center w-6 h-6">
                  {item.icon}
                </div>
                <span className="text-base font-medium">{item.label}</span>
                <motion.div
                  animate={{ rotate: item.expanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-auto"
                >
                  <ChevronDown />
                </motion.div>
              </motion.div>
              </Tooltip>
            ) : (
              <Tooltip content={item.tooltip} side="right">
              <SmoothLink href={item.path}>
                <motion.div
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-200 relative",
                    pathname.startsWith(item.path)
                      ? "bg-[#003366]/20 text-[#003366]"
                      : "text-[#4A5568] hover:bg-gray-100 hover:text-[#030E18]"
                  )}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleLinkClick(item.path)}
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    {item.icon}
                  </div>
                  <span className="text-base font-medium">{item.label}</span>
                  {!!item.badge && item.badge > 0 && (
                    <span className="ml-auto inline-flex min-w-5 h-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </motion.div>
              </SmoothLink>
              </Tooltip>
            )}

            {/* Sub-items */}
            <AnimatePresence>
              {item.hasDropdown && item.expanded && item.subItems && (
                <motion.div
                  className="ml-5 mt-1 space-y-1 overflow-hidden"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                >
                  {item.subItems.map((subItem, subIndex) => (
                    <motion.div
                      key={subItem.path}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: subIndex * 0.05, duration: 0.2 }}
                    >
                      <Tooltip content={subItem.tooltip} side="right">
                      <SmoothLink href={subItem.path}>
                        <motion.div
                          className={cn(
                            "flex items-center gap-3 py-2 px-3 rounded-md transition-all duration-200 relative",
                            pathname === subItem.path
                              ? "text-[#003366] bg-[#003366]/10 font-medium"
                              : "text-[#4A5568] hover:text-[#030E18] hover:bg-gray-100"
                          )}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleLinkClick(subItem.path)}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0"></div>
                          <span className="text-sm font-medium">{subItem.label}</span>
                        </motion.div>
                      </SmoothLink>
                      </Tooltip>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Logout Section */}
      <div className="border-t border-[#F4F4F4] px-3 py-2">
        <motion.div
          className={cn(
            "group flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-200",
            isLoggingOut
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "text-[#4A5568] hover:bg-red-50 hover:text-red-600"
          )}
          whileTap={!isLoggingOut ? { scale: 0.98 } : {}}
          onClick={isLoggingOut ? undefined : handleLogout}
        >
          <div className="flex items-center justify-center w-6 h-6">
            {isLoggingOut ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Power />
            )}
          </div>
          <span className="text-base font-medium">
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
        className="h-screen w-[266px] bg-white border-r border-gray-200 flex flex-col shadow-sm"
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
            className="fixed left-0 top-0 h-full bg-white border-r border-[#F3F3F3] flex flex-col z-50 md:hidden shadow-2xl"
          >
            {sidebarContent}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
