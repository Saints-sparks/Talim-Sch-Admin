"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import ChatSidebar from "./ChatSidebar";
import GroupChat from "./GroupChat";
import PrivateChat from "./PrivateChat";
import ThreadNotices from "./ThreadNotices";
import { useChats } from "@/hooks/useChats";
import { ChatsProvider } from "@/context/ChatsContext";
import { toDisplayRoom, type DisplayChatRoom } from "@/lib/chat/rooms";
import { chatRoomUrl } from "@/lib/chat/openRoom";

interface MessagesLayoutProps {
  replyingMessage: { sender: string; text: string } | null;
  setReplyingMessage: (msg: any) => void;
  openSubMenu: { index: number; type: string } | null;
  toggleSubMenu: (index: number, type: string) => void;
}

export default function MessagesLayout({
  replyingMessage,
  setReplyingMessage,
  openSubMenu,
  toggleSubMenu,
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

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
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
    openSubMenu,
    toggleSubMenu,
    onBack: handleBackToChats,
    chats,
  };

  return (
    <ChatsProvider value={chats}>
      <div className="flex h-full w-full bg-gray-50 relative">
        {/* Sidebar - Mobile: Take full container, Desktop: Fixed width panel */}
        <div
          className={`${
            isMobile ? (selectedRoomId ? "hidden" : "block w-full") : "relative w-96 xl:w-80"
          } bg-white ${!isMobile ? "border-r border-gray-200" : ""} flex flex-col h-full`}
        >
          <ChatSidebar
            onSelectChat={(room) => openRoom(room.roomId, room)}
            selectedRoomId={selectedRoomId}
            chats={chats}
          />
        </div>

        {/* Chat Area - Mobile: Take full container when shown, Desktop: Flexible width */}
        <div
          data-guide="messages-chat-area"
          className={`${
            isMobile
              ? selectedRoomId
                ? "block w-full"
                : "hidden"
              : selectedRoomId
                ? "flex flex-1"
                : "hidden lg:flex lg:flex-1"
          } flex-col bg-white h-full`}
        >
          {selectedRoomId && selectedRoom ? (
            selectedRoom.type === "group" ? (
              <GroupChat key={selectedRoom.roomId} room={selectedRoom} {...threadProps} />
            ) : (
              <PrivateChat key={selectedRoom.roomId} room={selectedRoom} {...threadProps} />
            )
          ) : selectedRoomId ? (
            // Deep-linked room whose details haven't loaded yet.
            <div className="flex flex-1 flex-col h-full">
              <ThreadNotices
                isConnected={chats.isConnected}
                threadStatus={chats.threadStatus}
                threadError={chats.threadError}
                hasMessages={false}
                onRetry={chats.retryCurrentRoom}
              />
              {chats.threadStatus !== "error" && (
                <div className="flex flex-1 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              )}
              <div className="p-3 lg:hidden">
                <button type="button" onClick={handleBackToChats} className="text-sm text-blue-600 hover:underline">
                  Back to chats
                </button>
              </div>
            </div>
          ) : (
            // Empty state for desktop when no chat is selected
            <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No chat selected</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Select a conversation from the sidebar to start messaging, or create a new group chat.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ChatsProvider>
  );
}
