"use client";
import { useState, useEffect } from "react";
import ChatSidebar from "./ChatSidebar";
import GroupChat from "./GroupChat";
import PrivateChat from "./PrivateChat";
import { RealtimeChatRoom } from "@/app/hooks/useRealtimeChat";

interface SelectedChat {
  type: "private" | "group";
  room?: RealtimeChatRoom;
}

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
  const [selectedChat, setSelectedChat] = useState<SelectedChat | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelectChat = (chat: SelectedChat) => {
    setSelectedChat(chat);
  };

  const handleBackToChats = () => {
    setSelectedChat(null);
  };

  return (
    <div className="flex h-full w-full bg-gray-50 relative">
      {/* Sidebar - Mobile: Take full container, Desktop: Fixed width panel */}
      <div className={`${
        isMobile 
          ? selectedChat 
            ? 'hidden' 
            : 'block w-full'
          : 'relative w-96 xl:w-80'
      } bg-white ${
        !isMobile ? 'border-r border-gray-200' : ''
      } flex flex-col h-full`}>
        <ChatSidebar onSelectChat={handleSelectChat} />
      </div>

      {/* Chat Area - Mobile: Take full container when shown, Desktop: Flexible width */}
      <div className={`${
        isMobile 
          ? selectedChat 
            ? 'block w-full' 
            : 'hidden'
          : selectedChat 
            ? 'flex flex-1' 
            : 'hidden lg:flex lg:flex-1'
      } flex-col bg-white h-full`}>
        {selectedChat ? (
          selectedChat.type === "group" ? (
            <GroupChat
              replyingMessage={replyingMessage}
              setReplyingMessage={setReplyingMessage}
              openSubMenu={openSubMenu}
              toggleSubMenu={toggleSubMenu}
              room={selectedChat.room}
              onBack={handleBackToChats}
            />
          ) : (
            <PrivateChat
              replyingMessage={replyingMessage}
              setReplyingMessage={setReplyingMessage}
              openSubMenu={openSubMenu}
              toggleSubMenu={toggleSubMenu}
              room={selectedChat.room}
              onBack={handleBackToChats}
            />
          )
        ) : (
          // Empty state for desktop when no chat is selected
          <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg 
                  className="w-12 h-12 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1.5} 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No chat selected
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Select a conversation from the sidebar to start messaging, or create a new group chat.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
