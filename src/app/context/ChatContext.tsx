// app/context/admin/ChatContext.tsx
"use client";

import React, { createContext, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useAdminRealtimeChat, RealtimeChatRoom } from '../hooks/useAdminRealTimeChat'; // Updated import
import { ChatMessage } from '@/hooks/useAdminWebSockets'; // Updated import
import { useAuth } from '@/context/AuthContext';

interface AdminChatContextType {
  // Chat state
  chatRooms: RealtimeChatRoom[];
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  
  // Current chat selection
  selectedRoomId: string | null;
  selectedRoom: RealtimeChatRoom | null;
  
  // Admin specific filters
  filteredBySchool: RealtimeChatRoom[];
  
  // Chat operations
  refreshChatRooms: () => void;
  searchChatRooms: (searchTerm: string) => RealtimeChatRoom[];
  getFilteredChatRooms: (filterType?: "all" | "teachers" | "groups") => RealtimeChatRoom[];
  
  // School specific operations (admin only)
  getRoomsBySchool: (schoolId: string) => RealtimeChatRoom[];
  getUnreadCountBySchool: (schoolId: string) => number;
  
  // Admin broadcast functions
  broadcastNotification: (data: {
    title: string;
    body: string;
    type: string;
    targetSchools?: string[];
    targetRoles?: string[];
    data?: Record<string, any>;
  }) => void;
  
  // School statistics
  fetchSchoolStats: () => void;
  
  // Room management
  selectRoom: (roomId: string) => void;
  unselectRoom: () => void;
  
  // Message operations
  sendMessage: (content: string, type?: 'text' | 'voice', duration?: number) => void;
  markAsRead: (messageId: string) => void;
  
  // Event handlers
  onNewMessage: (callback: (message: ChatMessage) => void) => () => void;
  onRoomUpdate: (callback: (roomId: string, room: RealtimeChatRoom) => void) => () => void;
  
  // Raw WebSocket access for advanced admin features
  webSocket: ReturnType<typeof useAdminRealtimeChat>['webSocket'];
}

const AdminChatContext = createContext<AdminChatContextType | undefined>(undefined);

interface AdminChatProviderProps {
  children: ReactNode;
}

export const AdminChatProvider: React.FC<AdminChatProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const realtimeChat = useAdminRealtimeChat(); // Using admin hook now
  
  // Find selected room
  const selectedRoom = realtimeChat.selectedRoomId 
    ? realtimeChat.chatRooms.find(room => room.roomId === realtimeChat.selectedRoomId) || null
    : null;

  // Admin specific: Filter rooms by the admin's school (if schoolId exists)
  const filteredBySchool = useMemo(() => {
    if (!user?.schoolId) return realtimeChat.chatRooms;
    
    return realtimeChat.chatRooms.filter(room => {
      // For private chats, check if the other user belongs to the admin's school
      if (room.type === 'one_to_one') {
        return room.participants?.some(p => p.schoolId === user.schoolId);
      }
      
      // For group chats, check if the group belongs to the admin's school
      return room.schoolId === user.schoolId || !room.schoolId; // Include global groups
    });
  }, [realtimeChat.chatRooms, user?.schoolId]);

  // Get filtered chat rooms with admin-specific filtering
  const getFilteredChatRooms = useCallback((filterType?: "all" | "teachers" | "groups"): RealtimeChatRoom[] => {
    // First apply school filter (for multi-school admin)
    let rooms = filteredBySchool;
    
    // Then apply type filter
    switch (filterType) {
      case "teachers":
        rooms = rooms.filter(room => 
          room.type === 'one_to_one' && 
          room.participants?.some(p => p.role === 'teacher')
        );
        break;
      case "groups":
        rooms = rooms.filter(room => room.type !== 'one_to_one');
        break;
      default:
        // "all" - return all rooms
        break;
    }
    
    return rooms;
  }, [filteredBySchool]);

  // Get rooms by specific school (useful for admins managing multiple schools)
  const getRoomsBySchool = useCallback((schoolId: string): RealtimeChatRoom[] => {
    return realtimeChat.chatRooms.filter(room => {
      if (room.type === 'one_to_one') {
        return room.participants?.some(p => p.schoolId === schoolId);
      }
      return room.schoolId === schoolId;
    });
  }, [realtimeChat.chatRooms]);

  // Get unread count for a specific school
  const getUnreadCountBySchool = useCallback((schoolId: string): number => {
    const schoolRooms = getRoomsBySchool(schoolId);
    return schoolRooms.reduce((total, room) => total + (room.unreadCount || 0), 0);
  }, [getRoomsBySchool]);

  // Enhanced search that includes school context
  const searchChatRooms = useCallback((searchTerm: string): RealtimeChatRoom[] => {
    if (!searchTerm.trim()) return filteredBySchool;
    
    const term = searchTerm.toLowerCase().trim();
    return filteredBySchool.filter(room => {
      // Search in room name
      if (room.displayName.toLowerCase().includes(term)) return true;
      
      // Search in last message
      if (room.lastMessage?.content?.toLowerCase().includes(term)) return true;
      
      // Search in participant names (for private chats)
      if (room.participants?.some(p => 
        p.name?.toLowerCase().includes(term) || 
        p.email?.toLowerCase().includes(term)
      )) return true;
      
      // Search by school name (admin specific)
      if (room.schoolName?.toLowerCase().includes(term)) return true;
      
      return false;
    });
  }, [filteredBySchool]);

  // Admin broadcast function
  const broadcastNotification = useCallback((data: {
    title: string;
    body: string;
    type: string;
    targetSchools?: string[];
    targetRoles?: string[];
    data?: Record<string, any>;
  }) => {
    realtimeChat.webSocket.broadcastNotification(data);
  }, [realtimeChat.webSocket]);

  // Fetch school statistics
  const fetchSchoolStats = useCallback(() => {
    realtimeChat.webSocket.fetchSchoolStats();
  }, [realtimeChat.webSocket]);

  // Auto-refresh when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      realtimeChat.refreshChatRooms();
    }
  }, [isAuthenticated, realtimeChat]);

  const contextValue: AdminChatContextType = {
    ...realtimeChat,
    selectedRoom,
    filteredBySchool,
    getFilteredChatRooms,
    getRoomsBySchool,
    getUnreadCountBySchool,
    searchChatRooms,
    broadcastNotification,
    fetchSchoolStats,
    webSocket: realtimeChat.webSocket,
  };

  return (
    <AdminChatContext.Provider value={contextValue}>
      {children}
    </AdminChatContext.Provider>
  );
};

export const useAdminChat = (): AdminChatContextType => {
  const context = useContext(AdminChatContext);
  if (context === undefined) {
    throw new Error('useAdminChat must be used within an AdminChatProvider');
  }
  return context;
};

export default AdminChatContext;