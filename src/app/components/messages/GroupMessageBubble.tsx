import BubbleMenu from "./BubbleMenu";
import MessageBody from "./MessageBody";
import type { ChatReplyTo, ReplyDraft } from "@/components/chat-kit";
import MessageDeliveryStatus from "./MessageDeliveryStatus";
import MessageTicks from "./MessageTicks";
import type { DeliveryState } from "@/lib/chat/readReceipts";
import { toneClass } from "@/components/tl";
import { PersonAvatar, bubbleFrame } from "./parts";

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

/** Props for {@link GroupMessageBubble}. */
interface MessageBubbleProps {
  msg: {
    _id: string;
    senderType: string;
    avatar: string;
    sender: string;
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

/**
 * One group message: the sender's avatar and name (in their own tone) over
 * other people's messages, the bubble (navy for mine, white for theirs) with
 * its menu and content, and the time with the delivery state and "Read by N"
 * under it.
 *
 * @param props - See {@link MessageBubbleProps}.
 * @param props.msg - The message as the thread shows it.
 * @param props.onReply - Starts a reply.
 * @param props.onDeleteMessage - Deletes it, when allowed.
 * @param props.onJump - Scrolls to a quoted message.
 * @param props.onRetry - Resends a failed message.
 * @param props.onDelete - Drops a failed message.
 * @returns The bubble row.
 */
export default function GroupMessageBubble({
  msg,
  onReply,
  onDeleteMessage,
  onJump,
  onRetry,
  onDelete,
}: MessageBubbleProps) {
  const isMe = msg.senderType === "self";

  return (
    <div className={`relative mb-3 flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[85%] gap-2 sm:max-w-md ${isMe ? "flex-row-reverse" : "flex-row"}`}>
        {!isMe && (
          <div className="mb-6 self-end">
            <PersonAvatar id={msg.sender} name={msg.sender} initials={msg.initials} src={msg.avatar || null} size={32} />
          </div>
        )}

        <div className={`flex min-w-0 flex-col ${isMe ? "items-end" : "items-start"}`}>
          {msg.sender !== "me" && !isMe && (
            // Each sender keeps a stable tone; its text shade is readable on the thread in both themes.
            <p className={`${toneClass(msg.sender)} mb-1 px-1 text-xs font-extrabold text-tone-fg`}>{msg.sender}</p>
          )}

          <div className={bubbleFrame(isMe)}>
            <BubbleMenu
              msg={msg}
              isMe={isMe}
              onReply={
                onReply
                  ? () =>
                      onReply({
                        messageId: msg._id,
                        senderName: msg.sender,
                        preview: msg.text || (msg.attachments?.length ? "Attachment" : ""),
                      })
                  : undefined
              }
              onDeleteMessage={onDeleteMessage}
            />
            <MessageBody msg={msg} isMe={isMe} onJump={onJump} />
          </div>

          <div className={`mt-1 flex items-center gap-1 px-1 text-[11px] text-tl-faint ${isMe ? "flex-row-reverse" : "flex-row"}`}>
            <span>{msg.time}</span>
            {msg.status ? (
              <MessageDeliveryStatus status={msg.status} error={msg.error} onRetry={onRetry} onDelete={onDelete} />
            ) : (
              isMe && (
                <>
                  <MessageTicks state={msg.deliveryState} />
                  {typeof msg.readByCount === "number" && msg.readByCount > 0 && (
                    <span>Read by {msg.readByCount}</span>
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
