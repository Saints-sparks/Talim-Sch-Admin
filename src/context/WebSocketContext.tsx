"use client";

import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useWebSocket, WebSocketContextType } from "../hooks/useWebSocket";
import { useAuth } from "./AuthContext";

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const { user, isAuthenticated, accessToken, isLoading: authLoading } = useAuth();
  const webSocket = useWebSocket();

  // Auto-connect when user is authenticated
  useEffect(() => {
    // Don't proceed if auth is still loading
    if (authLoading) return;

    const userId = user?.userId;


    if (
      isAuthenticated &&
      accessToken &&
      userId &&
      !webSocket.isConnected &&
      webSocket.connectionStatus !== "connecting"
    ) {
      webSocket.connect(userId);
    } else if (!isAuthenticated && webSocket.isConnected) {
      webSocket.disconnect();
    }
  }, [isAuthenticated, accessToken, user?.userId, webSocket, authLoading]);

  return (
    <WebSocketContext.Provider value={webSocket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider"
    );
  }
  return context;
};
