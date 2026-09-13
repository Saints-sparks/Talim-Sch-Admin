"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useWebSocket, WebSocketContextType } from "../hooks/useWebSocket";
import { useAuth } from "./AuthContext";

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

/**
 * Owns the app's one socket: connected while signed in, closed on sign-out.
 * Reconnection is left to Socket.IO.
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading: authLoading, refreshToken } = useAuth();
  const webSocket = useWebSocket({
    enabled: !authLoading && isAuthenticated,
    userId: user?.userId,
    refreshToken,
  });

  return <WebSocketContext.Provider value={webSocket}>{children}</WebSocketContext.Provider>;
};

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider");
  }
  return context;
};
