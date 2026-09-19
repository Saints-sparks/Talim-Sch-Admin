#!/usr/bin/env node
/**
 * Refreshes `src/types/api.d.ts` from the backend's generated contract.
 *
 *   npm run types:api
 *   TALIM_BACKEND_PATH=/path/to/talimBE-V2 npm run types:api
 *
 * Copies `<backend>/docs/api-types.d.ts` (default backend checkout:
 * `../talimBE-V2`, next to this repository) over `src/types/api.d.ts` and says
 * whether the file changed. Local only: no network. When the backend is not
 * checked out it reports that and exits 0, leaving the current copy in place.
 *
 * After a refresh run `npm run type-check`; every payload that no longer
 * matches a DTO fails there.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Copies the contract file when it differs.
 *
 * @param {{ source: string, dest: string }} paths - Absolute file paths.
 * @returns {{ status: "missing-source" | "unchanged" | "created" | "updated" }}
 */
export function syncApiTypes({ source, dest }) {
  if (!existsSync(source)) return { status: "missing-source" };
  const next = readFileSync(source);
  const existed = existsSync(dest);
  if (existed && readFileSync(dest).equals(next)) return { status: "unchanged" };
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(source, dest);
  return { status: existed ? "updated" : "created" };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const backend = resolve(root, process.env.TALIM_BACKEND_PATH ?? "../talimBE-V2");
  const source = resolve(backend, "docs/api-types.d.ts");
  const dest = resolve(root, "src/types/api.d.ts");
  const { status } = syncApiTypes({ source, dest });
  if (status === "missing-source") {
    console.log(
      `Backend contract not found at ${source}. Skipped: check out talimBE-V2 next to this repo or set TALIM_BACKEND_PATH. src/types/api.d.ts is unchanged.`,
    );
  } else if (status === "unchanged") {
    console.log("src/types/api.d.ts is already up to date with the backend contract.");
  } else {
    console.log(
      `src/types/api.d.ts ${status} from ${source}. Run \`npm run type-check\` to find payloads that no longer match a DTO.`,
    );
  }
}
