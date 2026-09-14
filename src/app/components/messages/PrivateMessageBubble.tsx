import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import MessageOptionsDropdown from "./MessageDropDown";
import { AttachmentGrid } from "@/components/chat-kit";
import MessageDeliveryStatus from "./MessageDeliveryStatus";
import MessageTicks from "./MessageTicks";
import type { DeliveryState } from "@/lib/chat/readReceipts";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";

interface Attachment {
  url: string;
  type: string;
  name: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
  playbackUrl?: string;
}

interface MessageBubbleProps {
  msg: {
    senderType: string;
    avatar: string;
    sender: string;
    color: string;
    type: string;
    text?: string;
    duration?: string | number;
    time: string;
    initials?: string;
    attachments?: Attachment[];
    status?: "pending" | "failed";
    error?: string;
    /** Local upload progress per attachment while sending. */
    uploadProgress?: number[];
    /** Tick state, for my own messages. */
    deliveryState?: DeliveryState;
  };
  index: number;
  onRetry?: () => void;
  onDelete?: () => void;
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
  onRetry,
  onDelete,
}: MessageBubbleProps) {
  const isCurrentUser = msg.senderType === "self" || msg.senderType === "me";
  const initials = msg.initials || getUserInitials(msg.sender);
  const bgColor = msg.color || generateColorFromString(msg.sender);

  const renderContent = () => {
    const hasAttachments = Boolean(msg.attachments?.length);
    return (
      <div className="flex flex-col gap-1.5">
        {hasAttachments && (
          <AttachmentGrid
            attachments={msg.attachments ?? []}
            tone={isCurrentUser ? "inverted" : "default"}
            pending={Boolean(msg.status)}
            failed={msg.status === "failed"}
            progress={msg.status === "pending" ? msg.uploadProgress : undefined}
          />
        )}
        {msg.text && (
          <p className="text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
        )}
      </div>
    );
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
            {msg.status ? (
              <MessageDeliveryStatus status={msg.status} error={msg.error} onRetry={onRetry} onDelete={onDelete} />
            ) : (
              isCurrentUser && <MessageTicks state={msg.deliveryState} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
