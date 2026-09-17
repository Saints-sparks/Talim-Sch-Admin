/**
 * Body scroll locking for the fees modals.
 *
 * The fee details and category dialogs used to leave the page scrolling behind
 * them, which on a long fee table meant reopening the modal in a different
 * place. This freezes the page while a modal is open and puts the previous
 * value back — including when two modals overlap, because the lock is counted.
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
