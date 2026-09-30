import { MATERIAL_COLORS, onDarkShade } from "@/lib/colorUtils";

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

  it("the dark theme's shade of every colour is readable on the dark surfaces (AA, 4.5:1)", () => {
    for (const background of ["#0F172A", "#1E293B"]) {
      for (const color of MATERIAL_COLORS) {
        const shade = onDarkShade(color);
        const ratio = (luminance(shade) + 0.05) / (luminance(background) + 0.05);
        expect({ color, shade, background, ok: ratio >= 4.5 }).toEqual({ color, shade, background, ok: true });
      }
    }
  });

  it("mixes with white and leaves anything but #rrggbb alone", () => {
    expect(onDarkShade("#000000", 0.5)).toBe("#808080");
    expect(onDarkShade("#303f9f", 0)).toBe("#303F9F");
    expect(onDarkShade("rgb(0, 0, 0)")).toBe("rgb(0, 0, 0)");
  });
});
