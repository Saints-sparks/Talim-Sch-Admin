import Link from "next/link";
import { Bell, Menu, CalendarRange } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { WebSocketStatus } from "./WebSocketStatus";
import { useSidebar } from "@/context/SidebarContext";

export function Header() {
  const { setMobileOpen } = useSidebar();

  return (
    <header className="font-manrope px-5 border-b sm:border-b-2 border-b-[#F0F0F0] py-2 bg-[#F8F8F8]">
      {/* Top row: Menu, Date, Notifications, Avatar */}
      <div className="flex flex-col  sm:flex-row items-center w-full justify-between gap-4 py-3 md:justify-end">
        {/* Menu Button (Only on Mobile) */}
        <div className="flex items-center w-full sm:w-auto justify-between">
          <button
            className="sm:hidden rounded-md shadow-none p-2 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="text-[#003366]" size={24} />
          </button>
          {/* Right Side: Date, Notifications, Avatar */}
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
