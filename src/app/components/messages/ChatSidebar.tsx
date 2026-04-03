"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  ChevronDown, 
  Loader2, 
  Users, 
  MessageCircle, 
  Wifi, 
  WifiOff,
  Plus,
  Filter
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useMemo } from "react";
import CreateGroupModal from "./CreateGroupModal";
import { useChats } from "@/hooks/useChats";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";
import { ChatRoomType } from "@/types/chat.types";

// Define a local interface that matches what the component needs
interface DisplayChatRoom {
  roomId: string;
  displayName: string;
  type: "private" | "group";
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
    email?: string;   
    isOnline: boolean;
  }>;
  avatarInfo: {
    type: 'image' | 'initials';
    value: string;
    bgColor?: string;
  };
  isOnline?: boolean;
  updatedAt: Date;
}

interface ChatSidebarProps {
  onSelectChat: (chat: { type: "private" | "group"; room?: any }) => void;
  className?: string;
}

export default function ChatSidebar({ onSelectChat, className = "" }: ChatSidebarProps) {
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "teachers" | "groups">("all");
  const [displayRooms, setDisplayRooms] = useState<DisplayChatRoom[]>([]);
  
  const { 
    chatRooms: originalRooms, 
    isLoading, 
    error, 
    fetchChatRooms,
    selectChatRoom,
    currentRoom,
    unreadCount: totalUnreadCount
  } = useChats();

  // Transform original chat rooms to display format
  const transformedRooms = useMemo(() => {
    return originalRooms.map(room => {
      // Determine if it's a group chat
      // Map ChatRoomType to DisplayChatRoom type
      let isGroup = false;
      let displayType: "private" | "group" = "private";
      // Any type other than one-to-one is treated as a group
      if (room.type !== ChatRoomType.ONE_TO_ONE) {
        isGroup = true;
        displayType = 'group';
      } else {
        isGroup = false;
        displayType = 'private';
      }
      // Get display name
      let displayName = room.name || 'Chat';
      let isOnline = false;
      // For one-to-one chats, find the other participant
      if (!isGroup && room.participants && Array.isArray(room.participants)) {
        // room.createdBy is a string, so compare to participant.userId or _id
        const otherParticipant = room.participants.find(p => {
          if (typeof p === 'string') return p !== room.createdBy;
          return p.userId !== room.createdBy && p._id !== room.createdBy;
        });
        if (otherParticipant && typeof otherParticipant !== 'string') {
          displayName = ((otherParticipant.firstName || '') + (otherParticipant.lastName ? ' ' + otherParticipant.lastName : '')).trim() || 'User';
          // isOnline is not available on Participant, so default to false
          isOnline = false;
        }
      }

      // Generate avatar
      const avatarInfo = {
        type: 'initials' as const,
        value: getUserInitials(displayName),
        bgColor: generateColorFromString(displayName)
      };

      // Get last message
      const lastMessage = room.lastMessage ? {
        content: room.lastMessage.content || '',
        senderId: room.lastMessage.senderId || '',
        senderName: room.lastMessage.senderName || 'Unknown',
        timestamp: new Date(room.lastMessage.createdAt),
        type: 'text'
      } : undefined;

      return {
        roomId: room._id,
        displayName,
        type: displayType,
        lastMessage,
        unreadCount: room.unreadCount || 0,
        participants: room.participants?.map((p: any) => {
          if (typeof p === 'string') {
            return {
              userId: p,
              name: undefined,
              role: undefined,
              isOnline: false
            };
          } else {
            const participantId = p.userId || p._id || p.id || p.user?._id || p.user?.id || p.user?.userId || '';
            const participantName = ((p.firstName || p.user?.firstName || '') + ((p.lastName || p.user?.lastName) ? ' ' + (p.lastName || p.user?.lastName) : '')).trim();
            return {
              userId: participantId,
              name: participantName || p.name || p.user?.name || p.email || p.user?.email || undefined,
              role: p.role || p.user?.role,
              isOnline: false // Participant does not have isActive
            };
          }
        }) || [],
        avatarInfo,
        isOnline,
        updatedAt: new Date(room.updatedAt || room.createdAt)
      };
    }).sort((a, b) => 
      (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0)
    );
  }, [originalRooms]);

  // Apply filters and search to rooms
  useEffect(() => {
    let filtered = [...transformedRooms];

    // Apply type filter
    if (filterType !== 'all') {
      if (filterType === 'groups') {
        filtered = filtered.filter(room => room.type === 'group');
      } else if (filterType === 'teachers') {
        filtered = filtered.filter(room => 
          room.type === 'private' && 
          room.participants.some(p => p.role === 'teacher')
        );
      }
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(room => 
        room.displayName.toLowerCase().includes(term) ||
        room.lastMessage?.content?.toLowerCase().includes(term) ||
        room.participants.some(p => p.name?.toLowerCase().includes(term))
      );
    }

    setDisplayRooms(filtered);
  }, [transformedRooms, filterType, searchTerm]);

  const handleSelectChat = (room: DisplayChatRoom) => {
    selectChatRoom(room.roomId);
    onSelectChat({ 
      type: room.type, 
      room 
    });
  };

  const handleFilterChange = (newFilter: "all" | "teachers" | "groups") => {
    setFilterType(newFilter);
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className={`w-full h-full border-r bg-white flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100 bg-white">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
          Messages
          {totalUnreadCount > 0 && (
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </span>
          )}
        </h2>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
      </div>

      {/* Search Section */}
      <div className="p-3 sm:p-4 space-y-3 bg-white border-b border-gray-50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          <Input
            className="pl-9 pr-4 py-3 sm:py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 transition-all duration-200 text-sm placeholder:text-gray-500 touch-manipulation"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-gray-600 border-gray-200 hover:bg-gray-50 active:bg-gray-100 capitalize rounded-lg px-3 py-2.5 sm:py-2 text-xs touch-manipulation"
              >
                <Filter size={12} />
                {filterType}
                <ChevronDown size={12} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-32">
              <DropdownMenuItem onClick={() => handleFilterChange('all')}>
                All Chats
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('teachers')}>
                Teachers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleFilterChange('groups')}>
                Groups
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchChatRooms()}
            className="flex items-center gap-2 text-gray-600 border-gray-200 hover:bg-gray-50 active:bg-gray-100 rounded-lg px-3 py-2.5 sm:py-2 text-xs touch-manipulation"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={isLoading ? 'animate-spin' : ''}
            >
              <path d="M23 4v6h-6"/>
              <path d="M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-3 sm:mx-4 mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
          <button 
            onClick={() => fetchChatRooms()}
            className="text-xs text-red-700 underline mt-1 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto bg-white">
        {/* Create Group Button */}
        <div className="px-3 sm:px-4 mb-2">
          <button
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors text-left group touch-manipulation"
            onClick={() => setIsCreateGroupModalOpen(true)}
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 group-active:bg-blue-300 transition-colors">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">Create Group</p>
              <p className="text-xs text-gray-500 truncate">Add teachers and students</p>
            </div>
          </button>
        </div>

        {/* Connection Status - You can determine this from your WebSocket implementation */}
        {false && (
          <div className="flex items-center justify-center p-6 text-gray-500">
            <div className="text-center">
              <WifiOff className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Connecting to chat...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && displayRooms.length === 0 && (
          <div className="flex items-center justify-center p-6 text-gray-500">
            <div className="text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">
                {searchTerm ? 'No chats found' : 'No chats yet'}
              </p>
              {!searchTerm && (
                <p className="text-xs text-gray-400 mt-1">
                  Start by creating a group chat
                </p>
              )}
            </div>
          </div>
        )}

        {/* Chat Items */}
        <div className="px-2 sm:px-3">
          {displayRooms.map((room) => {
            return (
              <div
                key={room.roomId}
                className={`flex items-center gap-3 p-3 mx-1 hover:bg-gray-50 active:bg-gray-100 rounded-xl cursor-pointer transition-all duration-200 ${
                  currentRoom?._id === room.roomId 
                    ? 'bg-blue-50 border border-blue-200 shadow-sm' 
                    : ''
                } touch-manipulation`}
                onClick={() => handleSelectChat(room)}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {room.avatarInfo.type === 'image' ? (
                    <Avatar className="w-11 h-11">
                      <AvatarImage src={room.avatarInfo.value} />
                      <AvatarFallback 
                        className="text-white font-medium text-sm"
                        style={{ backgroundColor: room.avatarInfo.bgColor }}
                      >
                        {room.avatarInfo.value}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                      style={{ backgroundColor: room.avatarInfo.bgColor }}
                    >
                      {room.avatarInfo.value}
                    </div>
                  )}
                  
                  {/* Online indicator for private chats */}
                  {room.type === 'private' && (
                    <span 
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${
                        room.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                  )}
                  
                  {/* Group indicator */}
                  {room.type === 'group' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
                      <Users className="w-2 h-2 text-white" />
                    </span>
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-medium text-gray-900 truncate text-sm">
                      {room.displayName}
                    </h3>
                    {room.lastMessage?.timestamp && (
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatTime(room.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 truncate pr-2">
                      {room.lastMessage?.content || "No messages yet"}
                    </p>
                    {room.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-medium text-white bg-blue-600 rounded-full">
                        {room.unreadCount > 99 ? '99+' : room.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CreateGroupModal
        open={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSuccess={() => fetchChatRooms(true)}
      />
    </div>
  );
}