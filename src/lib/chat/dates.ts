/**
 * The label above the first message of a day, the same in direct and group
 * chats: "Today", "Yesterday", otherwise e.g. "Mon, Sep 14, 2026".
 *
 * @param value - The message time.
 * @param now - Clock, for tests.
 * @returns The label, or "" when the time isn't a valid date.
 */
export function formatDateSeparator(value: Date | string | number | undefined | null, now: Date = new Date()): string {
  if (value === undefined || value === null || value === "") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((day(now) - day(date)) / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
