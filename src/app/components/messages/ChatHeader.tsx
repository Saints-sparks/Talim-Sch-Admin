"use client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  MoreVertical,
  Phone,
  Search,
  Video,
  X,
  Info,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import GroupInfoModal from "./GroupInfoModal";
import GroupMembersModal from "./GroupMembersModal";
import AddParentToGroupChatModal from "./AddParentToGroupChat";
import AddTeacherToGroupChatModal from "./AddTeacherToGroupChat";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";
import { useAuth } from "@/context/AuthContext";
import { useChatsContext } from "@/context/ChatsContext";
import { canManageRoom } from "@/lib/chat/rooms";
import { ChatRoomType } from "@/types/chat.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define participant type
interface Participant {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
  isOnline: boolean;
}

// Utility function to process participants data (handle Mongoose documents)
function processParticipants(participants: any[], currentUserId?: string): Participant[] {
  return participants
    .map((p: any) => {
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
        id: participantId?.toString() || '',
        firstName: participantData.firstName || p.firstName,
        lastName: participantData.lastName || p.lastName,
        name: name || 'Unknown User',
        email: participantData.email || p.email,
        avatar: participantData.userAvatar || participantData.avatar || p.userAvatar || p.avatar,
        role: participantData.role || p.role,
        isOnline: participantData.isOnline || p.isOnline || false,
      };
    })
    .filter((p: Participant) => p.id);
}

interface ChatHeaderProps {
  avatar: string;
  name: string;
  status?: string;
  subtext?: string | string[]; // Allow both string and array for group members
  participants?: any[]; // Real participants data
  currentUserId?: string; // Current user ID to filter out
  onBack?: () => void; // Navigation back to chat list
  showBackButton?: boolean; // Whether to show back button (mobile)
  initials?: string; // Add initials prop
  isGroup?: boolean; // Whether this is a group chat
  roomType?: string; // ChatRoomType of the open room
  chatRoomId?: string; // Chat room ID for adding participants
  onAddParticipants?: () => void; // Callback after adding participants
}

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
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isAddParentModalOpen, setIsAddParentModalOpen] = useState(false);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const { user } = useAuth();
  const { chatRooms } = useChatsContext();
  const room = chatRoomId ? chatRooms.find((r) => r._id === chatRoomId) : undefined;
  // Group controls: managers only, never in direct messages (the server has the final say).
  const canManage =
    isGroup &&
    canManageRoom(room ?? { type: (roomType as ChatRoomType) || ChatRoomType.CUSTOM_GROUP, createdBy: "" }, {
      id: currentUserId ?? "",
      role: user?.role,
    });

  // Process participants to get clean data
  const processedParticipants = processParticipants(participants, currentUserId);

  // Format subtext to ensure it's a string
  const displaySubtext = Array.isArray(subtext) ? subtext.join(', ') : subtext;

  // Get display initials
  const displayInitials = initials || getUserInitials(name);

  // Handle successful participant addition
  const handleAddParticipantsSuccess = () => {
    onAddParticipants?.();
  };

  return (
    <div className="flex w-full items-center bg-white border-b border-gray-200 px-3 py-2 sm:px-4 sm:py-3">
      <div className="flex w-full items-center gap-2 sm:gap-3">
        {/* Back Button - Mobile Only */}
        {showBackButton && onBack && (
          <button
            onClick={onBack}
            className="flex lg:hidden items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Back to chats"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
        )}

        {/* Avatar */}
        <div className="relative">
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0">
            <AvatarImage src={avatar} />
            <AvatarFallback 
              className="text-white font-medium text-sm"
              style={{ backgroundColor: generateColorFromString(name) }}
            >
              {displayInitials}
            </AvatarFallback>
          </Avatar>
          {/* Online Indicator */}
          {(status === "Online" || status === "Active Now") && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full"></span>
          )}
        </div>

        {/* Chat Info */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex items-center gap-1">
            <p className="font-medium text-sm sm:text-base text-gray-900 truncate">
              {name}
            </p>
            <Info size={14} className="text-gray-400 flex-shrink-0 hidden sm:block" />
          </div>
          {!isSearching && status && (
            <p className="text-xs text-gray-500 truncate">{status}</p>
          )}
          {!isSearching && displaySubtext && (
            <p className="text-xs text-[#7B7B7B] truncate hidden sm:block">{displaySubtext}</p>
          )}
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* Search */}
          {isSearching ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="relative flex items-center border border-gray-300 rounded-full px-2 py-1 bg-gray-50 w-32 sm:w-44">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full bg-transparent pl-2 text-sm focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsSearching(false);
                    setSearchQuery("");
                  }}
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Add Participants Button - Show directly for group chats on desktop */}
              {canManage && chatRoomId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="hidden sm:flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors text-sm font-medium"
                      title="Add Participants to Group"
                    >
                      <UserPlus size={16} />
                      <span>Add</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => setIsAddParentModalOpen(true)}
                      className="cursor-pointer"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      <span>Add Parents</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setIsAddTeacherModalOpen(true)}
                      className="cursor-pointer"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      <span>Add Teachers</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Call Icons - Hidden on very small screens */}
              <button className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors">
                <Phone size={18} className="text-gray-600" />
              </button>
              <button className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors">
                <Video size={18} className="text-gray-600" />
              </button>
              
              {/* Search Button */}
              <button
                onClick={() => setIsSearching(true)}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Search size={18} className="text-gray-600" />
              </button>
              
              {/* More Options Dropdown - Shows different options based on chat type */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors">
                    <MoreVertical size={18} className="text-gray-600" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {isGroup && chatRoomId && (
                    <>
                      <DropdownMenuItem
                        onClick={() => setIsMembersModalOpen(true)}
                        className="cursor-pointer"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        <span>View Members</span>
                      </DropdownMenuItem>
                      {canManage && (
                        <>
                          <DropdownMenuItem
                            onClick={() => setIsAddParentModalOpen(true)}
                            className="cursor-pointer sm:hidden" // Hide on desktop since we have the button
                          >
                            <Users className="mr-2 h-4 w-4" />
                            <span>Add Parents</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setIsAddTeacherModalOpen(true)}
                            className="cursor-pointer sm:hidden" // Hide on desktop since we have the button
                          >
                            <Users className="mr-2 h-4 w-4" />
                            <span>Add Teachers</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </>
                  )}
                  <DropdownMenuItem className="cursor-pointer">
                    <Phone className="mr-2 h-4 w-4" />
                    <span>Voice Call</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Video className="mr-2 h-4 w-4" />
                    <span>Video Call</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Search className="mr-2 h-4 w-4" />
                    <span>Search in Chat</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
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
    </div>
  );
}