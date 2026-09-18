"use client";

import { Suspense, useState } from "react";
import type { ReplyTarget } from "@/types/chat.types";
import MessagesLayout from "../components/messages/MessagesLayout";

export default function AdminChatUI() {
  const [replyingMessage, setReplyingMessage] = useState<ReplyTarget | null>(null);

  const [openSubMenu, setOpenSubMenu] = useState<{
    index: number;
    type: string;
  } | null>(null);

  const toggleSubMenu = (index: number, type: string) => {
    if (
      openSubMenu &&
      openSubMenu.index === index &&
      openSubMenu.type === type
    ) {
      setOpenSubMenu(null);
    } else {
      setOpenSubMenu({ index, type });
    }
  };

  return (
    <div
      className="h-full font-manrope text-[#030E18] flex flex-col bg-gray-50"
      data-guide="messages-shell"
    >
      {/* MessagesLayout reads ?room= for deep links. */}
      <Suspense fallback={null}>
        <MessagesLayout
          replyingMessage={replyingMessage}
          setReplyingMessage={setReplyingMessage}
          openSubMenu={openSubMenu}
          toggleSubMenu={toggleSubMenu}
        />
      </Suspense>
    </div>
  );
}
