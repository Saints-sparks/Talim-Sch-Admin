"use client";

import React from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';

export const WebSocketStatus: React.FC = () => {
  const { connectionStatus, isConnected, reconnect } = useWebSocketContext();

  // Debug the WebSocket status component state

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return '🟢';
      case 'connecting':
        return '🟡';
      case 'disconnected':
        return '⚫';
      case 'error':
        return '🔴';
      default:
        return '⚫';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="flex items-center space-x-1 sm:space-x-2 text-xs">
      <span className="text-sm sm:text-lg">{getStatusIcon()}</span>
      <span className={`font-medium text-xs sm:text-sm ${
        isConnected ? 'text-green-700 dark:text-green-400' : 'text-gray-500'
      }`}>
        {/* Show full text on desktop, shortened on mobile */}
        <span className="hidden sm:inline">{getStatusText()}</span>
        <span className="sm:hidden">
          {connectionStatus === 'connected' ? 'Online' : 
           connectionStatus === 'connecting' ? 'Connecting' : 
           connectionStatus === 'error' ? 'Error' : 'Offline'}
        </span>
      </span>
      {connectionStatus === 'error' && (
        <button
          onClick={reconnect}
          className="text-blue-600 hover:text-blue-800 underline"
          title="Reconnect"
        >
          Retry
        </button>
      )}
    </div>
  );
};
