import { MATERIAL_COLORS } from "@/lib/colorUtils";

/** WCAG relative luminance of a #RRGGBB colour. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe("sender colours", () => {
  it("every colour is readable against white (AA, 4.5:1)", () => {
    for (const color of MATERIAL_COLORS) {
      expect({ color, ok: 1.05 / (luminance(color) + 0.05) >= 4.5 }).toEqual({ color, ok: true });
    }
  });
});
