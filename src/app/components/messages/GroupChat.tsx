"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWebSocketContext } from "@/context/WebSocketContext";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useChats } from "@/hooks/useChats";
import { chatService } from "@/services/chatServices";
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
  // null = not yet checked, true = confirmed member, false = confirmed non-member
  const [isParticipant, setIsParticipant] = useState<boolean | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fetchedRoomsRef = useRef(new Set<string>());
  const participationCheckedRef = useRef(false);
  // Ref so socket callback always sees the current roomId without stale closure
  const currentRoomIdRef = useRef<string | undefined>(undefined);

  const { user } = useAuth();
  const { isConnected, onChatMessage } = useWebSocketContext();
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
    addMessage,
    updateMessage,
    removeMessage,
  } = useChatMessages();

  // Use the sendMessage from useChats
  const { sendMessage } = useChats();

  // Get room ID safely
  const getRoomId = useCallback((): string | undefined => {
    if (!room) return undefined;
    return room._id || room.roomId || room.id;
  }, [room]);

  const roomId = getRoomId();

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

  const extractId = useCallback((value: any): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    if (typeof value === "object") {
      const direct = value._id || value.id || value.userId;
      const nestedUser = value.user?._id || value.user?.id || value.user?.userId;
      const nestedParticipant = value.participant?._id || value.participant?.id || value.participant?.userId;
      return (direct || nestedUser || nestedParticipant || value?.toString?.() || "") as string;
    }
    return String(value);
  }, []);

  // Keep ref in sync so socket callback always has the latest roomId
  useEffect(() => {
    currentRoomIdRef.current = roomId;
  }, [roomId]);

  // Real-time incoming messages via WebSocket
  useEffect(() => {
    if (!isConnected || !roomId) return;

    const currentUserId = user?.userId || (user as any)?._id || '';

    const unsub = onChatMessage((message) => {
      // Ignore messages for other rooms
      if (message.roomId !== currentRoomIdRef.current) return;
      // Skip the sender's own message — it was already added optimistically
      if (message.senderId === currentUserId) return;

      // Resolve sender name from participant map when backend omits it
      const resolvedSenderName =
        message.senderName || participantNameByIdRef.current.get(message.senderId) || '';

      addMessage({
        _id: message._id,
        senderId: message.senderId,
        senderName: resolvedSenderName,
        content: message.content,
        roomId: message.roomId,
        type: message.type || 'text',
        duration: message.duration,
        isRead: false,
        readBy: message.readBy || [],
        createdAt: new Date(message.timestamp as any),
        updatedAt: new Date(message.timestamp as any),
      } as any);

      // Mark as read since the user is actively viewing this room
      chatService.markMessageAsRead(message._id).catch(console.error);
    });

    return unsub;
  }, [isConnected, roomId, onChatMessage, addMessage, user?.userId, (user as any)?._id]);

  // Reset participation state when room changes so the check re-runs
  useEffect(() => {
    setIsParticipant(null);
    participationCheckedRef.current = false;
  }, [roomId]);

  // Run membership check once isParticipant resets to null
  useEffect(() => {
    if (!room || !user || isParticipant !== null) return;

    const currentUserId = extractId(user?.userId || user?._id || (user as any)?.id);
    if (!currentUserId) {
      participationCheckedRef.current = true;
      setIsParticipant(false);
      return;
    }

    const verifyMembership = async () => {
      let participantIds: string[] = [];

      if (room.participants && Array.isArray(room.participants) && room.participants.length > 0) {
        participantIds = room.participants
          .map((p: any) => extractId(p))
          .filter(Boolean);
      }

      // Fail-closed: if room payload does not include usable participant IDs,
      // verify against participants endpoint before allowing any fetch.
      if (participantIds.length === 0 && roomId) {
        try {
          const apiParticipants = await chatService.getChatRoomParticipants(roomId);
          participantIds = (Array.isArray(apiParticipants) ? apiParticipants : [])
            .map((p: any) => extractId(p))
            .filter(Boolean);
        } catch (verifyError) {
          console.warn('⚠️ Membership verification failed; blocking room fetch', {
            roomId,
            verifyError,
          });
          participationCheckedRef.current = true;
          setIsParticipant(false);
          return;
        }
      }

      const isMember = participantIds.includes(currentUserId);
      participationCheckedRef.current = true;
      setIsParticipant(isMember);

      if (!isMember) {
        console.warn('⚠️ Current user is NOT a participant in this group:', {
          currentUserId,
          roomId,
          participantIds,
        });
      } else {
        console.log('✅ Current user is a participant in this group');
      }
    };

    verifyMembership();
  }, [room, user, isParticipant, roomId]);

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

  const participantNameById = useMemo(() => {
    const map = new Map<string, string>();
    const participants = room?.participants || [];

    participants.forEach((participant: any) => {
      const participantObj = typeof participant === "object" ? participant : { userId: participant };
      const participantId =
        extractId(participantObj?.userId) ||
        extractId(participantObj?._id) ||
        extractId(participantObj?.id);

      if (!participantId) return;

      const name = participantObj?.firstName && participantObj?.lastName
        ? `${participantObj.firstName} ${participantObj.lastName}`.trim()
        : participantObj?.name || participantObj?.email || "";

      if (name) {
        map.set(participantId, name);
      }
    });

    return map;
  }, [room?.participants, extractId]);

  // Keep a ref so the socket handler always reads the latest map without stale closure
  const participantNameByIdRef = useRef(participantNameById);
  useEffect(() => {
    participantNameByIdRef.current = participantNameById;
  }, [participantNameById]);

  // Get user initials for avatar
  const getUserAvatarInitials = useCallback((senderId: string, senderName: string): string => {
    if (isCurrentUser(senderId)) {
      return currentUserInfo.initials;
    }
    return getUserInitialsFromName(senderName);
  }, [isCurrentUser, currentUserInfo.initials, getUserInitialsFromName]);

  // Fetch messages when room changes — only after participation is verified
  useEffect(() => {
    if (!roomId) {
      clearMessages();
      fetchedRoomsRef.current.clear();
      participationCheckedRef.current = false;
      return;
    }

    // Block until the participation check completes (null = unchecked)
    if (isParticipant === null) return;

    // Block if confirmed non-member
    if (isParticipant === false) {
      console.warn(`⛔ Blocked fetch: current user is not a participant of room ${roomId}`);
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
  // isParticipant in deps causes this to re-run on null → true/false transition
  }, [roomId, fetchMessages, clearMessages, isParticipant]);

  // Transform messages for UI
  const messages = useMemo(() => {
    if (!chatMessages || chatMessages.length === 0) {
      return [];
    }

    return chatMessages.map((msg: any) => {
      // Extract senderId properly (could be string or object)
      const senderId =
        extractId(msg.senderId) ||
        extractId(msg.sender?._id) ||
        extractId(msg.sender?.id) ||
        extractId(msg.sender?.userId);
      
      // Get sender name
      const senderObjectName = msg.sender?.firstName && msg.sender?.lastName
        ? `${msg.sender.firstName} ${msg.sender.lastName}`.trim()
        : msg.sender?.name || msg.sender?.email || "";

      let senderName =
        msg.senderName ||
        senderObjectName ||
        participantNameById.get(senderId) ||
        "User";
      
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
  }, [chatMessages, extractId, isCurrentUser, currentUserInfo.name, getUserAvatarInitials, participantNameById]);

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
    const trimmedMessage = messageInput.trim();
    if (!trimmedMessage || !roomId || isSending) {
      console.log('Cannot send:', { 
        hasMessage: !!trimmedMessage, 
        hasRoomId: !!roomId, 
        isSending 
      });
      return;
    }

    // Check if user is a participant
    if (isParticipant === false) {
      toast.error('You are not a participant in this group');
      console.error('Cannot send message: User is not a participant');
      return;
    }

    setIsSending(true);

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: optimisticId,
      senderId: currentUserInfo.id,
      senderName: currentUserInfo.name || 'You',
      content: trimmedMessage,
      roomId,
      isRead: false,
      readBy: [],
      type: 'text',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Show outgoing message instantly in this chat view
    addMessage(optimisticMessage as any);
    setMessageInput("");
    
    try {
      console.log("📤 Sending group message:", {
        roomId,
        text: trimmedMessage,
        userId: currentUserInfo.id
      });
      
      const result = await sendMessage({
        chatRoomId: roomId,
        text: trimmedMessage,
      });
      
      if (result) {
        console.log("✅ Message sent successfully:", result);
        // Reconcile optimistic message with backend-confirmed message
        updateMessage(optimisticId, {
          ...result,
          _id: result._id,
        } as any);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (err) {
      removeMessage(optimisticId);
      setMessageInput(trimmedMessage);
      console.error("❌ Send failed", err);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [
    messageInput,
    roomId,
    isSending,
    sendMessage,
    isParticipant,
    currentUserInfo.id,
    currentUserInfo.name,
    addMessage,
    updateMessage,
    removeMessage,
  ]);

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
      name: room.displayName || room.name || "Group Chat",
      participantCount,
      participantList: participantNames + (participantCount > 3 ? ` and ${participantCount - 3} others` : '')
    };
  }, [room]);

  // If not a participant, show a message
  if (roomId && isParticipant === false && !isLoading) {
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
        onAddParticipants={() => {
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
          messages.map((msg, idx) => {
            const currentDayKey = getMessageDayKey(msg.createdAt);
            const prevDayKey = idx > 0 ? getMessageDayKey(messages[idx - 1]?.createdAt) : "";
            const showDateSeparator = idx === 0 || currentDayKey !== prevDayKey;

            return (
              <div key={msg._id || `${idx}-${msg.createdAt}`}>
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-3">
                    <span className="px-3 py-1 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded-full shadow-sm">
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                  </div>
                )}
                <GroupMessageBubble
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
              </div>
            );
          })
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
        disabled={!roomId || isSending || isParticipant === false || isParticipant === null}
        isSending={isSending}
        placeholder={
          !roomId 
            ? "Select a chat to start messaging"
            : isParticipant === false
            ? "You are not a participant in this group"
            : isSending 
            ? "Sending..." 
            : "Type a message..."
        }
      />
    </div>
  );
}