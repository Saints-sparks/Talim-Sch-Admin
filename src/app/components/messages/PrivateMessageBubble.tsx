import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CheckCheck, Download, FileText } from "lucide-react";
import MessageOptionsDropdown from "./MessageDropDown";
import AudioMessage from "./AudioMessage";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";

interface Attachment {
  url: string;
  type: string;
  name: string;
  mimeType?: string;
  duration?: number;
}

interface MessageBubbleProps {
  msg: {
    senderType: string;
    avatar: string;
    sender: string;
    color: string;
    type: string;
    text?: string;
    videoThumbnail?: string;
    duration?: string | number;
    time: string;
    initials?: string;
    attachments?: Attachment[];
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
  const isCurrentUser = msg.senderType === "self" || msg.senderType === "me";
  const initials = msg.initials || getUserInitials(msg.sender);
  const bgColor = msg.color || generateColorFromString(msg.sender);
  const attachment = msg.attachments?.[0];

  const renderContent = () => {
    if (msg.type === "audio" || msg.type === "voice") {
      return (
        <AudioMessage
          sender={isCurrentUser ? "me" : msg.sender}
          audioUrl={attachment?.url}
          duration={typeof attachment?.duration === "number" ? attachment.duration : undefined}
        />
      );
    }

    if (msg.type === "image" && attachment?.url) {
      return (
        <div>
          <img
            src={attachment.url}
            alt={attachment.name || "Image"}
            className="rounded-lg max-w-[220px] max-h-[220px] object-cover"
          />
          {msg.text && <p className="text-sm leading-relaxed break-words mt-1">{msg.text}</p>}
        </div>
      );
    }

    if (msg.type === "file" && attachment?.url) {
      return (
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          download={attachment.name}
          className={`flex items-center gap-2 text-sm underline-offset-2 hover:underline ${
            isCurrentUser ? "text-white" : "text-blue-600"
          }`}
        >
          <FileText size={16} className="flex-shrink-0" />
          <span className="truncate max-w-[160px]">{attachment.name || "File"}</span>
          <Download size={14} className="flex-shrink-0 ml-auto" />
        </a>
      );
    }

    return <p className="text-sm sm:text-base leading-relaxed break-words">{msg.text}</p>;
  };

  return (
    <div
      className={`relative flex items-end ${
        isCurrentUser ? "justify-end" : "justify-start"
      } gap-2 px-2 sm:px-0 mb-3`}
    >
      <div
        className={`flex gap-2 max-w-[85%] sm:max-w-md ${
          isCurrentUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
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

        <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
          {!isCurrentUser && (
            <span className="text-xs text-gray-600 mb-1 ml-1 font-medium">{msg.sender}</span>
          )}

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
            {renderContent()}
          </Card>

          <div
            className={`flex items-center gap-1 text-xs text-gray-400 mt-1 px-1 ${
              isCurrentUser ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <span>{msg.time}</span>
            {isCurrentUser && <CheckCheck size={12} className="text-blue-400" />}
          </div>
        </div>
      </div>
    </div>
  );
}
