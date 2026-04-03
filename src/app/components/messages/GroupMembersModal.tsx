"use client";

import { X, Users, Circle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";

interface Participant {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  avatar?: string;
  role?: string;
  isOnline?: boolean;
}

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupName: string;
  participants: Participant[];
  currentUserId?: string;
}

function getDisplayName(participant: Participant): string {
  if (participant.name && participant.name.trim()) return participant.name.trim();
  const composed = `${participant.firstName || ""} ${participant.lastName || ""}`.trim();
  if (composed) return composed;
  return participant.email || "Unknown User";
}

export default function GroupMembersModal({
  isOpen,
  onClose,
  groupName,
  participants,
  currentUserId,
}: GroupMembersModalProps) {
  if (!isOpen) return null;

  const sortedParticipants = [...participants].sort((a, b) =>
    getDisplayName(a).localeCompare(getDisplayName(b))
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl border border-gray-200 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">{groupName} Members</h3>
            <p className="text-xs text-gray-500">{sortedParticipants.length} total member(s)</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Close members list"
          >
            <X size={18} className="text-gray-600" />
          </button>
        </div>

        <div className="overflow-y-auto p-3 sm:p-4 space-y-2 max-h-[calc(80vh-72px)]">
          {sortedParticipants.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              No members found for this group.
            </div>
          ) : (
            sortedParticipants.map((participant) => {
              const displayName = getDisplayName(participant);
              const isCurrentUser = !!currentUserId && participant.id === currentUserId;

              return (
                <div
                  key={participant.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback
                        className="text-white text-xs"
                        style={{ backgroundColor: generateColorFromString(displayName) }}
                      >
                        {getUserInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {displayName} {isCurrentUser ? "(You)" : ""}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {participant.email || "No email"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-2">
                    {participant.role && (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-600">
                        {participant.role}
                      </span>
                    )}
                    <Circle
                      size={10}
                      className={participant.isOnline ? "fill-green-500 text-green-500" : "fill-gray-300 text-gray-300"}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
