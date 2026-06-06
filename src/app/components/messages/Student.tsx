import { Search, X } from "lucide-react";
import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Utility function to generate consistent colors from strings
function generateColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}

// Utility function to get user initials
function getUserInitials(firstName?: string, lastName?: string, name?: string): string {
  if (firstName || lastName) {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  }
  if (name) {
    const parts = name.split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return "U";
}

interface StudentsProps {
  participants?: any[];
}

const Students = ({ participants = [] }: StudentsProps) => {
  // If no participants provided, use mock data
  const members =
    participants.length > 0
      ? participants
      : [
          {
            name: "Mrs. Yetunde Adebayo",
            avatar: "/image/teachers/english.png",
            role: "Teacher",
          },
          {
            name: "Fatima Abubakar",
            avatar: "/image/teachers/mathematics.png",
            role: "Student",
          },
          {
            name: "Fatima Abubakar",
            avatar: "/image/teachers/mathematics.png",
            role: "Student",
          },
          {
            name: "Fatima Abubakar",
            avatar: "/image/teachers/mathematics.png",
            role: "Student",
          },
          {
            name: "Fatima Abubakar",
            avatar: "/image/teachers/mathematics.png",
            role: "Student",
          },
          {
            name: "Fatima Abubakar",
            avatar: "/image/teachers/mathematics.png",
            role: "Student",
          },
        ];
  return (
    <div className="mt-2">
      <div className="relative flex items-center border px-2 py-1 rounded-lg ">
        <Search strokeWidth="1px" size={20} />
        <input
          type="text"
          placeholder="Search"
          className="w-full bg-transparent p-2 text-sm focus:outline-none"
        />
        <X className="text-gray-500 cursor-pointer ml-2" size={16} />
      </div>
      <div className="flex flex-col overflow-y-auto max-h-[320px] scrollbar-hide">
        {members.map((mem, index) => {
          const displayName = mem.name || `${mem.firstName || ""} ${mem.lastName || ""}`.trim();
          const initials = getUserInitials(mem.firstName, mem.lastName, mem.name);
          const bgColor = generateColorFromString(displayName || mem.email || "user");

          return (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded cursor-pointer hover:bg-gray-200"
            >
              <Avatar className="w-10 h-10 rounded-full">
                <AvatarImage src={mem.avatar} />
                <AvatarFallback
                  className="text-white font-medium text-sm"
                  style={{ backgroundColor: bgColor }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-[16px]">{displayName}</p>
                <p className="text-sm text-[#7B7B7B]">{mem.role || "Student"}</p>
                {mem.email && <p className="text-xs text-[#999999]">{mem.email}</p>}
              </div>
              {mem.isOnline && <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Students;
