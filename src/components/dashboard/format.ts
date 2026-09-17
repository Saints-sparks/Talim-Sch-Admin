/**
 * Number and greeting formatting shared by the dashboard panels.
 *
 * Amounts arrive from the API in naira, never kobo.
 */

/**
 * A compact naira amount for a card, e.g. `₦1.4M`, `₦320K`, `₦4,500`.
 *
 * @param amount - Amount in naira.
 * @returns The short label.
 */
export function formatNairaShort(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}K`;
  return `₦${amount.toLocaleString("en-NG")}`;
}

/**
 * The full naira amount, for tooltips and rows where precision matters.
 *
 * @param amount - Amount in naira.
 * @returns The full label.
 */
export function formatNairaFull(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

/**
 * Time-of-day greeting for the page hero.
 *
 * @returns "Good morning", "Good afternoon" or "Good evening".
 */
export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Initials for an avatar circle, at most two letters.
 *
 * @param name - Full name as the API returned it.
 * @returns Uppercase initials.
 */
export function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
