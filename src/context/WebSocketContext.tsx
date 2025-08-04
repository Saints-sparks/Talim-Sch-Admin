"use client";

import React, { createContext, useContext, useEffect, ReactNode, useState, useCallback } from 'react';
import { useWebSocket, WebSocketContextType } from '../hooks/useWebSocket';

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const webSocket = useWebSocket();

  // Stable state management for authentication
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Stable auth check function
  const checkAuthStatus = useCallback(() => {
    try {
      const userData = localStorage.getItem('user');
      const accessToken = localStorage.getItem('accessToken');
      
      if (userData && accessToken) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log('🔍 User authenticated from localStorage:', parsedUser);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        console.log('🔍 No authentication found in localStorage');
      }
    } catch (error) {
      console.error('Failed to parse user data:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsAuthChecked(true);
    }
  }, []);

  // Check auth status only once on mount and when storage changes
  useEffect(() => {
    checkAuthStatus();

    // Listen for storage changes (when user logs in/out in another tab or from login process)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'accessToken') {
        console.log('🔍 Storage changed, rechecking auth status');
        // Small delay to ensure localStorage is fully updated
        setTimeout(checkAuthStatus, 100);
      }
    };

    // Listen for custom auth events from login process
    const handleAuthEvent = (e: CustomEvent) => {
      console.log('🔍 Auth event received, rechecking auth status');
      setTimeout(checkAuthStatus, 100);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-changed', handleAuthEvent as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-changed', handleAuthEvent as EventListener);
    };
  }, [checkAuthStatus]);

  // Add debugging for auth state (only when auth is checked)
  useEffect(() => {
    if (isAuthChecked) {
      console.log('🔍 WebSocketProvider state:', { 
        isAuthenticated, 
        userId: user?.userId || user?.id,
        isConnected: webSocket.isConnected,
        connectionStatus: webSocket.connectionStatus,
        userObject: user
      });
    }
  }, [isAuthenticated, user, webSocket.isConnected, webSocket.connectionStatus, isAuthChecked]);

  // Auto-connect when user is authenticated (only after auth check is complete)
  useEffect(() => {
    if (!isAuthChecked) return; // Wait for auth check to complete

    const userId = user?.userId || user?.id;
    
    console.log('🔍 WebSocket connection effect triggered:', { 
      isAuthenticated, 
      userId, 
      isConnected: webSocket.isConnected,
      connectionStatus: webSocket.connectionStatus
    });
    
    if (isAuthenticated && userId && !webSocket.isConnected && webSocket.connectionStatus !== 'connecting') {
      console.log('🔌 Auto-connecting WebSocket for user:', userId);
      webSocket.connect(userId);
    } else if (!isAuthenticated && webSocket.isConnected) {
      console.log('🔌 Auto-disconnecting WebSocket - user not authenticated');
      webSocket.disconnect();
    }
  }, [isAuthenticated, user?.userId, user?.id, webSocket, isAuthChecked]);

  return (
    <WebSocketContext.Provider value={webSocket}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};
