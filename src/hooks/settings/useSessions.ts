/**
 * Settings → Security: the signed-in administrator's devices (Round 4 §34),
 * signing one out, and signing out every other one.
 */
"use client";

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from "@tanstack/react-query";
import { toast } from "@/components/CustomToast";
import { useAuth } from "@/context/AuthContext";
import { settingsKeys } from "@/hooks/settings/keys";
import { staleTimes } from "@/lib/queryKeys";
import { logger } from "@/lib/logger";
import { settingsErrorMessage } from "@/components/settings/ui";
import { authService } from "@/app/services/auth.service";
import type { AuthSession } from "@/types/round4Contract";

/**
 * This device first, then the most recently active.
 *
 * @param sessions - As the API lists them.
 * @returns A sorted copy.
 */
export function sortSessions(sessions: AuthSession[]): AuthSession[] {
  /**
   * When a session was last used.
   *
   * @param s - A session.
   * @returns Epoch ms, 0 when unknown.
   */
  const time = (s: AuthSession) => {
    const t = new Date(s.lastUsedAt || s.createdAt).getTime();
    return Number.isNaN(t) ? 0 : t;
  };
  return [...sessions].sort((a, b) => Number(b.current) - Number(a.current) || time(b) - time(a));
}

/**
 * The signed-in user's sessions query key.
 *
 * @returns The key, scoped to the user.
 */
function useSessionsKey() {
  const { user } = useAuth();
  return settingsKeys.sessions(user?.userId ?? user?._id ?? "none");
}

/**
 * The signed-in user's sessions, this device first.
 *
 * @returns Query result; `data` is undefined until the first load finishes.
 */
export function useSessions(): UseQueryResult<AuthSession[]> {
  const { user } = useAuth();
  const key = useSessionsKey();
  return useQuery({
    queryKey: key,
    queryFn: async () => sortSessions(await authService.listSessions()),
    enabled: Boolean(user),
    staleTime: staleTimes.list,
  });
}

/** What {@link useRevokeSession} returns. */
export interface RevokeSession {
  /** Signs one session out; resolves false when it failed (after a toast). */
  revoke: (session: AuthSession) => Promise<boolean>;
  /** The id being signed out, or null. */
  pendingId: string | null;
}

/**
 * Signs one of the user's other sessions out, dropping it from the list.
 *
 * @returns The action and which session is in flight.
 */
export function useRevokeSession(): RevokeSession {
  const client = useQueryClient();
  const key = useSessionsKey();
  const mutation = useMutation({
    mutationFn: (session: AuthSession) => authService.revokeSession(session.id),
    onSuccess: (_data, session) => {
      client.setQueryData<AuthSession[]>(key, (list) => list?.filter((s) => s.id !== session.id));
      toast.success("Signed out of that device");
    },
    onError: (err) => {
      logger.error("settings/sessions", "revoke failed", err);
      toast.error(settingsErrorMessage(err, "We couldn't sign that device out. Try again."));
    },
    onSettled: () => void client.invalidateQueries({ queryKey: key }),
  });
  return {
    /**
     * Signs one session out.
     *
     * @param session - The session.
     * @returns True on success; false after the error toast.
     */
    revoke: async (session) => {
      try {
        await mutation.mutateAsync(session);
        return true;
      } catch {
        return false;
      }
    },
    pendingId: mutation.isPending ? (mutation.variables?.id ?? null) : null,
  };
}

/** What {@link useRevokeOtherSessions} returns. */
export interface RevokeOtherSessions {
  /** Signs out every other session; resolves false when it failed (after a toast). */
  revokeOthers: () => Promise<boolean>;
  /** True while the request is in flight. */
  pending: boolean;
}

/**
 * Signs out every session but this one.
 *
 * @returns The action and its pending flag.
 */
export function useRevokeOtherSessions(): RevokeOtherSessions {
  const client = useQueryClient();
  const key = useSessionsKey();
  const mutation = useMutation({
    mutationFn: () => authService.revokeOtherSessions(),
    onSuccess: (res) => {
      client.setQueryData<AuthSession[]>(key, (list) => list?.filter((s) => s.current));
      const n = typeof res?.revoked === "number" ? res.revoked : null;
      toast.success(
        n === null
          ? "Signed out of your other devices"
          : n === 0
            ? "No other devices were signed in"
            : `Signed out of ${n} other device${n === 1 ? "" : "s"}`
      );
    },
    onError: (err) => {
      logger.error("settings/sessions", "revoke-others failed", err);
      toast.error(settingsErrorMessage(err, "We couldn't sign your other devices out. Try again."));
    },
    onSettled: () => void client.invalidateQueries({ queryKey: key }),
  });
  return {
    /**
     * Signs out every other session.
     *
     * @returns True on success; false after the error toast.
     */
    revokeOthers: async () => {
      try {
        await mutation.mutateAsync();
        return true;
      } catch {
        return false;
      }
    },
    pending: mutation.isPending,
  };
}
