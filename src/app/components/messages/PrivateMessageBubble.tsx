import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CheckCheck } from "lucide-react";
import MessageOptionsDropdown from "./MessageDropDown";
import AudioMessage from "./AudioMessage";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";

interface MessageBubbleProps {
  msg: {
    senderType: string; // 'self' or 'me' for current user, 'other' for others
    avatar: string;
    sender: string;
    color: string;
    type: string;
    text?: string;
    videoThumbnail?: string;
    duration?: string;
    time: string;
    initials?: string; // Add initials field
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
  // Check if message is from current user (self/me)
  const isCurrentUser = msg.senderType === "self" || msg.senderType === "me";
  
  // Get initials - either from props or generate from sender name
  const initials = msg.initials || getUserInitials(msg.sender);
  
  // Generate or use provided color
  const bgColor = msg.color || generateColorFromString(msg.sender);

  return (
    <div
      className={`relative flex items-end ${
        isCurrentUser ? "justify-end" : "justify-start"
      } gap-2 px-2 sm:px-0 mb-3`}
    >
      <div className={`flex gap-2 max-w-[85%] sm:max-w-md ${
        isCurrentUser ? "flex-row-reverse" : "flex-row"
      }`}>
        {/* Avatar - only show for other users, not self */}
        {!isCurrentUser && (
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
          isCurrentUser ? "items-end" : "items-start"
        }`}>
          {/* Sender Name - only show for other users in group chats */}
          {!isCurrentUser && (
            <span className="text-xs text-gray-600 mb-1 ml-1 font-medium">
              {msg.sender}
            </span>
          )}
          
          {/* Message Bubble */}
          <Card
            className={`px-3 py-2 sm:px-4 sm:py-3 border-none shadow-sm relative ${
              isCurrentUser
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
            ) : msg.type === "audio" ? (
              <AudioMessage sender={msg.sender} />
            ) : (
              <p className="text-sm sm:text-base leading-relaxed break-words">
                {msg.text}
              </p>
            )}
          </Card>

          {/* Time and Status */}
          <div className={`flex items-center gap-1 text-xs text-gray-400 mt-1 px-1 ${
            isCurrentUser ? "flex-row-reverse" : "flex-row"
          }`}>
            <span>{msg.time}</span>
            {isCurrentUser && (
              <CheckCheck size={12} className="text-blue-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}