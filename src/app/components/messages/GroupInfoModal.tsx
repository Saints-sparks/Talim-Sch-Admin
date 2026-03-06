"use client";
import { useState, useEffect } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Phone,
  Video,
  MessageSquare,
  X,
  Users,
  Image,
  Video as VideoIcon,
  Link2,
  FileText,
  UserPlus,
  Loader2,
  UserCog,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Parents from "./Parents";
import Teachers from "./Teachers"; // Import the new Teachers component
import Images from "./Images";
import Videos from "./Videos";
import Links from "./Links";
import Documents from "./Document";
import AddParentToGroupChatModal from "./AddParentToGroupChat";
import AddTeacherToGroupChatModal from "./AddTeacherToGroupChat";
import { useChats } from "@/hooks/useChats";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";

// Update menuItems - add Teachers
const menuItems = [
  { name: "Parents", icon: UserCog },
  { name: "Teachers", icon: GraduationCap }, // Added Teachers
  { name: "Images", icon: Image },
  { name: "Videos", icon: VideoIcon },
  { name: "Links", icon: Link2 },
  { name: "Documents", icon: FileText },
];

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

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatar: string;
  name: string;
  description: string;
  participants?: Participant[]; // Real participants data
  chatRoomId?: string; // Add chatRoomId prop
  schoolName?: string;
}

export default function GroupInfoModal({
  isOpen,
  onClose,
  avatar,
  name,
  description,
  participants = [],
  chatRoomId,
  schoolName = "",
}: GroupInfoModalProps) {
  const [selectedMenu, setSelectedMenu] = useState("");
  const [isAddParentModalOpen, setIsAddParentModalOpen] = useState(false);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentParticipants, setCurrentParticipants] = useState<Participant[]>(participants);
  
  const { fetchChatRooms } = useChats();

  // Update participants when prop changes
  useEffect(() => {
    setCurrentParticipants(participants);
  }, [participants]);

  if (!isOpen) return null;

  const handleAddParticipantsSuccess = async () => {
    setIsRefreshing(true);
    try {
      // Refresh chat rooms to get updated participant list
      await fetchChatRooms(true);
      console.log("Participants added successfully");
    } catch (error) {
      console.error("Error refreshing after adding participants:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get display name for a participant
  const getParticipantDisplayName = (participant: Participant) => {
    if (participant.name) return participant.name;
    if (participant.firstName || participant.lastName) {
      return `${participant.firstName || ''} ${participant.lastName || ''}`.trim();
    }
    return 'Unknown User';
  };

  // Get initials for a participant
  const getParticipantInitials = (participant: Participant) => {
    const name = getParticipantDisplayName(participant);
    return getUserInitials(name);
  };

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
        <div className="bg-white rounded-lg shadow-lg w-[650px] h-[450px] flex">
          {/* Sidebar */}
          <div className="w-48 flex flex-col gap-2 bg-[#FDFDFD] border border-[#EEEEEE] text-[#878787] rounded-l-lg pt-6 p-3">
            {menuItems.map((item) => (
              <div
                key={item.name}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                  selectedMenu === item.name
                    ? "bg-gray-200 font-medium"
                    : "hover:bg-gray-200"
                }`}
                onClick={() => setSelectedMenu(item.name)}
              >
                <item.icon
                  strokeWidth="1px"
                  size={18}
                  className="text-gray-600"
                />
                <span>{item.name}</span>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 pt-6 p-5 relative overflow-y-auto">
            {/* Close Button */}
            <X
              className="absolute top-3 right-3 cursor-pointer text-[#434343] hover:text-gray-800"
              size={20}
              onClick={onClose}
            />

            {/* Group Info */}
            {selectedMenu === "" && (
              <div className="text-center">
                <Avatar className="w-16 h-16 rounded-full mx-auto">
                  <AvatarImage src={avatar} />
                  <AvatarFallback 
                    className="text-white font-medium text-sm"
                    style={{ backgroundColor: generateColorFromString(name) }}
                  >
                    {getUserInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-3 text-lg text-[#030E18] font-medium">
                  {name}
                </h2>
                <p className="text-sm text-[#7B7B7B]">Group Name</p>

                {/* Action Buttons */}
                <div className="flex justify-center gap-4 mt-5">
                  <div className="flex flex-col border border-[#F0F0F0] px-8 py-2 gap-2 rounded-lg items-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <Phone
                      size={20}
                      className="text-gray-600 hover:text-gray-800"
                    />
                    <p className="text-sm mt-1">Voice Call</p>
                  </div>
                  <div className="flex flex-col border border-[#F0F0F0] px-8 py-2 gap-2 rounded-lg items-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <Video
                      size={20}
                      className="text-gray-600 hover:text-gray-800"
                    />
                    <p className="text-sm mt-1">Video Call</p>
                  </div>
                  <div className="flex flex-col border border-[#F0F0F0] px-8 py-2 gap-2 rounded-lg items-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <MessageSquare
                      size={20}
                      className="text-gray-600 hover:text-gray-800"
                    />
                    <p className="text-sm mt-1">Message</p>
                  </div>
                </div>

                {/* Add Participants Buttons - Only show for group chats and when chatRoomId is provided */}
                {chatRoomId && (
                  <div className="mt-4 space-y-2">
                    <Button
                      onClick={() => setIsAddParentModalOpen(true)}
                      disabled={isRefreshing}
                      className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                    >
                      {isRefreshing ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <UserPlus size={18} />
                          Add Parents to Group
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => setIsAddTeacherModalOpen(true)}
                      disabled={isRefreshing}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
                    >
                      {isRefreshing ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <UserPlus size={18} />
                          Add Teachers to Group
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Description */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-left text-gray-700 mb-2">About</p>
                  <p className="text-sm p-3 border border-[#F0F0F0] rounded-lg text-[#545454] whitespace-pre-line text-left">
                    {description}
                  </p>
                </div>

                {/* Participants Preview */}
                {currentParticipants.length > 0 && (
                  <div className="mt-4 text-left">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Participants ({currentParticipants.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {currentParticipants.slice(0, 5).map((participant) => (
                        <div
                          key={participant.id}
                          className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1"
                          title={getParticipantDisplayName(participant)}
                        >
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
                            style={{ backgroundColor: generateColorFromString(getParticipantDisplayName(participant)) }}
                          >
                            {getParticipantInitials(participant)}
                          </div>
                          <span className="text-xs text-gray-700 max-w-[80px] truncate">
                            {getParticipantDisplayName(participant)}
                          </span>
                        </div>
                      ))}
                      {currentParticipants.length > 5 && (
                        <div className="bg-gray-100 rounded-full px-2 py-1">
                          <span className="text-xs text-gray-700">
                            +{currentParticipants.length - 5} more
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Content for Other Sections */}
            {selectedMenu !== "" && (
              <div className="text-center">
                <h2 className="text-lg text-left mb-5 font-medium">
                  {selectedMenu}
                </h2>
              </div>
            )}
            
            {/* Render section components */}
            {selectedMenu === "Parents" && (
              <Parents 
                chatRoomId={chatRoomId}
                onAddParentSuccess={handleAddParticipantsSuccess}
              />
            )}
            {selectedMenu === "Teachers" && (
              <Teachers 
                chatRoomId={chatRoomId}
                onAddTeacherSuccess={handleAddParticipantsSuccess}
              />
            )}
            {selectedMenu === "Images" && <Images />}
            {selectedMenu === "Videos" && <Videos />}
            {selectedMenu === "Links" && <Links />}
            {selectedMenu === "Documents" && <Documents />}
          </div>
        </div>
      </div>

      {/* Add Parent Modal */}
      {chatRoomId && (
        <AddParentToGroupChatModal
          isOpen={isAddParentModalOpen}
          onClose={() => setIsAddParentModalOpen(false)}
          chatRoomId={chatRoomId}
          onSuccess={handleAddParticipantsSuccess}
        />
      )}

      {/* Add Teacher Modal */}
      {chatRoomId && (
        <AddTeacherToGroupChatModal
          isOpen={isAddTeacherModalOpen}
          onClose={() => setIsAddTeacherModalOpen(false)}
          chatRoomId={chatRoomId}
          onSuccess={handleAddParticipantsSuccess}
        />
      )}
    </>
  );
}