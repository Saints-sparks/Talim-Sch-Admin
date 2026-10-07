import { Ban } from "lucide-react";
import { AttachmentGrid, Linkified, QuotedMessage, type ChatKitAttachment, type ChatReplyTo } from "@/components/chat-kit";

/** Props for {@link MessageBody}. */
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

/**
 * What is inside a bubble: the quote, the media, the text, or the "deleted"
 * placeholder. The chat kit draws the quote, media and links; the text sits
 * in spans inside one paragraph.
 *
 * @param props - The message, whose bubble it is, and the jump handler.
 * @param props.msg - The message.
 * @param props.isMe - Whether it is the viewer's (the navy bubble).
 * @param props.onJump - Scrolls to a quoted message.
 * @returns The content.
 */
export default function MessageBody({ msg, isMe, onJump }: MessageBodyProps) {
  const tone = isMe ? "inverted" : "default";

  if (msg.isDeleted) {
    return (
      <p className={`flex items-center gap-1.5 text-sm italic ${isMe ? "" : "text-tl-muted"}`}>
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
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
          <Linkified text={msg.text} tone={tone} />
        </p>
      )}
    </div>
  );
}
