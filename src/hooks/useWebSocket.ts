import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { sessionStore } from "@/lib/session";
import { apiClient } from "@/lib/apiClient";
import { API_BASE_URL } from "@/app/lib/api/config";

// WebSocket connection configuration
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || API_BASE_URL;

/** Default time to wait for a server acknowledgement. */
export const ACK_TIMEOUT_MS = 10_000;

/** A reconnect that stays up this long counts as authenticated again. */
const AUTH_STABLE_MS = 5_000;

/** Every chat event's acknowledgement (see docs/chat-realtime-contract.md). */
export type ChatAck<T = Record<string, unknown>> =
  | ({ ok: true } & T)
  | {
      ok: false;
      error: { code: string; message: string };
      roomId?: string;
      messageId?: string;
      clientMessageId?: string;
    };

export interface NotificationData {
  _id: string;
  userId?: string;
  title: string;
  body?: string;
  message?: string;
  type: string;
  metadata?: Record<string, unknown>;
  data?: Record<string, unknown>;
  createdAt: Date | string;
  read?: boolean;
}

export interface MessagesUpdatePayload {
  roomId: string;
  messages: unknown[];
  hasMore: boolean;
  nextCursor?: string;
  prevCursor?: string;
  direction: "before" | "after";
  cursor?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler = (...args: any[]) => void;

export interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";

  /**
   * Subscribes to a server event. Subscriptions are kept by the provider, so
   * they work before the socket exists and survive reconnects and sign-in
   * changes.
   *
   * @returns An unsubscribe function.
   */
  subscribe: (event: string, handler: Handler) => () => void;
  /** Emits when connected. Returns false (and sends nothing) when offline. */
  emit: (event: string, payload?: unknown) => boolean;
  /**
   * Emits and resolves with the server's acknowledgement. Rejects on timeout
   * or when the socket isn't connected.
   */
  emitWithAck: <T = ChatAck>(event: string, payload: unknown, timeoutMs?: number) => Promise<T>;

  // Chat functions
  joinChatRoom: (roomId: string) => void;
  leaveChatRoom: (roomId: string) => void;

  // Event listeners
  onConnect: (callback: () => void) => () => void;
  onChatMessage: (callback: (message: unknown) => void) => () => void;
  onNotification: (callback: (notification: NotificationData) => void) => () => void;
  onChatRoomsUpdate: (callback: (data: { rooms: unknown[]; totalRooms: number }) => void) => () => void;
  onUnreadMessagesUpdate: (callback: (data: { userId: string; unreadCount: number }) => void) => () => void;
  onMessagesUpdate: (callback: (data: MessagesUpdatePayload) => void) => () => void;

  // Socket emitters for fetching data
  fetchChatRoomsViaSocket: () => void;
  fetchUnreadCountViaSocket: () => void;

  /** Reconnects now instead of waiting for the next automatic attempt. */
  reconnect: () => void;
}

interface UseWebSocketOptions {
  /** Connect only while true (signed in, auth finished loading). */
  enabled: boolean;
  userId: string | null | undefined;
  /** The app's token refresh. Resolves false when the session can't be renewed. */
  refreshToken: () => Promise<boolean>;
}

function isUnauthenticated(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const v = value as { code?: unknown; error?: { code?: unknown }; data?: { code?: unknown }; message?: unknown };
  return (
    v.code === "UNAUTHENTICATED" ||
    v.error?.code === "UNAUTHENTICATED" ||
    v.data?.code === "UNAUTHENTICATED" ||
    (typeof v.message === "string" && v.message.includes("UNAUTHENTICATED"))
  );
}

/**
 * The app's single Socket.IO connection. Socket.IO's own reconnection does
 * the retrying; the token is read on every attempt, and an UNAUTHENTICATED
 * rejection refreshes the token once before reconnecting.
 */
export const useWebSocket = ({ enabled, userId, refreshToken }: UseWebSocketOptions): WebSocketContextType => {
  const socketRef = useRef<Socket | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<WebSocketContextType["connectionStatus"]>("disconnected");

  const handlersRef = useRef(new Map<string, Set<Handler>>());
  const dispatchersRef = useRef(new Map<string, Handler>());
  const refreshRef = useRef(refreshToken);
  refreshRef.current = refreshToken;

  /** Attaches one dispatcher per event to the live socket. */
  const attach = useCallback((target: Socket, event: string) => {
    if (dispatchersRef.current.has(event)) return;
    const dispatcher: Handler = (...args) => {
      for (const handler of Array.from(handlersRef.current.get(event) ?? [])) {
        try {
          handler(...args);
        } catch (error) {
          console.error(`WebSocket "${event}" handler failed:`, error);
        }
      }
    };
    dispatchersRef.current.set(event, dispatcher);
    target.on(event, dispatcher);
  }, []);

  useEffect(() => {
    if (!enabled || !userId) return;

    // The server authenticates the socket with the access token. The callback runs
    // on every connect and reconnect, so a refreshed token is always used.
    const s = io(WEBSOCKET_URL, {
      auth: (cb) => cb({ token: apiClient.getAccessToken() ?? sessionStore.getToken() }),
      query: { userId },
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 10000,
    });

    let refreshing = false;
    let authRetried = false;
    let stableTimer: ReturnType<typeof setTimeout> | null = null;

    const onUnauthenticated = async () => {
      if (refreshing) return;
      if (authRetried) {
        // A fresh token was refused too: leave it to the app's sign-out flow.
        setConnectionStatus("error");
        return;
      }
      authRetried = true;
      refreshing = true;
      const refreshed = await refreshRef.current().catch(() => false);
      refreshing = false;
      if (socketRef.current !== s) return;
      if (!refreshed) {
        setConnectionStatus("error");
        return;
      }
      // The server disconnects after refusing; reconnect once it has.
      if (s.connected) s.once("disconnect", () => s.connect());
      else s.connect();
    };

    s.on("connect", () => {
      setIsConnected(true);
      setConnectionStatus("connected");
      if (stableTimer) clearTimeout(stableTimer);
      stableTimer = setTimeout(() => {
        authRetried = false;
      }, AUTH_STABLE_MS);
    });

    s.on("disconnect", (reason) => {
      if (stableTimer) clearTimeout(stableTimer);
      setIsConnected(false);
      // "io server disconnect" is not retried by Socket.IO; the auth handler reconnects.
      setConnectionStatus(s.active ? "connecting" : "disconnected");
      if (reason === "io server disconnect" && !refreshing && !authRetried) s.connect();
    });

    s.on("connect_error", (error) => {
      setIsConnected(false);
      setConnectionStatus(s.active ? "connecting" : "error");
      if (isUnauthenticated(error)) void onUnauthenticated();
    });

    s.on("exception", (payload: unknown) => {
      if (isUnauthenticated(payload)) void onUnauthenticated();
    });

    socketRef.current = s;
    dispatchersRef.current = new Map();
    for (const event of handlersRef.current.keys()) attach(s, event);
    setSocket(s);
    setConnectionStatus("connecting");

    return () => {
      if (stableTimer) clearTimeout(stableTimer);
      s.removeAllListeners();
      s.disconnect();
      if (socketRef.current === s) socketRef.current = null;
      dispatchersRef.current = new Map();
      setSocket(null);
      setIsConnected(false);
      setConnectionStatus("disconnected");
    };
  }, [enabled, userId, attach]);

  const subscribe = useCallback(
    (event: string, handler: Handler) => {
      let handlers = handlersRef.current.get(event);
      if (!handlers) {
        handlers = new Set();
        handlersRef.current.set(event, handlers);
      }
      handlers.add(handler);
      if (socketRef.current) attach(socketRef.current, event);
      return () => {
        handlersRef.current.get(event)?.delete(handler);
      };
    },
    [attach]
  );

  const emit = useCallback((event: string, payload?: unknown) => {
    const s = socketRef.current;
    if (!s?.connected) return false;
    if (payload === undefined) s.emit(event);
    else s.emit(event, payload);
    return true;
  }, []);

  const emitWithAck = useCallback(<T = ChatAck>(event: string, payload: unknown, timeoutMs = ACK_TIMEOUT_MS) => {
    return new Promise<T>((resolve, reject) => {
      const s = socketRef.current;
      if (!s?.connected) {
        reject(new Error("Not connected"));
        return;
      }
      s.timeout(timeoutMs).emit(event, payload, (error: Error | null, ack: T) => {
        if (error) reject(error);
        else resolve(ack);
      });
    });
  }, []);

  // Chat functions
  const joinChatRoom = useCallback((roomId: string) => void emit("join-chat-room", { roomId }), [emit]);
  const leaveChatRoom = useCallback((roomId: string) => void emit("leave-chat-room", { roomId }), [emit]);

  // Event listeners
  const onConnect = useCallback((callback: () => void) => subscribe("connect", callback), [subscribe]);
  const onChatMessage = useCallback((callback: (message: unknown) => void) => subscribe("chat-message", callback), [subscribe]);
  const onNotification = useCallback(
    (callback: (notification: NotificationData) => void) => subscribe("notification", callback),
    [subscribe]
  );
  const onChatRoomsUpdate = useCallback(
    (callback: (data: { rooms: unknown[]; totalRooms: number }) => void) => subscribe("chat-rooms-update", callback),
    [subscribe]
  );
  const onUnreadMessagesUpdate = useCallback(
    (callback: (data: { userId: string; unreadCount: number }) => void) => subscribe("unread-messages-update", callback),
    [subscribe]
  );
  const onMessagesUpdate = useCallback(
    (callback: (data: MessagesUpdatePayload) => void) => subscribe("messages-update", callback),
    [subscribe]
  );

  const fetchChatRoomsViaSocket = useCallback(() => void emit("fetch-chat-rooms", {}), [emit]);
  const fetchUnreadCountViaSocket = useCallback(() => void emit("fetch-unread-count", {}), [emit]);

  const reconnect = useCallback(() => {
    const s = socketRef.current;
    if (s && !s.connected) s.connect();
  }, []);

  return {
    socket,
    isConnected,
    connectionStatus,
    subscribe,
    emit,
    emitWithAck,
    joinChatRoom,
    leaveChatRoom,
    onConnect,
    onChatMessage,
    onNotification,
    onChatRoomsUpdate,
    onUnreadMessagesUpdate,
    onMessagesUpdate,
    fetchChatRoomsViaSocket,
    fetchUnreadCountViaSocket,
    reconnect,
  };
};
