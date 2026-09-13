"use client";

import { useRef, useCallback, useMemo } from "react";
import type { UseChatsReturn } from "@/hooks/useChats";
import type { DisplayChatRoom } from "@/lib/chat/rooms";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageBubble from "./PrivateMessageBubble";
import ReplyPreview from "./ReplyPreview";
import ThreadNotices from "./ThreadNotices";
import { useChatThread } from "./useChatThread";
import { useThreadScroll } from "./useThreadScroll";
import { Loader2, MessageCircle } from "lucide-react";

interface MsgAttachment {
  url: string;
  type: string;
  name: string;
  mimeType?: string;
  duration?: number;
}

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
  color: string;
  duration?: number;
  attachments?: MsgAttachment[];
  status?: "pending" | "failed";
  error?: string;
}

interface PrivateChatProps {
  replyingMessage: { sender: string; text: string } | null;
  setReplyingMessage: (msg: any) => void;
  openSubMenu: { index: number; type: string } | null;
  toggleSubMenu: (index: number, type: string) => void;
  room: DisplayChatRoom;
  onBack?: () => void; // Navigation back to chat list
  chats: UseChatsReturn;
}

export default function PrivateChat({
  replyingMessage,
  setReplyingMessage,
  openSubMenu,
  toggleSubMenu,
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
  const { draft, updateDraft, sendText, sendFile, sendVoice } = useChatThread(chats, room.roomId);

  const participantById = useMemo(() => {
    const map = new Map<string, DisplayChatRoom["participants"][number]>();
    room.participants.forEach((p) => p.userId && map.set(p.userId, p));
    return map;
  }, [room.participants]);

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
          color: isMine ? "bg-blue-500" : "bg-gray-500",
          avatar: msg.senderAvatar || participant?.userAvatar || "",
          duration: msg.duration,
          attachments: msg.attachments,
          status: msg.status,
          error: msg.error,
        };
      }),
    [chatMessages, currentUserId, participantById, room.displayName]
  );

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
        avatar: other.userAvatar || "/icons/direct-message.svg",
        status: other.isOnline ? "Online" : "Offline",
      };
    }
    return {
      name: room.displayName || "Private Chat",
      avatar: "/icons/direct-message.svg",
      status: "",
    };
  }, [room, currentUserId]);

  // Format date for message grouping
  const formatMessageDate = useCallback((date: Date) => {
    const today = new Date();
    const messageDate = new Date(date);

    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const messageMidnight = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());
    const yesterday = new Date(todayMidnight);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageMidnight.getTime() === todayMidnight.getTime()) {
      return "Today";
    }
    if (messageMidnight.getTime() === yesterday.getTime()) {
      return "Yesterday";
    }
    return messageDate.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

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
    <div className="w-full h-full flex flex-col relative bg-white">
      <ChatHeader
        avatar={otherParticipant.avatar}
        name={otherParticipant.name}
        subtext={otherParticipant.status}
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
        className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3 bg-gray-50"
        ref={messagesContainerRef}
        onScroll={onScroll}
      >
        {/* Loading indicator for more messages */}
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          </div>
        )}

        {showBlockingLoader ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-gray-500">Loading messages...</p>
          </div>
        ) : threadStatus === "error" && messages.length === 0 ? null : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-2">No messages yet</p>
            <p className="text-xs text-gray-400">Send a message to start the conversation</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.key}>
              {/* Date divider */}
              <div className="flex justify-center my-4">
                <div className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                  {formatMessageDate(new Date(group.key))}
                </div>
              </div>

              {/* Messages for this date */}
              {group.messages.map((msg, index) => (
                <MessageBubble
                  key={msg.clientMessageId || msg._id}
                  msg={msg}
                  index={index}
                  openSubMenu={openSubMenu}
                  toggleSubMenu={toggleSubMenu}
                  setReplyingMessage={setReplyingMessage}
                  onRetry={msg.clientMessageId ? () => retryMessage(msg.clientMessageId!) : undefined}
                  onDelete={msg.clientMessageId ? () => deleteFailedMessage(msg.clientMessageId!) : undefined}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {replyingMessage && (
        <ReplyPreview replyingMessage={replyingMessage} onCancel={() => setReplyingMessage(null)} />
      )}

      <MessageInput
        value={draft}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDraft(e.target.value)}
        onSend={sendText}
        onSendFile={sendFile}
        onSendVoice={sendVoice}
        placeholder={isConnected ? "Type a message..." : "Offline — messages send when you're back"}
      />
    </div>
  );
}
