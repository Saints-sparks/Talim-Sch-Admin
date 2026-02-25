"use client";

import { useState } from "react";
import MessagesLayout from "../components/messages/MessagesLayout";

export default function AdminChatUI() {
  const [replyingMessage, setReplyingMessage] = useState<{
    sender: string;
    text: string;
  } | null>(null);

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
    <div className="h-full font-manrope text-[#030E18] flex flex-col bg-gray-50">
      <MessagesLayout
        replyingMessage={replyingMessage}
        setReplyingMessage={setReplyingMessage}
        openSubMenu={openSubMenu}
        toggleSubMenu={toggleSubMenu}
      />
    </div>
  );
}
