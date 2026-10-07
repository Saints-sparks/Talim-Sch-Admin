"use client";

import { AlertCircle, WifiOff } from "lucide-react";
import { rowButton } from "@/components/tl";
import type { ThreadStatus } from "@/hooks/useChats";

/** Props for {@link ThreadNotices}. */
interface ThreadNoticesProps {
  isConnected: boolean;
  threadStatus: ThreadStatus;
  threadError: string | null;
  hasMessages: boolean;
  onRetry: () => void;
}

/**
 * Non-blocking notices above a thread: offline (typing still works; messages
 * send on reconnect) and "Couldn't load this chat" with Retry, as tinted
 * strips under the header.
 *
 * @param props - The connection and thread state.
 * @param props.isConnected - Whether the socket is connected.
 * @param props.threadStatus - The open thread's load state.
 * @param props.threadError - Why it failed to load.
 * @param props.hasMessages - Whether some messages are on screen.
 * @param props.onRetry - Loads it again.
 * @returns The notices.
 */
export default function ThreadNotices({ isConnected, threadStatus, threadError, hasMessages, onRetry }: ThreadNoticesProps) {
  return (
    <>
      {!isConnected && (
        <div
          role="status"
          className="flex items-center gap-2 border-b border-tl-line-soft bg-tl-warning-bg px-4 py-2 text-xs font-bold text-tl-warning"
        >
          <WifiOff size={14} className="shrink-0" aria-hidden />
          <span>You&apos;re offline. Messages will send when the connection is back.</span>
        </div>
      )}
      {threadStatus === "error" && (
        <div
          role="alert"
          className={`flex items-center gap-2 border-b border-tl-line-soft bg-tl-danger-bg px-4 text-sm font-bold text-tl-danger ${
            hasMessages ? "py-1.5" : "py-3"
          }`}
        >
          <AlertCircle size={16} className="shrink-0" aria-hidden />
          <span className="flex-1">{threadError || "Couldn't load this chat"}</span>
          <button
            type="button"
            onClick={onRetry}
            className={rowButton}
          >
            Retry
          </button>
        </div>
      )}
    </>
  );
}
