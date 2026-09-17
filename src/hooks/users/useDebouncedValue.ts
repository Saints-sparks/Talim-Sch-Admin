/**
 * Debouncing for filter inputs.
 *
 * Typing in a roster search box changes a query key on every keystroke; without
 * this the list refetches (or re-filters and re-paginates) once per character.
 */
"use client";

import { useEffect, useState } from "react";

/**
 * The value as it was `delayMs` ago, once the caller stops changing it.
 *
 * @param value - The value that changes on every keystroke.
 * @param delayMs - Quiet period before the new value is published. Default 300.
 * @returns The settled value.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}
