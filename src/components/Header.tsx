import Link from "next/link";
import { Search, Bell, Menu, CalendarRange } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export function Header() {
  return (
    <header className="font-manrope px-5 border-b sm:border-b-2 border-b-[#F0F0F0] pb-4">
      {/* Top row: Menu, Date, Notifications, Avatar */}
      <div className="flex flex-col  sm:flex-row items-center w-full justify-between gap-4 py-3">
        {/* Menu Button (Only on Mobile) */}
        <div className="flex items-center w-full sm:w-auto justify-between">
          <div
            className="md:hidden rounded-md shadow-none"
          >
            <Menu className="text-[#003366]" size={24} />
          </div>
          {/* Right Side: Date, Notifications, Avatar */}
          <div className="flex items-center gap-4">
            <div className="flex gap-2 items-center text-sm text-[#6F6F6F] p-2 rounded-lg border border-[#F0F0F0] bg-white">
              <p className="text-[16px]">
                {format(new Date(), "dd MMM, yyyy")}
              </p>
              <CalendarRange size={24} />
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
        {/* Search Bar: Below on Mobile, Left-Aligned on Larger Screens */}
        <div className="relative w-full sm:w-[40%] max-w-md sm:order-first">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            type="search"
            placeholder="Search"
            className="pl-10 py-5 rounded-lg bg-white"
          />
        </div>
      </div>
    </header>
  );
}
