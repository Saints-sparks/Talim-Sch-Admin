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
import { OFFICE_THREAD_NOTE } from "./group-info/groupInfo";
import { Loader2, MessageCircle } from "lucide-react";
import { getUserInitials } from "@/lib/colorUtils";
import { EmptyNote } from "@/components/tl";
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

/**
 * A group thread (every room but a direct message, office threads included):
 * header, messages with date separators, reply bar and composer. The header
 * shows the room's subtitle and description; an office thread explains the
 * shared inbox instead.
 *
 * @param props.room - The room as the list shows it.
 * @param props.replyingMessage - The message being replied to, if any.
 * @param props.setReplyingMessage - Starts or cancels a reply.
 * @param props.onBack - Back to the list (mobile).
 * @param props.chats - The chat state from `useChats`.
 * @returns The thread.
 */
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
    <div className="flex h-full min-h-0 w-full flex-col bg-tl-surface">
      <ChatHeader
        avatar={room.avatarInfo?.type === "image" ? room.avatarInfo.value : ""}
        name={roomInfo.name}
        status={room.subtitle || "Group chat"}
        subtext={room.isOffice ? OFFICE_THREAD_NOTE : room.description || roomInfo.participantList}
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
        className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-tl-subtle p-3 sm:p-[18px]"
      >
        {/* Loading indicator for more messages */}
        {isLoadingMore && (
          <div className="flex justify-center py-3" role="status" aria-label="Loading older messages">
            <Loader2 className="h-5 w-5 animate-spin text-tl-brand" aria-hidden />
          </div>
        )}

        {showBlockingLoader ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2" role="status">
            <Loader2 className="h-8 w-8 animate-spin text-tl-brand" aria-hidden />
            <p className="text-sm text-tl-muted">Loading messages...</p>
          </div>
        ) : threadStatus === "error" && messages.length === 0 ? null : messages.length === 0 ? (
          <EmptyNote title="No messages yet" icon={<MessageCircle />}>
            Send a message to start the conversation
          </EmptyNote>
        ) : (
          messages.map((msg, idx) => {
            const currentDayKey = getMessageDayKey(msg.createdAt);
            const prevDayKey = idx > 0 ? getMessageDayKey(messages[idx - 1]?.createdAt) : "";
            const showDateSeparator = idx === 0 || currentDayKey !== prevDayKey;

            return (
              <div key={msg.clientMessageId || msg._id} id={`msg-${msg._id}`} className="rounded-2xl transition-colors duration-500">
                {showDateSeparator && (
                  <div className="my-3 flex items-center justify-center">
                    <span className="rounded-full bg-tl-track px-3 py-1 text-xs font-bold text-tl-muted">
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
