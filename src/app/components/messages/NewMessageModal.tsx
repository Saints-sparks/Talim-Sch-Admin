"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { teacherService } from "@/app/services/teacher.service";
import { parentService } from "@/app/services/parent.service";
import { useChatsContext } from "@/context/ChatsContext";
import { ChatRoomType, type ChatRoom } from "@/types/chat.types";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";
import { logger } from "@/lib/logger";

/** One person the admin can message. */
interface Person {
  /** The user id — what a chat room's participants are. */
  userId: string;
  name: string;
  detail: string;
  avatar?: string;
}

type Tab = "teachers" | "parents";

interface NewMessageModalProps {
  open: boolean;
  onClose: () => void;
  /** The direct chat, new or existing (`room.reused`). */
  onStarted: (room: ChatRoom) => void;
}

/** Picks a teacher or parent and opens a direct message with them. */
export default function NewMessageModal({ open, onClose, onStarted }: NewMessageModalProps) {
  const { createChatRoom, currentUserId } = useChatsContext();
  const [tab, setTab] = useState<Tab>("teachers");
  const [people, setPeople] = useState<{ teachers: Person[]; parents: Person[] } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [startingId, setStartingId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTerm("");
    setLoadError(null);
    searchRef.current?.focus();
    if (people) return;

    let cancelled = false;
    Promise.all([teacherService.getAllTeachers(), parentService.getParentsBySchoolId()])
      .then(([teachers, parents]) => {
        if (cancelled) return;
        setPeople({
          teachers: teachers.map((t) => ({
            userId: t._id,
            name: `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() || t.email || "Teacher",
            detail: t.specialization || t.employmentRole || "Teacher",
            avatar: t.userAvatar,
          })),
          parents: parents
            .filter((p) => p.userId?._id)
            .map((p) => ({
              userId: p.userId._id,
              name: `${p.userId.firstName ?? ""} ${p.userId.lastName ?? ""}`.trim() || p.userId.email || "Parent",
              detail:
                p.children?.length
                  ? `Parent of ${p.children.length} ${p.children.length === 1 ? "child" : "children"}`
                  : "Parent",
              avatar: p.userId.userAvatar,
            })),
        });
      })
      .catch((error: unknown) => {
        logger.error("chat", "Could not load people for a new message", error);
        if (!cancelled) setLoadError("Couldn't load the list. Close this and try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [open, people]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const visible = useMemo(() => {
    const list = people?.[tab] ?? [];
    const needle = term.trim().toLowerCase();
    return needle
      ? list.filter((p) => p.name.toLowerCase().includes(needle) || p.detail.toLowerCase().includes(needle))
      : list;
  }, [people, tab, term]);

  if (!open) return null;

  const start = async (person: Person) => {
    if (!currentUserId || startingId) return;
    setStartingId(person.userId);
    const room = await createChatRoom({
      type: ChatRoomType.ONE_TO_ONE,
      participants: [currentUserId, person.userId],
    });
    setStartingId(null);
    if (room) {
      onStarted(room);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New message"
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-base font-semibold text-gray-900">New message</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-1 px-4 pt-3" role="tablist">
          {(["teachers", "parents"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${
                tab === key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <div className="relative px-4 py-3">
          <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={`Search ${tab}`}
            aria-label={`Search ${tab}`}
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div className="min-h-[12rem] flex-1 overflow-y-auto px-2 pb-3">
          {loadError ? (
            <p className="px-3 py-6 text-center text-sm text-red-600">{loadError}</p>
          ) : !people ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : visible.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-gray-500">
              {term ? `No ${tab} match "${term}".` : `No ${tab} yet.`}
            </p>
          ) : (
            visible.map((person) => (
              <button
                key={person.userId}
                type="button"
                disabled={Boolean(startingId)}
                onClick={() => void start(person)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none disabled:opacity-60"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={person.avatar} />
                  <AvatarFallback
                    className="text-xs font-medium text-white"
                    style={{ backgroundColor: generateColorFromString(person.name) }}
                  >
                    {getUserInitials(person.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-900">{person.name}</span>
                  <span className="block truncate text-xs text-gray-500">{person.detail}</span>
                </span>
                {startingId === person.userId && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
