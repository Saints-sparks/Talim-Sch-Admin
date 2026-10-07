"use client";

import React from "react";
import { useWebSocketContext } from "../context/WebSocketContext";
import { focusRing } from "@/components/tl/styles";

/** The words and dot for each connection state. */
const STATE: Record<string, { text: string; short: string; dot: string; tone: string }> = {
  connected: { text: "Connected", short: "Online", dot: "tl-dot-success", tone: "text-tl-success" },
  connecting: {
    text: "Connecting...",
    short: "Connecting",
    dot: "tl-dot-warning",
    tone: "text-tl-warning",
  },
  disconnected: {
    text: "Disconnected",
    short: "Offline",
    dot: "tl-dot-neutral",
    tone: "text-tl-muted",
  },
  error: { text: "Connection Error", short: "Error", dot: "tl-dot-danger", tone: "text-tl-danger" },
};

/**
 * The live-connection status in the top bar: a dot and a word in a pill
 * (Connected, Connecting..., Disconnected, Connection Error), with Retry
 * after an error.
 *
 * @returns The status.
 */
export const WebSocketStatus: React.FC = () => {
  const { connectionStatus, reconnect } = useWebSocketContext();
  const state = STATE[connectionStatus] ?? {
    text: "Unknown",
    short: "Offline",
    dot: "tl-dot-neutral",
    tone: "text-tl-muted",
  };

  return (
    <div className="flex items-center gap-2" role="status" aria-live="polite">
      <span
        className={`inline-flex min-h-[32px] items-center gap-2 rounded-full border border-tl-line bg-tl-surface px-3 text-xs font-extrabold ${state.tone}`}
      >
        <span aria-hidden className={`h-2 w-2 rounded-full ${state.dot}`} />
        <span className="hidden sm:inline">{state.text}</span>
        <span className="sm:hidden">{state.short}</span>
      </span>
      {connectionStatus === "error" && (
        <button
          type="button"
          onClick={reconnect}
          className={`min-h-[44px] rounded-md px-1 text-xs font-bold text-tl-link underline ${focusRing}`}
          title="Reconnect"
        >
          Retry
        </button>
      )}
    </div>
  );
};
