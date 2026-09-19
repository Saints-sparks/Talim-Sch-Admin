import { Ban } from "lucide-react";
import { AttachmentGrid, Linkified, QuotedMessage, type ChatKitAttachment, type ChatReplyTo } from "@/components/chat-kit";

interface MessageBodyProps {
  msg: {
    text?: string;
    attachments?: ChatKitAttachment[];
    status?: "pending" | "failed";
    uploadProgress?: number[];
    isDeleted?: boolean;
    replyTo?: ChatReplyTo;
  };
  isMe: boolean;
  /** Scroll to a quoted message; omitted for one that isn't in the loaded thread. */
  onJump?: (messageId: string) => void;
}

/** What is inside a bubble: the quote, the media, the text, or the "deleted" placeholder. */
export default function MessageBody({ msg, isMe, onJump }: MessageBodyProps) {
  const tone = isMe ? "inverted" : "default";

  if (msg.isDeleted) {
    return (
      <p className="flex items-center gap-1.5 text-sm italic opacity-80">
        <Ban size={14} aria-hidden /> This message was deleted
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {msg.replyTo && <QuotedMessage replyTo={msg.replyTo} tone={tone} onJump={onJump} />}
      {Boolean(msg.attachments?.length) && (
        <AttachmentGrid
          attachments={msg.attachments ?? []}
          tone={tone}
          pending={Boolean(msg.status)}
          failed={msg.status === "failed"}
          progress={msg.status === "pending" ? msg.uploadProgress : undefined}
        />
      )}
      {msg.text && (
        <p className="text-sm sm:text-base leading-relaxed break-words whitespace-pre-wrap">
          <Linkified text={msg.text} tone={tone} />
        </p>
      )}
    </div>
  );
}
