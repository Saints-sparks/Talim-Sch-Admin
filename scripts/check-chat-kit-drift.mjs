#!/usr/bin/env node
/**
 * Reports whether the chat-kit copies in the sibling repositories still match
 * the canonical one in this repository.
 *
 * The kit (`src/components/chat-kit`) is developed here and copied into the
 * Teachers, Students and Parents apps. Until it becomes a published package
 * (which needs a package registry decision), a fix made in one copy and not the
 * others is the failure to guard against. Run this before and after changing
 * the kit:
 *
 *   node scripts/check-chat-kit-drift.mjs            # report
 *   node scripts/check-chat-kit-drift.mjs --strict   # also fail on the Parents port
 *
 * Exits 1 when a byte-for-byte copy (Teachers, Students) has drifted. Parents
 * is a TypeScript port with intentional differences, so it is reported but only
 * fails under --strict. Repositories that are not checked out next to this one
 * are skipped.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const canonical = resolve(here, "../src/components/chat-kit");
const workspace = resolve(here, "../..");

const COPIES = [
  { name: "Talim-Teachers", dir: "Talim-Teachers/src/components/chat-kit", exact: true },
  { name: "Talim-students-web", dir: "Talim-students-web/components/chat-kit", exact: true },
  { name: "talim-parents (TypeScript port)", dir: "talim-parents/src/Components/chat-kit", exact: false },
];
const EXTENSIONS = ["tsx", "ts", "jsx", "js"];
const strict = process.argv.includes("--strict");

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const sha = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");

/** The copy's file for a canonical relative path, allowing the extension to differ. */
function counterpart(root, rel) {
  const base = rel.replace(/\.[^.]+$/, "");
  for (const ext of EXTENSIONS) {
    const candidate = join(root, `${base}.${ext}`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

const files = walk(canonical)
  .filter((file) => !file.includes("__tests__") && !file.endsWith(".md"))
  .map((file) => relative(canonical, file));

let failed = false;
for (const copy of COPIES) {
  const root = resolve(workspace, copy.dir);
  if (!existsSync(root)) {
    console.log(`- ${copy.name}: not checked out here, skipped`);
    continue;
  }
  const drifted = [];
  const missing = [];
  for (const rel of files) {
    const other = counterpart(root, rel);
    if (!other) missing.push(rel);
    else if (sha(join(canonical, rel)) !== sha(other)) drifted.push(rel);
  }
  const clean = drifted.length === 0 && missing.length === 0;
  console.log(`${clean ? "✓" : "✗"} ${copy.name}: ${files.length - drifted.length - missing.length}/${files.length} identical`);
  for (const rel of drifted) console.log(`    differs: ${rel}`);
  for (const rel of missing) console.log(`    missing: ${rel}`);
  if (!clean && (copy.exact || strict)) failed = true;
}

if (failed) {
  console.error("\nA copy has drifted. Make the change in Talim-Sch-Admin, then copy it to the others.");
  process.exit(1);
}
