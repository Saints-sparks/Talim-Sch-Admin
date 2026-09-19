import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import BubbleMenu from "./BubbleMenu";
import MessageBody from "./MessageBody";
import type { ChatReplyTo, ReplyDraft } from "@/components/chat-kit";
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
    _id: string;
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
    replyTo?: ChatReplyTo;
    isDeleted?: boolean;
    /** Tick state, for my own messages. */
    deliveryState?: DeliveryState;
    /** "Read by N" — set only on my latest message. */
    readByCount?: number;
  };
  onRetry?: () => void;
  onDelete?: () => void;
  /** Start a reply to this message. */
  onReply?: (reply: ReplyDraft) => void;
  /** Present when this user may delete this message. */
  onDeleteMessage?: () => Promise<void>;
  /** Scroll to a quoted message; omitted for one that isn't loaded. */
  onJump?: (messageId: string) => void;
}

export default function GroupMessageBubble({
  msg,
  onReply,
  onDeleteMessage,
  onJump,
  onRetry,
  onDelete,
}: MessageBubbleProps) {
  const isMe = msg.senderType === "self";
  const initials = msg.initials || getUserInitials(msg.sender);
  const bgColor = msg.color || generateColorFromString(msg.sender);

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
            className={`px-3 py-2 sm:px-4 sm:py-3 border-none shadow-sm relative group ${
              isMe
                ? "bg-blue-500 text-white rounded-2xl rounded-br-md"
                : "bg-white text-gray-900 border border-gray-200 rounded-2xl rounded-bl-md"
            }`}
          >
            <BubbleMenu
              msg={msg}
              isMe={isMe}
              onReply={
                onReply
                  ? () => onReply({ messageId: msg._id, senderName: msg.sender, preview: msg.text || (msg.attachments?.length ? "Attachment" : "") })
                  : undefined
              }
              onDeleteMessage={onDeleteMessage}
            />
            <MessageBody msg={msg} isMe={isMe} onJump={onJump} />
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
