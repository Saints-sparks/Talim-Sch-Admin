import { formatDateSeparator } from "@/lib/chat/dates";

describe("formatDateSeparator", () => {
  const now = new Date(2026, 8, 19, 15, 0);

  it("says Today and Yesterday", () => {
    expect(formatDateSeparator(new Date(2026, 8, 19, 1, 0), now)).toBe("Today");
    expect(formatDateSeparator(new Date(2026, 8, 18, 23, 59), now)).toBe("Yesterday");
  });

  it("spells out older days the same way for every chat type", () => {
    const label = formatDateSeparator(new Date(2026, 8, 14, 9, 0), now);
    expect(label).toContain("Sep");
    expect(label).toContain("14");
    expect(label).toContain("2026");
  });

  it("returns an empty label for missing or invalid times", () => {
    expect(formatDateSeparator(undefined, now)).toBe("");
    expect(formatDateSeparator("nonsense", now)).toBe("");
  });
});
