"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MessageCircle } from "lucide-react";
import { EmptyNote, cardFrame, textLink } from "@/components/tl";
import ChatSidebar from "./ChatSidebar";
import GroupChat from "./GroupChat";
import PrivateChat from "./PrivateChat";
import ThreadNotices from "./ThreadNotices";
import { useChats } from "@/hooks/useChats";
import { ChatsProvider } from "@/context/ChatsContext";
import { toDisplayRoom, type DisplayChatRoom } from "@/lib/chat/rooms";
import type { ReplyDraft } from "@/components/chat-kit";
import { chatRoomUrl } from "@/lib/chat/openRoom";

/** Props for {@link MessagesLayout}. */
interface MessagesLayoutProps {
  /** The message being replied to, if any. */
  replyingMessage: ReplyDraft | null;
  /** Starts or cancels a reply. */
  setReplyingMessage: (msg: ReplyDraft | null) => void;
}

/**
 * The two-pane inbox: the conversation list card and the open conversation
 * card side by side from 980px, one at a time below. Owns the open room and
 * keeps it in `?room=` (deep links, Back), and leaves it when the user is
 * removed from it.
 *
 * @param props - See {@link MessagesLayoutProps}.
 * @param props.replyingMessage - The reply in progress.
 * @param props.setReplyingMessage - Starts or cancels a reply.
 * @returns The inbox.
 */
export default function MessagesLayout({
  replyingMessage,
  setReplyingMessage,
}: MessagesLayoutProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const chats = useChats();
  const { chatRooms, currentUserId, selectChatRoom, resetCurrentRoom } = chats;
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomParam = searchParams.get("room");
  /** The `?room=` value already acted on, so our own URL updates don't re-trigger selection. */
  const handledRoomParamRef = useRef<string | null | undefined>(undefined);
  const snapshotRef = useRef<DisplayChatRoom | null>(null);
  const selectedRoomIdRef = useRef<string | null>(null);

  // One pane at a time below 980px, where the app's sidebar becomes a drawer too.
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 980);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const openRoom = useCallback(
    (roomId: string, snapshot?: DisplayChatRoom) => {
      if (snapshot) snapshotRef.current = snapshot;
      // Reply state belongs to the chat it was started in.
      if (selectedRoomIdRef.current !== roomId) setReplyingMessage(null);
      selectedRoomIdRef.current = roomId;
      setSelectedRoomId(roomId);
      void selectChatRoom(roomId);
      handledRoomParamRef.current = roomId;
      if (roomParam !== roomId) router.replace(chatRoomUrl(roomId), { scroll: false });
    },
    [selectChatRoom, router, roomParam, setReplyingMessage]
  );

  const handleBackToChats = useCallback(() => {
    resetCurrentRoom();
    selectedRoomIdRef.current = null;
    setSelectedRoomId(null);
    setReplyingMessage(null);
    handledRoomParamRef.current = null;
    if (roomParam) router.replace("/messages", { scroll: false });
  }, [resetCurrentRoom, router, roomParam, setReplyingMessage]);

  // I left or was removed from the room on screen: back to the list.
  const removedRoom = chats.removedRoom;
  useEffect(() => {
    if (removedRoom && removedRoom.roomId === selectedRoomIdRef.current) handleBackToChats();
    // Only when a room is dropped.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removedRoom]);

  // Leaving the page (and React's development double mount) leaves the open room (useChats'
  // cleanup): forget the handled link, so a remount opens it again instead of waiting forever.
  useEffect(
    () => () => {
      handledRoomParamRef.current = undefined;
    },
    []
  );

  // Deep link: /messages?room=<id> opens that room, on load and whenever the query changes.
  useEffect(() => {
    if (handledRoomParamRef.current === roomParam) return;
    handledRoomParamRef.current = roomParam;
    if (roomParam) {
      openRoom(roomParam);
    } else if (selectedRoomIdRef.current) {
      resetCurrentRoom();
      selectedRoomIdRef.current = null;
      setSelectedRoomId(null);
      setReplyingMessage(null);
    }
    // Only react to the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomParam]);

  // The selected room, kept live from the room list (members, name, online state).
  const selectedRoom = useMemo<DisplayChatRoom | null>(() => {
    if (!selectedRoomId) return null;
    const room = chatRooms.find((r) => r._id === selectedRoomId);
    if (room) return toDisplayRoom(room, currentUserId);
    return snapshotRef.current?.roomId === selectedRoomId ? snapshotRef.current : null;
  }, [chatRooms, selectedRoomId, currentUserId]);

  const threadProps = {
    replyingMessage,
    setReplyingMessage,
    onBack: handleBackToChats,
    chats,
  };

  return (
    <ChatsProvider value={chats}>
      <div className="flex h-full min-h-0 w-full gap-[18px]">
        {/* The conversations: the whole width below 980px (hidden while a chat is open), a fixed column beside the chat above it. */}
        <div
          className={`${cardFrame} min-h-0 flex-col ${
            isMobile ? (selectedRoomId ? "hidden" : "flex w-full") : "flex w-[300px] shrink-0 xl:w-[340px]"
          }`}
        >
          <ChatSidebar
            onSelectChat={(room) => openRoom(room.roomId, room)}
            selectedRoomId={selectedRoomId}
            chats={chats}
          />
        </div>

        {/* The open conversation: the whole width below 980px while open, the rest of the row above it. */}
        <div
          data-guide="messages-chat-area"
          className={`${cardFrame} min-h-0 min-w-0 flex-col ${
            isMobile ? (selectedRoomId ? "flex w-full" : "hidden") : "flex flex-1"
          }`}
        >
          {selectedRoomId && selectedRoom ? (
            selectedRoom.type === "group" ? (
              <GroupChat key={selectedRoom.roomId} room={selectedRoom} {...threadProps} />
            ) : (
              <PrivateChat key={selectedRoom.roomId} room={selectedRoom} {...threadProps} />
            )
          ) : selectedRoomId ? (
            // Deep-linked room whose details haven't loaded yet.
            <div className="flex h-full flex-1 flex-col">
              <ThreadNotices
                isConnected={chats.isConnected}
                threadStatus={chats.threadStatus}
                threadError={chats.threadError}
                hasMessages={false}
                onRetry={chats.retryCurrentRoom}
              />
              {chats.threadStatus !== "error" && (
                <div className="flex flex-1 items-center justify-center bg-tl-subtle" role="status">
                  <Loader2 className="h-8 w-8 animate-spin text-tl-brand" aria-hidden />
                  <span className="sr-only">Loading the conversation</span>
                </div>
              )}
              <div className="border-t border-tl-line-soft p-2 min-[980px]:hidden">
                <button type="button" onClick={handleBackToChats} className={textLink}>
                  Back to chats
                </button>
              </div>
            </div>
          ) : (
            // Empty state for desktop when no chat is selected
            <div className="flex flex-1 items-center justify-center bg-tl-subtle">
              <EmptyNote title="No chat selected" icon={<MessageCircle />}>
                Select a conversation from the sidebar to start messaging, or create a new group chat.
              </EmptyNote>
            </div>
          )}
        </div>
      </div>
    </ChatsProvider>
  );
}
