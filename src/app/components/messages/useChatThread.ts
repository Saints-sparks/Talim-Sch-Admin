"use client";

import { useCallback, useState } from "react";
import type { UseChatsReturn } from "@/hooks/useChats";

/**
 * Composer state for one open room: the draft (kept per room, so switching
 * chats never carries text across) and the send actions. Sends are
 * optimistic — the text moves into a pending bubble, so the box clears at
 * once and a failed send keeps the text in its "Not sent" bubble.
 */
export function useChatThread(chats: UseChatsReturn, roomId: string | undefined) {
  const { getDraft, setDraft, sendMessage } = chats;
  const [draft, setDraftState] = useState(() => (roomId ? getDraft(roomId) : ""));

  const updateDraft = useCallback(
    (text: string) => {
      setDraftState(text);
      if (roomId) setDraft(roomId, text);
    },
    [roomId, setDraft]
  );

  const sendText = useCallback(() => {
    if (!roomId || !draft.trim()) return;
    if (sendMessage({ roomId, text: draft })) updateDraft("");
  }, [roomId, draft, sendMessage, updateDraft]);

  /** Sends picked files with whatever was typed as their caption. Returns false if nothing was sent. */
  const sendFiles = useCallback(
    (files: File[], caption: string) => {
      if (!roomId || files.length === 0) return false;
      if (!sendMessage({ roomId, files, text: caption })) return false;
      updateDraft("");
      return true;
    },
    [roomId, sendMessage, updateDraft]
  );

  const sendVoice = useCallback(
    (file: File, duration: number) => {
      if (!roomId) return;
      sendMessage({ roomId, voice: { file, duration } });
    },
    [roomId, sendMessage]
  );

  return { draft, updateDraft, sendText, sendFiles, sendVoice };
}
