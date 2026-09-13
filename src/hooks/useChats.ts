// hooks/useChats.ts
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWebSocketContext } from "@/context/WebSocketContext";
import type { ChatAck, MessagesUpdatePayload } from "@/hooks/useWebSocket";
import { chatService } from "@/app/services/chat.service";
import {
  ChatRoom,
  ChatMessage,
  ChatAttachment,
  CreateChatRoomDto,
  CreateGroupChatDto,
  ChatRoomType,
} from "@/types/chat.types";
import { toast } from "@/components/CustomToast";
import {
  buildPendingMessage,
  createClientMessageId,
  idOf,
  isDelivered,
  markMessageFailed,
  markMessagePending,
  mergeMessages,
  newestStoredMessageId,
  normalizeMessage,
  removeLocalMessage,
} from "@/lib/chat/messages";
import {
  applyRoomActivity,
  clearRoomUnread,
  isRoomMember,
  mergeRoomList,
  RoomActivity,
  upsertRoom,
} from "@/lib/chat/rooms";
import { openChatRoom } from "@/lib/chat/openRoom";

/** Loading state of the open conversation, separate from the room list. */
export type ThreadStatus = "idle" | "loading" | "ready" | "error";

/** What the composer hands to {@link UseChatsReturn.sendMessage}. */
export interface SendMessageInput {
  roomId?: string;
  text?: string;
  file?: File;
  voice?: { blob: Blob; duration: number };
}

export interface UseChatsReturn {
  // Room list
  chatRooms: ChatRoom[];
  isRoomsLoading: boolean;
  roomsError: string | null;

  // Open conversation
  currentRoom: ChatRoom | null;
  currentRoomId: string | null;
  messages: ChatMessage[];
  threadStatus: ThreadStatus;
  threadError: string | null;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  isConnected: boolean;
  currentUserId: string;

  // Chat room operations
  fetchChatRooms: () => Promise<ChatRoom[]>;
  createChatRoom: (data: CreateChatRoomDto) => Promise<ChatRoom | null>;
  createGroupChat: (data: CreateGroupChatDto) => Promise<ChatRoom | null>;
  selectChatRoom: (roomId: string) => Promise<void>;
  retryCurrentRoom: () => void;
  searchChatRooms: (params: { searchTerm?: string; type?: ChatRoomType }) => Promise<ChatRoom[]>;

  // Message operations
  /** Adds a pending bubble and sends it. Returns its clientMessageId. */
  sendMessage: (input: SendMessageInput) => string | null;
  retryMessage: (clientMessageId: string) => void;
  deleteFailedMessage: (clientMessageId: string) => void;
  /** Loads the previous page. Resolves true when older messages were added. */
  loadMoreMessages: () => Promise<boolean>;
  getDraft: (roomId: string) => string;
  setDraft: (roomId: string, text: string) => void;

  // Participant operations
  addParticipant: (roomId: string, userId: string) => Promise<void>;
  addParticipantsToRoom: (roomId: string, userIds: string[]) => Promise<void>;
  removeParticipant: (roomId: string, userId: string) => Promise<void>;

  // Utility
  resetCurrentRoom: () => void;
  clearRoomsError: () => void;
}

interface RoomThread {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor?: string;
  /** A first page has been loaded, so the cursors above are meaningful. */
  loaded: boolean;
}

interface OutboxEntry {
  roomId: string;
  text: string;
  type: string;
  file?: File;
  voice?: { blob: Blob; duration: number };
  uploaded?: ChatAttachment[];
  previewUrl?: string;
}

type PageAck = ChatAck<MessagesUpdatePayload>;
type SendAck = ChatAck<{ message: unknown; clientMessageId?: string }>;

const EMPTY_THREAD: RoomThread = { messages: [], hasMore: false, loaded: false };
const JOIN_TIMEOUT_MS = 10_000;
const SEND_TIMEOUT_MS = 10_000;
const PAGE_SIZE = 50;
const MAX_TEXT_LENGTH = 5000;
const LOAD_ERROR = "Couldn't load this chat";

function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const e = err as { message?: unknown };
    if (typeof e.message === "string" && e.message && !/timed out|Not connected/i.test(e.message)) {
      return e.message;
    }
  }
  return fallback;
}

function isVisible(): boolean {
  return typeof document === "undefined" || document.visibilityState === "visible";
}

/**
 * The messages page's chat state: the room list, one merged message store
 * per room, and optimistic sends over the socket. Create it once (in
 * `MessagesLayout`) and share it through `ChatsProvider`.
 */
export const useChats = (): UseChatsReturn => {
  const { user, accessToken, isAuthenticated } = useAuth();
  const ws = useWebSocketContext();
  const {
    isConnected,
    emitWithAck,
    leaveChatRoom,
    markMessageAsRead,
    subscribe,
    onConnect,
    onChatMessage,
    onChatRoomsUpdate,
    onMessagesUpdate,
    fetchChatRoomsViaSocket,
  } = ws;

  const currentUserId = idOf(user?.userId || user?._id);
  const currentUserName =
    user?.firstName || user?.lastName ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() : user?.email || "You";

  // Room list
  const [chatRooms, setChatRoomsState] = useState<ChatRoom[]>([]);
  const [isRoomsLoading, setIsRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  // Threads
  const [threads, setThreadsState] = useState<Record<string, RoomThread>>({});
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [threadStatus, setThreadStatusState] = useState<ThreadStatus>("idle");
  const [threadError, setThreadError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Mirrors for socket callbacks and async flows
  const chatRoomsRef = useRef<ChatRoom[]>([]);
  const threadsRef = useRef<Record<string, RoomThread>>({});
  const currentRoomIdRef = useRef<string | null>(null);
  const threadStatusRef = useRef<ThreadStatus>("idle");
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;
  const connectedRef = useRef(isConnected);
  connectedRef.current = isConnected;

  const selectSeqRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const outboxRef = useRef(new Map<string, OutboxEntry>());
  const inFlightRef = useRef(new Set<string>());
  const markedReadRef = useRef(new Set<string>());
  const draftsRef = useRef(new Map<string, string>());
  const roomsRefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setChatRooms = useCallback((update: (prev: ChatRoom[]) => ChatRoom[]) => {
    setChatRoomsState((prev) => {
      const next = update(prev);
      chatRoomsRef.current = next;
      return next;
    });
  }, []);

  const updateThread = useCallback((roomId: string, update: (thread: RoomThread) => RoomThread) => {
    setThreadsState((prev) => {
      const current = prev[roomId] ?? EMPTY_THREAD;
      const next = update(current);
      if (next === current) return prev;
      const all = { ...prev, [roomId]: next };
      threadsRef.current = all;
      return all;
    });
  }, []);

  const mergeInto = useCallback(
    (roomId: string, incoming: ChatMessage[]) => {
      if (!incoming.length) return;
      updateThread(roomId, (t) => {
        const messages = mergeMessages(t.messages, incoming);
        return messages === t.messages ? t : { ...t, messages };
      });
    },
    [updateThread]
  );

  const setThreadStatus = useCallback((status: ThreadStatus, error: string | null = null) => {
    threadStatusRef.current = status;
    setThreadStatusState(status);
    setThreadError(error);
  }, []);

  /** The open room, if the tab is visible — unread counts don't clear while nobody looks. */
  const viewingRoomId = useCallback(() => (isVisible() ? currentRoomIdRef.current : null), []);

  const clearRoomsError = useCallback(() => setRoomsError(null), []);

  /**
   * Fetch all chat rooms for the current user
   */
  const fetchChatRooms = useCallback(async (): Promise<ChatRoom[]> => {
    if (!isAuthenticated || !accessToken || !currentUserIdRef.current) return [];

    setIsRoomsLoading(true);
    setRoomsError(null);
    try {
      const rooms = await chatService.getUserChatRooms();
      const merged = mergeRoomList(rooms, currentUserIdRef.current, viewingRoomId());
      setChatRooms(() => merged);
      return merged;
    } catch (err) {
      console.error("❌ Error in fetchChatRooms:", err);
      // Keep the list we have; the sidebar shows the error with Retry.
      setRoomsError(errorMessage(err, "Failed to fetch chat rooms"));
      return chatRoomsRef.current;
    } finally {
      setIsRoomsLoading(false);
    }
  }, [isAuthenticated, accessToken, setChatRooms, viewingRoomId]);

  /** Asks the server for the room list (a room we don't know about had activity). */
  const scheduleRoomsRefetch = useCallback(() => {
    if (roomsRefetchTimerRef.current) return;
    roomsRefetchTimerRef.current = setTimeout(() => {
      roomsRefetchTimerRef.current = null;
      if (connectedRef.current) fetchChatRoomsViaSocket();
      else void fetchChatRooms();
    }, 500);
  }, [fetchChatRoomsViaSocket, fetchChatRooms]);

  /**
   * Create a new chat room
   */
  const createChatRoom = useCallback(
    async (data: CreateChatRoomDto): Promise<ChatRoom | null> => {
      if (!isAuthenticated || !accessToken) {
        toast.error("You must be logged in to create a chat room");
        return null;
      }
      try {
        const newRoom = await chatService.createChatRoom(data);
        setChatRooms((prev) => upsertRoom(prev, newRoom));
        toast.success("Chat room created successfully");
        return newRoom;
      } catch (err: any) {
        toast.error(errorMessage(err, "Failed to create chat room"));
        return null;
      }
    },
    [isAuthenticated, accessToken, setChatRooms]
  );

  /**
   * Create a group chat room. The modal shows the success toast.
   */
  const createGroupChat = useCallback(
    async (data: CreateGroupChatDto): Promise<ChatRoom | null> => {
      if (!isAuthenticated || !accessToken) {
        toast.error("You must be logged in to create a group chat");
        return null;
      }
      try {
        const newRoom = await chatService.createGroupChat(data);
        setChatRooms((prev) => upsertRoom(prev, newRoom));
        return newRoom;
      } catch (err: any) {
        console.error("❌ Error in createGroupChat:", err);
        toast.error(errorMessage(err, "Failed to create group chat"));
        return null;
      }
    },
    [isAuthenticated, accessToken, setChatRooms]
  );

  /** Fetches what arrived after `cursor` (oldest first), a page at a time. */
  const backfillAfter = useCallback(
    async (roomId: string, cursor: string) => {
      let next: string | undefined = cursor;
      for (let page = 0; page < 5 && next; page++) {
        const ack: PageAck = await emitWithAck<PageAck>(
          "fetch-messages",
          { roomId, cursor: next, direction: "after", limit: 100 },
          JOIN_TIMEOUT_MS
        );
        if (!ack?.ok) return;
        mergeInto(
          roomId,
          ack.messages.map((m: unknown) => normalizeMessage(m, roomId))
        );
        next = ack.hasMore ? ack.prevCursor : undefined;
      }
    },
    [emitWithAck, mergeInto]
  );

  /**
   * Joins the open room over the socket. `chat-room-joined` fills the thread;
   * a reconnect also backfills from the newest message we already had.
   */
  const joinRoom = useCallback(
    async (roomId: string) => {
      const newestKnown = newestStoredMessageId(threadsRef.current[roomId]?.messages ?? []);
      try {
        const ack = await emitWithAck<ChatAck>("join-chat-room", { roomId }, JOIN_TIMEOUT_MS);
        if (currentRoomIdRef.current !== roomId) {
          // Switched away while joining: make sure this socket isn't left in the room.
          if (ack?.ok) leaveChatRoom(roomId);
          return;
        }
        if (!ack?.ok) {
          // Refused for an expired token: the socket refreshes it and reconnects, and we join again then.
          if (ack?.error?.code === "UNAUTHENTICATED") return;
          setThreadStatus("error", ack?.error?.code === "NOT_FOUND" ? "Chat room not found" : LOAD_ERROR);
          return;
        }
        setThreadStatus("ready");
        if (newestKnown) await backfillAfter(roomId, newestKnown).catch(() => undefined);
      } catch {
        if (currentRoomIdRef.current !== roomId) return;
        setThreadStatus("error", LOAD_ERROR);
      }
    },
    [emitWithAck, backfillAfter, leaveChatRoom, setThreadStatus]
  );

  /** REST history, used while the socket is down so a chat never opens blank. */
  const loadHistoryOverRest = useCallback(
    async (roomId: string, seq: number) => {
      try {
        const page = await chatService.getChatRoomMessagesWithCursor(roomId, PAGE_SIZE);
        if (selectSeqRef.current !== seq || currentRoomIdRef.current !== roomId) return;
        updateThread(roomId, (t) => ({
          messages: mergeMessages(t.messages, page.messages),
          hasMore: t.loaded ? t.hasMore : page.hasMore,
          nextCursor: t.loaded ? t.nextCursor : page.nextCursor,
          loaded: true,
        }));
        setThreadStatus("ready");
      } catch (err) {
        if (selectSeqRef.current !== seq || currentRoomIdRef.current !== roomId) return;
        console.error("❌ Error loading messages:", err);
        setThreadStatus("error", LOAD_ERROR);
      }
    },
    [updateThread, setThreadStatus]
  );

  /**
   * Opens a chat room: leaves the previous one, joins this one, and shows
   * its messages. Responses for a room that is no longer open are ignored.
   */
  const selectChatRoom = useCallback(
    async (roomId: string) => {
      if (!isAuthenticated || !accessToken || !roomId) return;
      if (currentRoomIdRef.current === roomId && threadStatusRef.current !== "error") return;

      const seq = ++selectSeqRef.current;
      const previous = currentRoomIdRef.current;
      if (previous && previous !== roomId) leaveChatRoom(previous);

      currentRoomIdRef.current = roomId;
      openChatRoom.set(roomId);
      setCurrentRoomId(roomId);
      setIsLoadingMore(false);
      loadingMoreRef.current = false;
      setThreadStatus(threadsRef.current[roomId]?.loaded ? "ready" : "loading");

      let room = chatRoomsRef.current.find((r) => r._id === roomId);
      if (!room) {
        const rooms = await fetchChatRooms();
        if (selectSeqRef.current !== seq) return;
        room = rooms.find((r) => r._id === roomId);
        if (!room) {
          setThreadStatus("error", "Chat room not found");
          return;
        }
      }
      if (room.participants.length > 0 && !isRoomMember(room, currentUserIdRef.current)) {
        setThreadStatus("error", "You are not a member of this chat room");
        return;
      }

      if (connectedRef.current) {
        await joinRoom(roomId);
      } else {
        // Joined on connect (see the onConnect effect).
        await loadHistoryOverRest(roomId, seq);
      }
    },
    [isAuthenticated, accessToken, leaveChatRoom, fetchChatRooms, joinRoom, loadHistoryOverRest, setThreadStatus]
  );

  const retryCurrentRoom = useCallback(() => {
    const roomId = currentRoomIdRef.current;
    if (!roomId) return;
    setThreadStatus(threadsRef.current[roomId]?.loaded ? "ready" : "loading");
    if (connectedRef.current) void joinRoom(roomId);
    else void loadHistoryOverRest(roomId, selectSeqRef.current);
  }, [joinRoom, loadHistoryOverRest, setThreadStatus]);

  /**
   * Leaves the open room (back / unmount). Its unread count grows again from
   * here on; the cached messages stay for a quick reopen.
   */
  const resetCurrentRoom = useCallback(() => {
    const roomId = currentRoomIdRef.current;
    if (roomId) leaveChatRoom(roomId);
    selectSeqRef.current++;
    currentRoomIdRef.current = null;
    openChatRoom.set(null);
    setCurrentRoomId(null);
    setIsLoadingMore(false);
    loadingMoreRef.current = false;
    setThreadStatus("idle");
  }, [leaveChatRoom, setThreadStatus]);

  // ─── Sending ────────────────────────────────────────────────────────────────

  const failSend = useCallback(
    (roomId: string, clientMessageId: string, err: unknown) => {
      if (isDelivered(threadsRef.current[roomId]?.messages ?? [], clientMessageId)) {
        outboxRef.current.delete(clientMessageId);
        return;
      }
      const message = errorMessage(err, "Message not sent. Check your connection and try again.");
      updateThread(roomId, (t) => {
        const messages = markMessageFailed(t.messages, clientMessageId, message);
        return messages === t.messages ? t : { ...t, messages };
      });
      toast.error(message);
    },
    [updateThread]
  );

  /** Uploads (if needed) and sends one queued message. Offline: stays pending. */
  const flushMessage = useCallback(
    async (clientMessageId: string) => {
      const entry = outboxRef.current.get(clientMessageId);
      if (!entry || inFlightRef.current.has(clientMessageId) || !connectedRef.current) return;
      inFlightRef.current.add(clientMessageId);
      try {
        if ((entry.file || entry.voice) && !entry.uploaded) {
          const file =
            entry.file ??
            new File([entry.voice!.blob], `voice-${Date.now()}.webm`, {
              type: entry.voice!.blob.type || "audio/webm",
            });
          const uploaded = await chatService.uploadChatAttachment(file);
          entry.uploaded = [
            entry.voice
              ? { ...uploaded, type: "audio", duration: uploaded.duration ?? entry.voice.duration }
              : uploaded,
          ];
        }

        const payload = {
          roomId: entry.roomId,
          text: entry.text,
          type: entry.type,
          clientMessageId,
          ...(entry.uploaded ? { attachments: entry.uploaded } : {}),
          ...(entry.voice ? { duration: entry.voice.duration } : {}),
        };
        const ack = await emitWithAck<SendAck>("send-chat-message", payload, SEND_TIMEOUT_MS);
        // Refused for an expired token: stays pending and is sent again after the socket reconnects.
        if (!ack?.ok && ack?.error?.code === "UNAUTHENTICATED") return;
        if (!ack?.ok) throw new Error(ack?.error?.message || "Message not sent");

        mergeInto(entry.roomId, [normalizeMessage(ack.message, entry.roomId)]);
        outboxRef.current.delete(clientMessageId);
        if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      } catch (err) {
        failSend(entry.roomId, clientMessageId, err);
      } finally {
        inFlightRef.current.delete(clientMessageId);
      }
    },
    [emitWithAck, mergeInto, failSend]
  );

  const sendMessage = useCallback(
    (input: SendMessageInput): string | null => {
      const roomId = input.roomId ?? currentRoomIdRef.current;
      const text = (input.text ?? "").trim();
      if (!roomId || (!text && !input.file && !input.voice)) return null;
      if (text.length > MAX_TEXT_LENGTH) {
        toast.error("Messages can be up to 5,000 characters.");
        return null;
      }

      const clientMessageId = createClientMessageId();
      let type = "text";
      let attachments: ChatAttachment[] = [];
      let previewUrl: string | undefined;

      if (input.file) {
        const isImage = input.file.type.startsWith("image/");
        type = isImage ? "image" : "file";
        previewUrl = isImage ? URL.createObjectURL(input.file) : undefined;
        attachments = [
          {
            url: previewUrl ?? "",
            type: isImage ? "image" : "file",
            name: input.file.name,
            mimeType: input.file.type,
            size: input.file.size,
          },
        ];
      } else if (input.voice) {
        type = "voice";
        attachments = [{ url: "", type: "audio", name: "Voice note", duration: input.voice.duration }];
      }

      outboxRef.current.set(clientMessageId, {
        roomId,
        text,
        type,
        file: input.file,
        voice: input.voice,
        previewUrl,
      });
      mergeInto(roomId, [
        buildPendingMessage({
          clientMessageId,
          roomId,
          senderId: currentUserIdRef.current,
          senderName: currentUserName,
          senderAvatar: user?.userAvatar,
          text,
          type,
          attachments,
          duration: input.voice?.duration,
        }),
      ]);
      void flushMessage(clientMessageId);
      return clientMessageId;
    },
    [mergeInto, flushMessage, currentUserName, user?.userAvatar]
  );

  const retryMessage = useCallback(
    (clientMessageId: string) => {
      const entry = outboxRef.current.get(clientMessageId);
      if (!entry) return;
      updateThread(entry.roomId, (t) => {
        const messages = markMessagePending(t.messages, clientMessageId);
        return messages === t.messages ? t : { ...t, messages };
      });
      void flushMessage(clientMessageId);
    },
    [updateThread, flushMessage]
  );

  const deleteFailedMessage = useCallback(
    (clientMessageId: string) => {
      const entry = outboxRef.current.get(clientMessageId);
      if (!entry || inFlightRef.current.has(clientMessageId)) return;
      outboxRef.current.delete(clientMessageId);
      if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      updateThread(entry.roomId, (t) => {
        const messages = removeLocalMessage(t.messages, clientMessageId);
        return messages === t.messages ? t : { ...t, messages };
      });
    },
    [updateThread]
  );

  /** Sends everything still pending (typed while offline). */
  const flushOutbox = useCallback(() => {
    for (const [clientMessageId, entry] of outboxRef.current) {
      const bubble = threadsRef.current[entry.roomId]?.messages.find((m) => m.clientMessageId === clientMessageId);
      if (bubble?.status === "pending") void flushMessage(clientMessageId);
    }
  }, [flushMessage]);

  // ─── Paging ─────────────────────────────────────────────────────────────────

  const loadMoreMessages = useCallback(async (): Promise<boolean> => {
    const roomId = currentRoomIdRef.current;
    const thread = roomId ? threadsRef.current[roomId] : undefined;
    if (!roomId || !thread?.hasMore || !thread.nextCursor || loadingMoreRef.current) return false;

    loadingMoreRef.current = true;
    setIsLoadingMore(true);
    try {
      let page: { messages: ChatMessage[]; hasMore: boolean; nextCursor?: string };
      if (connectedRef.current) {
        const ack = await emitWithAck<PageAck>(
          "fetch-messages",
          { roomId, cursor: thread.nextCursor, direction: "before", limit: PAGE_SIZE },
          JOIN_TIMEOUT_MS
        );
        if (!ack?.ok) throw new Error(ack?.error?.message);
        page = {
          messages: ack.messages.map((m) => normalizeMessage(m, roomId)),
          hasMore: ack.hasMore,
          nextCursor: ack.nextCursor,
        };
      } else {
        page = await chatService.getChatRoomMessagesWithCursor(roomId, PAGE_SIZE, thread.nextCursor, "before");
      }
      if (currentRoomIdRef.current !== roomId) return false;
      updateThread(roomId, (t) => ({
        ...t,
        messages: mergeMessages(t.messages, page.messages),
        hasMore: page.hasMore && Boolean(page.nextCursor),
        nextCursor: page.nextCursor ?? t.nextCursor,
      }));
      return page.messages.length > 0;
    } catch (err) {
      console.error("Error loading more messages:", err);
      return false;
    } finally {
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, [emitWithAck, updateThread]);

  const getDraft = useCallback((roomId: string) => draftsRef.current.get(roomId) ?? "", []);
  const setDraft = useCallback((roomId: string, text: string) => {
    if (text) draftsRef.current.set(roomId, text);
    else draftsRef.current.delete(roomId);
  }, []);

  // ─── Participants ───────────────────────────────────────────────────────────

  /**
   * Add participant to a chat room
   */
  const addParticipant = useCallback(
    async (roomId: string, userId: string) => {
      if (!isAuthenticated || !accessToken) {
        toast.error("You must be logged in to add participants");
        return;
      }
      try {
        const updatedRoom = await chatService.addParticipant(roomId, userId);
        setChatRooms((prev) => upsertRoom(prev, updatedRoom));
        toast.success("Participant added successfully");
      } catch (err: any) {
        toast.error(errorMessage(err, "Failed to add participant"));
      }
    },
    [isAuthenticated, accessToken, setChatRooms]
  );

  const addParticipantsToRoom = useCallback(
    async (roomId: string, userIds: string[]) => {
      if (!isAuthenticated || !accessToken) {
        toast.error("You must be logged in to add participants");
        return;
      }
      if (!userIds || userIds.length === 0) {
        toast.error("No participants selected");
        return;
      }
      try {
        const updatedRoom = await chatService.addParticipantsToRoom(roomId, userIds);
        if (updatedRoom?._id) setChatRooms((prev) => upsertRoom(prev, updatedRoom));
        toast.success(`${userIds.length} participant${userIds.length !== 1 ? "s" : ""} added successfully`);
      } catch (err: any) {
        console.error("Error adding participants:", err);
        toast.error(errorMessage(err, "Failed to add participants"));
        throw err; // Re-throw so the modal can handle it
      }
    },
    [isAuthenticated, accessToken, setChatRooms]
  );

  /**
   * Remove participant from a chat room
   */
  const removeParticipant = useCallback(
    async (roomId: string, userId: string) => {
      if (!isAuthenticated || !accessToken) {
        toast.error("You must be logged in to remove participants");
        return;
      }
      try {
        const updatedRoom = await chatService.removeParticipant(roomId, userId);
        setChatRooms((prev) => upsertRoom(prev, updatedRoom));
        toast.success("Participant removed successfully");
      } catch (err: any) {
        toast.error(errorMessage(err, "Failed to remove participant"));
      }
    },
    [isAuthenticated, accessToken, setChatRooms]
  );

  /**
   * Search chat rooms
   */
  const searchChatRooms = useCallback(
    async (params: { searchTerm?: string; type?: ChatRoomType }): Promise<ChatRoom[]> => {
      if (!isAuthenticated || !accessToken) return [];
      try {
        return await chatService.searchChatRooms(params);
      } catch (err: any) {
        toast.error(errorMessage(err, "Failed to search chat rooms"));
        return [];
      }
    },
    [isAuthenticated, accessToken]
  );

  // ─── Effects ────────────────────────────────────────────────────────────────

  // Initial room list on sign-in
  useEffect(() => {
    if (isAuthenticated && accessToken && currentUserId) {
      void fetchChatRooms();
    } else {
      setChatRooms(() => []);
    }
    // Only when the signed-in user changes; later updates arrive over the socket.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentUserId]);

  // Leave the room when the messages page goes away
  useEffect(() => {
    const outbox = outboxRef.current;
    const timer = roomsRefetchTimerRef;
    return () => {
      const roomId = currentRoomIdRef.current;
      if (roomId) leaveChatRoom(roomId);
      currentRoomIdRef.current = null;
      openChatRoom.set(null);
      for (const entry of outbox.values()) {
        if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      }
      if (timer.current) clearTimeout(timer.current);
    };
  }, [leaveChatRoom]);

  // Every (re)connect: rejoin + backfill the open room, then refresh the list, then send what's pending
  useEffect(
    () =>
      onConnect(() => {
        const roomId = currentRoomIdRef.current;
        const afterJoin = () => {
          fetchChatRoomsViaSocket();
          flushOutbox();
        };
        if (roomId) void joinRoom(roomId).finally(afterJoin);
        else afterJoin();
      }),
    [onConnect, joinRoom, fetchChatRoomsViaSocket, flushOutbox]
  );

  // Live events
  useEffect(() => {
    const unsubJoined = subscribe("chat-room-joined", (data: any) => {
      const roomId = idOf(data?.roomId);
      if (!roomId || roomId !== currentRoomIdRef.current) return;
      const messages = (Array.isArray(data.messages) ? data.messages : []).map((m: unknown) =>
        normalizeMessage(m, roomId)
      );
      updateThread(roomId, (t) => ({
        messages: mergeMessages(t.messages, messages),
        hasMore: t.loaded ? t.hasMore : Boolean(data.hasMore),
        nextCursor: t.loaded ? t.nextCursor : data.nextCursor,
        loaded: true,
      }));
      if (data.room) {
        const view = data.room;
        setChatRooms((prev) =>
          prev.some((r) => r._id === roomId)
            ? prev
            : mergeRoomList([view, ...prev], currentUserIdRef.current, viewingRoomId())
        );
      }
      setThreadStatus("ready");
    });

    const unsubPage = onMessagesUpdate((data) => {
      const roomId = idOf(data?.roomId);
      if (!roomId || roomId !== currentRoomIdRef.current || !Array.isArray(data.messages)) return;
      mergeInto(
        roomId,
        data.messages.map((m) => normalizeMessage(m, roomId))
      );
    });

    const unsubMessage = onChatMessage((raw) => {
      const message = normalizeMessage(raw);
      // Only the open room is joined; anything else is stale.
      if (!message._id || message.roomId !== currentRoomIdRef.current) return;
      mergeInto(message.roomId, [message]);
    });

    const unsubActivity = subscribe("chat-room-activity", (activity: RoomActivity) => {
      const roomId = idOf(activity?.roomId);
      if (!roomId) return;
      if (!chatRoomsRef.current.some((r) => r._id === roomId)) {
        scheduleRoomsRefetch();
        return;
      }
      setChatRooms(
        (prev) =>
          applyRoomActivity(prev, activity, {
            currentUserId: currentUserIdRef.current,
            viewingRoomId: viewingRoomId(),
          }).rooms
      );
    });

    const unsubRooms = onChatRoomsUpdate((data) => {
      if (!Array.isArray(data?.rooms) || !currentUserIdRef.current) return;
      setChatRooms(() => mergeRoomList(data.rooms, currentUserIdRef.current, viewingRoomId()));
      setRoomsError(null);
    });

    const unsubError = subscribe("error", (data: any) => {
      if (data?.code === "UNAUTHENTICATED") return; // handled by the socket's token refresh
      const clientMessageId = typeof data?.clientMessageId === "string" ? data.clientMessageId : "";
      if (clientMessageId) {
        // The ack settles sends in flight; this covers anything else.
        const entry = outboxRef.current.get(clientMessageId);
        if (entry && !inFlightRef.current.has(clientMessageId)) failSend(entry.roomId, clientMessageId, data);
        return;
      }
      const roomId = idOf(data?.roomId);
      if (roomId && roomId === currentRoomIdRef.current && threadStatusRef.current === "loading") {
        setThreadStatus("error", data?.code === "NOT_FOUND" ? "Chat room not found" : LOAD_ERROR);
      }
    });

    return () => {
      unsubJoined();
      unsubPage();
      unsubMessage();
      unsubActivity();
      unsubRooms();
      unsubError();
    };
  }, [
    subscribe,
    onMessagesUpdate,
    onChatMessage,
    onChatRoomsUpdate,
    updateThread,
    mergeInto,
    setChatRooms,
    setThreadStatus,
    scheduleRoomsRefetch,
    viewingRoomId,
    failSend,
  ]);

  const messages = useMemo(
    () => (currentRoomId ? threads[currentRoomId]?.messages ?? [] : []),
    [threads, currentRoomId]
  );

  // Mark what's on screen as read — only while the tab is visible
  useEffect(() => {
    const roomId = currentRoomId;
    if (!roomId || !isConnected || !currentUserId) return;

    const markVisible = () => {
      if (!isVisible() || currentRoomIdRef.current !== roomId) return;
      for (const message of threadsRef.current[roomId]?.messages ?? []) {
        if (
          message.status ||
          !message._id ||
          message.senderId === currentUserId ||
          message.readBy.includes(currentUserId) ||
          markedReadRef.current.has(message._id)
        ) {
          continue;
        }
        markedReadRef.current.add(message._id);
        markMessageAsRead(message._id);
      }
      setChatRooms((prev) => clearRoomUnread(prev, roomId));
    };

    markVisible();
    document.addEventListener("visibilitychange", markVisible);
    return () => document.removeEventListener("visibilitychange", markVisible);
  }, [currentRoomId, messages, isConnected, currentUserId, markMessageAsRead, setChatRooms]);

  const currentRoom = useMemo(
    () => (currentRoomId ? chatRooms.find((r) => r._id === currentRoomId) ?? null : null),
    [chatRooms, currentRoomId]
  );
  const currentThread = currentRoomId ? threads[currentRoomId] : undefined;

  return {
    chatRooms,
    isRoomsLoading,
    roomsError,

    currentRoom,
    currentRoomId,
    messages,
    threadStatus,
    threadError,
    isLoadingMore,
    hasMoreMessages: Boolean(currentThread?.hasMore && currentThread.nextCursor),
    isConnected,
    currentUserId,

    fetchChatRooms,
    createChatRoom,
    createGroupChat,
    selectChatRoom,
    retryCurrentRoom,
    searchChatRooms,

    sendMessage,
    retryMessage,
    deleteFailedMessage,
    loadMoreMessages,
    getDraft,
    setDraft,

    addParticipant,
    addParticipantsToRoom,
    removeParticipant,

    resetCurrentRoom,
    clearRoomsError,
  };
};
