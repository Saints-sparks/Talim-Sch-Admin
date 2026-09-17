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
  applyParticipantsChanged,
  applyRoomActivity,
  applyRoomUpdated,
  clearRoomUnread,
  isRoomMember,
  mergeRoomList,
  removeRoom,
  RoomActivity,
  upsertRoom,
  type ParticipantsChangedEvent,
  type RoomUpdatedEvent,
} from "@/lib/chat/rooms";
import { openChatRoom } from "@/lib/chat/openRoom";
import {
  fileKind,
  messageTypeFor,
  useAttachmentUpload,
  validateFile,
  MAX_FILES_PER_MESSAGE,
  type AttachmentKind,
  type ChatUploadFn,
  type UploadItem,
} from "@/components/chat-kit";
import { logger } from "@/lib/logger";
import { applyMessagesRead, nextReadMarker, type ReadEvent, type ReadMarker } from "@/lib/chat/readReceipts";

/** Loading state of the open conversation, separate from the room list. */
export type ThreadStatus = "idle" | "loading" | "ready" | "error";

/** What the composer hands to {@link UseChatsReturn.sendMessage}. */
export interface SendMessageInput {
  roomId?: string;
  /** The message text, or the caption of the files. */
  text?: string;
  /** Up to 10 files, already validated by the composer. */
  files?: File[];
  /** A recorded voice note (`useVoiceRecorder`). */
  voice?: { file: File; duration: number };
}

/**
 * Narrows a socket payload to a readable record, so a malformed event is
 * ignored rather than throwing inside a handler.
 *
 * @param value - The raw event payload.
 * @returns The payload as a record, or an empty one.
 */
function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

/** Everything the chat screens need: the room list, the open room, and the actions that change either. */
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
  /** Removes a member (shows the server's message on failure). Resolves true on success. */
  removeParticipant: (roomId: string, userId: string) => Promise<boolean>;
  /** Removes me from a group. Resolves true on success. */
  leaveRoom: (roomId: string) => Promise<boolean>;

  // Group details
  /** PATCH /chat/rooms/:id. Rejects with the server's message (e.g. 403). */
  updateRoomDetails: (
    roomId: string,
    patch: { name?: string; description?: string | null; avatarUrl?: string | null }
  ) => Promise<ChatRoom>;
  /** Set when I left or was removed from a room, so the page can go back to the list. */
  removedRoom: { roomId: string; at: number } | null;

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
  /** Files to upload; each keeps its uploaded attachment so a retry skips it. */
  items: UploadItem[];
  /** Voice note length, seconds. */
  duration?: number;
  /** Local object URLs of the pending bubble's previews. */
  previewUrls: string[];
}

function revokePreviews(entry: OutboxEntry) {
  for (const url of entry.previewUrls) URL.revokeObjectURL(url);
  entry.previewUrls = [];
}

/** The app's upload helper, in the shape the chat kit expects. */
const uploadChatFile: ChatUploadFn = (file) => chatService.uploadChatAttachment(file);

type PageAck = ChatAck<MessagesUpdatePayload>;
type SendAck = ChatAck<{ message: unknown; clientMessageId?: string }>;

const EMPTY_THREAD: RoomThread = { messages: [], hasMore: false, loaded: false };
const JOIN_TIMEOUT_MS = 10_000;
const SEND_TIMEOUT_MS = 10_000;
const READ_TIMEOUT_MS = 10_000;
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

/** The page is on screen and focused — only then does the open room count as read. */
function isViewing(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState === "visible" && (typeof document.hasFocus !== "function" || document.hasFocus());
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
  const [removedRoom, setRemovedRoom] = useState<{ roomId: string; at: number } | null>(null);

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
  /** The last `mark-room-read` sent per room, so a position is never sent twice. */
  const readMarkersRef = useRef(new Map<string, ReadMarker>());
  const draftsRef = useRef(new Map<string, string>());
  const roomsRefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { upload: uploadFiles } = useAttachmentUpload(uploadChatFile);

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

  /** The open room, if the tab is visible and focused — unread counts don't clear while nobody looks. */
  const viewingRoomId = useCallback(() => (isViewing() ? currentRoomIdRef.current : null), []);

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
      logger.error('chat', "❌ Error in fetchChatRooms:", err);
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
      } catch (err: unknown) {
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
      } catch (err: unknown) {
        logger.error('chat', "❌ Error in createGroupChat:", err);
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
        logger.error('chat', "❌ Error loading messages:", err);
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

  /**
   * Forgets a room I'm no longer in: drops it from the list and its cached
   * thread, leaves it if it's open, and tells the page to go back.
   */
  const dropRoom = useCallback(
    (roomId: string) => {
      setChatRooms((prev) => removeRoom(prev, roomId));
      setThreadsState((prev) => {
        if (!prev[roomId]) return prev;
        const next = { ...prev };
        delete next[roomId];
        threadsRef.current = next;
        return next;
      });
      readMarkersRef.current.delete(roomId);
      if (currentRoomIdRef.current === roomId) resetCurrentRoom();
      setRemovedRoom({ roomId, at: Date.now() });
    },
    [setChatRooms, resetCurrentRoom]
  );

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

  /** Records upload progress on the pending bubble. */
  const setUploadProgress = useCallback(
    (roomId: string, clientMessageId: string, index: number, fraction: number) => {
      updateThread(roomId, (t) => {
        let changed = false;
        const messages = t.messages.map((m) => {
          if (m.clientMessageId !== clientMessageId || m.status !== "pending") return m;
          const progress = [...(m.uploadProgress ?? [])];
          if (progress[index] === fraction) return m;
          progress[index] = fraction;
          changed = true;
          return { ...m, uploadProgress: progress };
        });
        return changed ? { ...t, messages } : t;
      });
    },
    [updateThread]
  );

  /** Uploads (what isn't uploaded yet) and sends one queued message. Offline: stays pending. */
  const flushMessage = useCallback(
    async (clientMessageId: string) => {
      const entry = outboxRef.current.get(clientMessageId);
      if (!entry || inFlightRef.current.has(clientMessageId) || !connectedRef.current) return;
      inFlightRef.current.add(clientMessageId);
      try {
        const attachments = entry.items.length
          ? await uploadFiles(entry.items, {
              onProgress: (index, fraction) => setUploadProgress(entry.roomId, clientMessageId, index, fraction),
            })
          : [];

        const payload = {
          roomId: entry.roomId,
          text: entry.text,
          type: entry.type,
          clientMessageId,
          ...(attachments.length ? { attachments } : {}),
          ...(entry.type === "voice" && entry.duration !== undefined ? { duration: entry.duration } : {}),
        };
        const ack = await emitWithAck<SendAck>("send-chat-message", payload, SEND_TIMEOUT_MS);
        // Refused for an expired token: stays pending and is sent again after the socket reconnects.
        if (!ack?.ok && ack?.error?.code === "UNAUTHENTICATED") return;
        if (!ack?.ok) throw new Error(ack?.error?.message || "Message not sent");

        mergeInto(entry.roomId, [normalizeMessage(ack.message, entry.roomId)]);
        outboxRef.current.delete(clientMessageId);
        revokePreviews(entry);
      } catch (err) {
        failSend(entry.roomId, clientMessageId, err);
      } finally {
        inFlightRef.current.delete(clientMessageId);
      }
    },
    [emitWithAck, mergeInto, failSend, uploadFiles, setUploadProgress]
  );

  const sendMessage = useCallback(
    (input: SendMessageInput): string | null => {
      const roomId = input.roomId ?? currentRoomIdRef.current;
      const text = (input.text ?? "").trim();
      const files = input.voice ? [input.voice.file] : input.files ?? [];
      if (!roomId || (!text && files.length === 0)) return null;
      if (text.length > MAX_TEXT_LENGTH) {
        toast.error("Messages can be up to 5,000 characters.");
        return null;
      }
      if (files.length > MAX_FILES_PER_MESSAGE) {
        toast.error(`You can attach up to ${MAX_FILES_PER_MESSAGE} files`);
        return null;
      }
      const invalid = input.voice ? null : files.map(validateFile).find(Boolean);
      if (invalid) {
        toast.error(invalid);
        return null;
      }

      const clientMessageId = createClientMessageId();
      const kinds: AttachmentKind[] = files.map((file) => (input.voice ? "audio" : fileKind(file)));
      const type = messageTypeFor(kinds, Boolean(input.voice));
      const duration = input.voice?.duration;
      const previewUrls: string[] = [];

      // The pending bubble shows local previews until the stored message replaces it.
      const attachments: ChatAttachment[] = files.map((file, i) => {
        const kind = kinds[i];
        let url = "";
        if (kind === "image" || kind === "video" || kind === "audio") {
          url = URL.createObjectURL(file);
          previewUrls.push(url);
        }
        return {
          url,
          type: kind,
          name: file.name,
          mimeType: file.type,
          size: file.size,
          ...(kind === "audio" && duration !== undefined ? { duration } : {}),
        };
      });

      outboxRef.current.set(clientMessageId, {
        roomId,
        text,
        type,
        items: files.map((file, i) => ({ file, kind: input.voice ? "audio" : kinds[i], duration })),
        duration,
        previewUrls,
      });
      mergeInto(roomId, [
        {
          ...buildPendingMessage({
            clientMessageId,
            roomId,
            senderId: currentUserIdRef.current,
            senderName: currentUserName,
            senderAvatar: user?.userAvatar,
            text,
            type,
            attachments,
            duration,
          }),
          uploadProgress: files.length ? files.map(() => 0) : undefined,
        },
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
      revokePreviews(entry);
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
      logger.error('chat', "Error loading more messages:", err);
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
      } catch (err: unknown) {
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
      } catch (err: unknown) {
        logger.error('chat', "Error adding participants:", err);
        toast.error(errorMessage(err, "Failed to add participants"));
        throw err; // Re-throw so the modal can handle it
      }
    },
    [isAuthenticated, accessToken, setChatRooms]
  );

  /**
   * Remove a member from a group. Removing myself is leaving.
   */
  const removeParticipant = useCallback(
    async (roomId: string, userId: string): Promise<boolean> => {
      if (!isAuthenticated || !accessToken) {
        toast.error("You must be logged in to remove participants");
        return false;
      }
      const leaving = userId === currentUserIdRef.current;
      const roomName = chatRoomsRef.current.find((r) => r._id === roomId)?.name || "the group";
      try {
        await chatService.removeParticipant(roomId, userId);
        if (leaving) {
          dropRoom(roomId);
          toast.success(`You left ${roomName}`);
        } else {
          // participants-changed brings the fresh member list; don't wait for it.
          setChatRooms((prev) =>
            prev.map((r) =>
              r._id === roomId ? { ...r, participants: r.participants.filter((p) => p.userId !== userId) } : r
            )
          );
          toast.success("Member removed");
        }
        return true;
      } catch (err) {
        toast.error(errorMessage(err, leaving ? "Couldn't leave the group" : "Couldn't remove this member"));
        return false;
      }
    },
    [isAuthenticated, accessToken, setChatRooms, dropRoom]
  );

  const leaveRoom = useCallback(
    (roomId: string) => removeParticipant(roomId, currentUserIdRef.current),
    [removeParticipant]
  );

  const updateRoomDetails = useCallback(
    async (roomId: string, patch: { name?: string; description?: string | null; avatarUrl?: string | null }) => {
      const room = await chatService.updateRoomDetails(roomId, patch);
      if (room?._id) setChatRooms((prev) => upsertRoom(prev, room));
      return room;
    },
    [setChatRooms]
  );

  /**
   * Search chat rooms
   */
  const searchChatRooms = useCallback(
    async (params: { searchTerm?: string; type?: ChatRoomType }): Promise<ChatRoom[]> => {
      if (!isAuthenticated || !accessToken) return [];
      try {
        return await chatService.searchChatRooms(params);
      } catch (err: unknown) {
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
      for (const entry of outbox.values()) revokePreviews(entry);
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
    const unsubJoined = subscribe("chat-room-joined", (payload: unknown) => {
      const data = asRecord(payload);
      const roomId = idOf(data.roomId);
      if (!roomId || roomId !== currentRoomIdRef.current) return;
      const messages = (Array.isArray(data.messages) ? data.messages : []).map((m: unknown) =>
        normalizeMessage(m, roomId)
      );
      updateThread(roomId, (t) => ({
        messages: mergeMessages(t.messages, messages),
        hasMore: t.loaded ? t.hasMore : Boolean(data.hasMore),
        nextCursor: t.loaded ? t.nextCursor : (data.nextCursor as string | undefined),
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

    // Another member read up to a message (they share read receipts).
    const unsubMessagesRead = subscribe("messages-read", (data: ReadEvent) => {
      const roomId = idOf(data?.roomId);
      if (!roomId || !threadsRef.current[roomId]) return;
      updateThread(roomId, (t) => {
        const messages = applyMessagesRead(t.messages, data);
        return messages === t.messages ? t : { ...t, messages };
      });
    });

    // I read a room on another device.
    const unsubRoomRead = subscribe("room-read", (data: ReadEvent) => {
      const roomId = idOf(data?.roomId);
      if (roomId) setChatRooms((prev) => clearRoomUnread(prev, roomId));
    });

    // A group's name / description / picture changed.
    const unsubRoomUpdated = subscribe("room-updated", (data: RoomUpdatedEvent) => {
      setChatRooms((prev) => applyRoomUpdated(prev, data));
    });

    // Members were added or removed; I may be one of them.
    const unsubParticipants = subscribe("participants-changed", (data: ParticipantsChangedEvent) => {
      const roomId = idOf(data?.roomId);
      if (!roomId) return;
      const result = applyParticipantsChanged(chatRoomsRef.current, data, currentUserIdRef.current);
      if (result.removedMe) {
        // Leaving from this device already dropped the room.
        if (!result.known) return;
        dropRoom(roomId);
        if (idOf(data.by) !== currentUserIdRef.current) {
          toast.error(`You were removed from ${result.room?.name || "a group"}`);
        }
        return;
      }
      if (!result.known) {
        if ((data.added ?? []).map(idOf).includes(currentUserIdRef.current)) scheduleRoomsRefetch();
        return;
      }
      setChatRooms((prev) => applyParticipantsChanged(prev, data, currentUserIdRef.current).rooms);
    });

    const unsubError = subscribe("error", (payload: unknown) => {
      const data = asRecord(payload);
      if (data.code === "UNAUTHENTICATED") return; // handled by the socket's token refresh
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
      unsubMessagesRead();
      unsubRoomRead();
      unsubRoomUpdated();
      unsubParticipants();
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
    dropRoom,
  ]);

  const messages = useMemo(
    () => (currentRoomId ? threads[currentRoomId]?.messages ?? [] : []),
    [threads, currentRoomId]
  );

  // Mark the room read up to the newest message from someone else — once per
  // position, and only while the page is visible and focused.
  useEffect(() => {
    const roomId = currentRoomId;
    if (!roomId || !isConnected || !currentUserId) return;

    const markRead = () => {
      if (!isViewing() || currentRoomIdRef.current !== roomId) return;
      setChatRooms((prev) => clearRoomUnread(prev, roomId));
      const previous = readMarkersRef.current.get(roomId);
      const marker = nextReadMarker(threadsRef.current[roomId]?.messages ?? [], currentUserId, previous);
      if (!marker) return;
      readMarkersRef.current.set(roomId, marker);
      emitWithAck<ChatAck>("mark-room-read", { roomId, upToMessageId: marker.messageId }, READ_TIMEOUT_MS)
        .then((ack) => {
          if (!ack?.ok) throw new Error(ack?.error?.message);
        })
        .catch(() => {
          // Not acknowledged: allow this position to be sent again next time.
          if (readMarkersRef.current.get(roomId) !== marker) return;
          if (previous) readMarkersRef.current.set(roomId, previous);
          else readMarkersRef.current.delete(roomId);
        });
    };

    markRead();
    document.addEventListener("visibilitychange", markRead);
    window.addEventListener("focus", markRead);
    return () => {
      document.removeEventListener("visibilitychange", markRead);
      window.removeEventListener("focus", markRead);
    };
  }, [currentRoomId, messages, isConnected, currentUserId, emitWithAck, setChatRooms]);

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
    leaveRoom,
    updateRoomDetails,
    removedRoom,

    resetCurrentRoom,
    clearRoomsError,
  };
};
