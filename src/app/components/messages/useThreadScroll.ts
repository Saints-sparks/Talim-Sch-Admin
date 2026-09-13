"use client";

import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import { isNearBottom } from "@/lib/chat/messages";

interface ThreadItem {
  _id?: string;
  senderType?: string;
  status?: string;
}

/**
 * Scroll behaviour for a message thread:
 * - first render of a room's messages jumps to the newest;
 * - older pages are prepended with the reading position held in place;
 * - new messages scroll into view only when the reader is near the bottom
 *   (~120px) or just sent one.
 *
 * @returns `onScroll` for the scroll container.
 */
export function useThreadScroll({
  containerRef,
  items,
  canLoadOlder,
  loadOlder,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  items: ThreadItem[];
  canLoadOlder: boolean;
  loadOlder: () => Promise<boolean>;
}) {
  const nearBottomRef = useRef(true);
  const initialDoneRef = useRef(false);
  const snapshotRef = useRef<{ firstId?: string; lastId?: string; height: number }>({ height: 0 });

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const firstId = items[0]?._id;
    const last = items[items.length - 1];
    const lastId = last?._id;
    const prev = snapshotRef.current;

    if (items.length > 0 && !initialDoneRef.current) {
      el.scrollTop = el.scrollHeight;
      initialDoneRef.current = true;
      nearBottomRef.current = true;
    } else if (prev.firstId && firstId !== prev.firstId && lastId === prev.lastId) {
      // Older messages were added above: keep what the reader was looking at.
      el.scrollTop += el.scrollHeight - prev.height;
    } else if (lastId && lastId !== prev.lastId) {
      const sentByMe = last?.senderType === "self" && last?.status === "pending";
      if (nearBottomRef.current || sentByMe) {
        el.scrollTop = el.scrollHeight;
        nearBottomRef.current = true;
      }
    }

    snapshotRef.current = { firstId, lastId, height: el.scrollHeight };
  }, [items, containerRef]);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    nearBottomRef.current = isNearBottom(el);
    snapshotRef.current = { ...snapshotRef.current, height: el.scrollHeight };
    if (el.scrollTop < 60 && canLoadOlder) void loadOlder();
  }, [containerRef, canLoadOlder, loadOlder]);

  return { onScroll };
}
