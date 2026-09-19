"use client";

import { useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import type { UseChatsReturn } from "@/hooks/useChats";
import type { ChatAttachment } from "@/types/chat.types";
import type { DisplayChatRoom } from "@/lib/chat/rooms";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import GroupMessageBubble from "./GroupMessageBubble";
import { ReplyBar, type ChatReplyTo, type ReplyDraft } from "@/components/chat-kit";
import { useMessageActions } from "./useMessageActions";
import ThreadNotices from "./ThreadNotices";
import { useChatThread } from "./useChatThread";
import { useThreadScroll } from "./useThreadScroll";
import { formatDateSeparator } from "@/lib/chat/dates";
import { Loader2, MessageCircle } from "lucide-react";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";
import {
  deliveryState,
  latestOwnStoredMessageId,
  readByCount,
  type DeliveryState,
} from "@/lib/chat/readReceipts";

type MsgAttachment = ChatAttachment;

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
  replyTo?: ChatReplyTo;
  isDeleted?: boolean;
  status?: "pending" | "failed";
  error?: string;
  uploadProgress?: number[];
  deliveryState?: DeliveryState;
  readByCount?: number;
}

interface GroupChatProps {
  replyingMessage: ReplyDraft | null;
  setReplyingMessage: (msg: ReplyDraft | null) => void;
  room: DisplayChatRoom;
  onBack?: () => void;
  chats: UseChatsReturn;
}

export default function GroupChat({
  replyingMessage,
  setReplyingMessage,
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
  const clearReply = useCallback(() => setReplyingMessage(null), [setReplyingMessage]);
  const { draft, updateDraft, sendText, sendFiles, sendVoice } = useChatThread(chats, roomId, replyingMessage, clearReply);

  const getMessageDayKey = useCallback((value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
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
  const messages = useMemo<Message[]>(() => {
    const latestOwnId = latestOwnStoredMessageId(chatMessages, currentUserId);
    return chatMessages.map((msg) => {
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
          replyTo: msg.replyTo,
          isDeleted: msg.isDeleted,
          status: msg.status,
          error: msg.error,
          uploadProgress: msg.uploadProgress,
          deliveryState: isMine ? deliveryState(msg) : undefined,
          readByCount: isMine && msg._id === latestOwnId ? readByCount(msg) : undefined,
        };
    });
  }, [chatMessages, currentUserId, currentUserName, participantById]);

  const { deleteHandlerFor, jumpFor } = useMessageActions(chats, roomId, true, messages);

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
              <div key={msg.clientMessageId || msg._id} id={`msg-${msg._id}`} className="transition-colors duration-500">
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-3">
                    <span className="px-3 py-1 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded-full shadow-sm">
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                  </div>
                )}
                <GroupMessageBubble
                  msg={msg}
                  onReply={setReplyingMessage}
                  onDeleteMessage={deleteHandlerFor(msg)}
                  onJump={jumpFor(msg)}
                  onRetry={msg.clientMessageId ? () => retryMessage(msg.clientMessageId!) : undefined}
                  onDelete={msg.clientMessageId ? () => deleteFailedMessage(msg.clientMessageId!) : undefined}
                />
              </div>
            );
          })
        )}
      </div>

      {replyingMessage && (
        <ReplyBar reply={replyingMessage} onCancel={clearReply} className="mx-2 sm:mx-4" />
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
