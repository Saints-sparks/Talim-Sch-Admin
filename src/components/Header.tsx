import Link from "next/link";
import { Bell, Menu, CalendarRange, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { WebSocketStatus } from "./WebSocketStatus";
import { useSidebar } from "@/context/SidebarContext";
import { useState, useEffect } from "react";

export function Header() {
  const { setMobileOpen } = useSidebar();
  const [user, setUser] = useState<any>(null);

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

  return (
    <header className="font-manrope px-5 border-b sm:border-b-2 border-b-[#F0F0F0] py-2 bg-white">
      {/* Top row: School Name (left) and Menu, Date, Notifications, Avatar (right) */}
      <div className="flex flex-col sm:flex-row items-center w-full justify-between gap-4 py-3">
        {/* Left Side: School Name */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <GraduationCap className="w-5 h-5 text-white" />
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
            <div className="flex gap-2 items-center text-sm text-[#6F6F6F] p-2 rounded-lg border border-[#F0F0F0] bg-white cursor-pointer hover:bg-gray-100">
              <p className="text-[14px] sm:text-[16px]">
                {format(new Date(), "dd MMM, yyyy")}
              </p>
              <CalendarRange size={24} />
            </div>
            {/* WebSocket Status - Always visible but compact on mobile */}
            <div className="flex items-center">
              <WebSocketStatus />
            </div>
            <Link href="/notifications">
              <Button className="bg-white shadow-none border border-[#F0F0F0] hover:bg-gray-200 h-full rounded-lg p-3">
                <Bell className="h-5 w-5 text-gray-600" />
              </Button>
            </Link>
            <Link href="/profile">
              <Avatar>
                <AvatarImage src="/placeholder.svg" alt="User avatar" />
                <AvatarFallback className="bg-green-300">OA</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
