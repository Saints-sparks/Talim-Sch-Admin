import Link from "next/link";
import { Bell, Menu, CalendarRange, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { WebSocketStatus } from "./WebSocketStatus";
import { useSidebar } from "@/context/SidebarContext";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { Calendar } from "./Icons";

export function Header() {
  const { setMobileOpen } = useSidebar();
  const { user } = useAuth();

  // Generate user initials from first and last name
  const getUserInitials = () => {
    if (!user?.firstName && !user?.lastName) return "U";

    const firstInitial = user?.firstName?.charAt(0).toUpperCase() || "";
    const lastInitial = user?.lastName?.charAt(0).toUpperCase() || "";

    return `${firstInitial}${lastInitial}` || "U";
  };

  return (
    <header className="font-manrope px-5 border-b border-b-[#F3F3F3] py-2 bg-[#FAFAFA]">
      {/* Top row: School Name (left) and Menu, Date, Notifications, Avatar (right) */}
      <div className="flex flex-col sm:flex-row items-center w-full justify-between gap-4 py-3">
        {/* Left Side: School Name */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl  flex items-center justify-center  overflow-hidden">
            {user?.schoolLogo ? (
              <img
                src={user.schoolLogo}
                alt="School Logo"
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  // Fallback to graduation cap if image fails to load
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const fallback = parent.querySelector(".fallback-icon");
                    if (fallback) {
                      (fallback as HTMLElement).style.display = "block";
                    }
                  }
                }}
              />
            ) : null}
            <GraduationCap
              className={`w-5 h-5 text-white fallback-icon ${
                user?.schoolLogo ? "hidden" : "block"
              }`}
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {user?.schoolName || "School Name"}
            </h1>
          </div>
        </div>

        {/* Right Side: Menu, Date, Notifications, Avatar */}
        <div className="flex items-center w-full sm:w-auto justify-between sm:justify-end">
          <button
            className="sm:hidden rounded-md shadow-none p-2 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="text-[#003366]" size={24} />
          </button>

          <div className="flex items-center gap-4">
            <div className="flex gap-2 items-center text-[#6F6F6F] p-2 rounded-lg border border-[#F0F0F0] bg-white cursor-pointer hover:bg-gray-100">
              <p className="font-medium leading-[24px]">
                {format(new Date(), "dd MMM, yyyy")}
              </p>
              <Calendar />
            </div>
            {/* WebSocket Status - Always visible but compact on mobile */}
            <div className="flex items-center">
              <WebSocketStatus />
            </div>
            {/* <Link href="/notifications">
              <Button className="bg-white shadow-none border border-[#F0F0F0] hover:bg-gray-200 h-full rounded-lg p-3">
                <Bell className="h-5 w-5 text-gray-600" />
              </Button>
            </Link> */}
            <Link href="/profile">
              <Avatar>
                <AvatarImage
                  src={user?.userAvatar || ""}
                  alt={`${user?.firstName || "User"} ${
                    user?.lastName || ""
                  } avatar`}
                />
                <AvatarFallback className="bg-blue-500 text-white font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
