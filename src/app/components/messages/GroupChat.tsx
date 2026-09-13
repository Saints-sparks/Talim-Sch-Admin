"use client";

import { useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import type { UseChatsReturn } from "@/hooks/useChats";
import type { DisplayChatRoom } from "@/lib/chat/rooms";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import GroupMessageBubble from "./GroupMessageBubble";
import ReplyPreview from "./ReplyPreview";
import ThreadNotices from "./ThreadNotices";
import { useChatThread } from "./useChatThread";
import { useThreadScroll } from "./useThreadScroll";
import { Loader2, MessageCircle } from "lucide-react";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";

interface MsgAttachment {
  url: string;
  type: string;
  name: string;
  mimeType?: string;
  duration?: number;
}

interface Message {
  _id: string;
  clientMessageId?: string;
  sender: string;
  senderId: string;
  text: string;
  time: string;
  createdAt: string;
  type: string;
  senderType: "self" | "other";
  avatar: string;
  color: string;
  initials: string;
  duration?: number;
  attachments?: MsgAttachment[];
  status?: "pending" | "failed";
  error?: string;
}

interface GroupChatProps {
  replyingMessage: { sender: string; text: string } | null;
  setReplyingMessage: (msg: { sender: string; text: string } | null) => void;
  openSubMenu: { index: number; type: string } | null;
  toggleSubMenu: (index: number, type: string) => void;
  room: DisplayChatRoom;
  onBack?: () => void;
  chats: UseChatsReturn;
}

export default function GroupChat({
  replyingMessage,
  setReplyingMessage,
  openSubMenu,
  toggleSubMenu,
  room,
  onBack,
  chats,
}: GroupChatProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
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
  const roomId = room.roomId;
  const { draft, updateDraft, sendText, sendFile, sendVoice } = useChatThread(chats, roomId);

  const getMessageDayKey = useCallback((value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
  }, []);

  const formatDateSeparator = useCallback((value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const today = new Date();
    const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const dateKey = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const diffDays = Math.round((todayKey - dateKey) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";

    return date.toLocaleDateString([], {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  const currentUserName = useMemo(() => {
    if (!user) return "";
    return user.firstName && user.lastName ? `${user.firstName} ${user.lastName}`.trim() : user.email || "User";
  }, [user]);

  const participantById = useMemo(() => {
    const map = new Map<string, DisplayChatRoom["participants"][number]>();
    room.participants.forEach((p) => p.userId && map.set(p.userId, p));
    return map;
  }, [room.participants]);

  // Transform messages for UI. Own messages (including ones sent from another
  // device) are recognised by sender id only.
  const messages = useMemo<Message[]>(
    () =>
      chatMessages.map((msg) => {
        const isMine = Boolean(currentUserId) && msg.senderId === currentUserId;
        const participant = participantById.get(msg.senderId);
        const senderName = isMine ? currentUserName : msg.senderName || participant?.name || "User";
        return {
          _id: msg._id,
          clientMessageId: msg.clientMessageId,
          sender: senderName,
          senderId: msg.senderId,
          text: msg.content,
          time: new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          createdAt: new Date(msg.createdAt).toISOString(),
          type: msg.type || "text",
          senderType: isMine ? "self" : "other",
          color: generateColorFromString(senderName || msg.senderId),
          avatar: msg.senderAvatar || participant?.userAvatar || "",
          initials: getUserInitials(senderName),
          duration: msg.duration,
          attachments: msg.attachments,
          status: msg.status,
          error: msg.error,
        };
      }),
    [chatMessages, currentUserId, currentUserName, participantById]
  );

  const { onScroll } = useThreadScroll({
    containerRef: messagesContainerRef,
    items: messages,
    canLoadOlder: hasMoreMessages && !isLoadingMore && threadStatus === "ready",
    loadOlder: loadMoreMessages,
  });

  // Get room name and participants info
  const roomInfo = useMemo(() => {
    const participants = room.participants;
    const participantCount = participants.length;

    // Get first 3 participant names for subtext
    const participantNames = participants
      .slice(0, 3)
      .map((p) => p.name || "User")
      .join(", ");

    return {
      name: room.displayName || "Group Chat",
      participantCount,
      participantList: participantNames + (participantCount > 3 ? ` and ${participantCount - 3} others` : ""),
    };
  }, [room]);

  const roomAvatarInitials = useMemo(() => {
    if (room.avatarInfo?.type === "initials" && room.avatarInfo.value) {
      return room.avatarInfo.value;
    }
    return getUserInitials(roomInfo.name);
  }, [room.avatarInfo, roomInfo.name]);

  const showBlockingLoader = threadStatus === "loading" && messages.length === 0;

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <ChatHeader
        avatar={room.avatarInfo?.type === "image" ? room.avatarInfo.value : "/icons/chat.svg"}
        name={roomInfo.name}
        status="Group chat"
        subtext={roomInfo.participantList}
        participants={room.participants}
        currentUserId={currentUserId}
        onBack={onBack}
        showBackButton={!!onBack}
        initials={roomAvatarInitials}
        isGroup={true}
        roomType={currentRoom?.type ?? room.roomType}
        chatRoomId={roomId}
      />

      <ThreadNotices
        isConnected={isConnected}
        threadStatus={threadStatus}
        threadError={threadError}
        hasMessages={messages.length > 0}
        onRetry={retryCurrentRoom}
      />

      <div
        ref={messagesContainerRef}
        onScroll={onScroll}
        className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50 space-y-3"
      >
        {/* Loading indicator for more messages */}
        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}

        {showBlockingLoader ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-3" />
            <p className="text-gray-600">Loading messages...</p>
          </div>
        ) : threadStatus === "error" && messages.length === 0 ? null : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-gray-500">
            <MessageCircle className="w-20 h-20 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800">No messages yet</h3>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const currentDayKey = getMessageDayKey(msg.createdAt);
            const prevDayKey = idx > 0 ? getMessageDayKey(messages[idx - 1]?.createdAt) : "";
            const showDateSeparator = idx === 0 || currentDayKey !== prevDayKey;

            return (
              <div key={msg.clientMessageId || msg._id}>
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-3">
                    <span className="px-3 py-1 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded-full shadow-sm">
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                  </div>
                )}
                <GroupMessageBubble
                  msg={msg}
                  index={idx}
                  openSubMenu={openSubMenu}
                  toggleSubMenu={toggleSubMenu}
                  setReplyingMessage={setReplyingMessage}
                  onRetry={msg.clientMessageId ? () => retryMessage(msg.clientMessageId!) : undefined}
                  onDelete={msg.clientMessageId ? () => deleteFailedMessage(msg.clientMessageId!) : undefined}
                />
              </div>
            );
          })
        )}
      </div>

      {replyingMessage && (
        <ReplyPreview replyingMessage={replyingMessage} onCancel={() => setReplyingMessage(null)} />
      )}

      <MessageInput
        value={draft}
        onChange={(e) => updateDraft(e.target.value)}
        onSend={sendText}
        onSendFile={sendFile}
        onSendVoice={sendVoice}
        placeholder={isConnected ? "Type a message..." : "Offline — messages send when you're back"}
      />
    </div>
  );
}
