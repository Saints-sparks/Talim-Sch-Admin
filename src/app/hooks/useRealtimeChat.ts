// app/hooks/admin/useAdminRealtimeChat.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAdminWebSocket, ChatMessage, ChatRoomData } from "@/hooks/useAdminWebSockets";
import { useAuth } from "@/context/AuthContext";

export interface RealtimeChatRoom {
  roomId: string;
  displayName: string;
  type: 'one_to_one' | 'group';
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    timestamp: Date;
    type: string;
  };
  unreadCount: number;
  participants: Array<{
    userId: string;
    name?: string;
    role?: string;
    schoolId?: string;
    isOnline: boolean;
  }>;
  avatarInfo: {
    type: 'image' | 'initials';
    value: string;
    bgColor?: string;
  };
  isOnline?: boolean;
  schoolId?: string;
  schoolName?: string;
  updatedAt: Date;
}

export const useAdminRealtimeChat = () => {
  const { user, isAuthenticated, accessToken } = useAuth();
  const [chatRooms, setChatRooms] = useState<RealtimeChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  
  const webSocket = useAdminWebSocket();
  const { isConnected, connect, disconnect } = webSocket;

  // Transform API room data to RealtimeChatRoom format
  const transformRoomData = useCallback((room: ChatRoomData): RealtimeChatRoom => {
    // Determine display name based on room type
    let displayName = room.displayName || room.name;
    let avatarInfo: RealtimeChatRoom['avatarInfo'] = {
      type: 'initials',
      value: '',
    };

    if (room.type === 'one_to_one') {
      // For private chats, find the other participant
      const otherParticipant = room.participants.find(p => p.userId !== user?.userId);
      if (otherParticipant) {
        displayName = otherParticipant.name || 
          `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() || 
          'User';
        
        if (otherParticipant.userAvatar) {
          avatarInfo = {
            type: 'image',
            value: otherParticipant.userAvatar,
          };
        } else {
          avatarInfo = {
            type: 'initials',
            value: (otherParticipant.firstName?.[0] || '') + (otherParticipant.lastName?.[0] || ''),
          };
        }
      }
    } else {
      // For group chats
      avatarInfo = {
        type: 'initials',
        value: displayName.substring(0, 2).toUpperCase(),
      };
    }

    return {
      roomId: room.roomId,
      displayName,
      type: room.type === 'one_to_one' ? 'one_to_one' : 'group',
      lastMessage: room.lastMessage ? {
        content: room.lastMessage.content,
        senderId: room.lastMessage.senderId,
        senderName: room.lastMessage.senderName,
        timestamp: new Date(room.lastMessage.timestamp),
        type: room.lastMessage.type,
      } : undefined,
      unreadCount: room.unreadCount || 0,
      participants: room.participants.map(p => ({
        userId: p.userId,
        name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
        role: p.role,
        schoolId: p.schoolId,
        isOnline: p.isOnline,
      })),
      avatarInfo,
      isOnline: room.participants.some(p => p.userId !== user?.userId && p.isOnline),
      schoolId: room.schoolId,
      schoolName: room.schoolName,
      updatedAt: new Date(room.updatedAt),
    };
  }, [user?.userId]);

  // Refresh chat rooms
  const refreshChatRooms = useCallback(() => {
    if (isConnected) {
      setIsLoading(true);
      setError(null);
      webSocket.fetchChatRooms();
    }
  }, [isConnected, webSocket]);

  // Search chat rooms
  const searchChatRooms = useCallback((searchTerm: string): RealtimeChatRoom[] => {
    if (!searchTerm.trim()) return chatRooms;
    
    const term = searchTerm.toLowerCase().trim();
    return chatRooms.filter(room => 
      room.displayName.toLowerCase().includes(term) ||
      room.lastMessage?.content?.toLowerCase().includes(term) ||
      room.participants.some(p => p.name?.toLowerCase().includes(term))
    );
  }, [chatRooms]);

  // Get filtered chat rooms
  const getFilteredChatRooms = useCallback((filterType?: string): RealtimeChatRoom[] => {
    let filtered = [...chatRooms];
    
    switch (filterType) {
      case 'teachers':
        filtered = filtered.filter(room => 
          room.type === 'one_to_one' && 
          room.participants.some(p => p.role === 'teacher')
        );
        break;
      case 'groups':
        filtered = filtered.filter(room => room.type === 'group');
        break;
      default:
        break;
    }
    
    return filtered.sort((a, b) => 
      (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)
    );
  }, [chatRooms]);

  // Select room
  const selectRoom = useCallback((roomId: string) => {
    setSelectedRoomId(roomId);
    webSocket.joinChatRoom(roomId);
  }, [webSocket]);

  // Unselect room
  const unselectRoom = useCallback(() => {
    if (selectedRoomId) {
      webSocket.leaveChatRoom(selectedRoomId);
      setSelectedRoomId(null);
    }
  }, [selectedRoomId, webSocket]);

  // Send message
  const sendMessage = useCallback((content: string, type: 'text' | 'voice' = 'text', duration?: number) => {
    if (!selectedRoomId) return;

    webSocket.sendChatMessage({
      content,
      roomId: selectedRoomId,
      senderName: user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email || 'Admin',
      type,
      duration,
    });
  }, [selectedRoomId, webSocket, user]);

  // Mark message as read
  const markAsRead = useCallback((messageId: string) => {
    webSocket.markMessageAsRead(messageId);
  }, [webSocket]);

  // Set up WebSocket connection when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.userId && accessToken) {
      connect(user.userId, user.schoolId);
    } else {
      disconnect();
    }
  }, [isAuthenticated, user?.userId, user?.schoolId, accessToken, connect, disconnect]);

  // Listen for chat rooms updates
  useEffect(() => {
    if (!webSocket.socket) return;

    const unsubscribe = webSocket.onChatRoomsUpdate((data) => {
      const transformedRooms = data.rooms.map(transformRoomData);
      setChatRooms(transformedRooms);
      setIsLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, [webSocket, transformRoomData]);

  // Listen for new messages
  useEffect(() => {
    if (!webSocket.socket) return;

    const unsubscribe = webSocket.onChatMessage((message) => {
      setChatRooms(prevRooms => 
        prevRooms.map(room => {
          if (room.roomId === message.roomId) {
            return {
              ...room,
              lastMessage: {
                content: message.content,
                senderId: message.senderId,
                senderName: message.senderName,
                timestamp: new Date(message.timestamp),
                type: message.type,
              },
              updatedAt: new Date(),
              unreadCount: room.roomId === selectedRoomId ? 0 : (room.unreadCount || 0) + 1,
            };
          }
          return room;
        })
      );
    });

    return unsubscribe;
  }, [webSocket, selectedRoomId]);

  return {
    chatRooms,
    isLoading,
    isConnected: webSocket.isConnected,
    error,
    selectedRoomId,
    refreshChatRooms,
    searchChatRooms,
    getFilteredChatRooms,
    selectRoom,
    unselectRoom,
    sendMessage,
    markAsRead,
    onNewMessage: webSocket.onChatMessage,
    onRoomUpdate: () => () => {}, // Implement if needed
    webSocket, // Expose raw WebSocket for admin-specific features
  };
};