"use client";

import { useMemo, useState } from "react";
import { LogOut, ShieldCheck, UserMinus } from "lucide-react";
import { Pill, dangerGhostButton } from "@/components/tl";
import type { ChatRoom, Participant } from "@/types/chat.types";
import { useChatsContext } from "@/context/ChatsContext";
import { canLeaveRoom, isGroupAdmin, isOfficeRoom } from "@/lib/chat/rooms";
import ConfirmDialog from "./ConfirmDialog";
import { PersonAvatar } from "./parts";

/** Props for {@link GroupMemberList}. */
interface GroupMemberListProps {
  room: ChatRoom;
  currentUserId: string;
  /** Show Remove on other members (never in an office thread, whose members the server keeps). */
  canManage: boolean;
}

/**
 * A member's name for the list.
 *
 * @param p - The member.
 * @returns First and last name, else the email, else "Unknown user".
 */
function displayName(p: Participant): string {
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || p.email || "Unknown user";
}

/**
 * A role as people read it.
 *
 * @param role - e.g. `school_sub_admin`.
 * @returns e.g. "School sub admin", or "" when there is none.
 */
function roleLabel(role?: string): string {
  if (!role) return "";
  const text = role.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

type PendingAction = { kind: "remove"; member: Participant } | { kind: "leave" } | null;

/**
 * Group members with their role, online state and a "Group admin" badge (from
 * the room's `admins`); me first, then the admins, then by name. Remove for
 * managers and Leave for me where allowed; neither in an office thread.
 *
 * @param props - See {@link GroupMemberListProps}.
 * @param props.room - The room, live from the room list.
 * @param props.currentUserId - The viewer.
 * @param props.canManage - Whether the viewer may remove members.
 * @returns The list, with its confirmation dialog.
 */
export default function GroupMemberList({ room, currentUserId, canManage }: GroupMemberListProps) {
  const { removeParticipant, leaveRoom } = useChatsContext();
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);

  const members = useMemo(
    () =>
      [...room.participants].sort((a, b) => {
        if (a.userId === currentUserId) return -1;
        if (b.userId === currentUserId) return 1;
        const adminOrder = Number(isGroupAdmin(room, b.userId)) - Number(isGroupAdmin(room, a.userId));
        return adminOrder || displayName(a).localeCompare(displayName(b));
      }),
    [room, currentUserId]
  );
  const showLeave = canLeaveRoom(room) && members.some((m) => m.userId === currentUserId);
  const showRemove = canManage && !isOfficeRoom(room);

  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    // Success and failure both close the dialog; the toast says which.
    if (pending.kind === "leave") await leaveRoom(room._id);
    else await removeParticipant(room._id, pending.member.userId);
    setBusy(false);
    setPending(null);
  };

  const groupName = room.name || "this group";

  return (
    <div>
      <ul className="flex flex-col gap-1.5">
        {members.map((member) => {
          const name = displayName(member);
          const isMe = member.userId === currentUserId;
          const isAdmin = isGroupAdmin(room, member.userId);
          return (
            <li
              key={member.userId}
              className="flex items-center gap-3 rounded-2xl border border-tl-line-soft px-3 py-2.5"
            >
              <PersonAvatar
                id={member.userId}
                name={name}
                src={member.userAvatar || null}
                size={36}
                online={Boolean(member.isOnline)}
                announceOnline
              />
              <div className="min-w-0 flex-1 text-left">
                <p className="flex min-w-0 flex-wrap items-center gap-1.5 text-sm font-bold text-tl-ink">
                  <span className="truncate">
                    {name} {isMe && <span className="font-medium text-tl-muted">(You)</span>}
                  </span>
                  {isAdmin && (
                    <Pill tone="info">
                      <ShieldCheck className="h-3 w-3" aria-hidden />
                      Group admin
                    </Pill>
                  )}
                </p>
                <p className="truncate text-xs text-tl-muted">
                  {[roleLabel(member.role), member.isOnline ? "Online" : "Offline"].filter(Boolean).join(" · ")}
                </p>
              </div>
              {showRemove && !isMe && (
                <button
                  type="button"
                  onClick={() => setPending({ kind: "remove", member })}
                  className={dangerGhostButton}
                  aria-label={`Remove ${name}`}
                >
                  <UserMinus size={14} aria-hidden />
                  <span className="hidden sm:inline">Remove</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {showLeave && (
        <button
          type="button"
          onClick={() => setPending({ kind: "leave" })}
          className={`${dangerGhostButton} mt-4 w-full`}
        >
          <LogOut size={16} aria-hidden />
          Leave group
        </button>
      )}

      <ConfirmDialog
        open={pending !== null}
        title={pending?.kind === "leave" ? "Leave group?" : "Remove member?"}
        message={
          pending?.kind === "leave"
            ? `You'll stop getting messages from ${groupName}.`
            : pending?.kind === "remove"
              ? `Remove ${displayName(pending.member)} from ${groupName}?`
              : ""
        }
        confirmLabel={pending?.kind === "leave" ? "Leave" : "Remove"}
        busy={busy}
        onConfirm={() => void confirm()}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
