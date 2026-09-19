"use client";

import { MessageMenu, type ChatKitAttachment } from "@/components/chat-kit";
import { toast } from "@/components/CustomToast";

interface BubbleMenuProps {
  msg: {
    _id: string;
    text?: string;
    attachments?: ChatKitAttachment[];
    status?: "pending" | "failed";
    isDeleted?: boolean;
  };
  isMe: boolean;
  onReply?: () => void;
  /** Present when this user may delete this message. */
  onDeleteMessage?: () => Promise<void>;
}

/** The message options for one bubble. Only on stored, not-deleted messages. */
export default function BubbleMenu({ msg, isMe, onReply, onDeleteMessage }: BubbleMenuProps) {
  if (msg.status || msg.isDeleted || !msg._id) return null;
  return (
    <MessageMenu
      messageId={msg._id}
      text={msg.text}
      attachments={msg.attachments}
      onReply={onReply}
      onDelete={onDeleteMessage}
      onNotify={(message) => (/copied/i.test(message) ? toast.success(message) : toast.error(message))}
      tone={isMe ? "inverted" : "default"}
      className="absolute right-1 top-1 z-10"
    />
  );
}
