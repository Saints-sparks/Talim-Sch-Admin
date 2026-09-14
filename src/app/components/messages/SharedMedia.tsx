"use client";

import { useMemo, useState } from "react";
import { Download, FileText, Link2 } from "lucide-react";
import type { ChatAttachment, ChatMessage } from "@/types/chat.types";
import { isLocalMessage } from "@/lib/chat/messages";
import { Lightbox, attachmentKind, extractLinks, formatBytes } from "@/components/chat-kit";

export type SharedMediaSection = "Images" | "Videos" | "Links" | "Documents";

interface SharedMediaProps {
  section: SharedMediaSection;
  /** The conversation's loaded messages (oldest first). */
  messages: ChatMessage[];
}

interface Shared {
  attachment: ChatAttachment;
  message: ChatMessage;
}

function when(message: ChatMessage): string {
  return new Date(message.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/**
 * Images / videos / links / documents shared in the conversation, from the
 * messages already loaded (no extra request) — newest first.
 */
export default function SharedMedia({ section, messages }: SharedMediaProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { images, videos, documents, links } = useMemo(() => {
    const stored = messages.filter((m) => !isLocalMessage(m)).reverse();
    const collect = (match: (kind: string) => boolean): Shared[] =>
      stored.flatMap((message) =>
        (message.attachments ?? [])
          .filter((attachment) => attachment.url && match(attachmentKind(attachment)))
          .map((attachment) => ({ attachment, message }))
      );
    return {
      images: collect((k) => k === "image"),
      videos: collect((k) => k === "video"),
      documents: collect((k) => k === "document" || k === "file"),
      links: stored.flatMap((message) => extractLinks(message.content).map((url) => ({ url, message }))),
    };
  }, [messages]);

  const count =
    section === "Images" ? images.length : section === "Videos" ? videos.length : section === "Links" ? links.length : documents.length;

  const note = <p className="mb-3 text-xs text-gray-400">From loaded messages</p>;

  if (count === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-gray-500">No {section.toLowerCase()} yet</p>
        <p className="mt-1 text-xs text-gray-400">From loaded messages — scroll up in the chat to load older ones.</p>
      </div>
    );
  }

  if (section === "Images") {
    return (
      <div>
        {note}
        <div className="grid grid-cols-3 gap-1.5">
          {images.map(({ attachment }, i) => (
            <button
              key={`${attachment.url}-${i}`}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="aspect-square overflow-hidden rounded-md bg-gray-100"
              aria-label={`Open image ${i + 1} of ${images.length}`}
            >
              <img src={attachment.url} alt={attachment.name || "Image"} loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        <Lightbox
          images={images.map(({ attachment }) => ({ url: attachment.url, name: attachment.name }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      </div>
    );
  }

  if (section === "Videos") {
    return (
      <div>
        {note}
        <div className="grid grid-cols-2 gap-2">
          {videos.map(({ attachment, message }, i) => (
            <div key={`${attachment.url}-${i}`} className="overflow-hidden rounded-md bg-black">
              <video src={attachment.url} controls preload="metadata" playsInline className="aspect-video w-full" />
              <p className="truncate bg-white px-1 pt-1 text-xs text-gray-500">
                {message.senderName || "Someone"} · {when(message)}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section === "Links") {
    return (
      <div>
        {note}
        <ul className="space-y-2">
          {links.map(({ url, message }, i) => (
            <li key={`${url}-${message._id}-${i}`} className="flex items-start gap-2 rounded-lg border border-gray-100 p-2">
              <Link2 size={16} className="mt-0.5 flex-shrink-0 text-gray-400" aria-hidden />
              <div className="min-w-0">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-sm text-blue-600 hover:underline"
                >
                  {url}
                </a>
                <p className="text-xs text-gray-400">
                  {message.senderName || "Someone"} · {when(message)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      {note}
      <ul className="space-y-2">
        {documents.map(({ attachment, message }, i) => (
          <li key={`${attachment.url}-${i}`} className="flex items-center gap-2 rounded-lg border border-gray-100 p-2">
            <FileText size={18} className="flex-shrink-0 text-gray-500" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-gray-800" title={attachment.name}>
                {attachment.name || "File"}
              </p>
              <p className="text-xs text-gray-400">
                {[formatBytes(attachment.size), message.senderName, when(message)].filter(Boolean).join(" · ")}
              </p>
            </div>
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              download={attachment.name || true}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full hover:bg-gray-100"
              aria-label={`Download ${attachment.name || "file"}`}
            >
              <Download size={16} className="text-gray-600" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
