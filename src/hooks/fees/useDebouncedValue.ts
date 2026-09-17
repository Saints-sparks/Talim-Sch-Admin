/**
 * Debouncing for the fees search boxes.
 *
 * Fee search is a server query, so typing "tuition" used to be seven requests.
 * The input stays instant; only the value the query keys off is delayed.
 */
"use client";

import { useEffect, useState } from "react";

/** How long to wait after the last keystroke before searching. */
export const SEARCH_DEBOUNCE_MS = 350;

/**
 * Returns `value` after it has stopped changing for `delay` milliseconds.
 *
 * @param value - The live value, e.g. the search box contents.
 * @param delay - Quiet period in milliseconds. Defaults to 350.
 * @returns The settled value.
 */
export function useDebouncedValue<T>(value: T, delay = SEARCH_DEBOUNCE_MS): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
}
