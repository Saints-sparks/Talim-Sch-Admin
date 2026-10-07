"use client";
import { useEffect, useState } from "react";
import { Building2, X } from "lucide-react";
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
  OFFICE_THREAD_NOTE,
  pictureProblem,
  planDescriptionSave,
  planNameSave,
  roomSubtitle,
  type Section,
} from "./group-info/groupInfo";
import { useChatsContext } from "@/context/ChatsContext";
import { useAuth } from "@/context/AuthContext";
import { ChatRoomType } from "@/types/chat.types";
import { canEditRoomDetails, canManageRoom, isOfficeRoom } from "@/lib/chat/rooms";
import { chatService } from "@/app/services/chat.service";
import { toast } from "@/components/CustomToast";
import { getErrorMessage } from "@/lib/apiError";
import { cardTitle, iconButton, sectionTitle } from "@/components/tl";
import { dialogOverlay } from "./parts";

/** Props for {@link GroupInfoModal}. */
interface GroupInfoModalProps {
  /** Whether the dialog is shown. */
  isOpen: boolean;
  /** Closes it. */
  onClose: () => void;
  /** Shown until the room is in the list. */
  avatar: string;
  name: string;
  chatRoomId?: string;
  roomType?: string;
}

/**
 * Group info: picture, name, description, members and shared media. School
 * staff and group admins edit the name and description; managers also change
 * the picture and add or remove members. Office threads explain the shared
 * inbox and have no description; direct messages have none either. Reads the
 * room from the list, so `room-updated` shows here live.
 *
 * @param props.isOpen - Whether the dialog is shown.
 * @param props.onClose - Closes it.
 * @param props.avatar - Picture shown until the room is in the list.
 * @param props.name - Name shown until the room is in the list.
 * @param props.chatRoomId - The room.
 * @param props.roomType - The room's type, until the room is in the list.
 * @returns The dialog, or null when closed.
 */
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
  const isOffice = isOfficeRoom(room ?? { type: type as ChatRoomType });
  const viewer = { id: currentUserId, role: user?.role };
  const roomRef = room ?? { type: type as ChatRoomType, createdBy: "" };
  // Members and the picture: managers. Name and description: staff and group admins too.
  const canManage = isGroup && canManageRoom(roomRef, viewer);
  const canEditDetails = isGroup && canEditRoomDetails(roomRef, viewer);
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
        className={`${dialogOverlay} z-50`}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${groupName} info`}
          className="flex h-[85vh] max-h-[640px] w-full max-w-[760px] overflow-hidden rounded-t-[24px] border border-tl-line bg-tl-surface text-tl-ink shadow-[0_30px_70px_-30px_rgba(15,27,46,0.45)] sm:h-[80vh] sm:rounded-[24px]"
        >
          <GroupInfoSidebar selected={selectedMenu} onSelect={setSelectedMenu} />

          {/* Main Content */}
          <div className="relative min-w-0 flex-1 overflow-y-auto px-5 pb-6 pt-14 sm:px-6 sm:pt-7">
            <button
              type="button"
              onClick={onClose}
              className={`${iconButton} absolute right-2 top-2`}
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden />
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
                  canManage={canEditDetails}
                  onDraftChange={setNameDraft}
                  onStartEdit={() => {
                    setNameDraft(room?.name || groupName);
                    setEditingName(true);
                  }}
                  onCancel={() => setEditingName(false)}
                  onSave={() => void saveName()}
                />
                <p className="mt-1 text-sm text-tl-muted">
                  {isOffice && room?.subtitle ? room.subtitle : roomSubtitle(type, isGroup, memberCount)}
                </p>

                {isOffice && (
                  <p className="mt-4 flex items-start gap-2.5 rounded-2xl border border-tl-warning/25 bg-tl-warning-bg px-3.5 py-3 text-left text-[13px] leading-relaxed text-tl-body">
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-tl-warning" aria-hidden />
                    <span>{OFFICE_THREAD_NOTE} Members are kept up to date automatically.</span>
                  </p>
                )}

                {/* Add members — managers only, never in 1:1 chats */}
                {canManage && chatRoomId && (
                  <AddMembersButtons
                    onAddParents={() => setIsAddParentModalOpen(true)}
                    onAddTeachers={() => setIsAddTeacherModalOpen(true)}
                  />
                )}

                {/* Office threads and direct messages have no description. */}
                {isGroup && !isOffice && (
                  <GroupDescriptionField
                    editing={editingDescription}
                    draft={descriptionDraft}
                    description={room?.description}
                    saving={saving === "description"}
                    canManage={canEditDetails}
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
                  <div className="mt-6 text-left">
                    <p className={`${sectionTitle} mb-2.5`}>{membersHeading(isGroup, memberCount)}</p>
                    <GroupMemberList room={room} currentUserId={currentUserId} canManage={canManage} />
                  </div>
                )}
              </div>
            )}

            {selectedMenu !== "" && <h2 className={`${cardTitle} mb-4 text-left`}>{selectedMenu}</h2>}

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
