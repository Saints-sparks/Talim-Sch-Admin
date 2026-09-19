"use client";

import { useCallback, useMemo } from "react";
import type { UseChatsReturn } from "@/hooks/useChats";

interface ActionMessage {
  _id: string;
  senderType: string;
  status?: "pending" | "failed";
  isDeleted?: boolean;
  replyTo?: { messageId: string };
}

/**
 * What a bubble's menu can do in the open room: delete (mine anywhere; others'
 * only in a group, where the server decides who may) and jump to a quoted
 * message that is loaded in the thread.
 *
 * @param chats - The shared chat state.
 * @param roomId - The open room.
 * @param canDeleteOthers - True in a group; direct messages only let you delete your own.
 * @param messages - The thread as displayed.
 */
export function useMessageActions(
  chats: UseChatsReturn,
  roomId: string,
  canDeleteOthers: boolean,
  messages: ActionMessage[]
) {
  const { deleteMessage } = chats;
  const loadedIds = useMemo(() => new Set(messages.map((m) => m._id)), [messages]);

  /** A delete handler for this message, or undefined when none should be offered. */
  const deleteHandlerFor = useCallback(
    (msg: ActionMessage): (() => Promise<void>) | undefined => {
      if (!msg._id || msg.status || msg.isDeleted) return undefined;
      const mine = msg.senderType === "self" || msg.senderType === "me";
      if (!mine && !canDeleteOthers) return undefined;
      return () => deleteMessage(roomId, msg._id);
    },
    [deleteMessage, roomId, canDeleteOthers]
  );

  const jump = useCallback((messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("bg-blue-50");
    window.setTimeout(() => el.classList.remove("bg-blue-50"), 1200);
  }, []);

  /** `jump` only for a quote whose original is loaded. */
  const jumpFor = useCallback(
    (msg: ActionMessage) => (msg.replyTo && loadedIds.has(msg.replyTo.messageId) ? jump : undefined),
    [loadedIds, jump]
  );

  return { deleteHandlerFor, jumpFor };
}
