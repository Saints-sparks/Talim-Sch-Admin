/**
 * Where the signed-in session is kept in the browser.
 *
 * A "keep me signed in" session lives in `localStorage`; a session-only one in
 * `sessionStorage` (gone when the tab closes). The choice itself is remembered
 * in `localStorage` under `keepSignedIn`. `AuthContext` is the only writer;
 * `session.ts` reads the same keys for code that runs before it mounts.
 */

const TOKEN_KEY = "accessToken";
const USER_KEY = "user";
const KEEP_KEY = "keepSignedIn";

/**
 * Whether the user chose to stay signed in. Absent means yes: only an explicit
 * "false" makes a session tab-scoped.
 *
 * @returns The stored preference.
 */
export function keepSignedInPreference(): boolean {
  return localStorage.getItem(KEEP_KEY) !== "false";
}

/**
 * The stored access token, whichever storage holds it.
 *
 * @returns The token, or `null` when none is stored.
 */
export function readStoredAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

/**
 * The stored user, whichever storage holds it. A copy that no longer parses is
 * discarded from `localStorage` so it cannot fail again on the next load.
 *
 * @returns The parsed user, or `null` when none is stored or it is unreadable.
 */
export function readStoredUser<T>(): T | null {
  const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

/**
 * Stores a fresh sign-in and remembers the "keep me signed in" choice. The
 * other storage is emptied so the session lives in exactly one place.
 *
 * @param token - The access token.
 * @param user - The introspected user.
 * @param keepSignedIn - True for `localStorage`, false for `sessionStorage`.
 */
export function saveSession(token: string, user: unknown, keepSignedIn: boolean): void {
  const [keep, drop] = keepSignedIn ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
  keep.setItem(TOKEN_KEY, token);
  keep.setItem(USER_KEY, JSON.stringify(user));
  drop.removeItem(TOKEN_KEY);
  drop.removeItem(USER_KEY);
  localStorage.setItem(KEEP_KEY, keepSignedIn ? "true" : "false");
}

/**
 * Stores a refreshed access token where the session already lives, honouring
 * the original "keep me signed in" choice.
 *
 * @param token - The new access token.
 */
export function saveRefreshedToken(token: string): void {
  const [keep, drop] = keepSignedInPreference() ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
  keep.setItem(TOKEN_KEY, token);
  drop.removeItem(TOKEN_KEY);
}

/**
 * Stores the token the server rotated in after a password change. Unlike
 * {@link saveRefreshedToken} it only writes the preferred storage.
 *
 * @param token - The rotated access token.
 */
export function saveRotatedToken(token: string): void {
  (keepSignedInPreference() ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
}

/**
 * Stores the re-introspected user where the session already lives.
 *
 * @param user - The user as the server returned it.
 */
export function saveIntrospectedUser(user: unknown): void {
  const [keep, drop] = keepSignedInPreference() ? [localStorage, sessionStorage] : [sessionStorage, localStorage];
  keep.setItem(USER_KEY, JSON.stringify(user));
  drop.removeItem(USER_KEY);
}

/**
 * Stores a locally edited user (a profile change) in `localStorage`.
 *
 * @param user - The edited user.
 */
export function saveEditedUser(user: unknown): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Forgets the token, the user and the "keep me signed in" choice, in both storages. */
export function clearStoredSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(KEEP_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}
