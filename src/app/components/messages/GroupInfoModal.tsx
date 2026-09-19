"use client";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  X,
  Image,
  Video as VideoIcon,
  Link2,
  FileText,
  UserPlus,
  Loader2,
  Pencil,
  Camera,
  Trash2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SharedMedia from "./SharedMedia";
import GroupMemberList from "./GroupMemberList";
import AddParentToGroupChatModal from "./AddParentToGroupChat";
import AddTeacherToGroupChatModal from "./AddTeacherToGroupChat";
import { useChatsContext } from "@/context/ChatsContext";
import { useAuth } from "@/context/AuthContext";
import { ChatRoomType } from "@/types/chat.types";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";
import { canManageRoom } from "@/lib/chat/rooms";
import { chatService } from "@/app/services/chat.service";
import { toast } from "@/components/CustomToast";
import { getErrorMessage } from "@/lib/apiError";
import { IMAGE_ACCEPT, fileKind, validateFile } from "@/components/chat-kit";

const NAME_MAX = 80;
const DESCRIPTION_MAX = 500;

type Section = "" | "Images" | "Videos" | "Links" | "Documents";

const MEDIA_ITEMS = [
  { name: "Images", icon: Image },
  { name: "Videos", icon: VideoIcon },
  { name: "Links", icon: Link2 },
  { name: "Documents", icon: FileText },
] as const;

const ROOM_TYPE_LABELS: Record<string, string> = {
  [ChatRoomType.CLASS_GROUP]: "Class group",
  [ChatRoomType.COURSE_GROUP]: "Subject group",
  [ChatRoomType.ADMIN_PARENT_GROUP]: "Parent group",
  [ChatRoomType.PARENT_GROUP]: "Parent group",
  [ChatRoomType.CUSTOM_GROUP]: "Group",
  [ChatRoomType.ONE_TO_ONE]: "Direct message",
};

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Shown until the room is in the list. */
  avatar: string;
  name: string;
  chatRoomId?: string;
  roomType?: string;
}

export default function GroupInfoModal({ isOpen, onClose, avatar, name, chatRoomId, roomType }: GroupInfoModalProps) {
  const [selectedMenu, setSelectedMenu] = useState<Section>("");
  const [isAddParentModalOpen, setIsAddParentModalOpen] = useState(false);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [saving, setSaving] = useState<"name" | "description" | "avatar" | null>(null);
  const pictureInputRef = useRef<HTMLInputElement>(null);

  const { chatRooms, messages, currentRoomId, currentUserId, updateRoomDetails } = useChatsContext();
  const { user } = useAuth();

  const room = chatRoomId ? chatRooms.find((r) => r._id === chatRoomId) : undefined;
  const type = room?.type ?? roomType;
  const isGroup = Boolean(type) && type !== ChatRoomType.ONE_TO_ONE;
  const canManage = isGroup && canManageRoom(room ?? { type: type as ChatRoomType, createdBy: "" }, {
    id: currentUserId,
    role: user?.role,
  });
  const groupName = isGroup ? room?.name || name : name;
  const pictureUrl = isGroup ? room?.avatarUrl || "" : avatar;
  // Shared media comes from this conversation's loaded messages.
  const roomMessages = chatRoomId && currentRoomId === chatRoomId ? messages : [];

  // Start clean each time it opens.
  useEffect(() => {
    if (!isOpen) {
      setSelectedMenu("");
      setEditingName(false);
      setEditingDescription(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const save = async (
    field: "name" | "description" | "avatar",
    patch: { name?: string; description?: string | null; avatarUrl?: string | null }
  ) => {
    if (!chatRoomId) return false;
    setSaving(field);
    try {
      await updateRoomDetails(chatRoomId, patch);
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't update the group"));
      return false;
    } finally {
      setSaving(null);
    }
  };

  const saveName = async () => {
    const next = nameDraft.trim();
    if (!next || next.length > NAME_MAX) return;
    if (next === room?.name || (await save("name", { name: next }))) setEditingName(false);
  };

  const saveDescription = async () => {
    const next = descriptionDraft.trim();
    if (next.length > DESCRIPTION_MAX) return;
    if (next === (room?.description ?? "") || (await save("description", { description: next || null }))) {
      setEditingDescription(false);
    }
  };

  const changePicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !chatRoomId) return;
    const problem = fileKind(file) !== "image" ? "Choose a JPG, PNG, GIF or WebP image" : validateFile(file);
    if (problem) {
      toast.error(problem);
      return;
    }
    setSaving("avatar");
    try {
      const uploaded = await chatService.uploadChatAttachment(file);
      await updateRoomDetails(chatRoomId, { avatarUrl: uploaded.url });
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't change the group picture"));
    } finally {
      setSaving(null);
    }
  };

  const menuItems = MEDIA_ITEMS;
  const memberCount = room?.participants.length ?? 0;

  return (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${groupName} info`}
          className="bg-white rounded-lg shadow-lg w-full max-w-[720px] h-[80vh] max-h-[600px] flex overflow-hidden"
        >
          {/* Sidebar */}
          <div className="hidden sm:flex w-44 flex-col gap-1 bg-[#FDFDFD] border-r border-[#EEEEEE] text-[#878787] pt-6 p-3">
            <button
              type="button"
              className={`flex items-center gap-3 p-2 rounded-lg transition text-left ${
                selectedMenu === "" ? "bg-gray-200 font-medium" : "hover:bg-gray-200"
              }`}
              onClick={() => setSelectedMenu("")}
            >
              <Info strokeWidth="1px" size={18} className="text-gray-600" />
              <span>Info</span>
            </button>
            {menuItems.map((item) => (
              <button
                type="button"
                key={item.name}
                className={`flex items-center gap-3 p-2 rounded-lg transition text-left ${
                  selectedMenu === item.name ? "bg-gray-200 font-medium" : "hover:bg-gray-200"
                }`}
                onClick={() => setSelectedMenu(item.name)}
              >
                <item.icon strokeWidth="1px" size={18} className="text-gray-600" />
                <span>{item.name}</span>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 pt-6 p-5 relative overflow-y-auto">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 text-[#434343] hover:text-gray-800"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {/* Mobile section picker */}
            <select
              className="sm:hidden mb-4 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
              value={selectedMenu}
              onChange={(e) => setSelectedMenu(e.target.value as Section)}
              aria-label="Section"
            >
              <option value="">Info</option>
              {menuItems.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>

            {selectedMenu === "" && (
              <div className="text-center">
                {/* Picture */}
                <div className="relative mx-auto w-20 h-20">
                  <Avatar className="w-20 h-20 rounded-full">
                    <AvatarImage src={pictureUrl || undefined} />
                    <AvatarFallback
                      className="text-white font-medium text-lg"
                      style={{ backgroundColor: generateColorFromString(groupName) }}
                    >
                      {getUserInitials(groupName)}
                    </AvatarFallback>
                  </Avatar>
                  {saving === "avatar" && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                      <Loader2 size={20} className="animate-spin text-white" />
                    </div>
                  )}
                </div>
                {canManage && (
                  <div className="mt-2 flex justify-center gap-3 text-xs">
                    <input
                      ref={pictureInputRef}
                      type="file"
                      accept={IMAGE_ACCEPT}
                      className="hidden"
                      onChange={(e) => void changePicture(e)}
                    />
                    <button
                      type="button"
                      disabled={saving !== null}
                      onClick={() => pictureInputRef.current?.click()}
                      className="flex items-center gap-1 text-blue-600 hover:underline disabled:opacity-50"
                    >
                      <Camera size={14} />
                      {pictureUrl ? "Change picture" : "Add picture"}
                    </button>
                    {pictureUrl && (
                      <button
                        type="button"
                        disabled={saving !== null}
                        onClick={() => void save("avatar", { avatarUrl: null })}
                        className="flex items-center gap-1 text-red-600 hover:underline disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    )}
                  </div>
                )}

                {/* Name */}
                {editingName ? (
                  <div className="mt-3 mx-auto max-w-sm text-left">
                    <Input
                      value={nameDraft}
                      maxLength={NAME_MAX}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void saveName();
                        if (e.key === "Escape") setEditingName(false);
                      }}
                      autoFocus
                      aria-label="Group name"
                    />
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                      <span>
                        {nameDraft.trim().length}/{NAME_MAX}
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingName(false)} disabled={saving === "name"}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => void saveName()} disabled={saving === "name" || !nameDraft.trim()}>
                          {saving === "name" && <Loader2 size={14} className="mr-1 animate-spin" />}
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center justify-center gap-1.5">
                    <h2 className="text-lg text-[#030E18] font-medium break-words">{groupName}</h2>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => {
                          setNameDraft(room?.name || groupName);
                          setEditingName(true);
                        }}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Edit group name"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                )}
                <p className="text-sm text-[#7B7B7B]">
                  {ROOM_TYPE_LABELS[type ?? ""] ?? "Chat"}
                  {isGroup && memberCount > 0 ? ` · ${memberCount} member${memberCount === 1 ? "" : "s"}` : ""}
                </p>

                {/* Add members — managers only, never in 1:1 chats */}
                {canManage && chatRoomId && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      onClick={() => setIsAddParentModalOpen(true)}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
                    >
                      <UserPlus size={18} />
                      Add Parents
                    </Button>
                    <Button
                      onClick={() => setIsAddTeacherModalOpen(true)}
                      className="bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
                    >
                      <UserPlus size={18} />
                      Add Teachers
                    </Button>
                  </div>
                )}

                {/* Description */}
                {isGroup && (
                  <div className="mt-5 text-left">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700">About</p>
                      {canManage && !editingDescription && (
                        <button
                          type="button"
                          onClick={() => {
                            setDescriptionDraft(room?.description ?? "");
                            setEditingDescription(true);
                          }}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <Pencil size={12} />
                          Edit
                        </button>
                      )}
                    </div>
                    {editingDescription ? (
                      <div>
                        <Textarea
                          value={descriptionDraft}
                          maxLength={DESCRIPTION_MAX}
                          onChange={(e) => setDescriptionDraft(e.target.value)}
                          rows={4}
                          autoFocus
                          aria-label="Group description"
                          placeholder="What is this group for?"
                        />
                        <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                          <span>
                            {descriptionDraft.length}/{DESCRIPTION_MAX}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingDescription(false)}
                              disabled={saving === "description"}
                            >
                              Cancel
                            </Button>
                            <Button size="sm" onClick={() => void saveDescription()} disabled={saving === "description"}>
                              {saving === "description" && <Loader2 size={14} className="mr-1 animate-spin" />}
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : room?.description ? (
                      <p className="text-sm p-3 border border-[#F0F0F0] rounded-lg text-[#545454] whitespace-pre-line break-words">
                        {room.description}
                      </p>
                    ) : (
                      <p className="text-sm p-3 border border-[#F0F0F0] rounded-lg text-gray-400 italic">No description</p>
                    )}
                  </div>
                )}

                {/* Members */}
                {room && (
                  <div className="mt-5 text-left">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {isGroup ? `Members (${memberCount})` : "People"}
                    </p>
                    <GroupMemberList room={room} currentUserId={currentUserId} canManage={canManage} />
                  </div>
                )}
              </div>
            )}

            {selectedMenu !== "" && <h2 className="text-lg text-left mb-4 font-medium">{selectedMenu}</h2>}

            {(selectedMenu === "Images" ||
              selectedMenu === "Videos" ||
              selectedMenu === "Links" ||
              selectedMenu === "Documents") && <SharedMedia section={selectedMenu} messages={roomMessages} />}
          </div>
        </div>
      </div>

      {canManage && chatRoomId && (
        <AddParentToGroupChatModal
          isOpen={isAddParentModalOpen}
          onClose={() => setIsAddParentModalOpen(false)}
          chatRoomId={chatRoomId}
        />
      )}

      {canManage && chatRoomId && (
        <AddTeacherToGroupChatModal
          isOpen={isAddTeacherModalOpen}
          onClose={() => setIsAddTeacherModalOpen(false)}
          chatRoomId={chatRoomId}
        />
      )}
    </>
  );
}
