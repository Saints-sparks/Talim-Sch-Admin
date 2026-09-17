/**
 * Body scroll locking for modals.
 *
 * A dialog that does not lock the page leaves it scrolling behind the overlay,
 * so reopening lands somewhere else. This freezes the page while a modal is
 * open and puts the previous value back. The lock is counted, so a modal
 * opened on top of another does not release the outer one's lock when it
 * closes — the page stays frozen until the last one is dismissed.
 */
"use client";

import { useEffect } from "react";

let lockCount = 0;
let previousOverflow = "";

/**
 * Freezes page scrolling while `locked` is true.
 *
 * @param locked - Whether a modal is currently open.
 */
export function useBodyScrollLock(locked: boolean): void {
  useEffect(() => {
    if (!locked || typeof document === "undefined") return;

    if (lockCount === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0) document.body.style.overflow = previousOverflow;
    };
  }, [locked]);
}
