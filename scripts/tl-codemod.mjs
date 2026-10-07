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
 *        (add --dry to print the counts without writing)
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
 * Rewrites one file's classes.
 *
 * @param {string} file - Path to a .ts or .tsx file.
 * @param {boolean} dry - Count only.
 * @returns {number} How many classes changed.
 */
function rewrite(file, dry) {
  const before = fs.readFileSync(file, "utf8");
  let after = before;
  let changed = 0;
  for (const { re, to } of COMPILED) {
    after = after.replace(re, () => {
      changed += 1;
      return to;
    });
  }
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
const targets = args.filter((a) => a !== "--dry");
if (targets.length === 0) {
  console.error("usage: node scripts/tl-codemod.mjs [--dry] <file-or-dir> [...]");
  process.exit(1);
}
let total = 0;
for (const file of targets.flatMap(filesUnder)) {
  const n = rewrite(file, dry);
  if (n) console.log(`${String(n).padStart(4)}  ${file}`);
  total += n;
}
console.log(`${dry ? "would change" : "changed"} ${total} class(es)`);
