"use client";

import { Building2, ChevronDown, Filter, MessageCircle, MessageSquarePlus, Plus, RefreshCw, Users } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { Banner, CountBadge, EmptyNote, focusRing, iconButton, rowButton, skeletonBlock } from "@/components/tl";
import CreateGroupModal from "./CreateGroupModal";
import NewMessageModal from "./NewMessageModal";
import type { UseChatsReturn } from "@/hooks/useChats";
import { toDisplayRoom, type DisplayChatRoom } from "@/lib/chat/rooms";
import { ROOM_FILTERS, filterRooms, unreadOfficeThreads, type RoomFilter } from "./roomFilter";
import { OfficeAvatar, PersonAvatar, TextSearch } from "./parts";

/** Props for {@link ChatSidebar}. */
interface ChatSidebarProps {
  /** Opens a room. */
  onSelectChat: (room: DisplayChatRoom) => void;
  /** The room open now, highlighted. */
  selectedRoomId: string | null;
  /** The chat state from `useChats`. */
  chats: UseChatsReturn;
  /** Extra classes for the panel. */
  className?: string;
}

/**
 * When a room's last message was sent, as the list shows it: the time today,
 * the weekday within a week, else the date.
 *
 * @param timestamp - The last message's time.
 * @returns "14:05", "Tue" or "3 Sep".
 */
function formatTime(timestamp: Date | string): string {
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
}

/**
 * The Messages room list card: the heading with the unread count, search,
 * the filter (All chats, Teachers, School office, Groups), refresh, New
 * message and Create Group, and one row per room with its avatar, subtitle,
 * last message and unread count. Office threads show the building; rows open
 * with a click, Enter or Space.
 *
 * @param props - See {@link ChatSidebarProps}.
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

  const totalVisibleUnreadCount = transformedRooms.reduce((sum, room) => sum + (room.unreadCount || 0), 0);

  // Filter and search; the list keeps its latest-message order.
  const displayRooms = useMemo(
    () => filterRooms(transformedRooms, filterType, searchTerm),
    [transformedRooms, filterType, searchTerm]
  );
  const officeUnread = unreadOfficeThreads(transformedRooms);
  const filterLabel = ROOM_FILTERS.find((f) => f.id === filterType)?.label ?? "All chats";
  // The first load: grey rows instead of "No chats yet".
  const showSkeleton = isLoading && originalRooms.length === 0;

  return (
    <div className={`flex h-full min-h-0 w-full flex-col bg-tl-surface ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-tl-line-soft p-3.5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="flex min-w-0 items-center gap-2 pl-1 text-[19px] font-extrabold tracking-[-0.3px] text-tl-ink">
            Messages
            <CountBadge count={totalVisibleUnreadCount} label={`${totalVisibleUnreadCount} unread`} />
          </h1>
          <button
            type="button"
            onClick={() => fetchChatRooms()}
            aria-label="Refresh conversations"
            title="Refresh"
            className={iconButton}
          >
            <RefreshCw className={`h-[18px] w-[18px] ${isLoading ? "animate-spin" : ""}`} aria-hidden />
          </button>
        </div>

        {/* Search and filter */}
        <div className="flex flex-col gap-2" data-guide="messages-search">
          <TextSearch
            value={searchTerm}
            onChange={setSearchTerm}
            label="Search conversations"
            placeholder="Search conversations..."
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Filter: ${filterLabel}`}
                className={`inline-flex min-h-[44px] w-full items-center gap-2 rounded-[13px] border border-tl-control bg-tl-surface px-3.5 text-sm font-bold text-tl-ink transition-colors hover:bg-tl-bg ${focusRing}`}
              >
                <Filter className="h-4 w-4 text-tl-muted" aria-hidden />
                <span className="flex-1 truncate text-left">{filterLabel}</span>
                {filterType !== "office" && officeUnread > 0 && (
                  <span className="tl-dot-warning inline-block h-2 w-2 rounded-full" title="Unread office threads" aria-hidden />
                )}
                <ChevronDown className="h-4 w-4 text-tl-muted" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {ROOM_FILTERS.map((f) => (
                <DropdownMenuItem key={f.id} onClick={() => setFilterType(f.id)} className="flex items-center gap-2">
                  {f.id === "office" && <Building2 className="h-4 w-4 text-tl-warning" aria-hidden />}
                  <span className="flex-1">{f.label}</span>
                  {f.id === "office" && officeUnread > 0 && (
                    <span className="rounded-full bg-tl-warning-bg px-1.5 text-[11px] font-extrabold text-tl-warning">
                      {officeUnread}
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Start a direct chat with a teacher or parent, or a group. */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            data-guide="messages-new-message"
            className={`${rowButton} w-full`}
            title="Chat with a teacher or parent"
            onClick={() => setIsNewMessageOpen(true)}
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden />
            New message
          </button>
          <button
            type="button"
            data-guide="messages-create-group"
            className={`${rowButton} w-full`}
            title="Add teachers and students"
            onClick={() => setIsCreateGroupModalOpen(true)}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Create Group
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-3.5 pt-3">
          <Banner
            tone="danger"
            role="alert"
            action={
              <button type="button" onClick={() => fetchChatRooms()} className={rowButton}>
                Retry
              </button>
            }
          >
            {error}
          </Banner>
        </div>
      )}

      {/* Chat List */}
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {showSkeleton ? (
          <div role="status" aria-label="Loading conversations" className="flex flex-col gap-1 p-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} aria-hidden className={`${skeletonBlock} h-16 rounded-2xl`} />
            ))}
          </div>
        ) : !isLoading && displayRooms.length === 0 ? (
          <EmptyNote
            compact
            icon={<MessageCircle />}
            title={searchTerm ? "No chats found" : filterType === "office" ? "No office threads yet" : "No chats yet"}
          >
            {searchTerm
              ? null
              : filterType === "office"
                ? "When a teacher or a parent messages the school office, the thread appears here."
                : "Start by creating a group chat"}
          </EmptyNote>
        ) : null}

        {/* Chat Items */}
        <div className="flex flex-col gap-0.5">
          {displayRooms.map((room) => {
            const selected = selectedRoomId === room.roomId;
            return (
              <div
                key={room.roomId}
                role="button"
                tabIndex={0}
                aria-current={selected ? "true" : undefined}
                data-category={room.category}
                data-office-owner={room.officeOwnerRole}
                className={`flex min-h-[64px] cursor-pointer items-center gap-3 rounded-2xl p-3 transition-colors ${focusRing} ${
                  selected ? "bg-tl-select" : "hover:bg-tl-subtle"
                } touch-manipulation`}
                onClick={() => onSelectChat(room)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectChat(room);
                  }
                }}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {room.isOffice ? (
                    <OfficeAvatar size={44} />
                  ) : (
                    <PersonAvatar
                      id={room.roomId}
                      name={room.displayName}
                      src={room.avatarInfo.type === "image" ? room.avatarInfo.value : null}
                      size={44}
                    />
                  )}

                  {/* Online indicator for private chats */}
                  {room.type === "private" && (
                    <Tooltip content="One-to-one conversation with a teacher or parent." side="right">
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-tl-surface ${
                          room.isOnline ? "tl-dot-success" : "bg-tl-control"
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
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-tl-surface bg-tl-brand-fill text-tl-on-brand">
                        <Users className="h-2 w-2" aria-hidden />
                      </span>
                    </Tooltip>
                  )}
                </div>

                {/* Chat Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-[15px] font-extrabold text-tl-ink">{room.displayName}</p>
                    {room.lastMessage?.timestamp && (
                      <span className="shrink-0 whitespace-nowrap text-xs text-tl-faint">
                        {formatTime(room.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>

                  {room.subtitle && (
                    <p
                      className={`mt-0.5 flex items-center gap-1 truncate text-xs font-semibold ${
                        room.isOffice ? "text-tl-warning" : "text-tl-muted"
                      }`}
                    >
                      {room.isOffice && <Building2 className="h-3 w-3 shrink-0" aria-hidden />}
                      {room.subtitle}
                    </p>
                  )}

                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-[13px] ${room.unreadCount > 0 ? "font-bold text-tl-ink" : "text-tl-muted"}`}
                    >
                      {room.lastMessage?.content || "No messages yet"}
                    </p>
                    {room.unreadCount > 0 && (
                      <span title="Number of messages you haven't read yet in this conversation." className="shrink-0">
                        <CountBadge count={room.unreadCount} label={`${room.unreadCount} unread`} />
                      </span>
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
