/**
 * This build's version, read from `package.json` so there is one place to
 * bump it (v1.5 §3). Shown in Settings → Data & System and at the foot of the
 * sidebar, and sent with every support ticket.
 */
import packageJson from "../../package.json";

/** The version, e.g. "1.5.0". */
export const APP_VERSION: string = packageJson.version;

/**
 * The version as people read it.
 *
 * @param version - A version string; defaults to this build's.
 * @returns "Version 1.5.0".
 */
export function versionLabel(version: string = APP_VERSION): string {
  return `Version ${version}`;
}
