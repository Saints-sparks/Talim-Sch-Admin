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
import { toast } from "react-toastify";

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
  const [isParticipant, setIsParticipant] = useState<boolean>(true); // Assume true until checked

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fetchedRoomsRef = useRef(new Set<string>());
  const participationCheckedRef = useRef(false);

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

  // Get room ID safely
  const getRoomId = useCallback((): string | undefined => {
    if (!room) return undefined;
    return room._id || room.roomId || room.id;
  }, [room]);

  const roomId = getRoomId();

  // Check if current user is a participant in this group
  useEffect(() => {
    if (!room || !user || participationCheckedRef.current) return;

    const checkParticipation = () => {
      const currentUserId = user?.userId || user?._id;
      if (!currentUserId) return;

      // Check if user is in participants list
      if (room.participants && Array.isArray(room.participants)) {
        const isUserParticipant = room.participants.some((p: any) => {
          const participantId = p.userId || p._id || p.id || p;
          return participantId === currentUserId;
        });

        setIsParticipant(isUserParticipant);
        
        if (!isUserParticipant) {
          console.warn('⚠️ Current user is not a participant in this group:', {
            currentUserId,
            participants: room.participants
          });
        } else {
          console.log('✅ Current user is a participant in this group');
        }
      }
      
      participationCheckedRef.current = true;
    };

    checkParticipation();
  }, [room, user]);

  // Debug logging for room and user
  useEffect(() => {
    if (room) {
      console.log('📋 GroupChat - Room data:', {
        roomId,
        roomName: room.name,
        participants: room.participants?.length,
        currentUser: user?.userId || user?._id,
        isParticipant
      });
    }
  }, [room, roomId, user, isParticipant]);

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

  // Check if message is from current user
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

  // Fetch messages when room changes
  useEffect(() => {
    if (!roomId) {
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

    // Check if user is a participant
    if (!isParticipant) {
      toast.error('You are not a participant in this group');
      console.error('Cannot send message: User is not a participant');
      return;
    }

    setIsSending(true);
    
    try {
      console.log("📤 Sending group message:", {
        roomId,
        text: messageInput.trim(),
        userId: currentUserInfo.id
      });
      
      const result = await sendMessage({
        chatRoomId: roomId,
        text: messageInput.trim(),
      });
      
      if (result) {
        console.log("✅ Message sent successfully:", result);
        setMessageInput("");
      } else {
        throw new Error('Failed to send message');
      }
    } catch (err) {
      console.error("❌ Send failed", err);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [messageInput, roomId, isSending, sendMessage, isParticipant, currentUserInfo.id]);

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
      .map((p: any) => {
        if (typeof p === 'string') return 'User';
        return p.firstName && p.lastName 
          ? `${p.firstName} ${p.lastName}`.trim()
          : p.name || p.email || 'User';
      })
      .join(', ');

    return {
      name: room.name || "Group Chat",
      participantCount,
      participantList: participantNames + (participantCount > 3 ? ` and ${participantCount - 3} others` : '')
    };
  }, [room]);

  // If not a participant, show a message
  if (roomId && !isParticipant && !isLoading) {
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
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Cannot Send Messages</h3>
            <p className="text-sm text-gray-600">
              You are not a participant in this group chat. Please contact an administrator to be added.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
        isGroup={true}
        chatRoomId={roomId}
        onAddParents={() => {
          console.log('Add parents to group');
          // You can implement this functionality
        }}
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
        disabled={!roomId || isSending || !isParticipant}
        isSending={isSending}
        placeholder={
          !roomId 
            ? "Select a chat to start messaging"
            : !isParticipant
            ? "You are not a participant in this group"
            : isSending 
            ? "Sending..." 
            : "Type a message..."
        }
      />
    </div>
  );
}