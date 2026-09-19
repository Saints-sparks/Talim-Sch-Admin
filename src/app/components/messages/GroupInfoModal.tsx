"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import SharedMedia from "./SharedMedia";
import GroupMemberList from "./GroupMemberList";
import AddParentToGroupChatModal from "./AddParentToGroupChat";
import AddTeacherToGroupChatModal from "./AddTeacherToGroupChat";
import { AddMembersButtons } from "./group-info/AddMembersButtons";
import { GroupDescriptionField } from "./group-info/GroupDescriptionField";
import { GroupInfoMobilePicker, GroupInfoSidebar } from "./group-info/GroupInfoNav";
import { GroupNameField } from "./group-info/GroupNameField";
import { GroupPictureBlock } from "./group-info/GroupPictureBlock";
import {
  membersHeading,
  pictureProblem,
  planDescriptionSave,
  planNameSave,
  roomSubtitle,
  type Section,
} from "./group-info/groupInfo";
import { useChatsContext } from "@/context/ChatsContext";
import { useAuth } from "@/context/AuthContext";
import { ChatRoomType } from "@/types/chat.types";
import { canManageRoom } from "@/lib/chat/rooms";
import { chatService } from "@/app/services/chat.service";
import { toast } from "@/components/CustomToast";
import { getErrorMessage } from "@/lib/apiError";

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
    const plan = planNameSave(nameDraft, room?.name);
    if (plan.kind === "invalid") return;
    if (plan.kind === "unchanged" || (await save("name", { name: plan.value }))) setEditingName(false);
  };

  const saveDescription = async () => {
    const plan = planDescriptionSave(descriptionDraft, room?.description);
    if (plan.kind === "invalid") return;
    if (plan.kind === "unchanged" || (await save("description", { description: plan.value }))) {
      setEditingDescription(false);
    }
  };

  const changePicture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !chatRoomId) return;
    const problem = pictureProblem(file);
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
          <GroupInfoSidebar selected={selectedMenu} onSelect={setSelectedMenu} />

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

            <GroupInfoMobilePicker selected={selectedMenu} onSelect={setSelectedMenu} />

            {selectedMenu === "" && (
              <div className="text-center">
                <GroupPictureBlock
                  pictureUrl={pictureUrl}
                  groupName={groupName}
                  uploading={saving === "avatar"}
                  canManage={canManage}
                  busy={saving !== null}
                  onFileChange={(e) => void changePicture(e)}
                  onRemove={() => void save("avatar", { avatarUrl: null })}
                />

                <GroupNameField
                  editing={editingName}
                  draft={nameDraft}
                  name={groupName}
                  saving={saving === "name"}
                  canManage={canManage}
                  onDraftChange={setNameDraft}
                  onStartEdit={() => {
                    setNameDraft(room?.name || groupName);
                    setEditingName(true);
                  }}
                  onCancel={() => setEditingName(false)}
                  onSave={() => void saveName()}
                />
                <p className="text-sm text-[#7B7B7B]">
                  {roomSubtitle(type, isGroup, memberCount)}
                </p>

                {/* Add members — managers only, never in 1:1 chats */}
                {canManage && chatRoomId && (
                  <AddMembersButtons
                    onAddParents={() => setIsAddParentModalOpen(true)}
                    onAddTeachers={() => setIsAddTeacherModalOpen(true)}
                  />
                )}

                {isGroup && (
                  <GroupDescriptionField
                    editing={editingDescription}
                    draft={descriptionDraft}
                    description={room?.description}
                    saving={saving === "description"}
                    canManage={canManage}
                    onDraftChange={setDescriptionDraft}
                    onStartEdit={() => {
                      setDescriptionDraft(room?.description ?? "");
                      setEditingDescription(true);
                    }}
                    onCancel={() => setEditingDescription(false)}
                    onSave={() => void saveDescription()}
                  />
                )}

                {/* Members */}
                {room && (
                  <div className="mt-5 text-left">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {membersHeading(isGroup, memberCount)}
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
