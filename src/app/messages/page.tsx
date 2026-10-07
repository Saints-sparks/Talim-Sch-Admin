"use client";

import { Suspense, useState } from "react";
import type { ReplyDraft } from "@/components/chat-kit";
import MessagesLayout from "../components/messages/MessagesLayout";

/**
 * The Messages page: the conversation list and the open conversation as two
 * cards that fill the window down to the composer (one pane at a time below
 * 980px). The bottom padding stays small so Send sits below the floating
 * Guide button, never under it.
 *
 * @returns The page.
 */
export default function AdminChatUI() {
  const [replyingMessage, setReplyingMessage] = useState<ReplyDraft | null>(null);

  return (
    <div
      className="flex h-full min-h-0 flex-col px-[clamp(10px,2.4vw,26px)] pb-3 pt-[clamp(10px,2.2vw,22px)] font-manrope text-tl-ink"
      data-guide="messages-shell"
    >
      {/* MessagesLayout reads ?room= for deep links. */}
      <Suspense fallback={null}>
        <MessagesLayout replyingMessage={replyingMessage} setReplyingMessage={setReplyingMessage} />
      </Suspense>
    </div>
  );
}
