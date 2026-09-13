"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { UseChatsReturn } from "@/hooks/useChats";

const ChatsContext = createContext<UseChatsReturn | null>(null);

/**
 * Shares the messages page's single `useChats()` instance with everything
 * under it (sidebar, threads, group modals), so only one instance fetches
 * and listens to the socket.
 */
export function ChatsProvider({ value, children }: { value: UseChatsReturn; children: ReactNode }) {
  return <ChatsContext.Provider value={value}>{children}</ChatsContext.Provider>;
}

export function useChatsContext(): UseChatsReturn {
  const context = useContext(ChatsContext);
  if (!context) {
    throw new Error("useChatsContext must be used within a ChatsProvider");
  }
  return context;
}
