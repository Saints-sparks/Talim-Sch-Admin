#!/usr/bin/env node
/**
 * Refreshes the in-app copy of the past-records import guide.
 *
 *   npm run guide:import
 *   TALIM_BACKEND_PATH=/path/to/talimBE-V2 npm run guide:import
 *
 * Reads `<backend>/docs/history-import-guide.md` (default backend checkout:
 * `../talimBE-V2`, next to this repository) and writes it, as a string, to
 * `src/content/historyImportGuide.ts`, which Settings → Data → Import past
 * records → "Read the guide" renders. The backend does not serve the guide,
 * so run this whenever it changes there. Local only: no network. When the
 * backend is not checked out it reports that and exits 0.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * The TypeScript module that carries the guide.
 *
 * @param {string} markdown - The guide.
 * @returns {string} The module's source.
 */
export function guideModule(markdown) {
  return [
    "/**",
    " * The past-records import guide, copied from talimBE-V2 `docs/history-import-guide.md`",
    " * by `npm run guide:import`. Do not edit it here: change the backend's guide and run",
    " * the script again.",
    " */",
    `export const HISTORY_IMPORT_GUIDE = ${JSON.stringify(markdown.replace(/\r\n/g, "\n"))};`,
    "",
  ].join("\n");
}

/**
 * Writes the module when the guide changed.
 *
 * @param {{ source: string, dest: string }} paths - Absolute file paths.
 * @returns {{ status: "missing-source" | "unchanged" | "created" | "updated" }}
 */
export function syncImportGuide({ source, dest }) {
  if (!existsSync(source)) return { status: "missing-source" };
  const next = guideModule(readFileSync(source, "utf8"));
  const existed = existsSync(dest);
  if (existed && readFileSync(dest, "utf8") === next) return { status: "unchanged" };
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, next);
  return { status: existed ? "updated" : "created" };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const backend = resolve(root, process.env.TALIM_BACKEND_PATH ?? "../talimBE-V2");
  const source = resolve(backend, "docs/history-import-guide.md");
  const dest = resolve(root, "src/content/historyImportGuide.ts");
  const { status } = syncImportGuide({ source, dest });
  if (status === "missing-source") {
    console.log(
      `Import guide not found at ${source}. Skipped: src/content/historyImportGuide.ts is unchanged.`
    );
  } else {
    console.log(
      `src/content/historyImportGuide.ts ${status === "unchanged" ? "is already up to date" : status} (${source}).`
    );
  }
}
