#!/usr/bin/env node
/**
 * tl-codemod: moves legacy colour classes onto the design system's `tl-*`
 * tokens (src/components/tl, tailwind.config.ts, globals.css).
 *
 * It only rewrites what is unambiguous: a light class with its `dark:`
 * partner right after it (`text-gray-500 dark:text-slate-400` becomes
 * `text-tl-muted`), and the brand hex colours that have a token. Anything
 * else (bare greys, status colours without a partner, layout) is left for a
 * person to restyle with the tl components.
 *
 * Usage: node scripts/tl-codemod.mjs <file-or-dir> [...more]
 *        (add --dry to print the counts without writing; add --singles for
 *        the broader second pass over bare legacy classes)
 *
 * The rules are data (RULES below) so a page group can see what changed.
 */
import fs from "node:fs";
import path from "node:path";

/** Matches a Tailwind shade suffix with an optional opacity, e.g. `900/30`. */
const S = (shades) => `(?:${shades})(?:\\/\\d+)?`;

/**
 * Pairs and singles, in order. Each `from` is a regex source matched on class
 * boundaries; `to` is the token class.
 *
 * @type {Array<{ from: string; to: string }>}
 */
const RULES = [
  // ── Text ──────────────────────────────────────────────────────────────
  {
    from: `text-(?:gray|slate)-(?:900|950) dark:text-(?:white|(?:slate|gray)-(?:50|100))`,
    to: "text-tl-ink",
  },
  {
    from: `text-\\[#(?:030E18|0B1220|101828|1A1A1A|131616)\\] dark:text-(?:white|(?:slate|gray)-(?:50|100|200))`,
    to: "text-tl-ink",
  },
  {
    from: `text-(?:gray|slate)-800 dark:text-(?:white|(?:slate|gray)-(?:100|200))`,
    to: "text-tl-ink",
  },
  { from: `text-(?:gray|slate)-700 dark:text-(?:slate|gray)-(?:200|300)`, to: "text-tl-body" },
  { from: `text-(?:gray|slate)-600 dark:text-(?:slate|gray)-(?:300|400)`, to: "text-tl-muted" },
  { from: `text-(?:gray|slate)-500 dark:text-(?:slate|gray)-(?:300|400)`, to: "text-tl-muted" },
  { from: `text-(?:gray|slate)-400 dark:text-(?:slate|gray)-(?:400|500)`, to: "text-tl-faint" },
  { from: `text-\\[#003366\\] dark:text-(?:blue|sky)-(?:200|300|400)`, to: "text-tl-brand" },
  { from: `text-(?:blue)-(?:600|700) dark:text-blue-(?:300|400)`, to: "text-tl-link" },
  { from: `text-red-(?:600|700) dark:text-red-(?:300|400)`, to: "text-tl-danger" },
  {
    from: `text-(?:green|emerald)-(?:600|700) dark:text-(?:green|emerald)-(?:300|400)`,
    to: "text-tl-success",
  },
  {
    from: `text-(?:amber|yellow)-(?:600|700|800) dark:text-(?:amber|yellow)-(?:300|400)`,
    to: "text-tl-warning",
  },

  // ── Surfaces ──────────────────────────────────────────────────────────
  { from: `bg-white dark:bg-(?:slate|gray)-${S("700|800|900|950")}`, to: "bg-tl-surface" },
  { from: `bg-(?:gray|slate)-50 dark:bg-slate-950`, to: "bg-tl-bg" },
  { from: `bg-(?:gray|slate)-50 dark:bg-(?:slate|gray)-${S("700|800|900")}`, to: "bg-tl-subtle" },
  { from: `bg-(?:gray|slate)-100 dark:bg-(?:slate|gray)-${S("700|800")}`, to: "bg-tl-track" },
  { from: `bg-(?:gray|slate)-200 dark:bg-(?:slate|gray)-${S("700|800")}`, to: "bg-tl-line" },
  { from: `bg-\\[#003366\\] dark:bg-(?:blue|sky)-(?:500|600)`, to: "bg-tl-brand-fill" },
  { from: `bg-\\[#003366\\]\\/10 dark:bg-blue-${S("900|950")}`, to: "bg-tl-select" },
  { from: `bg-blue-50 dark:bg-blue-${S("900|950")}`, to: "bg-tl-select" },
  { from: `bg-red-50 dark:bg-red-${S("900|950")}`, to: "bg-tl-danger-bg" },
  {
    from: `bg-(?:green|emerald)-50 dark:bg-(?:green|emerald)-${S("900|950")}`,
    to: "bg-tl-success-bg",
  },
  {
    from: `bg-(?:amber|yellow)-50 dark:bg-(?:amber|yellow)-${S("900|950")}`,
    to: "bg-tl-warning-bg",
  },

  // ── Borders and dividers ──────────────────────────────────────────────
  {
    from: `border-(?:gray|slate)-300 dark:border-(?:slate|gray)-(?:600|700)`,
    to: "border-tl-control",
  },
  {
    from: `border-(?:gray|slate)-200 dark:border-(?:slate|gray)-(?:600|700|800)`,
    to: "border-tl-line",
  },
  {
    from: `border-(?:gray|slate)-(?:50|100) dark:border-(?:slate|gray)-(?:700|800)`,
    to: "border-tl-line-soft",
  },
  { from: `border-\\[#003366\\] dark:border-(?:blue|sky)-(?:400|500)`, to: "border-tl-brand" },
  {
    from: `divide-(?:gray|slate)-(?:50|100|200) dark:divide-(?:slate|gray)-(?:700|800)`,
    to: "divide-tl-line-soft",
  },

  // ── Hover ─────────────────────────────────────────────────────────────
  {
    from: `hover:bg-(?:gray|slate)-(?:50|100) dark:hover:bg-(?:slate|gray)-${S("700|800")}`,
    to: "hover:bg-tl-bg",
  },
  { from: `hover:bg-red-50 dark:hover:bg-red-${S("900|950")}`, to: "hover:bg-tl-danger-bg" },
  {
    from: `hover:text-(?:gray|slate)-(?:700|800|900) dark:hover:text-(?:white|(?:slate|gray)-(?:100|200))`,
    to: "hover:text-tl-ink",
  },

  // ── Brand hex with a token (no partner needed) ────────────────────────
  { from: `bg-\\[#003366\\]`, to: "bg-tl-brand-fill" },
  {
    from: `hover:bg-\\[#(?:002244|002855|00264d|004080|002B55|002a55|154473|123961)\\]`,
    to: "hover:bg-tl-brand-fill-hover",
  },
  { from: `text-\\[#003366\\]`, to: "text-tl-brand" },
  { from: `border-\\[#003366\\]`, to: "border-tl-brand" },
  { from: `ring-\\[#003366\\]`, to: "ring-tl-link" },
  { from: `text-\\[#030E18\\]`, to: "text-tl-ink" },
  { from: `bg-\\[#F2F2F2\\]`, to: "bg-tl-bg" },
  { from: `bg-\\[#EBF0F7\\]`, to: "bg-tl-select" },
];

const COMPILED = RULES.map((rule) => ({
  ...rule,
  // Class boundaries: start, whitespace, quote or backtick before; whitespace, quote, backtick or end after.
  re: new RegExp(`(?<=^|[\\s"'\`])${rule.from}(?=$|[\\s"'\`])`, "g"),
}));


/**
 * The second pass (`--singles`): bare legacy colour classes, with no `dark:`
 * partner, mapped to the nearest token by meaning, and any `dark:` colour
 * variant left behind dropped (the tokens switch with the theme). Run it
 * after the pairs; it is broader, so review the result.
 *
 * @type {Array<{ from: string; to: string }>}
 */
const SINGLE_RULES = [
  // Leftover dark: colour variants (the tokens already switch).
  { from: `dark:(?:hover:|focus:|group-hover:|placeholder:)?(?:bg|text|border|divide|ring|placeholder|from|via|to)-(?:white|black|(?:gray|slate|zinc|neutral|blue|sky|indigo|violet|purple|red|rose|green|emerald|teal|amber|yellow|orange)-\\d{2,3}(?:\\/\\d+)?|\\[#[0-9A-Fa-f]{3,8}\\](?:\\/\\d+)?)`, to: "" },
  { from: `dark:(?:shadow-none|ring-offset-\\S+)`, to: "" },
  // Text.
  { from: `text-(?:gray|slate|zinc|neutral)-(?:800|900|950)`, to: "text-tl-ink" },
  { from: `text-black`, to: "text-tl-ink" },
  { from: `text-(?:gray|slate|zinc|neutral)-700`, to: "text-tl-body" },
  { from: `text-(?:gray|slate|zinc|neutral)-(?:500|600)`, to: "text-tl-muted" },
  { from: `text-(?:gray|slate|zinc|neutral)-(?:300|400)`, to: "text-tl-faint" },
  { from: `text-(?:blue|sky)-(?:500|600|700)`, to: "text-tl-link" },
  { from: `text-(?:blue|sky|indigo)-(?:800|900)`, to: "text-tl-brand" },
  { from: `text-(?:red|rose)-(?:400|500|600|700|800|900)`, to: "text-tl-danger" },
  { from: `text-(?:green|emerald|teal)-(?:500|600|700|800|900)`, to: "text-tl-success" },
  { from: `text-(?:amber|yellow|orange)-(?:500|600|700|800|900)`, to: "text-tl-warning" },
  { from: `text-(?:purple|violet|indigo)-(?:500|600|700)`, to: "text-tl-accent" },
  { from: `placeholder-(?:gray|slate)-\\d{3}`, to: "placeholder:text-tl-faint" },
  { from: `placeholder:text-(?:gray|slate)-\\d{3}`, to: "placeholder:text-tl-faint" },
  { from: `text-\\[#(?:6F6F6F|878787|707070|667085|808080|7B7B7B|4A5568|595959|5D5D5D|525252|545454|929292|979797|98A2B3|8A95A5|738195)\\]`, to: "text-tl-muted" },
  { from: `text-\\[#(?:2F2F2F|344054|393939|434343|4D4D4D)\\]`, to: "text-tl-body" },
  { from: `text-\\[#(?:0B1220|101828|1A1A1A|131616|002244)\\]`, to: "text-tl-ink" },
  { from: `text-\\[#(?:154473|123961|0B63CE|0B79D0)\\]`, to: "text-tl-brand" },
  // Hover text.
  { from: `hover:text-(?:gray|slate)-(?:600|700|800|900)`, to: "hover:text-tl-ink" },
  { from: `hover:text-(?:blue|sky)-(?:600|700|800)`, to: "hover:text-tl-link" },
  { from: `hover:text-red-\\d{3}`, to: "hover:text-tl-danger" },
  // Surfaces.
  { from: `bg-white(?:\\/\\d+)?`, to: "bg-tl-surface" },
  { from: `bg-(?:gray|slate|zinc|neutral)-50(?:\\/\\d+)?`, to: "bg-tl-subtle" },
  { from: `bg-(?:gray|slate|zinc|neutral)-100(?:\\/\\d+)?`, to: "bg-tl-track" },
  { from: `bg-(?:gray|slate|zinc|neutral)-(?:200|300)(?:\\/\\d+)?`, to: "bg-tl-line" },
  { from: `bg-(?:gray|slate)-(?:700|800|900)`, to: "bg-tl-ink" },
  { from: `bg-(?:blue|sky|indigo)-(?:50|100)(?:\\/\\d+)?`, to: "bg-tl-select" },
  { from: `bg-(?:blue|sky)-(?:500|600|700)`, to: "bg-tl-brand-fill" },
  { from: `bg-(?:red|rose)-(?:50|100)(?:\\/\\d+)?`, to: "bg-tl-danger-bg" },
  { from: `bg-(?:red|rose)-(?:500|600|700)`, to: "bg-tl-danger" },
  { from: `bg-(?:green|emerald|teal)-(?:50|100)(?:\\/\\d+)?`, to: "bg-tl-success-bg" },
  { from: `bg-(?:green|emerald|teal)-(?:500|600|700)`, to: "bg-tl-success" },
  { from: `bg-(?:amber|yellow|orange)-(?:50|100)(?:\\/\\d+)?`, to: "bg-tl-warning-bg" },
  { from: `bg-(?:amber|yellow|orange)-(?:400|500|600)`, to: "bg-tl-warning" },
  { from: `bg-(?:purple|violet|indigo)-(?:50|100)(?:\\/\\d+)?`, to: "bg-tl-accent-bg" },
  { from: `bg-(?:purple|violet|indigo)-(?:500|600|700)`, to: "bg-tl-accent" },
  { from: `bg-\\[#(?:154473|123961|002244|0B63CE)\\]`, to: "bg-tl-brand-fill" },
  { from: `bg-\\[#(?:F8F8F8|F9FAFB|FAFBFB|FBFCFE|FDFDFD|F7F7F7|F3F3F3|F8FBFF|F7F9FC|F4F8FF)\\]`, to: "bg-tl-subtle" },
  { from: `bg-\\[#(?:EAF2FB|EFF5FF|E6F2FB|E8EDF3)\\]`, to: "bg-tl-select" },
  { from: `bg-\\[#003366\\]\\/\\d+`, to: "bg-tl-select" },
  // Hover surfaces.
  { from: `hover:bg-(?:gray|slate)-(?:50|100|200)(?:\\/\\d+)?`, to: "hover:bg-tl-bg" },
  { from: `hover:bg-(?:blue|sky|indigo)-(?:50|100)`, to: "hover:bg-tl-select" },
  { from: `hover:bg-(?:blue|sky)-(?:600|700|800)`, to: "hover:bg-tl-brand-fill-hover" },
  { from: `hover:bg-\\[#(?:002244|002855|154473|123961|00264d|004080|003366)\\](?:\\/\\d+)?`, to: "hover:bg-tl-brand-fill-hover" },
  { from: `hover:bg-(?:red|rose)-(?:50|100)`, to: "hover:bg-tl-danger-bg" },
  { from: `hover:bg-(?:red|rose)-(?:600|700|800)`, to: "hover:opacity-90" },
  { from: `hover:bg-(?:green|emerald)-(?:50|100)`, to: "hover:bg-tl-success-bg" },
  { from: `hover:bg-(?:green|emerald)-(?:600|700|800)`, to: "hover:opacity-90" },
  // Borders, dividers, rings.
  { from: `border-(?:gray|slate|zinc)-(?:300|400)`, to: "border-tl-control" },
  { from: `border-(?:gray|slate|zinc)-200`, to: "border-tl-line" },
  { from: `border-(?:gray|slate|zinc)-(?:50|100)`, to: "border-tl-line-soft" },
  { from: `border-white`, to: "border-tl-surface" },
  { from: `border-(?:blue|sky|indigo)-(?:100|200|300)`, to: "border-tl-control" },
  { from: `border-(?:blue|sky)-(?:400|500|600|700)`, to: "border-tl-brand" },
  { from: `border-(?:red|rose)-(?:100|200|300)`, to: "border-tl-danger/30" },
  { from: `border-(?:red|rose)-(?:400|500|600)`, to: "border-tl-danger" },
  { from: `border-(?:green|emerald|teal)-(?:100|200|300)`, to: "border-tl-success/30" },
  { from: `border-(?:green|emerald)-(?:400|500|600)`, to: "border-tl-success" },
  { from: `border-(?:amber|yellow|orange)-(?:100|200|300)`, to: "border-tl-warning/30" },
  { from: `border-(?:amber|yellow|orange)-(?:400|500|600)`, to: "border-tl-warning" },
  { from: `border-(?:purple|violet|indigo)-(?:100|200|300)`, to: "border-tl-accent/30" },
  { from: `border-\\[#(?:F9F9F9|F4F4F4|F3F3F3|F2F2F2|F1F1F1|F0F0F0|EEEEEE|EBEBEB|E8EDF5|E5EAF2|E5E7EB|E4E4E4|E0E0E0|DCE5F2|D8D8D8|D6D6D6)\\]`, to: "border-tl-line" },
  { from: `border-\\[#(?:154473|123961|0B63CE)\\]`, to: "border-tl-brand" },
  { from: `divide-(?:gray|slate)-\\d{2,3}`, to: "divide-tl-line-soft" },
  { from: `(focus|focus-visible|focus-within):ring-(?:blue|sky|indigo|gray)-\\d{3}(?:\\/\\d+)?`, to: "$1:ring-tl-link" },
  { from: `(focus|focus-visible):ring-\\[#003366\\](?:\\/\\d+)?`, to: "$1:ring-tl-link" },
  { from: `(focus|focus-visible):border-(?:blue|sky|indigo)-\\d{3}`, to: "$1:border-tl-link" },
  { from: `(focus|focus-visible):border-\\[#003366\\]`, to: "$1:border-tl-link" },
  { from: `ring-(?:gray|slate)-(?:100|200|300)`, to: "ring-tl-line" },
  { from: `ring-(?:blue|sky)-\\d{3}`, to: "ring-tl-link" },
  // Gradients collapse to the brand fill.
  { from: `bg-gradient-to-(?:r|br|b|l|t|tr|bl|tl) from-(?:blue|sky|indigo)-\\d{3} (?:via-\\S+ )?to-(?:blue|sky|indigo)-\\d{3}`, to: "bg-tl-brand-fill" },
  { from: `bg-gradient-to-(?:r|br|b) from-(?:blue|sky|indigo|slate|gray)-50 (?:via-\\S+ )?to-\\S+`, to: "bg-tl-subtle" },
];

const COMPILED_SINGLES = SINGLE_RULES.map((rule) => ({
  ...rule,
  re: new RegExp(`(?<=^|[\\s"'\`])${rule.from}(?=$|[\\s"'\`])`, "g"),
}));

/**
 * Rewrites one file's classes.
 *
 * @param {string} file - Path to a .ts or .tsx file.
 * @param {boolean} dry - Count only.
 * @param {boolean} singles - Also run the broader single-class pass.
 * @returns {number} How many classes changed.
 */
function rewrite(file, dry, singles = false) {
  const before = fs.readFileSync(file, "utf8");
  let after = before;
  let changed = 0;
  for (const { re, to } of singles ? [...COMPILED, ...COMPILED_SINGLES] : COMPILED) {
    after = after.replace(re, (...match) => {
      changed += 1;
      return to.replace("$1", match[1] ?? "");
    });
  }
  // Classes removed above can leave double spaces inside a class string.
  if (singles) after = after.replace(/(className=(?:"|\{?`)[^"`\n]*?) {2,}/g, (m) => m.replace(/ {2,}/g, " "));
  // A dark: variant left behind on a token is now redundant noise; drop the ones that duplicate it.
  after = after.replace(/(\b(?:bg|text|border)-tl-[\w-]+) dark:\1\b/g, "$1");
  if (changed && !dry) fs.writeFileSync(file, after);
  return changed;
}

/**
 * The .ts and .tsx files under a path (tests and stories excluded).
 *
 * @param {string} target - A file or a directory.
 * @returns {string[]} The files.
 */
function filesUnder(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return /\.(tsx?|jsx?)$/.test(target) ? [target] : [];
  return fs.readdirSync(target).flatMap((name) => {
    if (name === "node_modules" || name === "__tests__" || name.endsWith(".stories.tsx")) return [];
    return filesUnder(path.join(target, name));
  });
}

const args = process.argv.slice(2);
const dry = args.includes("--dry");
const singlesPass = args.includes("--singles");
const targets = args.filter((a) => a !== "--dry" && a !== "--singles");
if (targets.length === 0) {
  console.error("usage: node scripts/tl-codemod.mjs [--dry] <file-or-dir> [...]");
  process.exit(1);
}
let total = 0;
for (const file of targets.flatMap(filesUnder)) {
  const n = rewrite(file, dry, singlesPass);
  if (n) console.log(`${String(n).padStart(4)}  ${file}`);
  total += n;
}
console.log(`${dry ? "would change" : "changed"} ${total} class(es)`);
