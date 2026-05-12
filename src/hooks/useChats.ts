// hooks/useChats.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useWebSocketContext } from '@/context/WebSocketContext';
import { chatService } from '@/services/chatServices';
import { 
  ChatRoom, 
  ChatMessage, 
  SendMessageDto,
  CreateChatRoomDto,
  CreateGroupChatDto,
  ChatRoomType,
  CursorMessagesResponse
} from '@/types/chat.types';
import { toast } from "@/components/CustomToast";

export interface UseChatsReturn {
// State
  chatRooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  messages: ChatMessage[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  error: string | null;

  // Chat room operations
  fetchChatRooms: (force?: boolean) => Promise<ChatRoom[]>;
  createChatRoom: (data: CreateChatRoomDto) => Promise<ChatRoom | null>;
  createGroupChat: (data: CreateGroupChatDto) => Promise<ChatRoom | null>;
  selectChatRoom: (roomId: string) => Promise<void>;
  searchChatRooms: (params: { searchTerm?: string; type?: ChatRoomType }) => Promise<ChatRoom[]>;
  
  // Message operations
  sendMessage: (data: SendMessageDto) => Promise<ChatMessage | null>;
  loadMoreMessages: () => Promise<void>;
  refreshMessages: (force?: boolean) => Promise<void>;
  markMessageAsRead: (messageId: string) => Promise<void>;
  
  // Participant operations
  addParticipant: (roomId: string, userId: string) => Promise<void>;
  addParticipantsToRoom: (roomId: string, userIds: string[]) => Promise<void>;
  removeParticipant: (roomId: string, userId: string) => Promise<void>;
  
  // Utility
  resetCurrentRoom: () => void;
  clearError: () => void;

}

export const useChats = (): UseChatsReturn => {
  const { user, accessToken, isAuthenticated } = useAuth();
  const {
    isConnected,
    joinChatRoom,
    leaveChatRoom,
    onChatMessage,
    onChatRoomsUpdate,
    onUnreadMessagesUpdate,
  } = useWebSocketContext();

  const normalizeId = useCallback((value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return value?.toString?.() || '';
  }, []);

  const getParticipantId = useCallback((participant: any): string => {
    if (!participant) return '';
    if (typeof participant === 'string' || typeof participant === 'number') {
      return normalizeId(participant);
    }

    // Support multiple backend payload shapes
    const direct = participant.userId || participant._id || participant.id;
    const nestedUser = participant.user?.userId || participant.user?._id || participant.user?.id;
    const nestedParticipant = participant.participant?.userId || participant.participant?._id || participant.participant?.id;

    return normalizeId(direct || nestedUser || nestedParticipant || participant);
  }, [normalizeId]);
  
  // State
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const publishUnreadCount = useCallback((count: number) => {
    setUnreadCount(count);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('talim:chat-unread-count', {
          detail: { unreadCount: count },
        })
      );
    }
  }, []);
  
  // Pagination refs
  const nextCursorRef = useRef<string | undefined>();
  const currentRoomIdRef = useRef<string | null>(null);
  // Ref to access the latest currentRoom inside socket callbacks without stale closure
  const currentRoomRef = useRef<ChatRoom | null>(null);

  // Add refs to track last fetch times
  const lastMessageFetchRef = useRef<number>(0);
  const lastUnreadFetchRef = useRef<number>(0);
  const lastRoomsFetchRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  // Minimum time between fetches (in milliseconds)
  const MESSAGE_FETCH_INTERVAL = 30000; // 30 seconds
  const UNREAD_FETCH_INTERVAL = 60000; // 60 seconds
  const ROOMS_FETCH_INTERVAL = 60000; // 60 seconds

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Fetch all chat rooms for the current user (with throttling)
   */
  const fetchChatRooms = useCallback(async (force = false): Promise<ChatRoom[]> => {
    if (!isAuthenticated || !accessToken) {
      setChatRooms([]);
      return [];
    }

    // Throttle requests unless forced
    const now = Date.now();
    if (!force && now - lastRoomsFetchRef.current < ROOMS_FETCH_INTERVAL) {
      console.log('⏱️ Skipping chat rooms fetch - too soon');
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const rooms = await chatService.getUserChatRooms();
      const roomsArray = Array.isArray(rooms) ? rooms : [];

      // Only keep rooms where the current user is a participant
      const currentUserId = normalizeId(user?.userId || user?._id || (user as any)?.id);
      if (!currentUserId) {
        console.warn('⛔ Blocking room list: current user ID unavailable for membership filter');
        setChatRooms([]);
        publishUnreadCount(0);
        return [];
      }

      const memberRooms = roomsArray.filter(room => {
        if (!room.participants || !Array.isArray(room.participants)) return false;
        return room.participants.some((p: any) => {
          const pid = getParticipantId(p);
          return pid === currentUserId;
        });
      });

      const sortedRooms = memberRooms.sort((a, b) => {
        const tsA = a.lastMessageAt ?? a.lastMessage?.createdAt ?? a.updatedAt ?? 0;
        const tsB = b.lastMessageAt ?? b.lastMessage?.createdAt ?? b.updatedAt ?? 0;
        return new Date(tsB).getTime() - new Date(tsA).getTime();
      });

      setChatRooms(sortedRooms);
      lastRoomsFetchRef.current = now;
      return sortedRooms;

    } catch (err: any) {
      console.error('❌ Error in fetchChatRooms:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch chat rooms';
      setError(errorMessage);
      toast.error(errorMessage);
      setChatRooms([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken, user?.userId, user?._id, (user as any)?.id, normalizeId, getParticipantId, publishUnreadCount]);

  /**
   * Create a new chat room
   */
  const createChatRoom = useCallback(async (data: CreateChatRoomDto): Promise<ChatRoom | null> => {
    if (!isAuthenticated || !accessToken) {
      toast.error('You must be logged in to create a chat room');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newRoom = await chatService.createChatRoom(data);
      setChatRooms(prev => [newRoom, ...prev]);
      toast.success('Chat room created successfully');
      return newRoom;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to create chat room';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken]);

  /**
   * Create a group chat room
   */
  const createGroupChat = useCallback(async (data: CreateGroupChatDto): Promise<ChatRoom | null> => {
    if (!isAuthenticated || !accessToken) {
      toast.error('You must be logged in to create a group chat');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newRoom = await chatService.createGroupChat(data);
      setChatRooms(prev => [newRoom, ...prev]);
      toast.success('Group chat created successfully');
      return newRoom;
    } catch (err: any) {
      console.error('❌ Error in createGroupChat:', err);
      
      let errorMessage = 'Failed to create group chat';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (typeof err?.message === 'string' && err.message.startsWith('HTTP')) {
        errorMessage = err.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken]);

  /**
   * Select a chat room and load its messages
   */
  const selectChatRoom = useCallback(async (roomId: string) => {
    if (!isAuthenticated || !accessToken) {
      toast.error('You must be logged in to view messages');
      return;
    }

    const currentUserId = normalizeId(user?.userId || user?._id || (user as any)?.id);
    if (!currentUserId) {
      toast.error('Unable to verify chat membership for current user');
      setError('Access denied: unable to verify current user');
      return;
    }

    // Find room in existing list; if not found, force-fetch and use the returned array
    // (avoids stale-closure: chatRooms state won't update synchronously inside this callback)
    const room = chatRooms.find(r => r._id === roomId);
    let resolvedRoom = room || null;
    if (!room) {
      const freshRooms = await fetchChatRooms(true);
      const refreshedRoom = freshRooms.find(r => r._id === roomId);
      if (!refreshedRoom) {
        setError('Chat room not found');
        return;
      }
      resolvedRoom = refreshedRoom;
    }

    // Verify the current user is a participant — use resolvedRoom (not a stale second lookup)
    let participantIds: string[] = [];
    if (resolvedRoom?.participants && Array.isArray(resolvedRoom.participants) && resolvedRoom.participants.length > 0) {
      participantIds = resolvedRoom.participants
        .map((p: any) => getParticipantId(p))
        .filter(Boolean);
    }

    // Fail-closed: if local room payload lacks participant IDs, verify via server endpoint
    if (participantIds.length === 0) {
      try {
        const apiParticipants = await chatService.getChatRoomParticipants(roomId);
        participantIds = (Array.isArray(apiParticipants) ? apiParticipants : [])
          .map((p: any) => getParticipantId(p))
          .filter(Boolean);
      } catch (verifyError) {
        console.warn(`⛔ Blocked fetch: could not verify participants for room ${roomId}`, verifyError);
        toast.error('Unable to verify chat membership');
        setError('Access denied: unable to verify chat membership');
        return;
      }
    }

    const isMember = participantIds.includes(currentUserId);
    if (!isMember) {
      console.warn(`⛔ Blocked fetch: user ${currentUserId} is not a member of room ${roomId}`);
      toast.error('You are not a member of this chat room');
      setError('Access denied: you are not a member of this chat room');
      return;
    }

    // Leave the previous room on the socket before switching
    if (currentRoomIdRef.current && currentRoomIdRef.current !== roomId) {
      leaveChatRoom(currentRoomIdRef.current);
    }

    // Set current room only after membership is verified
    if (resolvedRoom) {
      setCurrentRoom(resolvedRoom);
    }

    // Join the new room so the socket receives live chat-message events for it
    joinChatRoom(roomId);
    currentRoomIdRef.current = roomId;
    setIsLoading(true);
    setError(null);
    setMessages([]);
    nextCursorRef.current = undefined;
    setHasMoreMessages(true);

    try {
      const response = await chatService.getChatRoomMessagesWithCursor(roomId, 50);
      setMessages(response.messages);
      setHasMoreMessages(response.hasMore);
      nextCursorRef.current = response.nextCursor;
      lastMessageFetchRef.current = Date.now();

      // Mark all messages as read
      response.messages.forEach(msg => {
        const senderId = normalizeId((msg as any).senderId);
        if (msg._id && senderId !== currentUserId) {
          chatService.markMessageAsRead(msg._id).catch(console.error);
        }
      });

      // Update unread count for this room
      setChatRooms(prev => prev.map(r => 
        r._id === roomId ? { ...r, unreadCount: 0 } : r
      ));
      chatService
        .getUnreadMessageCount()
        .then((count) => {
          if (isMountedRef.current) publishUnreadCount(count);
        })
        .catch(console.error);
    } catch (err: any) {
      console.error('❌ Error loading messages in selectChatRoom:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load messages';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken, chatRooms, fetchChatRooms, joinChatRoom, leaveChatRoom, user?.userId, user?._id, (user as any)?.id, normalizeId, getParticipantId, publishUnreadCount]);



const sendMessage = useCallback(async (data: SendMessageDto): Promise<ChatMessage | null> => {
  const targetRoomId = data.chatRoomId || currentRoom?._id;

  if (!isAuthenticated || !accessToken || !targetRoomId) {
    console.error('❌ Cannot send message - missing requirements:', {
      isAuthenticated,
      hasAccessToken: !!accessToken,
      hasCurrentRoom: !!currentRoom,
      currentRoomId: currentRoom?._id,
      dataChatRoomId: data.chatRoomId
    });
    toast.error('Cannot send message');
    return null;
  }

  // Backend expects 'chatRoomId' and 'text'
  const messageData: SendMessageDto = {
    chatRoomId: targetRoomId,
    text: data.text || '',     // Backend expects 'text'
    attachments: data.attachments || []
  };

  console.log('📤 Sending message with data:', JSON.stringify(messageData, null, 2));

  // Don't send empty messages
  if (!messageData.text?.trim()) {
    console.warn('⚠️ Attempted to send empty message');
    toast.error('Cannot send empty message');
    return null;
  }

  // Get current user info
  const currentUserId = user?.userId || user?._id || '';
  const currentUserName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`.trim()
    : user?.email || 'You';

  // Create optimistic message that matches the backend response format
  const optimisticMessage: ChatMessage = {
    _id: `temp-${Date.now()}`,
    senderId: currentUserId,
    senderName: currentUserName,
    content: messageData.text,
    roomId: targetRoomId,
    isRead: false,
    readBy: [],
    type: 'text',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  console.log('📝 Optimistic message:', optimisticMessage);

  // Optimistically add message to UI
  setMessages(prev => [...prev, optimisticMessage]);

  try {
    const newMessage = await chatService.sendMessage(messageData);
    
    console.log('✅ Message sent successfully:', newMessage);
    
    // Replace optimistic message with real one
    setMessages(prev => prev.map(msg => 
      msg._id === optimisticMessage._id ? newMessage : msg
    ));
    
    // Update last message in chat rooms list
    setChatRooms(prev => prev.map(room => 
      room._id === targetRoomId 
        ? { 
            ...room, 
            lastMessage: newMessage,
            lastMessageAt: newMessage.createdAt 
          } 
        : room
    ));

    // Reset last fetch time so next interval will fetch new messages
    lastMessageFetchRef.current = 0;

    return newMessage;
  } catch (err: any) {
    // Remove optimistic message on error
    setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
    
    console.error('❌ Error sending message:', err);
    
    const errorMessage = err.response?.data?.message || 
                        err.message || 
                        'Failed to send message';
    
    toast.error(errorMessage);
    return null;
  }
}, [isAuthenticated, accessToken, currentRoom, user]);
 
  const loadMoreMessages = useCallback(async () => {
    if (!currentRoom || !hasMoreMessages || isLoadingMore || !nextCursorRef.current) return;

    setIsLoadingMore(true);

    try {
      const response = await chatService.getChatRoomMessagesWithCursor(
        currentRoom._id,
        50,
        nextCursorRef.current,
        'before'
      );

      setMessages(prev => [...response.messages, ...prev]);
      setHasMoreMessages(response.hasMore);
      nextCursorRef.current = response.nextCursor;
    } catch (err: any) {
      console.error('Error loading more messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentRoom, hasMoreMessages, isLoadingMore]);

  /**
   * Refresh current room messages (with throttling)
   */
  const refreshMessages = useCallback(async (force = false) => {
    if (!currentRoom || !isMountedRef.current) return;

    // Throttle requests unless forced
    const now = Date.now();
    if (!force && now - lastMessageFetchRef.current < MESSAGE_FETCH_INTERVAL) {
      console.log('⏱️ Skipping message refresh - too soon');
      return;
    }

    try {
      const response = await chatService.getChatRoomMessagesWithCursor(
        currentRoom._id,
        50,
        undefined,
        'before'
      );
      
      if (isMountedRef.current) {
        setMessages(response.messages);
        setHasMoreMessages(response.hasMore);
        nextCursorRef.current = response.nextCursor;
        lastMessageFetchRef.current = now;
      }
    } catch (err) {
      console.error('Error refreshing messages:', err);
    }
  }, [currentRoom]);

// hooks/useChats.ts - Updated markMessageAsRead function

// hooks/useChats.ts - Updated markMessageAsRead function

/**
 * Mark a message as read
 */
const markMessageAsRead = useCallback(async (messageId: string) => {
  if (!isAuthenticated || !accessToken) return;

  try {
    await chatService.markMessageAsRead(messageId);
    
    // Get current user ID
    const currentUserId = normalizeId(user?.userId || user?._id || (user as any)?.id);
    
    if (!currentUserId) return;
    
    // Update local state - add current user ID to readBy array
    setMessages(prev => prev.map(msg => 
      msg._id === messageId
        ? {
            ...msg,
            // If readBy is string[] (array of user IDs)
            readBy: Array.from(new Set([
              ...(msg.readBy || []).map((reader: any) => normalizeId(reader)),
              currentUserId
            ]))
          }
        : msg
    ));
    
    console.log(`✅ Message ${messageId} marked as read by user ${currentUserId}`);
  } catch (err) {
    console.error('Error marking message as read:', err);
  }
  }, [isAuthenticated, accessToken, user?.userId, user?._id, (user as any)?.id, normalizeId]);
  /**
   * Add participant to a chat room
   */
  const addParticipant = useCallback(async (roomId: string, userId: string) => {
    if (!isAuthenticated || !accessToken) {
      toast.error('You must be logged in to add participants');
      return;
    }

    try {
      const updatedRoom = await chatService.addParticipant(roomId, userId);
      setChatRooms(prev => prev.map(room => 
        room._id === roomId ? updatedRoom : room
      ));
      if (currentRoom?._id === roomId) {
        setCurrentRoom(updatedRoom);
      }
      toast.success('Participant added successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to add participant';
      toast.error(errorMessage);
    }
  }, [isAuthenticated, accessToken, currentRoom]);



const addParticipantsToRoom = useCallback(async (roomId: string, userIds: string[]) => {
  if (!isAuthenticated || !accessToken) {
    toast.error('You must be logged in to add participants');
    return;
  }

  if (!userIds || userIds.length === 0) {
    toast.error('No participants selected');
    return;
  }

  setIsLoading(true);
  setError(null);

  try {
    // You'll need to add this method to your chatService
    const updatedRoom = await chatService.addParticipantsToRoom(roomId, userIds);
    
    // Update chat rooms list
    setChatRooms(prev => prev.map(room => 
      room._id === roomId ? updatedRoom : room
    ));
    
    // Update current room if it's the one being modified
    if (currentRoom?._id === roomId) {
      setCurrentRoom(updatedRoom);
    }
    
    toast.success(`${userIds.length} parent${userIds.length !== 1 ? 's' : ''} added successfully`);
  } catch (err: any) {
    console.error('Error adding participants:', err);
    const errorMessage = err.response?.data?.message || err.message || 'Failed to add participants';
    setError(errorMessage);
    toast.error(errorMessage);
    throw err; // Re-throw so the modal can handle it
  } finally {
    setIsLoading(false);
  }
}, [isAuthenticated, accessToken, currentRoom]);

  /**
   * Remove participant from a chat room
   */
  const removeParticipant = useCallback(async (roomId: string, userId: string) => {
    if (!isAuthenticated || !accessToken) {
      toast.error('You must be logged in to remove participants');
      return;
    }

    try {
      const updatedRoom = await chatService.removeParticipant(roomId, userId);
      setChatRooms(prev => prev.map(room => 
        room._id === roomId ? updatedRoom : room
      ));
      if (currentRoom?._id === roomId) {
        setCurrentRoom(updatedRoom);
      }
      toast.success('Participant removed successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to remove participant';
      toast.error(errorMessage);
    }
  }, [isAuthenticated, accessToken, currentRoom]);

  /**
   * Search chat rooms
   */
  const searchChatRooms = useCallback(async (params: { searchTerm?: string; type?: ChatRoomType }): Promise<ChatRoom[]> => {
    if (!isAuthenticated || !accessToken) return [];

    try {
      return await chatService.searchChatRooms(params);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to search chat rooms';
      toast.error(errorMessage);
      return [];
    }
  }, [isAuthenticated, accessToken]);

  /**
   * Reset current room
   */
  const resetCurrentRoom = useCallback(() => {
    if (currentRoomIdRef.current) {
      leaveChatRoom(currentRoomIdRef.current);
    }
    setCurrentRoom(null);
    setMessages([]);
    nextCursorRef.current = undefined;
    setHasMoreMessages(true);
    currentRoomIdRef.current = null;
    lastMessageFetchRef.current = 0;
  }, [leaveChatRoom]);

  /**
   * Fetch unread message count (with throttling)
   */
  const fetchUnreadCount = useCallback(async (force = false) => {
    if (!isAuthenticated || !accessToken) {
      publishUnreadCount(0);
      return;
    }

    // Throttle requests unless forced
    const now = Date.now();
    if (!force && now - lastUnreadFetchRef.current < UNREAD_FETCH_INTERVAL) {
      return;
    }

    try {
      const count = await chatService.getUnreadMessageCount();
      if (isMountedRef.current) {
        publishUnreadCount(count);
        lastUnreadFetchRef.current = now;
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [isAuthenticated, accessToken, publishUnreadCount]);

  // Initial fetch on mount and auth change
  useEffect(() => {
    isMountedRef.current = true;

    if (isAuthenticated && accessToken) {
      fetchChatRooms(true);
      fetchUnreadCount(true);
    } else {
      setChatRooms([]);
      setCurrentRoom(null);
      setMessages([]);
      publishUnreadCount(0);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [isAuthenticated, accessToken, fetchChatRooms, fetchUnreadCount, publishUnreadCount]);

  // Keep currentRoomRef in sync so socket callbacks always see the latest room
  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  // Subscribe to real-time socket events while connected
  useEffect(() => {
    if (!isConnected || !isAuthenticated) return;

    const unsubMessage = onChatMessage((message) => {
      const activeRoom = currentRoomRef.current;

      // Append incoming message to the open conversation (skip if already present)
      if (activeRoom && message.roomId === activeRoom._id) {
        // Resolve sender name from participants when the backend omits it
        let resolvedSenderName = message.senderName;
        const messageSenderId = normalizeId(message.senderId);
        if (!resolvedSenderName && activeRoom.participants) {
          const participant = (activeRoom.participants as any[]).find((p: any) => {
            const pid = getParticipantId(p);
            return pid === messageSenderId;
          });
          if (participant && typeof participant === 'object') {
            resolvedSenderName =
              participant.firstName && participant.lastName
                ? `${participant.firstName} ${participant.lastName}`.trim()
                : participant.name || participant.email || '';
          }
        }

        setMessages(prev => {
          if (prev.some(m => m._id === message._id)) return prev;
          return [
            ...prev,
            {
              _id: message._id,
              senderId: message.senderId,
              senderName: resolvedSenderName || message.senderName,
              content: message.content,
              roomId: message.roomId,
              type: message.type,
              duration: message.duration,
              isRead: false,
              readBy: message.readBy || [],
              createdAt: new Date(message.timestamp),
              updatedAt: new Date(message.timestamp),
            } as any,
          ];
        });

        // Mark as read — user is actively viewing this room
        const currentUserId = normalizeId(user?.userId || user?._id || (user as any)?.id);
        if (messageSenderId !== currentUserId) {
          chatService
            .markMessageAsRead(message._id)
            .then(() => chatService.getUnreadMessageCount())
            .then((count) => {
              if (isMountedRef.current) publishUnreadCount(count);
            })
            .catch(console.error);
        }
      }

      // Update sidebar: refresh last-message preview and bump unread count
      setChatRooms(prev => {
        const updated = prev.map(room => {
          if (room._id !== message.roomId) return room;
          const isCurrentRoom = activeRoom?._id === message.roomId;
          return {
            ...room,
            lastMessage: {
              content: message.content,
              createdAt: new Date(message.timestamp),
              updatedAt: new Date(message.timestamp),
            } as any,
            lastMessageAt: message.timestamp,
            unreadCount: isCurrentRoom ? 0 : (room.unreadCount ?? 0) + 1,
          };
        });
        return updated.sort((a, b) => {
          const tsA = a.lastMessageAt ?? a.lastMessage?.createdAt ?? a.updatedAt ?? 0;
          const tsB = b.lastMessageAt ?? b.lastMessage?.createdAt ?? b.updatedAt ?? 0;
          return new Date(tsB as any).getTime() - new Date(tsA as any).getTime();
        });
      });
    });

    // Full room list refresh (triggered after a message is sent by any participant)
    const unsubRooms = onChatRoomsUpdate((data) => {
      if (!Array.isArray(data.rooms)) return;
      const currentUserId = normalizeId(
        user?.userId || user?._id || (user as any)?.id
      );
      if (!currentUserId) return;
      const activeRoom = currentRoomRef.current;
      const memberRooms = data.rooms.filter(room => {
        if (!Array.isArray(room.participants)) return false;
        return room.participants.some(
          (p: any) => getParticipantId(p) === currentUserId
        );
      }).map((room) =>
        activeRoom?._id === room._id ? { ...room, unreadCount: 0 } : room
      );

      setChatRooms(memberRooms.sort((a, b) => {
        const tsA = a.lastMessageAt ?? a.lastMessage?.createdAt ?? a.updatedAt ?? 0;
        const tsB = b.lastMessageAt ?? b.lastMessage?.createdAt ?? b.updatedAt ?? 0;
        return new Date(tsB as any).getTime() - new Date(tsA as any).getTime();
      }));
    });

    // Global unread badge update (triggered after mark-as-read or new message)
    const unsubUnread = onUnreadMessagesUpdate((data) => {
      if (typeof data.unreadCount === 'number') {
        publishUnreadCount(data.unreadCount);
      }
    });

    return () => {
      unsubMessage();
      unsubRooms();
      unsubUnread();
    };
  }, [
    isConnected,
    isAuthenticated,
    onChatMessage,
    onChatRoomsUpdate,
    onUnreadMessagesUpdate,
    publishUnreadCount,
    normalizeId,
    getParticipantId,
    user?.userId,
    user?._id,
  ]);

  // Polling fallback — only active while the WebSocket is disconnected
  useEffect(() => {
    if (!isAuthenticated || !accessToken || isConnected) return;

    const pollingInterval = setInterval(() => {
      if (!isMountedRef.current) return;
      fetchUnreadCount();
      fetchChatRooms();
      if (currentRoom) refreshMessages();
    }, MESSAGE_FETCH_INTERVAL);

    return () => clearInterval(pollingInterval);
  }, [isAuthenticated, accessToken, isConnected, currentRoom, fetchChatRooms, fetchUnreadCount, refreshMessages]);

  return {
    // State
    chatRooms,
    currentRoom,
    messages,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMoreMessages,
    error,
    
    // Chat room operations
    fetchChatRooms,
    createChatRoom,
    createGroupChat,
    selectChatRoom,
    searchChatRooms,
    
    // Message operations
    sendMessage,
    loadMoreMessages,
    refreshMessages,
    markMessageAsRead,
    
    // Participant operations
    addParticipant,
    removeParticipant,
   addParticipantsToRoom, // Add this line

    // Utility
    resetCurrentRoom,
    clearError
  };
};
