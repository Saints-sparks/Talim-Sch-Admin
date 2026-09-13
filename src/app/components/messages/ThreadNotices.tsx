"use client";

import { AlertCircle, WifiOff } from "lucide-react";
import type { ThreadStatus } from "@/hooks/useChats";

interface ThreadNoticesProps {
  isConnected: boolean;
  threadStatus: ThreadStatus;
  threadError: string | null;
  hasMessages: boolean;
  onRetry: () => void;
}

/**
 * Non-blocking notices above a thread: offline (typing still works; messages
 * send on reconnect) and "Couldn't load this chat" with Retry.
 */
export default function ThreadNotices({ isConnected, threadStatus, threadError, hasMessages, onRetry }: ThreadNoticesProps) {
  return (
    <>
      {!isConnected && (
        <div
          role="status"
          className="flex items-center gap-2 px-4 py-1.5 text-xs text-amber-800 bg-amber-50 border-b border-amber-200"
        >
          <WifiOff size={14} aria-hidden />
          <span>You&apos;re offline. Messages will send when the connection is back.</span>
        </div>
      )}
      {threadStatus === "error" && (
        <div
          role="alert"
          className={`flex items-center gap-2 px-4 text-sm text-red-700 bg-red-50 border-b border-red-200 ${
            hasMessages ? "py-1.5" : "py-3"
          }`}
        >
          <AlertCircle size={16} aria-hidden />
          <span className="flex-1">{threadError || "Couldn't load this chat"}</span>
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      )}
    </>
  );
}
