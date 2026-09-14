import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import MessageOptionsDropdown from "./MessageDropDown";
import AudioMessage from "./AudioMessage";
import MessageDeliveryStatus from "./MessageDeliveryStatus";
import MessageTicks from "./MessageTicks";
import type { DeliveryState } from "@/lib/chat/readReceipts";
import VideoMessage from "./VideoMessage";
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
    status?: "pending" | "failed";
    error?: string;
    /** Tick state, for my own messages. */
    deliveryState?: DeliveryState;
    /** "Read by N" — set only on my latest message. */
    readByCount?: number;
  };
  index: number;
  onRetry?: () => void;
  onDelete?: () => void;
  openSubMenu: { index: number; type: string } | null;
  toggleSubMenu: (index: number, type: string) => void;
  setReplyingMessage: (msg: any) => void;
}

export default function GroupMessageBubble({
  msg,
  index,
  openSubMenu,
  toggleSubMenu,
  setReplyingMessage,
  onRetry,
  onDelete,
}: MessageBubbleProps) {
  const isMe = msg.senderType === "self";
  const initials = msg.initials || getUserInitials(msg.sender);
  const bgColor = msg.color || generateColorFromString(msg.sender);
  const attachment = msg.attachments?.[0];

  const renderContent = () => {
    if (msg.type === "audio" || msg.type === "voice") {
      return (
        <AudioMessage
          sender={isMe ? "me" : msg.sender}
          audioUrl={attachment?.url}
          duration={
            typeof attachment?.duration === "number"
              ? attachment.duration
              : typeof msg.duration === "number"
                ? msg.duration
                : undefined
          }
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
          {msg.text && (
            <p className="text-sm leading-relaxed break-words mt-1">{msg.text}</p>
          )}
        </div>
      );
    }

    if (msg.type === "file" && attachment && !attachment.url) {
      // Still uploading.
      return (
        <span className="flex items-center gap-2 text-sm">
          <FileText size={16} className="flex-shrink-0" />
          <span className="truncate max-w-[160px]">{attachment.name || "File"}</span>
        </span>
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
            isMe ? "text-white" : "text-blue-600"
          }`}
        >
          <FileText size={16} className="flex-shrink-0" />
          <span className="truncate max-w-[160px]">{attachment.name || "File"}</span>
          <Download size={14} className="flex-shrink-0 ml-auto" />
        </a>
      );
    }

    if (msg.type === "video") {
      return (
        <VideoMessage
          videoThumbnail={msg.videoThumbnail || ""}
          videoDuration={typeof msg.duration === "string" ? msg.duration : ""}
          messageText={msg.text || ""}
        />
      );
    }

    return (
      <p className="text-sm sm:text-base leading-relaxed break-words">
        {msg.text}
      </p>
    );
  };

  return (
    <div
      className={`relative flex items-end ${
        isMe ? "justify-end" : "justify-start"
      } gap-2 px-2 sm:px-0 mb-3`}
    >
      <div className={`flex gap-2 max-w-[85%] sm:max-w-md ${
        isMe ? "flex-row-reverse" : "flex-row"
      }`}>
        {!isMe && (
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

        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
          {msg.sender !== "me" && !isMe && (
            <div className="mb-1 px-1">
              <p className="text-xs font-semibold" style={{ color: bgColor }}>
                {msg.sender}
              </p>
            </div>
          )}

          <Card
            className={`px-3 py-2 sm:px-4 sm:py-3 border-none shadow-sm relative ${
              isMe
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

          <div className={`flex items-center gap-1 text-xs text-gray-400 mt-1 px-1 ${
            isMe ? "flex-row-reverse" : "flex-row"
          }`}>
            <span>{msg.time}</span>
            {msg.status ? (
              <MessageDeliveryStatus status={msg.status} error={msg.error} onRetry={onRetry} onDelete={onDelete} />
            ) : (
              isMe && (
                <>
                  <MessageTicks state={msg.deliveryState} />
                  {typeof msg.readByCount === "number" && msg.readByCount > 0 && (
                    <span className="text-gray-400">Read by {msg.readByCount}</span>
                  )}
                </>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
