"use client";

/**
 * Pieces the teacher profile's tabs share. The tiles and cards themselves
 * come from `@/components/users/parts`.
 */

/**
 * "Not recorded" rather than an empty box when a field was never filled in.
 *
 * @param value - The field's value.
 * @returns The value as text, or "Not recorded".
 */
export function orNotRecorded(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "Not recorded";
  return String(value);
}
