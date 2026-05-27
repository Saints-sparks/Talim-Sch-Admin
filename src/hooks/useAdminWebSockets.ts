// app/hooks/admin/useAdminWebSocket.ts
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "@/components/CustomToast";
import { API_BASE_URL } from "@/app/lib/api/config";

// WebSocket connection configuration
const WEBSOCKET_URL = API_BASE_URL;

// Event types that match the backend gateway
export interface ChatMessage {
  _id: string;
  senderId: string;
  content: string;
  roomId: string;
  senderName: string;
  senderRole?: string; // Added for admin to know who sent
  schoolId?: string; // Added for school filtering
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
    role?: string;
    schoolId?: string;
  };
  createdAt: Date;
  read: boolean;
}

export interface ChatRoomData {
  roomId: string;
  name: string;
  displayName: string;
  type: string;
  schoolId?: string; // For admin filtering
  schoolName?: string; // Display school name
  participants: Array<{
    _id: string;
    userId: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    role?: string;
    schoolId?: string;
    userAvatar?: string | null;
    isActive?: boolean;
    isOnline: boolean;
  }>;
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    senderRole?: string;
    timestamp: Date;
    type: string;
  };
  unreadCount: number;
  updatedAt: Date;
  classId?: string;
  courseId?: string;
  metadata?: Record<string, any>; // For additional admin data
}

export interface ChatRoomsUpdateData {
  rooms: ChatRoomData[];
  totalRooms: number;
  schoolStats?: {
    schoolId: string;
    schoolName: string;
    roomCount: number;
    unreadCount: number;
  }[];
}

export interface ChatRoomJoinedData {
  roomId: string;
  roomName: string;
  roomType: string;
  schoolId?: string;
  schoolName?: string;
  participants: Array<{
    _id: string;
    userId: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    role?: string;
    schoolId?: string;
    userAvatar?: string | null;
    isActive?: boolean;
    isOnline: boolean;
  }>;
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor?: string;
  totalParticipants: number;
}

export interface FetchMessagesData {
  roomId: string;
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor?: string;
  direction: "before" | "after";
}

export interface SchoolStatsData {
  schoolId: string;
  schoolName: string;
  totalRooms: number;
  unreadCount: number;
  activeUsers: number;
  onlineTeachers: number;
  onlineStudents: number;
}

export interface AdminWebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: "disconnected" | "connecting" | "connected" | "error";

  // Chat functions (similar to teacher)
  joinChatRoom: (roomId: string) => void;
  leaveChatRoom: (roomId: string) => void;
  sendChatMessage: (
    message: Omit<ChatMessage, "_id" | "senderId" | "timestamp" | "readBy">
  ) => void;
  markMessageAsRead: (messageId: string) => void;
  fetchChatRooms: () => void;
  fetchMessages: (data: {
    roomId: string;
    cursor?: string;
    direction?: "before" | "after";
    limit?: number;
  }) => void;

  // Admin specific functions
  fetchSchoolStats: () => void; // Get statistics by school
  fetchRoomsBySchool: (schoolId: string) => void; // Get rooms for specific school
  broadcastNotification: (data: {
    title: string;
    body: string;
    type: string;
    targetSchools?: string[]; // Optional: send to specific schools
    targetRoles?: string[]; // Optional: send to specific roles
    data?: Record<string, any>;
  }) => void;

  // Event listeners
  onChatMessage: (callback: (message: ChatMessage) => void) => () => void;
  onNotification: (
    callback: (notification: NotificationData) => void
  ) => () => void;
  onChatRoomHistory: (
    callback: (data: { roomId: string; messages: any[] }) => void
  ) => () => void;
  onChatRoomsUpdate: (
    callback: (data: ChatRoomsUpdateData) => void
  ) => () => void;
  onChatRoomJoined: (
    callback: (data: ChatRoomJoinedData) => void
  ) => () => void;
  onMessagesUpdate: (callback: (data: FetchMessagesData) => void) => () => void;
  
  // Admin specific listeners
  onSchoolStatsUpdate: (
    callback: (data: SchoolStatsData[]) => void
  ) => () => void;

  // Connection management
  connect: (userId: string, schoolId?: string) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export const useAdminWebSocket = (): AdminWebSocketContextType => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userIdRef = useRef<string | null>(null);
  const schoolIdRef = useRef<string | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const fetchCooldownMs = 2000; // 2 seconds cooldown between fetches
  const isFetchingRef = useRef<boolean>(false);
  const lastDisconnectToastAtRef = useRef<number>(0);
  const disconnectToastCooldownMs = 10000;

  // Connect to WebSocket
  const connect = useCallback((userId: string, schoolId?: string) => {
    // Prevent multiple connections
    if (socketRef.current?.connected) {
      return;
    }

    // Prevent multiple connection attempts while connecting
    if (connectionStatus === "connecting") {
      return;
    }

    setConnectionStatus("connecting");
    userIdRef.current = userId;
    schoolIdRef.current = schoolId || null;

    try {
      const socket = io(WEBSOCKET_URL, {
        query: { 
          userId, 
          role: 'admin',
          schoolId: schoolId || '' 
        },
        transports: ["websocket", "polling"],
        timeout: 20000,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
      });

      // Connection successful
      socket.on("connect", () => {
        setIsConnected(true);
        setConnectionStatus("connected");

        // Clear any pending reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // Join admin room for broadcasts
        socket.emit("join-admin-room", { 
          userId, 
          schoolId: schoolId || null 
        });
      });

      // Connection failed
      socket.on("connect_error", (error) => {
        console.error("Connection error:", error);
        setIsConnected(false);
        setConnectionStatus("error");
        toast.error("Failed to connect to real-time services");
      });

      // Disconnection
      socket.on("disconnect", (reason) => {
        setIsConnected(false);
        setConnectionStatus("disconnected");

        // Don't show toast for intentional disconnections
        if (reason !== "io client disconnect") {
          const now = Date.now();
          if (now - lastDisconnectToastAtRef.current > disconnectToastCooldownMs) {
            toast.error("Connection lost");
            lastDisconnectToastAtRef.current = now;
          }

          // Attempt to reconnect after a delay
          if (userIdRef.current && reason !== "io server disconnect") {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnect();
            }, 3000);
          }
        }
      });

      // Error handling
      socket.on("error", (error) => {
        console.error("WebSocket error:", error);
        toast.error("WebSocket error occurred");
      });

      // Reconnection events
      socket.on("reconnect", (attemptNumber) => {
        // Silent success: avoid noisy "connected" toasts

        // Re-join admin room after reconnection
        if (userIdRef.current) {
          socket.emit("join-admin-room", { 
            userId: userIdRef.current, 
            schoolId: schoolIdRef.current 
          });
        }
      });

      socket.on("reconnect_error", (error) => {
        console.error("Reconnection error:", error);
      });

      socket.on("reconnect_failed", () => {
        toast.error("Unable to reconnect. Please refresh the page.");
        setConnectionStatus("error");
      });

      socketRef.current = socket;
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
      setConnectionStatus("error");
      toast.error("Failed to initialize WebSocket connection");
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
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
    schoolIdRef.current = null;
  }, []);

  // Reconnect to WebSocket
  const reconnect = useCallback(() => {
    if (userIdRef.current) {
      disconnect();
      setTimeout(() => {
        connect(userIdRef.current!, schoolIdRef.current || undefined);
      }, 1000);
    }
  }, [connect, disconnect]);

  // Chat functions
  const joinChatRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join-chat-room", { roomId });
    } else {
      toast.error("Not connected to chat service");
    }
  }, []);

  const leaveChatRoom = useCallback((roomId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave-chat-room", { roomId });
    }
  }, []);

  const sendChatMessage = useCallback(
    (
      message: Omit<ChatMessage, "_id" | "senderId" | "timestamp" | "readBy">
    ) => {
      if (socketRef.current?.connected) {
        // Add admin context to message
        socketRef.current.emit("send-chat-message", {
          ...message,
          senderRole: 'admin',
          schoolId: schoolIdRef.current
        });
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

  const fetchChatRooms = useCallback(() => {
    if (!socketRef.current?.connected) {
      toast.error("Not connected to chat service");
      return;
    }

    const now = Date.now();

    // Prevent duplicate requests if already fetching
    if (isFetchingRef.current) {
      return;
    }

    // Rate limiting: prevent requests too close together
    if (now - lastFetchTimeRef.current < fetchCooldownMs) {
      return;
    }

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    // Include school filter if admin has specific school
    socketRef.current.emit("fetch-chat-rooms", {
      schoolId: schoolIdRef.current
    });

    // Reset fetching flag after a short delay
    setTimeout(() => {
      isFetchingRef.current = false;
    }, 1000);
  }, []);

  const fetchMessages = useCallback(
    (data: {
      roomId: string;
      cursor?: string;
      direction?: "before" | "after";
      limit?: number;
    }) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("fetch-messages", data);
      } else {
        toast.error("Not connected to chat service");
      }
    },
    []
  );

  // Admin specific functions
  const fetchSchoolStats = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("fetch-school-stats");
    }
  }, []);

  const fetchRoomsBySchool = useCallback((schoolId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("fetch-rooms-by-school", { schoolId });
    }
  }, []);

  const broadcastNotification = useCallback(
    (data: {
      title: string;
      body: string;
      type: string;
      targetSchools?: string[];
      targetRoles?: string[];
      data?: Record<string, any>;
    }) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("broadcast-notification", {
          ...data,
          senderId: userIdRef.current,
          senderRole: 'admin'
        });
        toast.success("Notification sent successfully");
      } else {
        toast.error("Not connected to real-time service");
      }
    },
    []
  );

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
        // Show toast notification for admin
        toast.success(`${notification.title}: ${notification.body}`);

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

  const onChatRoomsUpdate = useCallback(
    (callback: (data: ChatRoomsUpdateData) => void) => {
      if (!socketRef.current) return () => {};

      socketRef.current.on("chat-rooms-update", (data: ChatRoomsUpdateData) => {
        // Reset fetching flag when we receive chat rooms
        isFetchingRef.current = false;
        callback(data);
      });

      return () => {
        socketRef.current?.off("chat-rooms-update", callback);
      };
    },
    []
  );

  const onChatRoomJoined = useCallback(
    (callback: (data: ChatRoomJoinedData) => void) => {
      if (!socketRef.current) return () => {};

      socketRef.current.on("chat-room-joined", (data: ChatRoomJoinedData) => {
        callback(data);
      });

      return () => {
        socketRef.current?.off("chat-room-joined", callback);
      };
    },
    []
  );

  const onMessagesUpdate = useCallback(
    (callback: (data: FetchMessagesData) => void) => {
      if (!socketRef.current) return () => {};

      socketRef.current.on("messages-fetched", (data: FetchMessagesData) => {
        callback(data);
      });

      return () => {
        socketRef.current?.off("messages-fetched", callback);
      };
    },
    []
  );

  // Admin specific listeners
  const onSchoolStatsUpdate = useCallback(
    (callback: (data: SchoolStatsData[]) => void) => {
      if (!socketRef.current) return () => {};

      socketRef.current.on("school-stats-update", callback);
      return () => {
        socketRef.current?.off("school-stats-update", callback);
      };
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
    fetchChatRooms,
    fetchMessages,

    // Admin specific functions
    fetchSchoolStats,
    fetchRoomsBySchool,
    broadcastNotification,

    // Event listeners
    onChatMessage,
    onNotification,
    onChatRoomHistory,
    onChatRoomsUpdate,
    onChatRoomJoined,
    onMessagesUpdate,
    
    // Admin specific listeners
    onSchoolStatsUpdate,

    // Connection management
    connect,
    disconnect,
    reconnect,
  };
};
