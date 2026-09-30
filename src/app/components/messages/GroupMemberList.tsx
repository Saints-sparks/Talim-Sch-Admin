"use client";

import { useMemo, useState } from "react";
import { LogOut, ShieldCheck, UserMinus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";
import type { ChatRoom, Participant } from "@/types/chat.types";
import { useChatsContext } from "@/context/ChatsContext";
import { canLeaveRoom, isGroupAdmin, isOfficeRoom } from "@/lib/chat/rooms";
import ConfirmDialog from "./ConfirmDialog";

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
      <ul className="space-y-1.5">
        {members.map((member) => {
          const name = displayName(member);
          const isMe = member.userId === currentUserId;
          const isAdmin = isGroupAdmin(room, member.userId);
          return (
            <li key={member.userId} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2">
              <div className="relative flex-shrink-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={member.userAvatar || undefined} />
                  <AvatarFallback className="text-xs text-white" style={{ backgroundColor: generateColorFromString(name) }}>
                    {getUserInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
                    member.isOnline ? "bg-green-500" : "bg-gray-300"
                  }`}
                  aria-label={member.isOnline ? "Online" : "Offline"}
                />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-slate-100">
                  <span className="truncate">
                    {name} {isMe && <span className="font-normal text-gray-500">(You)</span>}
                  </span>
                  {isAdmin && (
                    <span className="inline-flex flex-shrink-0 items-center gap-0.5 rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                      <ShieldCheck className="h-3 w-3" aria-hidden />
                      Group admin
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {[roleLabel(member.role), member.isOnline ? "Online" : "Offline"].filter(Boolean).join(" · ")}
                </p>
              </div>
              {showRemove && !isMe && (
                <button
                  type="button"
                  onClick={() => setPending({ kind: "remove", member })}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  aria-label={`Remove ${name}`}
                >
                  <UserMinus size={14} />
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
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut size={16} />
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
