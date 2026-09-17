/** Small UI hooks the transit pages share: debounced input and modal scroll lock. */
"use client";

import { useEffect, useState } from "react";

/**
 * Follows a value, but only after it stops changing.
 *
 * Keeps a search box from firing a request per keystroke.
 *
 * @param value - The live value.
 * @param delayMs - How long it must stay still, in milliseconds.
 * @returns The settled value.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}

/**
 * Locks page scrolling while a modal is open and restores it on close.
 *
 * Restores the document's own overflow rather than clearing it, so two modals
 * closing in sequence cannot leave the page unscrollable.
 *
 * @param active - True while the modal is mounted.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
