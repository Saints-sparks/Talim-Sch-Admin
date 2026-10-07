"use client";

import { useRef, useCallback, useMemo } from "react";
import type { UseChatsReturn } from "@/hooks/useChats";
import type { ChatAttachment } from "@/types/chat.types";
import type { DisplayChatRoom } from "@/lib/chat/rooms";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageBubble from "./PrivateMessageBubble";
import { ReplyBar, type ChatReplyTo, type ReplyDraft } from "@/components/chat-kit";
import { useMessageActions } from "./useMessageActions";
import ThreadNotices from "./ThreadNotices";
import { useChatThread } from "./useChatThread";
import { useThreadScroll } from "./useThreadScroll";
import { formatDateSeparator } from "@/lib/chat/dates";
import { Loader2, MessageCircle } from "lucide-react";
import { EmptyNote } from "@/components/tl";
import { deliveryState, type DeliveryState } from "@/lib/chat/readReceipts";

type MsgAttachment = ChatAttachment;

// Define the message structure for our UI
interface Message {
  _id: string;
  clientMessageId?: string;
  sender: string;
  senderId: string;
  text: string;
  time: string;
  createdAt: Date;
  type: string;
  senderType: "self" | "other";
  avatar: string;
  duration?: number;
  attachments?: MsgAttachment[];
  replyTo?: ChatReplyTo;
  isDeleted?: boolean;
  status?: "pending" | "failed";
  error?: string;
  uploadProgress?: number[];
  deliveryState?: DeliveryState;
}

interface PrivateChatProps {
  replyingMessage: ReplyDraft | null;
  setReplyingMessage: (msg: ReplyDraft | null) => void;
  room: DisplayChatRoom;
  onBack?: () => void; // Navigation back to chat list
  chats: UseChatsReturn;
}

/**
 * A direct-message thread: header (with the room's subtitle), messages
 * grouped by day, reply bar and composer.
 *
 * @param props.room - The room as the list shows it.
 * @param props.replyingMessage - The message being replied to, if any.
 * @param props.setReplyingMessage - Starts or cancels a reply.
 * @param props.onBack - Back to the list (mobile).
 * @param props.chats - The chat state from `useChats`.
 * @returns The thread.
 */
export default function PrivateChat({
  replyingMessage,
  setReplyingMessage,
  room,
  onBack,
  chats,
}: PrivateChatProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const {
    currentRoom,
    currentUserId,
    messages: chatMessages,
    threadStatus,
    threadError,
    isLoadingMore,
    hasMoreMessages,
    isConnected,
    loadMoreMessages,
    retryCurrentRoom,
    retryMessage,
    deleteFailedMessage,
  } = chats;
  const clearReply = useCallback(() => setReplyingMessage(null), [setReplyingMessage]);
  const { draft, updateDraft, sendText, sendFiles, sendVoice } = useChatThread(
    chats,
    room.roomId,
    replyingMessage,
    clearReply
  );

  const participantById = useMemo(() => {
    const map = new Map<string, DisplayChatRoom["participants"][number]>();
    room.participants.forEach((p) => p.userId && map.set(p.userId, p));
    return map;
  }, [room.participants]);

  const otherUserId = useMemo(
    () => room.participants.find((p) => p.userId && p.userId !== currentUserId)?.userId,
    [room.participants, currentUserId]
  );

  const messages = useMemo<Message[]>(
    () =>
      chatMessages.map((msg) => {
        // Own-message detection is by id only.
        const isMine = Boolean(currentUserId) && msg.senderId === currentUserId;
        const participant = participantById.get(msg.senderId);
        const sender = isMine ? "Me" : msg.senderName || participant?.name || room.displayName || "User";
        return {
          _id: msg._id,
          clientMessageId: msg.clientMessageId,
          sender,
          senderId: msg.senderId,
          text: msg.content,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          createdAt: msg.createdAt,
          type: msg.type || "text",
          senderType: isMine ? "self" : "other",
          avatar: msg.senderAvatar || participant?.userAvatar || "",
          duration: msg.duration,
          attachments: msg.attachments,
          replyTo: msg.replyTo,
          isDeleted: msg.isDeleted,
          status: msg.status,
          error: msg.error,
          uploadProgress: msg.uploadProgress,
          deliveryState: isMine ? deliveryState(msg, otherUserId) : undefined,
        };
      }),
    [chatMessages, currentUserId, participantById, room.displayName, otherUserId]
  );

  const { deleteHandlerFor, jumpFor } = useMessageActions(chats, room.roomId, false, messages);

  const { onScroll } = useThreadScroll({
    containerRef: messagesContainerRef,
    items: messages,
    canLoadOlder: hasMoreMessages && !isLoadingMore && threadStatus === "ready",
    loadOlder: loadMoreMessages,
  });

  // The other person in this conversation — the participant who isn't me.
  const otherParticipant = useMemo(() => {
    const other = room.participants.find((p) => p.userId && p.userId !== currentUserId);
    if (other) {
      return {
        name: other.name || room.displayName || "Unknown User",
        avatar: other.userAvatar || "",
        status: other.isOnline ? "Online" : "Offline",
      };
    }
    return {
      name: room.displayName || "Private Chat",
      avatar: "",
      status: "",
    };
  }, [room, currentUserId]);


  // Group messages by date (messages are already in order)
  const groupedMessages = useMemo(() => {
    const groups: { key: string; messages: Message[] }[] = [];
    messages.forEach((message) => {
      const key = new Date(message.createdAt).toDateString();
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.messages.push(message);
      else groups.push({ key, messages: [message] });
    });
    return groups;
  }, [messages]);

  const showBlockingLoader = threadStatus === "loading" && messages.length === 0;

  return (
    <div className="relative flex h-full min-h-0 w-full flex-col bg-tl-surface">
      <ChatHeader
        avatar={otherParticipant.avatar}
        name={otherParticipant.name}
        status={otherParticipant.status}
        subtext={room.subtitle}
        onBack={onBack}
        showBackButton={true}
        isGroup={false}
        roomType={currentRoom?.type ?? room.roomType}
        chatRoomId={room.roomId}
        participants={room.participants}
        currentUserId={currentUserId}
      />

      <ThreadNotices
        isConnected={isConnected}
        threadStatus={threadStatus}
        threadError={threadError}
        hasMessages={messages.length > 0}
        onRetry={retryCurrentRoom}
      />

      <div
        className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-tl-subtle p-3 sm:p-[18px]"
        ref={messagesContainerRef}
        onScroll={onScroll}
      >
        {/* Loading indicator for more messages */}
        {isLoadingMore && (
          <div className="flex justify-center py-2" role="status" aria-label="Loading older messages">
            <Loader2 className="h-5 w-5 animate-spin text-tl-brand" aria-hidden />
          </div>
        )}

        {showBlockingLoader ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2" role="status">
            <Loader2 className="h-8 w-8 animate-spin text-tl-brand" aria-hidden />
            <p className="text-sm text-tl-muted">Loading messages...</p>
          </div>
        ) : threadStatus === "error" && messages.length === 0 ? null : messages.length === 0 ? (
          <EmptyNote title="No messages yet" icon={<MessageCircle />}>
            Send a message to start the conversation
          </EmptyNote>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.key}>
              {/* Date divider */}
              <div className="my-3 flex items-center justify-center">
                <div className="rounded-full bg-tl-track px-3 py-1 text-xs font-bold text-tl-muted">
                  {formatDateSeparator(group.key)}
                </div>
              </div>

              {/* Messages for this date */}
              {group.messages.map((msg) => (
                <div
                  key={msg.clientMessageId || msg._id}
                  id={`msg-${msg._id}`}
                  className="rounded-2xl transition-colors duration-500"
                >
                  <MessageBubble
                    msg={msg}
                    onReply={setReplyingMessage}
                    onDeleteMessage={deleteHandlerFor(msg)}
                    onJump={jumpFor(msg)}
                    onRetry={msg.clientMessageId ? () => retryMessage(msg.clientMessageId!) : undefined}
                    onDelete={msg.clientMessageId ? () => deleteFailedMessage(msg.clientMessageId!) : undefined}
                  />
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {replyingMessage && (
        <ReplyBar reply={replyingMessage} onCancel={clearReply} className="mx-3 mt-3 rounded-xl sm:mx-[18px]" />
      )}

      <MessageInput
        value={draft}
        onValueChange={updateDraft}
        onSend={sendText}
        onSendFiles={sendFiles}
        onSendVoice={sendVoice}
        placeholder={isConnected ? "Type a message..." : "Offline — messages send when you're back"}
      />
    </div>
  );
}
