"use client";

import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { Users } from "lucide-react";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";

interface ChatSidebarParticipant {
  _id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

interface ChatSidebarMessage {
  type?: string;
  content?: string;
}

interface ChatSidebarRoom {
  name?: string;
  participants?: ChatSidebarParticipant[];
  currentUserId?: string;
  avatarInfo?: {
    type?: "image" | "initials";
    value?: string;
  };
  lastMessageAt?: Date | string;
  lastMessage?: ChatSidebarMessage;
  unreadCount?: number;
}

interface ChatSidebarItemProps {
  room: ChatSidebarRoom;
  type: "private" | "group";
  onClick: () => void;
}

export default function ChatSidebarItem({ room, type, onClick }: ChatSidebarItemProps) {
  
  // Get display name and avatar info
  const { name, avatar, color, initials } = useMemo(() => {
    if (type === "group") {
      // Group chat
      const groupName = room.name || "Group Chat";
        return {
          name: groupName,
          avatar: room.avatarInfo?.type === "image" ? room.avatarInfo.value : null,
          color: generateColorFromString(groupName),
          initials: "👥"
        };
    } else {
      // Private chat - get the other participant
      const otherParticipant =
        room.participants?.find((p) => p._id !== room.currentUserId) || room.participants?.[0];
      const participantName = otherParticipant 
        ? `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() 
        : 'Unknown User';
      
      return {
        name: participantName || otherParticipant?.email || 'User',
        avatar: otherParticipant?.avatar || null,
        color: generateColorFromString(participantName || otherParticipant?.email || ''),
        initials: getUserInitials(participantName || otherParticipant?.email || 'U')
      };
    }
  }, [room, type]);

  // Format last message time
  const timeAgo = useMemo(() => {
    if (!room.lastMessageAt) return "";
    try {
      return formatDistanceToNow(new Date(room.lastMessageAt), { addSuffix: true });
    } catch {
      return "";
    }
  }, [room.lastMessageAt]);

  // Get last message preview
  const lastMessage = useMemo(() => {
    if (!room.lastMessage) return "No messages yet";
    
    const msg = room.lastMessage;
    if (msg.type === 'text') {
      return msg.content || '';
    }
    return `Sent a ${msg.type}`;
  }, [room.lastMessage]);

  return (
    <div
      onClick={onClick}
      className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition"
    >
      {/* Avatar */}
      <div 
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg font-medium"
        style={{ backgroundColor: color }}
      >
        {avatar ? (
          <img 
            src={avatar} 
            alt={name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : type === "group" ? (
          <Users className="h-6 w-6 text-gray-700" />
        ) : (
          <span className="text-gray-700">{initials}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-medium text-gray-900 truncate">
            {name}
          </h4>
          {timeAgo && (
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {timeAgo}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 truncate mt-0.5">
          {lastMessage}
        </p>

        {/* Unread count */}
        {(room.unreadCount || 0) > 0 && (
          <div className="mt-1">
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              {room.unreadCount || 0}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
