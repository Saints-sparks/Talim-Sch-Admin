// hooks/useChats.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
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
import { toast } from 'react-toastify';

interface UseChatsReturn {
  // ... (same interface)
}

export const useChats = (): UseChatsReturn => {
  const { user, accessToken, isAuthenticated } = useAuth();
  
  // State
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination refs
  const nextCursorRef = useRef<string | undefined>();
  const currentRoomIdRef = useRef<string | null>(null);
  
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
  const fetchChatRooms = useCallback(async (force = false) => {
    if (!isAuthenticated || !accessToken) {
      setChatRooms([]);
      return;
    }

    // Throttle requests unless forced
    const now = Date.now();
    if (!force && now - lastRoomsFetchRef.current < ROOMS_FETCH_INTERVAL) {
      console.log('⏱️ Skipping chat rooms fetch - too soon');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const rooms = await chatService.getUserChatRooms();
      const roomsArray = Array.isArray(rooms) ? rooms : [];
      
      const sortedRooms = roomsArray.sort((a, b) => {
        const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return dateB - dateA;
      });
      
      setChatRooms(sortedRooms);
      lastRoomsFetchRef.current = now;
      
    } catch (err: any) {
      console.error('❌ Error in fetchChatRooms:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch chat rooms';
      setError(errorMessage);
      toast.error(errorMessage);
      setChatRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken]);

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

    // Find room in existing list
    const room = chatRooms.find(r => r._id === roomId);
    if (!room) {
      await fetchChatRooms(true); // Force fetch
      const refreshedRoom = chatRooms.find(r => r._id === roomId);
      if (!refreshedRoom) {
        setError('Chat room not found');
        return;
      }
      setCurrentRoom(refreshedRoom);
    } else {
      setCurrentRoom(room);
    }

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
        if (msg.senderId !== user?.userId) {
          chatService.markMessageAsRead(msg._id).catch(console.error);
        }
      });

      // Update unread count for this room
      setChatRooms(prev => prev.map(r => 
        r._id === roomId ? { ...r, unreadCount: 0 } : r
      ));
    } catch (err: any) {
      console.error('❌ Error loading messages in selectChatRoom:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load messages';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken, chatRooms, fetchChatRooms, user?.userId]);

  /**
   * Send a message to the current chat room
   */
  const sendMessage = useCallback(async (data: SendMessageDto): Promise<ChatMessage | null> => {
    if (!isAuthenticated || !accessToken || !currentRoom) {
      toast.error('Cannot send message');
      return null;
    }

    try {
      const newMessage = await chatService.sendMessage(data);
      
      // Optimistically add message to UI
      setMessages(prev => [...prev, newMessage]);
      
      // Update last message in chat rooms list
      setChatRooms(prev => prev.map(room => 
        room._id === currentRoom._id 
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
      const errorMessage = err.response?.data?.message || 'Failed to send message';
      toast.error(errorMessage);
      return null;
    }
  }, [isAuthenticated, accessToken, currentRoom]);

  /**
   * Load more messages (older messages)
   */
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

  /**
   * Mark a message as read
   */
  const markMessageAsRead = useCallback(async (messageId: string) => {
    if (!isAuthenticated || !accessToken) return;

    try {
      await chatService.markMessageAsRead(messageId);
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg._id === messageId
          ? {
              ...msg,
              readBy: [
                ...(msg.readBy || []),
                { userId: user?.userId || '', readAt: new Date() }
              ]
            }
          : msg
      ));
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  }, [isAuthenticated, accessToken, user?.userId]);

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
    setCurrentRoom(null);
    setMessages([]);
    nextCursorRef.current = undefined;
    setHasMoreMessages(true);
    currentRoomIdRef.current = null;
    lastMessageFetchRef.current = 0;
  }, []);

  /**
   * Fetch unread message count (with throttling)
   */
  const fetchUnreadCount = useCallback(async (force = false) => {
    if (!isAuthenticated || !accessToken) {
      setUnreadCount(0);
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
        setUnreadCount(count);
        lastUnreadFetchRef.current = now;
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [isAuthenticated, accessToken]);

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
      setUnreadCount(0);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [isAuthenticated, accessToken]);

  // Single polling interval for all updates
  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const pollingInterval = setInterval(() => {
      // Only fetch if the component is still mounted
      if (!isMountedRef.current) return;

      // Fetch unread count
      fetchUnreadCount();

      // Fetch rooms updates
      fetchChatRooms();

      // Refresh current room messages if one is selected
      if (currentRoom) {
        refreshMessages();
      }
    }, MESSAGE_FETCH_INTERVAL); // Use a single interval (30 seconds)

    return () => {
      clearInterval(pollingInterval);
    };
  }, [isAuthenticated, accessToken, currentRoom, fetchChatRooms, fetchUnreadCount, refreshMessages]);

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
    
    // Utility
    resetCurrentRoom,
    clearError
  };
};