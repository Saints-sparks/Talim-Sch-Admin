"use client";

import { useId } from "react";
import { EmptyNote, Pill } from "@/components/tl";
import { useChatsContext } from "@/context/ChatsContext";
import type { ChatParticipant } from "@/types/chat.types";
import GroupMemberList from "./GroupMemberList";
import { DialogTitleBar, PersonAvatar, dialogOverlay, dialogPanel } from "./parts";

/** Props for {@link GroupMembersModal}. */
interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  participants: ChatParticipant[];
  currentUserId?: string;
  /** With a room from the list, members are live and managers can remove them. */
  chatRoomId?: string;
  canManage?: boolean;
}

/**
 * A member's name for the list.
 *
 * @param participant - The member.
 * @returns The name, else first and last name, else the email.
 */
function getDisplayName(participant: ChatParticipant): string {
  if (participant.name && participant.name.trim()) return participant.name.trim();
  const composed = `${participant.firstName || ""} ${participant.lastName || ""}`.trim();
  if (composed) return composed;
  return participant.email || "Unknown User";
}

/**
 * The group's members from the header menu ("View Members"): the live list
 * from the room (with Remove and Leave where allowed), or the members the
 * header was given while the room is not in the list yet.
 *
 * @param props - See {@link GroupMembersModalProps}.
 * @param props.isOpen - Whether it is shown.
 * @param props.onClose - Closes it.
 * @param props.groupName - The group's name.
 * @param props.participants - The members the header knows.
 * @param props.currentUserId - The viewer.
 * @param props.chatRoomId - The room.
 * @param props.canManage - Whether the viewer may remove members.
 * @returns The dialog, or null while closed.
 */
export default function GroupMembersModal({
  isOpen,
  onClose,
  groupName,
  participants,
  currentUserId,
  chatRoomId,
  canManage = false,
}: GroupMembersModalProps) {
  const { chatRooms } = useChatsContext();
  const titleId = useId();
  if (!isOpen) return null;
  const room = chatRoomId ? chatRooms.find((r) => r._id === chatRoomId) : undefined;

  const sortedParticipants = [...participants].sort((a, b) =>
    getDisplayName(a).localeCompare(getDisplayName(b))
  );

  return (
    <div className={`${dialogOverlay} z-[60]`}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${dialogPanel} max-h-[85vh] sm:max-w-2xl`}
      >
        <DialogTitleBar
          title={`${groupName} Members`}
          titleId={titleId}
          subtitle={`${room ? room.participants.length : sortedParticipants.length} total member(s)`}
          onClose={onClose}
          closeLabel="Close members list"
        />

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {room ? (
            <GroupMemberList room={room} currentUserId={currentUserId ?? ""} canManage={canManage} />
          ) : sortedParticipants.length === 0 ? (
            <EmptyNote compact title="No members found for this group." />
          ) : (
            <ul className="flex flex-col gap-1.5">
              {sortedParticipants.map((participant) => {
                const displayName = getDisplayName(participant);
                const isCurrentUser = !!currentUserId && participant.id === currentUserId;

                return (
                  <li
                    key={participant.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-tl-line-soft px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <PersonAvatar
                        id={participant.id}
                        name={displayName}
                        src={participant.avatar ?? null}
                        size={36}
                        online={Boolean(participant.isOnline)}
                        announceOnline
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-tl-ink">
                          {displayName} {isCurrentUser ? "(You)" : ""}
                        </p>
                        <p className="truncate text-xs text-tl-muted">{participant.email || "No email"}</p>
                      </div>
                    </div>

                    {participant.role && <Pill tone="muted">{participant.role}</Pill>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
