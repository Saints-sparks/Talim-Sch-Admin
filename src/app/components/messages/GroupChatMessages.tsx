import { useAuth } from "@/context/AuthContext";
import { useChatMessages } from "@/hooks/useChatMessages";
import GroupMessageBubble from "./GroupMessageBubble";
import { Loader2, MessageCircle } from "lucide-react";
import { useMemo, useRef, useEffect } from "react";

interface GroupChatMessagesProps {
  roomId: string;
  openSubMenu: { index: number; type: string } | null;
  toggleSubMenu: (index: number, type: string) => void;
  setReplyingMessage: (msg: any) => void;
}

export default function GroupChatMessages({
  roomId,
  openSubMenu,
  toggleSubMenu,
  setReplyingMessage,
}: GroupChatMessagesProps) {
  const { user } = useAuth();
  const { messages: chatMessages, isLoading, isLoadingMore, error, refreshMessages, hasMoreOlder, loadOlderMessages } = useChatMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Transform messages for UI
  const messages = useMemo(() => {
    return chatMessages.map((msg: any) => {
      const senderId = msg.senderId || msg.sender?._id || "";
      let senderName = msg.senderName || msg.sender?.name || "Unknown";
      const isCurrentUser =
        senderId === user?._id ||
        senderId === user?.userId ||
        senderName === user?.email;

      // If this is the current user's message, use their name/email
      if (isCurrentUser) {
        senderName = user?.firstName && user?.lastName
          ? `${user.firstName} ${user.lastName}`.trim()
          : user?.email || user?._id || "Me";
      }

      return {
        ...msg,
        sender: senderName,
        senderId,
        senderType: isCurrentUser ? "self" : "other",
      };
    });
  }, [chatMessages, user]);

  useEffect(() => {
    if (messagesEndRef.current && !isLoading && !isLoadingMore) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages.length, isLoading, isLoadingMore]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 60 && hasMoreOlder && !isLoadingMore) {
      loadOlderMessages();
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-3" />
        <p className="text-gray-600">Loading messages...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => refreshMessages()}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!roomId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-gray-500">
        <MessageCircle className="w-20 h-20 text-gray-300 mb-4" />
        <p className="text-lg">Select a conversation to start chatting</p>
      </div>
    );
  }
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-gray-500">
        <MessageCircle className="w-20 h-20 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-800">No messages yet</h3>
        <p>Send a message to start the conversation</p>
      </div>
    );
  }
  return (
    <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50 space-y-3">
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      )}
      {messages.map((msg, idx) => (
        <GroupMessageBubble
          key={msg._id || `${idx}-${msg.createdAt}`}
          msg={msg}
          index={idx}
          openSubMenu={openSubMenu}
          toggleSubMenu={toggleSubMenu}
          setReplyingMessage={setReplyingMessage}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
