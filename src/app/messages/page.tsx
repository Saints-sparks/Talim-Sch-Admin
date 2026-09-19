"use client";

import { Suspense, useState } from "react";
import type { ReplyDraft } from "@/components/chat-kit";
import MessagesLayout from "../components/messages/MessagesLayout";

export default function AdminChatUI() {
  const [replyingMessage, setReplyingMessage] = useState<ReplyDraft | null>(null);

  return (
    <div
      className="h-full font-manrope text-[#030E18] flex flex-col bg-gray-50"
      data-guide="messages-shell"
    >
      {/* MessagesLayout reads ?room= for deep links. */}
      <Suspense fallback={null}>
        <MessagesLayout replyingMessage={replyingMessage} setReplyingMessage={setReplyingMessage} />
      </Suspense>
    </div>
  );
}
