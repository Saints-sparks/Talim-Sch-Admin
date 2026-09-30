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
  MessageSquarePlus,
  WifiOff,
  Plus,
  Filter,
  Building2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import CreateGroupModal from "./CreateGroupModal";
import NewMessageModal from "./NewMessageModal";
import type { UseChatsReturn } from "@/hooks/useChats";
import { toDisplayRoom, type DisplayChatRoom } from "@/lib/chat/rooms";
import { getUserInitials } from "@/lib/colorUtils";
import { ROOM_FILTERS, filterRooms, unreadOfficeThreads, type RoomFilter } from "./roomFilter";

interface ChatSidebarProps {
  onSelectChat: (room: DisplayChatRoom) => void;
  selectedRoomId: string | null;
  chats: UseChatsReturn;
  className?: string;
}

/**
 * The Messages room list: search, the filter (All chats, Teachers,
 * Teachers · Office, Groups), new message and new group, and one row per room
 * with its subtitle, last message and unread count. Office threads show a
 * building icon; rows open with a click, Enter or Space.
 *
 * @param props.onSelectChat - Opens a room.
 * @param props.selectedRoomId - The room open now, highlighted.
 * @param props.chats - The chat state from `useChats`.
 * @param props.className - Extra classes for the panel.
 * @returns The panel.
 */
export default function ChatSidebar({ onSelectChat, selectedRoomId, chats, className = "" }: ChatSidebarProps) {
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<RoomFilter>("all");

  const { chatRooms: originalRooms, isRoomsLoading: isLoading, roomsError: error, fetchChatRooms, currentUserId } = chats;

  // Transform chat rooms to display format; the list is already ordered by latest message.
  const transformedRooms = useMemo(
    () => originalRooms.map((room) => toDisplayRoom(room, currentUserId)),
    [originalRooms, currentUserId]
  );

  const totalVisibleUnreadCount = transformedRooms.reduce(
    (sum, room) => sum + (room.unreadCount || 0),
    0
  );

  // Filter and search; the list keeps its latest-message order.
  const displayRooms = useMemo(
    () => filterRooms(transformedRooms, filterType, searchTerm),
    [transformedRooms, filterType, searchTerm]
  );
  const officeUnread = unreadOfficeThreads(transformedRooms);
  const filterLabel = ROOM_FILTERS.find((f) => f.id === filterType)?.label ?? "All chats";

  const handleSelectChat = (room: DisplayChatRoom) => {
    onSelectChat(room);
  };

  const formatTime = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <div className={`w-full h-full border-r bg-white flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100 bg-white">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
          Messages
          {totalVisibleUnreadCount > 0 && (
            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
              {totalVisibleUnreadCount > 99 ? "99+" : totalVisibleUnreadCount}
            </span>
          )}
        </h2>
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
      </div>

      {/* Search Section */}
      <div
        className="p-3 sm:p-4 space-y-3 bg-white border-b border-gray-50"
        data-guide="messages-search"
      >
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
            size={16}
          />
          <Input
            className="pl-9 pr-4 py-3 sm:py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:border-blue-500 transition-all duration-200 text-sm placeholder:text-gray-500 touch-manipulation"
            placeholder="Search conversations..."
            aria-label="Search conversations"
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
                aria-label={`Filter: ${filterLabel}`}
                className="flex items-center gap-2 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 active:bg-gray-100 rounded-lg px-3 py-2.5 sm:py-2 text-xs touch-manipulation"
              >
                <Filter size={12} aria-hidden />
                {filterLabel}
                {filterType !== "office" && officeUnread > 0 && (
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-amber-500"
                    title="Unread office threads"
                    aria-hidden
                  />
                )}
                <ChevronDown size={12} aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {ROOM_FILTERS.map((f) => (
                <DropdownMenuItem key={f.id} onClick={() => setFilterType(f.id)} className="flex items-center gap-2">
                  {f.id === "office" && <Building2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden />}
                  <span className="flex-1">{f.label}</span>
                  {f.id === "office" && officeUnread > 0 && (
                    <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-1.5 text-[10px] font-semibold text-amber-800 dark:text-amber-200">
                      {officeUnread}
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
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
              className={isLoading ? "animate-spin" : ""}
            >
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
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
        {/* New message: start a direct chat with a teacher or parent */}
        <div className="px-3 sm:px-4 mb-1">
          <button
            data-guide="messages-new-message"
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 active:bg-gray-100 rounded-xl transition-colors text-left group touch-manipulation"
            onClick={() => setIsNewMessageOpen(true)}
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
              <MessageSquarePlus className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm">New message</p>
              <p className="text-xs text-gray-500 truncate">Chat with a teacher or parent</p>
            </div>
          </button>
        </div>

        {/* Create Group Button */}
        <div className="px-3 sm:px-4 mb-2">
          <button
            data-guide="messages-create-group"
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
                {searchTerm ? "No chats found" : filterType === "office" ? "No office threads yet" : "No chats yet"}
              </p>
              {!searchTerm && (
                <p className="text-xs text-gray-400 mt-1">
                  {filterType === "office"
                    ? "When a teacher messages the school office, the thread appears here."
                    : "Start by creating a group chat"}
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
                role="button"
                tabIndex={0}
                aria-current={selectedRoomId === room.roomId ? "true" : undefined}
                data-category={room.category}
                className={`flex items-center gap-3 p-3 mx-1 hover:bg-gray-50 dark:hover:bg-slate-800 active:bg-gray-100 rounded-xl cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  selectedRoomId === room.roomId
                    ? "bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 shadow-sm"
                    : ""
                } touch-manipulation`}
                onClick={() => handleSelectChat(room)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleSelectChat(room);
                  }
                }}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {room.isOffice ? (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                      aria-hidden
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                  ) : room.avatarInfo.type === "image" ? (
                    <Avatar className="w-11 h-11">
                      <AvatarImage src={room.avatarInfo.value} />
                      <AvatarFallback
                        className="text-white font-medium text-sm"
                        style={{ backgroundColor: room.avatarInfo.bgColor }}
                      >
                        {getUserInitials(room.displayName)}
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
                  {room.type === "private" && (
                    <Tooltip
                      content="One-to-one conversation with a teacher or parent."
                      side="right"
                    >
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${
                          room.isOnline ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                    </Tooltip>
                  )}

                  {/* Group indicator */}
                  {room.type === "group" && !room.isOffice && (
                    <Tooltip
                      content="Broadcast conversations with all members. Any member can send a message."
                      side="right"
                    >
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
                        <Users className="w-2 h-2 text-white" />
                      </span>
                    </Tooltip>
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

                  {room.subtitle && (
                    <p
                      className={`text-xs truncate mb-0.5 flex items-center gap-1 ${
                        room.isOffice ? "text-amber-800 dark:text-amber-300" : "text-gray-500"
                      }`}
                    >
                      {room.isOffice && <Building2 className="w-3 h-3 flex-shrink-0" aria-hidden />}
                      {room.subtitle}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 truncate pr-2">
                      {room.lastMessage?.content || "No messages yet"}
                    </p>
                    {room.unreadCount > 0 && (
                      <Tooltip
                        content="Number of messages you haven't read yet in this conversation."
                        side="top"
                      >
                        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-medium text-white bg-blue-600 rounded-full">
                          {room.unreadCount > 99 ? "99+" : room.unreadCount}
                        </span>
                      </Tooltip>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <NewMessageModal
        open={isNewMessageOpen}
        onClose={() => setIsNewMessageOpen(false)}
        onStarted={(room) => onSelectChat(toDisplayRoom(room, currentUserId))}
      />

      <CreateGroupModal
        open={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSuccess={(room) => {
          void fetchChatRooms();
          // A reused class / course group is opened straight away.
          if (room?.reused) onSelectChat(toDisplayRoom(room, currentUserId));
        }}
      />
    </div>
  );
}
