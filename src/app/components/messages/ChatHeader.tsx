"use client";
import { ArrowLeft, MoreVertical, Info, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import GroupInfoModal from "./GroupInfoModal";
import GroupMembersModal from "./GroupMembersModal";
import AddParentToGroupChatModal from "./AddParentToGroupChat";
import AddTeacherToGroupChatModal from "./AddTeacherToGroupChat";
import { useAuth } from "@/context/AuthContext";
import { useChatsContext } from "@/context/ChatsContext";
import { canManageRoom, isOfficeRoom } from "@/lib/chat/rooms";
import { ChatRoomType } from "@/types/chat.types";
import type { ChatParticipant } from "@/types/chat.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { focusRing, iconButton, rowButton } from "@/components/tl";
import { OfficeAvatar, PersonAvatar } from "./parts";

// Define participant type
// Utility function to process participants data (handle Mongoose documents)
/**
 * One participant as the API or the socket sends it: sometimes a plain object,
 * sometimes a Mongoose document with the real fields under `_doc`.
 */
interface RawParticipantFields {
  userId?: string | { toString(): string };
  _id?: string | { toString(): string };
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string | null;
  userAvatar?: string | null;
  role?: string;
  isOnline?: boolean;
}
type RawParticipant = RawParticipantFields & { _doc?: RawParticipantFields };

/**
 * Clean member records for the members dialog, whatever shape they arrived in.
 *
 * @param participants - The room's members as sent.
 * @returns One record per member that has an id.
 */
function processParticipants(participants: RawParticipant[]): ChatParticipant[] {
  return participants
    .map((p: RawParticipant) => {
      // Handle Mongoose documents - data might be in _doc property
      const participantData = p._doc || p;
      const participantId = participantData.userId || participantData._id || p.userId || p._id;
      
      // Get name from various possible fields
      let name = participantData.name || p.name;
      if (!name && participantData.firstName) {
        name = participantData.lastName 
          ? `${participantData.firstName} ${participantData.lastName}`
          : participantData.firstName;
      }
      
      return {
        id: participantId?.toString() ?? '',
        firstName: participantData.firstName || p.firstName,
        lastName: participantData.lastName || p.lastName,
        name: name || 'Unknown User',
        email: participantData.email || p.email,
        avatar: participantData.userAvatar ?? participantData.avatar ?? p.userAvatar ?? p.avatar ?? null,
        role: participantData.role || p.role,
        isOnline: participantData.isOnline || p.isOnline || false,
      };
    })
    .filter((p: ChatParticipant) => p.id);
}

/** Props for {@link ChatHeader}. */
interface ChatHeaderProps {
  /** The room's or the other person's photo URL; "" for none. */
  avatar: string;
  name: string;
  status?: string;
  subtext?: string | string[]; // Allow both string and array for group members
  participants?: RawParticipant[]; // Real participants data
  currentUserId?: string; // The viewer, for the members dialog and the group controls
  onBack?: () => void; // Navigation back to chat list
  showBackButton?: boolean; // Whether to show back button (below 980px)
  initials?: string; // The avatar's initials, when not the name's own
  isGroup?: boolean; // Whether this is a group chat
  roomType?: string; // ChatRoomType of the open room
  chatRoomId?: string; // Chat room ID for adding participants
  onAddParticipants?: () => void; // Callback after adding participants
}

/**
 * A thread's header row: Back (below 980px), the avatar, the name button
 * that opens the conversation info (with the status and subtext), and the
 * group actions as round icon buttons. Office threads (Round 4 §28) get the
 * building avatar and no Add control, since the server keeps their members.
 *
 * @param props - The room's display details; see {@link ChatHeaderProps}.
 * @param props.avatar - Photo URL.
 * @param props.name - The room's or the person's name.
 * @param props.status - The line under the name.
 * @param props.subtext - The second line (wider screens).
 * @param props.participants - The members.
 * @param props.currentUserId - The viewer.
 * @param props.onBack - Back to the list.
 * @param props.showBackButton - Whether Back is offered.
 * @param props.initials - The avatar's initials.
 * @param props.isGroup - Whether it is a group.
 * @param props.roomType - The room type.
 * @param props.chatRoomId - The room id.
 * @param props.onAddParticipants - Called after members are added.
 * @returns The header, with its info, members and add-member dialogs.
 */
export default function ChatHeader({
  avatar,
  name,
  status,
  subtext,
  participants = [],
  currentUserId,
  onBack,
  showBackButton = true,
  initials,
  isGroup = false,
  roomType,
  chatRoomId,
  onAddParticipants,
}: ChatHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isAddParentModalOpen, setIsAddParentModalOpen] = useState(false);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const { user } = useAuth();
  const { chatRooms } = useChatsContext();
  const room = chatRoomId ? chatRooms.find((r) => r._id === chatRoomId) : undefined;
  // An office thread's members are kept by the server: no adding, removing or leaving.
  const isOffice = isOfficeRoom(room ?? { type: (roomType as ChatRoomType) || ChatRoomType.CUSTOM_GROUP });
  // Group controls: managers only, never in direct messages or office threads (the server has the final say).
  const canManage =
    isGroup &&
    canManageRoom(room ?? { type: (roomType as ChatRoomType) || ChatRoomType.CUSTOM_GROUP, createdBy: "" }, {
      id: currentUserId ?? "",
      role: user?.role,
    });

  // Process participants to get clean data
  const processedParticipants = processParticipants(participants);

  // Format subtext to ensure it's a string
  const displaySubtext = Array.isArray(subtext) ? subtext.join(', ') : subtext;

  // Handle successful participant addition
  const handleAddParticipantsSuccess = () => {
    onAddParticipants?.();
  };

  return (
    <div className="flex w-full items-center gap-2.5 border-b border-tl-line-soft bg-tl-surface px-3 py-3 sm:gap-3 sm:px-[18px]">
      {/* Back Button - one pane at a time below 980px */}
      {showBackButton && onBack && (
        <button
          type="button"
          onClick={onBack}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-tl-line text-tl-brand transition-colors hover:bg-tl-bg min-[980px]:hidden ${focusRing}`}
          aria-label="Back to chats"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </button>
      )}

      {/* Avatar */}
      {isOffice ? (
        <OfficeAvatar size={42} />
      ) : (
        <PersonAvatar
          id={chatRoomId || name}
          name={name}
          initials={initials}
          src={avatar || null}
          size={42}
          online={status === "Online" || status === "Active Now" ? true : undefined}
        />
      )}

      {/* Chat info: a button, so the keyboard and screen readers can open it too. */}
      <button
        type="button"
        className={`min-h-[44px] min-w-0 flex-1 cursor-pointer rounded-xl px-1 text-left ${focusRing}`}
        onClick={() => setIsModalOpen(true)}
        aria-haspopup="dialog"
        aria-label={`${name}: conversation info`}
      >
        <span className="flex items-center gap-1.5">
          <span className="block truncate text-base font-extrabold text-tl-ink">{name}</span>
          <Info className="hidden h-3.5 w-3.5 shrink-0 text-tl-faint sm:block" aria-hidden />
        </span>
        {status && <span className="block truncate text-[13px] text-tl-muted">{status}</span>}
        {displaySubtext && (
          <span className="hidden truncate text-xs text-tl-faint sm:block">{displaySubtext}</span>
        )}
      </button>

      {/* Action Icons */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Add Participants - shown directly for group managers on wider screens */}
        {canManage && chatRoomId && (
          <span className="hidden sm:inline-flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={rowButton} title="Add Participants to Group">
                  <UserPlus className="h-4 w-4" aria-hidden />
                  <span>Add</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsAddParentModalOpen(true)} className="cursor-pointer">
                  <Users className="h-4 w-4" aria-hidden />
                  <span>Add Parents</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsAddTeacherModalOpen(true)} className="cursor-pointer">
                  <Users className="h-4 w-4" aria-hidden />
                  <span>Add Teachers</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        )}

        {/* More options: group members and adding people (groups only). */}
        {isGroup && chatRoomId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="More options" className={iconButton}>
                <MoreVertical className="h-[18px] w-[18px]" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsMembersModalOpen(true)} className="cursor-pointer">
                <Users className="h-4 w-4" aria-hidden />
                <span>View Members</span>
              </DropdownMenuItem>
              {canManage && (
                <>
                  <DropdownMenuItem
                    onClick={() => setIsAddParentModalOpen(true)}
                    className="cursor-pointer sm:hidden" // Hidden on wider screens, which have the Add button
                  >
                    <Users className="h-4 w-4" aria-hidden />
                    <span>Add Parents</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsAddTeacherModalOpen(true)}
                    className="cursor-pointer sm:hidden" // Hidden on wider screens, which have the Add button
                  >
                    <Users className="h-4 w-4" aria-hidden />
                    <span>Add Teachers</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Group Info Modal */}
      <GroupInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        avatar={avatar}
        name={name}
        chatRoomId={chatRoomId}
        roomType={roomType}
      />

      {isGroup && (
        <GroupMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          groupName={name}
          participants={processedParticipants}
          currentUserId={currentUserId}
          chatRoomId={chatRoomId}
          canManage={canManage}
        />
      )}

      {/* Add Parent Modal */}
      {canManage && chatRoomId && (
        <AddParentToGroupChatModal
          isOpen={isAddParentModalOpen}
          onClose={() => setIsAddParentModalOpen(false)}
          chatRoomId={chatRoomId}
          onSuccess={handleAddParticipantsSuccess}
        />
      )}

      {/* Add Teacher Modal */}
      {canManage && chatRoomId && (
        <AddTeacherToGroupChatModal
          isOpen={isAddTeacherModalOpen}
          onClose={() => setIsAddTeacherModalOpen(false)}
          chatRoomId={chatRoomId}
          onSuccess={handleAddParticipantsSuccess}
        />
      )}
    </div>
  );
}
