"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChats } from "@/hooks/useChats";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import GroupMessageBubble from "./GroupMessageBubble";
import ReplyPreview from "./ReplyPreview";
import { Loader2, MessageCircle } from "lucide-react";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";

interface Message {
  _id?: string;
  sender: string;
  senderId?: string;
  senderName?: string;
  text?: string;
  content?: string;
  time?: string;
  createdAt?: string;
  type: string;
  senderType: string;
  avatar?: string;
  color?: string;
  initials?: string;
  replyTo?: string;
  videoThumbnail?: string;
  duration?: string;
}

interface GroupChatProps {
  replyingMessage: { sender: string; text: string } | null;
  setReplyingMessage: (msg: { sender: string; text: string } | null) => void;
  openSubMenu: { index: number; type: string } | null;
  toggleSubMenu: (index: number, type: string) => void;
  room?: any;
  onBack?: () => void;
}

export default function GroupChat({
  replyingMessage,
  setReplyingMessage,
  openSubMenu,
  toggleSubMenu,
  room,
  onBack,
}: GroupChatProps) {
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fetchedRoomsRef = useRef(new Set<string>());

  const { user } = useAuth();
  const {
    messages: chatMessages,
    isLoading,
    isLoadingMore,
    hasMoreOlder,
    error,
    fetchMessages,
    loadOlderMessages,
    refreshMessages,
    clearMessages,
  } = useChatMessages();

  // Use the sendMessage from useChats
  const { sendMessage } = useChats();

  const roomId = room?._id;

  // Get user initials from name
  const getUserInitialsFromName = useCallback((name: string): string => {
    if (!name) return "?";
    
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }, []);

  // Get current user's display name and initials
  const currentUserInfo = useMemo(() => {
    if (!user) return { name: '', initials: '?', id: '' };
    
    const fullName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`.trim()
      : user.email || 'User';
    
    return {
      name: fullName,
      initials: getUserInitialsFromName(fullName),
      id: user.userId || user._id || ''
    };
  }, [user, getUserInitialsFromName]);

  // Check if message is from current user (by ID only, not name)
  const isCurrentUser = useCallback((senderId: string): boolean => {
    const currentUserId = currentUserInfo.id;
    
    if (!currentUserId || !senderId) return false;
    
    // Handle case where senderId might be an object
    let extractedSenderId = senderId;
    if (typeof senderId === 'object' && senderId !== null) {
      extractedSenderId = (senderId as any)._id || String(senderId);
    }
    
    // Direct ID match
    return extractedSenderId === currentUserId;
  }, [currentUserInfo.id]);

  // Get user initials for avatar
  const getUserAvatarInitials = useCallback((senderId: string, senderName: string): string => {
    if (isCurrentUser(senderId)) {
      return currentUserInfo.initials;
    }
    return getUserInitialsFromName(senderName);
  }, [isCurrentUser, currentUserInfo.initials, getUserInitialsFromName]);

  // ── Fetch messages only when room changes, but don't clear immediately ──
  useEffect(() => {
    if (!roomId) {
      // Only clear if we're explicitly leaving to a null room
      clearMessages();
      fetchedRoomsRef.current.clear();
      return;
    }

    // Don't refetch if we already have messages for this room
    if (fetchedRoomsRef.current.has(roomId)) {
      console.log(`Already fetched room ${roomId}, skipping`);
      return;
    }

    const timer = setTimeout(() => {
      console.log(`Initial fetch → room ${roomId}`);
      fetchMessages(roomId, {
        replaceExisting: true,
        force: true,
      }).finally(() => {
        fetchedRoomsRef.current.add(roomId);
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [roomId, fetchMessages, clearMessages]);

  // Transform messages for UI
  const messages = useMemo(() => {
    if (!chatMessages || chatMessages.length === 0) {
      return [];
    }

    console.log('🔄 Formatting group messages, count:', chatMessages.length);

    return chatMessages.map((msg: any) => {
      // Extract senderId properly (could be string or object)
      let senderId = '';
      if (typeof msg.senderId === 'object' && msg.senderId !== null) {
        senderId = msg.senderId._id || msg.senderId.toString();
      } else {
        senderId = msg.senderId || msg.sender?._id || '';
      }
      
      // Get sender name
      let senderName = msg.senderName || msg.sender?.name || 'Unknown';
      
      // Check if this message is from the current user
      const isMyMessage = isCurrentUser(senderId);
      
      // If it's my message, use my name
      if (isMyMessage) {
        senderName = currentUserInfo.name;
      }
      
      // Get the message content
      const messageText = msg.content || msg.text || "";
      
      return {
        _id: msg._id,
        sender: senderName,
        senderId,
        text: messageText,
        content: messageText,
        time: new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        createdAt: msg.createdAt,
        type: msg.type || "text",
        senderType: isMyMessage ? "self" : "other",
        color: generateColorFromString(senderName || senderId),
        avatar: "",
        initials: getUserAvatarInitials(senderId, senderName),
      };
    }).sort((a, b) => 
      new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime()
    );
  }, [chatMessages, isCurrentUser, currentUserInfo.name, getUserAvatarInitials]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !isLoading && !isLoadingMore && messages.length > 0) {
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, isLoading, isLoadingMore]);

  // Handle sending a new message
  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !roomId || isSending) {
      console.log('Cannot send:', { 
        hasMessage: !!messageInput.trim(), 
        hasRoomId: !!roomId, 
        isSending 
      });
      return;
    }

    setIsSending(true);
    
    try {
      console.log("📤 Sending message:", messageInput.trim());
      
      await sendMessage({
        chatRoomId: roomId,
        text: messageInput.trim(),
      });
      
      setMessageInput("");
    } catch (err) {
      console.error("❌ Send failed", err);
    } finally {
      setIsSending(false);
    }
  }, [messageInput, roomId, isSending, sendMessage]);

  // Handle scroll for pagination
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (container.scrollTop < 60 && hasMoreOlder && !isLoadingMore) {
      console.log('📜 Loading older messages...');
      loadOlderMessages();
    }
  }, [hasMoreOlder, isLoadingMore, loadOlderMessages]);

  // Get room name and participants info
  const roomInfo = useMemo(() => {
    if (!room) {
      return {
        name: "Group Chat",
        participantCount: 0,
        participantList: []
      };
    }

    const participants = room.participants || [];
    const participantCount = participants.length;
    
    // Get first 3 participant names for subtext
    const participantNames = participants
      .slice(0, 3)
      .map((p: any) => p.firstName && p.lastName 
        ? `${p.firstName} ${p.lastName}`.trim()
        : p.name || p.email || 'User'
      )
      .join(', ');

    return {
      name: room.name || "Group Chat",
      participantCount,
      participantList: participantNames + (participantCount > 3 ? ` and ${participantCount - 3} others` : '')
    };
  }, [room]);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <ChatHeader
        avatar={room?.avatarInfo?.type === "image" ? room.avatarInfo.value : "/icons/chat.svg"}
        name={roomInfo.name}
        status="Group chat"
        subtext={roomInfo.participantList}
        participants={room?.participants || []}
        currentUserId={currentUserInfo.id}
        onBack={onBack}
        showBackButton={!!onBack}
        initials={currentUserInfo.initials}
      />

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-50 space-y-3"
      >
        {/* Loading indicator for more messages */}
        {isLoadingMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}

        {/* Main loading state */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh]">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-3" />
            <p className="text-gray-600">Loading messages...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => roomId && refreshMessages()}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : !roomId ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-gray-500">
            <MessageCircle className="w-20 h-20 text-gray-300 mb-4" />
            <p className="text-lg">Select a conversation to start chatting</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-gray-500">
            <MessageCircle className="w-20 h-20 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-800">No messages yet</h3>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <GroupMessageBubble
              key={msg._id || `${idx}-${msg.createdAt}`}
              msg={{
                ...msg,
                senderType: msg.senderType,
                initials: msg.initials,
              }}
              index={idx}
              openSubMenu={openSubMenu}
              toggleSubMenu={toggleSubMenu}
              setReplyingMessage={setReplyingMessage}
            />
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {replyingMessage && (
        <ReplyPreview
          replyingMessage={replyingMessage}
          onCancel={() => setReplyingMessage(null)}
        />
      )}

      <MessageInput
        value={messageInput}
        onChange={(e) => setMessageInput(e.target.value)}
        onSend={handleSendMessage}
        disabled={!roomId || isSending}
        isSending={isSending}
        placeholder={isSending ? "Sending..." : "Type a message..."}
      />
    </div>
  );
}