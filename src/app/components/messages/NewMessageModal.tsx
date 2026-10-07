"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Sheet, Tabs, focusRing, type TabOption } from "@/components/tl";
import { teacherService } from "@/app/services/teacher.service";
import { parentService } from "@/app/services/parent.service";
import { useChatsContext } from "@/context/ChatsContext";
import { ChatRoomType, type ChatRoom } from "@/types/chat.types";
import { logger } from "@/lib/logger";
import { PersonAvatar, TextSearch } from "./parts";

/** One person the admin can message. */
interface Person {
  /** The user id — what a chat room's participants are. */
  userId: string;
  name: string;
  detail: string;
  avatar?: string;
}

type Tab = "teachers" | "parents";

/** The two lists, as tabs. */
const TAB_OPTIONS: readonly TabOption<Tab>[] = [
  { value: "teachers", label: "Teachers" },
  { value: "parents", label: "Parents" },
];

/** Props for {@link NewMessageModal}. */
interface NewMessageModalProps {
  open: boolean;
  onClose: () => void;
  /** The direct chat, new or existing (`room.reused`). */
  onStarted: (room: ChatRoom) => void;
}

/**
 * Picks a teacher or parent and opens a direct message with them, in the
 * design system's sheet (Escape, the backdrop and Close dismiss it).
 *
 * @param props - See {@link NewMessageModalProps}.
 * @param props.open - Whether it is shown.
 * @param props.onClose - Closes it.
 * @param props.onStarted - Opens the chat once it exists.
 * @returns The sheet.
 */
export default function NewMessageModal({ open, onClose, onStarted }: NewMessageModalProps) {
  const { createChatRoom, currentUserId } = useChatsContext();
  const [tab, setTab] = useState<Tab>("teachers");
  const [people, setPeople] = useState<{ teachers: Person[]; parents: Person[] } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  const [startingId, setStartingId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const tabsId = useId();

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
    <Sheet open={open} onOpenChange={(next) => !next && onClose()} title="New message" subtitle="Chat with a teacher or parent.">
      <Tabs
        options={TAB_OPTIONS}
        value={tab}
        onChange={setTab}
        label="People to message"
        variant="segmented"
        idPrefix={tabsId}
      />

      <TextSearch
        inputRef={searchRef}
        value={term}
        onChange={setTerm}
        label={`Search ${tab}`}
        placeholder={`Search ${tab}`}
        autoFocusInSheet
      />

      <div
        role="tabpanel"
        id={`${tabsId}-panel`}
        aria-labelledby={`${tabsId}-tab-${tab}`}
        className="-mx-2 max-h-[45vh] min-h-[12rem] overflow-y-auto"
      >
        {loadError ? (
          <p className="px-3 py-6 text-center text-sm font-bold text-tl-danger" role="alert">
            {loadError}
          </p>
        ) : !people ? (
          <div className="flex justify-center py-10" role="status" aria-label={`Loading ${tab}`}>
            <Loader2 className="h-6 w-6 animate-spin text-tl-brand" aria-hidden />
          </div>
        ) : visible.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-tl-muted">
            {term ? `No ${tab} match "${term}".` : `No ${tab} yet.`}
          </p>
        ) : (
          visible.map((person) => (
            <button
              key={person.userId}
              type="button"
              disabled={Boolean(startingId)}
              onClick={() => void start(person)}
              className={`flex min-h-[56px] w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors hover:bg-tl-subtle disabled:opacity-60 ${focusRing}`}
            >
              <PersonAvatar id={person.userId} name={person.name} src={person.avatar ?? null} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-tl-ink">{person.name}</span>
                <span className="block truncate text-xs text-tl-muted">{person.detail}</span>
              </span>
              {startingId === person.userId && (
                <Loader2 className="h-4 w-4 animate-spin text-tl-brand" aria-hidden />
              )}
            </button>
          ))
        )}
      </div>
    </Sheet>
  );
}
