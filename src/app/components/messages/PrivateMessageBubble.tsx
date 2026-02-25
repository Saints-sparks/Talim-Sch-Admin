import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CheckCheck } from "lucide-react";
import MessageOptionsDropdown from "./MessageDropDown";
import AudioMessage from "./AudioMessage";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";

interface MessageBubbleProps {
  msg: {
    senderType: string;
    avatar: string;
    sender: string;
    color: string;
    type: string;
    text?: string;
    videoThumbnail?: string;
    duration?: string;
    time: string;
  };
  index: number;
  openSubMenu: { index: number; type: string } | null;
  toggleSubMenu: (index: number, type: string) => void;
  setReplyingMessage: (msg: any) => void;
}

export default function MessageBubble({
  msg,
  index,
  openSubMenu,
  toggleSubMenu,
  setReplyingMessage,
}: MessageBubbleProps) {
  const initials = getUserInitials(msg.sender);
  const bgColor = msg.color || generateColorFromString(msg.sender);

  return (
    <div
      className={`relative flex items-end ${
        msg.sender === "me" ? "justify-end" : "justify-start"
      } gap-2 px-2 sm:px-0 mb-3`}
    >
      <div className={`flex gap-2 max-w-[85%] sm:max-w-md ${
        msg.sender === "me" ? "flex-row-reverse" : "flex-row"
      }`}>
        {/* Avatar - only show for other users, not self */}
        {msg.sender !== "me" && (
          <div className="relative w-8 h-8 flex-shrink-0 self-end mb-1">
            <Avatar className="w-8 h-8 rounded-full">
              <AvatarImage src={msg.avatar} />
              <AvatarFallback 
                className="text-white font-medium text-xs"
                style={{ backgroundColor: bgColor }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Message Content */}
        <div className={`flex flex-col ${
          msg.sender === "me" ? "items-end" : "items-start"
        }`}>
          {/* Message Bubble */}
          <Card
            className={`px-3 py-2 sm:px-4 sm:py-3 border-none shadow-sm relative ${
              msg.sender === "me"
                ? "bg-blue-500 text-white rounded-2xl rounded-br-md"
                : "bg-white text-gray-900 border border-gray-200 rounded-2xl rounded-bl-md"
            }`}
          >
            <MessageOptionsDropdown
              index={index}
              msg={msg}
              openSubMenu={openSubMenu}
              toggleSubMenu={toggleSubMenu}
              setReplyingMessage={setReplyingMessage}
            />

            {msg.type === "text" ? (
              <p className="text-sm sm:text-base leading-relaxed break-words">
                {msg.text}
              </p>
            ) : (
              <AudioMessage sender={msg.sender} />
            )}
          </Card>

          {/* Time and Status */}
          <div className={`flex items-center gap-1 text-xs text-gray-400 mt-1 px-1 ${
            msg.sender === "me" ? "flex-row-reverse" : "flex-row"
          }`}>
            <span>{msg.time}</span>
            {msg.sender === "me" && (
              <CheckCheck size={12} className="text-blue-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
