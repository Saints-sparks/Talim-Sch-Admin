"use client";
import { useState } from "react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  Phone,
  Video,
  MessageSquare,
  X,
  Users,
  Image,
  Video as VideoIcon,
  Link2,
  FileText,
} from "lucide-react";
import Students from "./Student";
import Images from "./Images";
import Videos from "./Videos";
import Links from "./Links";
import Documents from "./Document";

const menuItems = [
  { name: "Students", icon: Users },
  { name: "Images", icon: Image },
  { name: "Videos", icon: VideoIcon },
  { name: "Links", icon: Link2 },
  { name: "Documents", icon: FileText },
];

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatar: string;
  name: string;
  description: string;
  participants?: any[]; // Real participants data
}

export default function GroupInfoModal({
  isOpen,
  onClose,
  avatar,
  name,
  description,
  participants = [],
}: GroupInfoModalProps) {
  const [selectedMenu, setSelectedMenu] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <div className="bg-white rounded-lg shadow-lg w-[650px] h-[450px] flex">
        {/* Sidebar */}
        <div className="w-48 flex flex-col gap-2 bg-[#FDFDFD] border border-[#EEEEEE] text-[#878787] rounded-l-lg pt-6 p-3">
          {menuItems.map((item) => (
            <div
              key={item.name}
              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                selectedMenu === item.name
                  ? "bg-gray-200 font-medium"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => setSelectedMenu(item.name)}
            >
              <item.icon
                strokeWidth="1px"
                size={18}
                className="text-gray-600"
              />
              <span>{item.name}</span>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 pt-6 p-5 relative">
          {/* Close Button */}
          <X
            className="absolute top-3 right-3 cursor-pointer text-[#434343] hover:text-gray-800"
            size={20}
            onClick={onClose}
          />

          {/* Group Info */}
          {selectedMenu === "" && (
            <div className="text-center">
              <Avatar className="w-16 h-16 rounded-full mx-auto">
                <AvatarImage src={avatar} />
              </Avatar>
              <h2 className="mt-3 text-lg text-[#030E18] font-medium">
                {name}
              </h2>
              <p className="text-sm text-[#7B7B7B]">Group Name</p>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 mt-5">
                <div className="flex flex-col border border-[#F0F0F0] px-8 py-2 gap-2 rounded-lg items-center cursor-pointer">
                  <Phone
                    size={20}
                    className="text-gray-600 hover:text-gray-800"
                  />
                  <p className="text-sm mt-1">Voice Call</p>
                </div>
                <div className="flex flex-col border border-[#F0F0F0] px-8 py-2 gap-2 rounded-lg items-center cursor-pointer">
                  <Video
                    size={20}
                    className="text-gray-600 hover:text-gray-800"
                  />
                  <p className="text-sm mt-1">Video Call</p>
                </div>
                <div className="flex flex-col border border-[#F0F0F0] px-8 py-2 gap-2 rounded-lg items-center cursor-pointer">
                  <MessageSquare
                    size={20}
                    className="text-gray-600 hover:text-gray-800"
                  />
                  <p className="text-sm mt-1">Message</p>
                </div>
              </div>

              <p className="text-sm p-2 border border-[#F0F0F0] rounded-lg text-[#545454] whitespace-pre-line text-left mt-4">
                {description}
              </p>
            </div>
          )}

          {/* Content for Other Sections */}
          {selectedMenu !== "" && (
            <div className="text-center">
              <h2 className="text-lg text-left mb-5 font-medium">
                {selectedMenu}
              </h2>
              {/* <p className="text-sm text-gray-500 mt-2">No content available yet.</p> */}
            </div>
          )}
          {selectedMenu === "Students" && <Students participants={participants} />}
          {selectedMenu === "Images" && <Images />}
          {selectedMenu === "Videos" && <Videos />}
          {selectedMenu === "Links" && <Links />}
          {selectedMenu === "Documents" && <Documents />}
        </div>
      </div>
    </div>
  );
}
