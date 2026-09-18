/**
 * In-memory session store — the one place non-React code (services, the API
 * client) reads the signed-in user and their school from.
 *
 * `AuthContext` writes to it whenever the session changes; everything else
 * only reads. On a cold call before `AuthContext` has mounted it hydrates
 * once from the persisted user, so early service calls still resolve.
 * Nothing here decodes tokens: the introspected user is the source of truth.
 */

/** The signed-in user, as stored for non-React code to read. */
export interface SessionUser {
  _id?: string;
  userId: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  schoolId?: string | { _id?: string; id?: string; name?: string };
  schoolName?: string;
  permissions?: string[];
  onboardingCompleted?: boolean;
  [key: string]: unknown;
}

type Listener = () => void;

let currentUser: SessionUser | null = null;
let currentToken: string | null = null;
let hydrated = false;
const listeners = new Set<Listener>();

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

/** Loads the persisted user/token once, for reads that happen before AuthContext mounts. */
function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  currentToken = readStorage("accessToken");
  const raw = readStorage("user");
  if (raw) {
    try {
      currentUser = JSON.parse(raw) as SessionUser;
    } catch {
      currentUser = null;
    }
  }
}

function notify(): void {
  for (const listener of listeners) listener();
}

/**
 * Extracts a 24-hex school id from the shapes the API returns for
 * `user.schoolId` (a string, or a populated `{ _id }` object).
 */
export function extractSchoolId(value: unknown): string | null {
  if (typeof value === "string") return OBJECT_ID.test(value) ? value : null;
  if (value && typeof value === "object") {
    const obj = value as { _id?: unknown; id?: unknown };
    if (typeof obj._id === "string" && OBJECT_ID.test(obj._id)) return obj._id;
    if (typeof obj.id === "string" && OBJECT_ID.test(obj.id)) return obj.id;
  }
  return null;
}

export const sessionStore = {
  /** The signed-in user, or `null`. */
  getUser(): SessionUser | null {
    hydrate();
    return currentUser;
  },

  /** The current access token, or `null`. */
  getToken(): string | null {
    hydrate();
    return currentToken;
  },

  /** The signed-in user's school id, or `null` when signed out. */
  getSchoolId(): string | null {
    hydrate();
    return extractSchoolId(currentUser?.schoolId);
  },

  /** The signed-in user's id, or `null`. */
  getUserId(): string | null {
    hydrate();
    return currentUser?.userId ?? currentUser?._id ?? null;
  },

  /** Replaces the user (and optionally the token). Called by AuthContext. */
  set(user: SessionUser | null, token?: string | null): void {
    hydrated = true;
    currentUser = user;
    if (token !== undefined) currentToken = token;
    notify();
  },

  /** Updates the token only (after a refresh). */
  setToken(token: string | null): void {
    hydrated = true;
    currentToken = token;
    notify();
  },

  /** Merges fields into the current user (profile edits). */
  patchUser(partial: Partial<SessionUser>): void {
    if (!currentUser) return;
    currentUser = { ...currentUser, ...partial };
    notify();
  },

  /** Clears everything on logout. */
  clear(): void {
    hydrated = true;
    currentUser = null;
    currentToken = null;
    notify();
  },

  /**
   * Subscribes to session changes.
   *
   * @returns An unsubscribe function.
   */
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
