import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "react-toastify";

// WebSocket connection configuration
const WEBSOCKET_URL =
  process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:5005";

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

  // Debug state changes
  useEffect(() => {
    console.log("🔍 WebSocket state changed:", {
      isConnected,
      connectionStatus,
    });
  }, [isConnected, connectionStatus]);

  // Connect to WebSocket with debouncing
  const connect = useCallback(
    (userId: string) => {
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
          env: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
        });

        setConnectionStatus("connecting");
        userIdRef.current = userId;

        try {
          const socket = io(WEBSOCKET_URL, {
            query: { userId },
            transports: ["websocket", "polling"],
            timeout: 20000,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
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

            // Clear any pending reconnection attempts
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
          });

          // Connection failed
          socket.on("connect_error", (error) => {
            console.error("🔌 WebSocket connection error:", error);
            setIsConnected(false);
            setConnectionStatus("error");
            toast.error("Failed to connect to real-time services");
          });

          // Disconnection
          socket.on("disconnect", (reason) => {
            console.log("🔌 WebSocket disconnected:", reason);
            setIsConnected(false);
            setConnectionStatus("disconnected");

            // Don't show toast for intentional disconnections
            if (reason !== "io client disconnect") {
              toast.error("Connection lost");

              // Attempt to reconnect after a delay
              if (userIdRef.current && reason !== "io server disconnect") {
                reconnectTimeoutRef.current = setTimeout(() => {
                  console.log("🔄 Attempting to reconnect...");
                  reconnect();
                }, 3000);
              }
            }
          });

          // Error handling
          socket.on("error", (error) => {
            console.error("🔌 WebSocket error:", error);
            toast.error("WebSocket error occurred");
          });

          // Reconnection events
          socket.on("reconnect", (attemptNumber) => {
            console.log(
              `🔄 WebSocket reconnected after ${attemptNumber} attempts`
            );
            toast.success("Reconnected to real-time services");
          });

          socket.on("reconnect_error", (error) => {
            console.error("🔄 WebSocket reconnection failed:", error);
          });

          socket.on("reconnect_failed", () => {
            console.error(
              "🔄 WebSocket reconnection failed after max attempts"
            );
            toast.error("Unable to reconnect. Please refresh the page.");
            setConnectionStatus("error");
          });

          socketRef.current = socket;
        } catch (error) {
          console.error("Failed to create WebSocket connection:", error);
          setConnectionStatus("error");
          toast.error("Failed to initialize WebSocket connection");
        }
      }, 300); // 300ms debounce
    },
    [connectionStatus]
  ); // Add connectionStatus as dependency

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

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus("disconnected");
    userIdRef.current = null;
    console.log("🔌 WebSocket manually disconnected");
  }, []);

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
