/**
 * Freezes the page behind a modal and gives the scroll position back when it
 * closes — without this the page underneath scrolls while a dialog is open and
 * jumps to the top once it is dismissed.
 */
"use client";

import { useEffect } from "react";

/**
 * Locks `document.body` scrolling while `locked` is true.
 *
 * @param locked - Whether a modal is currently open.
 */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked || typeof document === "undefined") return;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [locked]);
}
