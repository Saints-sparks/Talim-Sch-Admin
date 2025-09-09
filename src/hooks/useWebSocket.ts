import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "react-toastify";
import { API_BASE_URL } from "@/app/lib/api/config";

// WebSocket connection configuration
const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || API_BASE_URL;

// Event types that match the backend gateway
export interface ChatMessage {
  _id: string;
  senderId: string;
  content: string;
  roomId: string;
  senderName: string;
  type: "text" | "voice";
  duration?: number;
  timestamp: Date;
  readBy: string[];
}

export interface NotificationData {
  _id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, any>;
  sender?: {
    id: string;
    name: string;
  };
  createdAt: Date;
  read: boolean;
}

export interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";

  // Chat functions
  joinChatRoom: (roomId: string) => void;
  leaveChatRoom: (roomId: string) => void;
  sendChatMessage: (
    message: Omit<ChatMessage, "_id" | "senderId" | "timestamp" | "readBy">
  ) => void;
  markMessageAsRead: (messageId: string) => void;

  // Event listeners
  onChatMessage: (callback: (message: ChatMessage) => void) => () => void;
  onNotification: (
    callback: (notification: NotificationData) => void
  ) => () => void;
  onChatRoomHistory: (
    callback: (data: { roomId: string; messages: ChatMessage[] }) => void
  ) => () => void;

  // Connection management
  connect: (userId: string) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export const useWebSocket = (): WebSocketContextType => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userIdRef = useRef<string | null>(null);
  const connectionAttemptRef = useRef<NodeJS.Timeout | null>(null);

  // Retry logic state
  const retryCountRef = useRef<number>(0);
  const lastRetryTimeRef = useRef<number>(0);
  const isInCooldownRef = useRef<boolean>(false);
  const cooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const MAX_RETRY_ATTEMPTS = 3;
  const COOLDOWN_DURATION = 60000; // 1 minute in milliseconds

  // Check if we're in cooldown period
  const isInCooldown = useCallback(() => {
    const now = Date.now();
    return (
      isInCooldownRef.current ||
      now - lastRetryTimeRef.current < COOLDOWN_DURATION
    );
  }, []);

  // Reset retry count and cooldown
  const resetRetryLogic = useCallback(() => {
    retryCountRef.current = 0;
    isInCooldownRef.current = false;
    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current);
      cooldownTimeoutRef.current = null;
    }
  }, []);

  // Start cooldown period
  const startCooldown = useCallback(() => {
    isInCooldownRef.current = true;
    lastRetryTimeRef.current = Date.now();

    console.log(
      `🚫 WebSocket connection failed ${MAX_RETRY_ATTEMPTS} times. Entering cooldown for 1 minute.`
    );
    toast.error("Connection failed multiple times. Will retry in 1 minute.");

    cooldownTimeoutRef.current = setTimeout(() => {
      console.log(
        "✅ WebSocket cooldown period ended. Retries are now allowed."
      );
      resetRetryLogic();
    }, COOLDOWN_DURATION);
  }, []);

  // Check if we can attempt connection
  const canAttemptConnection = useCallback(() => {
    if (isInCooldown()) {
      const remainingTime = Math.ceil(
        (COOLDOWN_DURATION - (Date.now() - lastRetryTimeRef.current)) / 1000
      );
      console.log(
        `🚫 WebSocket in cooldown. ${remainingTime} seconds remaining.`
      );
      return false;
    }
    return retryCountRef.current < MAX_RETRY_ATTEMPTS;
  }, [isInCooldown]);

  // Debug state changes
  useEffect(() => {
    console.log("🔍 WebSocket state changed:", {
      isConnected,
      connectionStatus,
    });
  }, [isConnected, connectionStatus]);

  // Connect to WebSocket with debouncing and retry logic
  const connect = useCallback(
    (userId: string) => {
      // Check if we can attempt connection
      if (!canAttemptConnection()) {
        console.log(
          "🚫 Cannot attempt WebSocket connection: either in cooldown or max retries exceeded"
        );
        return;
      }

      // Clear any pending connection attempts
      if (connectionAttemptRef.current) {
        clearTimeout(connectionAttemptRef.current);
        connectionAttemptRef.current = null;
      }

      // Prevent connection if same user is already connecting or connected
      if (
        userIdRef.current === userId &&
        (socketRef.current?.connected || connectionStatus === "connecting")
      ) {
        console.log(
          "WebSocket already connected/connecting for this user, skipping connection attempt"
        );
        return;
      }

      // Prevent multiple connection attempts while connecting
      if (connectionStatus === "connecting") {
        console.log(
          "WebSocket connection in progress, skipping duplicate attempt"
        );
        return;
      }

      // Debounce connection attempts
      connectionAttemptRef.current = setTimeout(() => {
        // Disconnect existing connection if different user
        if (socketRef.current && userIdRef.current !== userId) {
          console.log(
            "Disconnecting existing WebSocket connection for different user"
          );
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        console.log("🔌 Attempting to connect to WebSocket...", {
          url: WEBSOCKET_URL,
          userId,
          attempt: retryCountRef.current + 1,
          maxAttempts: MAX_RETRY_ATTEMPTS,
          env: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
        });

        setConnectionStatus("connecting");
        userIdRef.current = userId;

        // Increment retry count
        retryCountRef.current += 1;

        try {
          const socket = io(WEBSOCKET_URL, {
            query: { userId },
            transports: ["websocket", "polling"],
            timeout: 20000,
            reconnection: false, // Disable automatic reconnection
            reconnectionDelay: 1000,
            reconnectionAttempts: 0, // Disable Socket.IO's retry mechanism
          });

          // Connection successful
          socket.on("connect", () => {
            console.log("🔌 WebSocket connected:", socket.id);
            console.log(
              "🔌 Setting state: isConnected=true, connectionStatus=connected"
            );
            setIsConnected(true);
            setConnectionStatus("connected");
            toast.success("Connected to real-time services");

            // Reset retry logic on successful connection
            resetRetryLogic();

            // Clear any pending reconnection attempts
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
          });

          // Connection failed
          socket.on("connect_error", (error) => {
            console.error(
              `🔌 WebSocket connection error (attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS}):`,
              error
            );
            setIsConnected(false);
            setConnectionStatus("error");

            // Check if we've exceeded max attempts
            if (retryCountRef.current >= MAX_RETRY_ATTEMPTS) {
              startCooldown();
              toast.error(
                "Failed to connect after multiple attempts. Will retry in 1 minute."
              );
            } else {
              toast.error(
                `Connection failed (attempt ${retryCountRef.current}/${MAX_RETRY_ATTEMPTS})`
              );
            }
          });

          // Disconnection
          socket.on("disconnect", (reason) => {
            console.log("🔌 WebSocket disconnected:", reason);
            setIsConnected(false);
            setConnectionStatus("disconnected");

            // Don't show toast for intentional disconnections
            if (reason !== "io client disconnect") {
              toast.error("Connection lost");

              // Attempt to reconnect after a delay only if we haven't exceeded max attempts
              if (
                userIdRef.current &&
                reason !== "io server disconnect" &&
                canAttemptConnection()
              ) {
                reconnectTimeoutRef.current = setTimeout(() => {
                  console.log("🔄 Attempting to reconnect...");
                  reconnect();
                }, 3000);
              } else if (retryCountRef.current >= MAX_RETRY_ATTEMPTS) {
                console.log(
                  "🚫 Max reconnection attempts reached, entering cooldown"
                );
                startCooldown();
              }
            }
          });

          // Error handling
          socket.on("error", (error) => {
            console.error("🔌 WebSocket error:", error);
            toast.error("WebSocket error occurred");
          });

          socketRef.current = socket;
        } catch (error) {
          console.error("Failed to create WebSocket connection:", error);
          setConnectionStatus("error");
          toast.error("Failed to initialize WebSocket connection");
        }
      }, 300); // 300ms debounce
    },
    [connectionStatus, canAttemptConnection, resetRetryLogic, startCooldown]
  ); // Add retry logic dependencies

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    // Clear any pending connection attempts
    if (connectionAttemptRef.current) {
      clearTimeout(connectionAttemptRef.current);
      connectionAttemptRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current);
      cooldownTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus("disconnected");
    userIdRef.current = null;

    // Reset retry logic when manually disconnecting
    resetRetryLogic();

    console.log("🔌 WebSocket manually disconnected");
  }, [resetRetryLogic]);

  // Reconnect to WebSocket
  const reconnect = useCallback(() => {
    if (userIdRef.current) {
      disconnect();
      setTimeout(() => {
        connect(userIdRef.current!);
      }, 1000);
    }
  }, [connect, disconnect]);

  // Chat functions
  const joinChatRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join-chat-room", { roomId });
      console.log(`📨 Joined chat room: ${roomId}`);
    } else {
      toast.error("Not connected to chat service");
    }
  }, []);

  const leaveChatRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave-chat-room", { roomId });
      console.log(`📨 Left chat room: ${roomId}`);
    }
  }, []);

  const sendChatMessage = useCallback(
    (
      message: Omit<ChatMessage, "_id" | "senderId" | "timestamp" | "readBy">
    ) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("send-chat-message", message);
        console.log(`📨 Sent message to room: ${message.roomId}`);
      } else {
        toast.error("Not connected to chat service");
      }
    },
    []
  );

  const markMessageAsRead = useCallback((messageId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("mark-message-read", { messageId });
    }
  }, []);

  // Event listeners
  const onChatMessage = useCallback(
    (callback: (message: ChatMessage) => void) => {
      if (!socketRef.current) return () => {};

      socketRef.current.on("chat-message", callback);
      return () => {
        socketRef.current?.off("chat-message", callback);
      };
    },
    []
  );

  const onNotification = useCallback(
    (callback: (notification: NotificationData) => void) => {
      if (!socketRef.current) return () => {};

      socketRef.current.on("notification", (notification: NotificationData) => {
        // Show toast notification using react-toastify
        toast.success(`${notification.title}: ${notification.body}`, {
          position: "top-right",
          autoClose: 4000,
        });

        callback(notification);
      });

      return () => {
        socketRef.current?.off("notification", callback);
      };
    },
    []
  );

  const onChatRoomHistory = useCallback(
    (callback: (data: { roomId: string; messages: ChatMessage[] }) => void) => {
      if (!socketRef.current) return () => {};

      socketRef.current.on("chat-room-history", callback);
      return () => {
        socketRef.current?.off("chat-room-history", callback);
      };
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all timeouts
      if (connectionAttemptRef.current) {
        clearTimeout(connectionAttemptRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    connectionStatus,

    // Chat functions
    joinChatRoom,
    leaveChatRoom,
    sendChatMessage,
    markMessageAsRead,

    // Event listeners
    onChatMessage,
    onNotification,
    onChatRoomHistory,

    // Connection management
    connect,
    disconnect,
    reconnect,
  };
};
