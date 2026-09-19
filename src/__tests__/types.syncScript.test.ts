/**
 * Runtime test of `scripts/sync-api-types.mjs`, the script behind
 * `npm run types:api`: it copies the backend's generated contract into
 * `src/types/api.d.ts` and must never fail just because the backend is absent.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { syncApiTypes } from "../../scripts/sync-api-types.mjs";

describe("syncApiTypes", () => {
  let dir: string;
  let source: string;
  let dest: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "talim-sync-"));
    mkdirSync(join(dir, "backend", "docs"), { recursive: true });
    source = join(dir, "backend", "docs", "api-types.d.ts");
    dest = join(dir, "client", "src", "types", "api.d.ts");
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("reports a missing backend and leaves the client copy alone", () => {
    mkdirSync(join(dir, "client", "src", "types"), { recursive: true });
    writeFileSync(dest, "// old");
    expect(syncApiTypes({ source, dest })).toEqual({ status: "missing-source" });
    expect(readFileSync(dest, "utf8")).toBe("// old");
  });

  it("creates the copy (and its folders) the first time", () => {
    writeFileSync(source, "export interface paths {}");
    expect(syncApiTypes({ source, dest })).toEqual({ status: "created" });
    expect(readFileSync(dest, "utf8")).toBe("export interface paths {}");
  });

  it("says unchanged when the copy already matches", () => {
    writeFileSync(source, "export interface paths {}");
    syncApiTypes({ source, dest });
    expect(syncApiTypes({ source, dest })).toEqual({ status: "unchanged" });
  });

  it("overwrites the copy when the backend contract changed", () => {
    writeFileSync(source, "export interface paths {}");
    syncApiTypes({ source, dest });
    writeFileSync(source, "export interface paths { '/x': never }");
    expect(syncApiTypes({ source, dest })).toEqual({ status: "updated" });
    expect(readFileSync(dest, "utf8")).toBe("export interface paths { '/x': never }");
  });
});

describe("node scripts/sync-api-types.mjs", () => {
  it("exits 0 and explains itself when the backend is not checked out", () => {
    const output = execFileSync(process.execPath, [resolve(__dirname, "../../scripts/sync-api-types.mjs")], {
      env: { ...process.env, TALIM_BACKEND_PATH: join(tmpdir(), "talim-no-such-backend") },
      encoding: "utf8",
    });
    expect(output).toMatch(/not found/i);
    expect(output).toMatch(/unchanged/i);
  });
});
