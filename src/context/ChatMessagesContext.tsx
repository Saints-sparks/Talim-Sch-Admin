import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useChatMessages, UseChatMessagesReturn } from '../hooks/useChatMessages';

export interface ChatMessagesContextType extends UseChatMessagesReturn {
  currentRoomId: string | null;
  setCurrentRoomId: (roomId: string | null) => void;
}

const ChatMessagesContext = createContext<ChatMessagesContextType | undefined>(undefined);

export const ChatMessagesProvider = ({ children }: { children: ReactNode }) => {
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const messagesHook = useChatMessages();

  useEffect(() => {
    if (currentRoomId) {
      messagesHook.fetchMessages(currentRoomId, { replaceExisting: true });
    } else {
      messagesHook.clearMessages();
    }
  }, [currentRoomId]);

  const value: ChatMessagesContextType = {
    ...messagesHook,
    currentRoomId,
    setCurrentRoomId
  };

  return (
    <ChatMessagesContext.Provider value={value}>
      {children}
    </ChatMessagesContext.Provider>
  );
};

export const useChatMessagesContext = () => {
  const context = useContext(ChatMessagesContext);
  if (context === undefined) {
    throw new Error('useChatMessagesContext must be used within a ChatMessagesProvider');
  }
  return context;
};
