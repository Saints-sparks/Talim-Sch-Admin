import fs from "fs";
import path from "path";
import config from "../../tailwind.config";

/**
 * The text colours that Tailwind's stock palette gets wrong for WCAG AA are read
 * from CSS variables (tailwind.config.ts `textColor`, values in globals.css).
 * This pins the light values at 4.5:1 on the surfaces they sit on, and the dark
 * values at the stock palette so dark mode never gets less readable.
 */
const css = fs.readFileSync(path.join(__dirname, "../app/globals.css"), "utf8");

/** Channels of `--name: r g b;` inside the `selector { ... }` block. */
function tokensOf(selector: string): Record<string, [number, number, number]> {
  const block = css.match(new RegExp(`${selector.replace(".", "\\.")}\\s*\\{([^}]*)\\}`, "g")) ?? [];
  const tokens: Record<string, [number, number, number]> = {};
  for (const chunk of block) {
    for (const m of chunk.matchAll(/--(text-[\w-]+):\s*(\d+)\s+(\d+)\s+(\d+);/g)) {
      tokens[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])];
    }
  }
  return tokens;
}

const luminance = ([r, g, b]: [number, number, number]) => {
  const lin = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const ratio = (a: [number, number, number], b: [number, number, number]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Surfaces the secondary text sits on in light mode: white, gray-50, gray-100, slate-50, the active-nav tint. */
const LIGHT_SURFACES: Array<[number, number, number]> = [
  [255, 255, 255],
  [249, 250, 251],
  [243, 244, 246],
  [248, 250, 252],
  [235, 240, 247],
];

const light = tokensOf(":root");
const dark = tokensOf(".dark");

describe("light-mode text tokens", () => {
  it.each(["text-gray-400", "text-gray-500", "text-slate-400", "text-slate-500", "text-green-600", "text-yellow-600", "text-red-600"])(
    "%s is at least 4.5:1 on white and the light surfaces",
    (name) => {
      expect(light[name]).toBeDefined();
      // The green/yellow/red 600s only ever sit on white, gray-50 or their own light tints.
      const surfaces = /green|yellow|red/.test(name) ? LIGHT_SURFACES.slice(0, 2) : LIGHT_SURFACES;
      for (const surface of surfaces) expect(ratio(light[name], surface)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("keeps the ranks: 400 is lighter than 500, which is lighter than the stock 600", () => {
    expect(luminance(light["text-gray-400"])).toBeGreaterThan(luminance(light["text-gray-500"]));
    expect(luminance(light["text-gray-500"])).toBeGreaterThan(luminance([75, 85, 99])); // gray-600
    expect(luminance(light["text-slate-400"])).toBeGreaterThan(luminance(light["text-slate-500"]));
    expect(luminance(light["text-slate-500"])).toBeGreaterThan(luminance([71, 85, 105])); // slate-600
  });
});

describe("dark-mode text tokens", () => {
  it("are the stock Tailwind values, so dark mode is unchanged", () => {
    expect(dark).toEqual({
      "text-gray-400": [156, 163, 175],
      "text-gray-500": [107, 114, 128],
      "text-slate-400": [148, 163, 184],
      "text-slate-500": [100, 116, 139],
      "text-green-600": [22, 163, 74],
      "text-yellow-600": [202, 138, 4],
      "text-red-600": [220, 38, 38],
    });
  });
});

describe("tailwind textColor mapping", () => {
  const textColor = (config.theme?.extend as { textColor?: Record<string, Record<string, string>> }).textColor ?? {};

  it("points each text utility at its variable, keeping opacity modifiers working", () => {
    for (const [family, shade] of [["gray", "400"], ["gray", "500"], ["slate", "400"], ["slate", "500"], ["green", "600"], ["yellow", "600"], ["red", "600"]]) {
      expect(textColor[family][shade]).toBe(`rgb(var(--text-${family}-${shade}) / <alpha-value>)`);
    }
  });
});
