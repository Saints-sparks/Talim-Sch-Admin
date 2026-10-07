"use client";

import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, Loader2, LogOut, Monitor, Smartphone, Tablet } from "lucide-react";
import {
  useRevokeOtherSessions,
  useRevokeSession,
  useSessions,
} from "@/hooks/settings/useSessions";
import {
  Card,
  CardHeader,
  ModalShell,
  Notice,
  OutlineBtn,
  settingsErrorMessage,
} from "@/components/settings/ui";
import type { AuthSession } from "@/types/round4Contract";
import { deviceKind, lastActiveLabel, sessionDetails, sessionTitle } from "./sessionFormat";

const ICONS = { phone: Smartphone, tablet: Tablet, computer: Monitor } as const;

/**
 * Settings → Security → Signed-in devices (Round 4 §34): every browser and
 * phone signed in to this account, "Sign out" for each of the others, and
 * "Sign out of other devices" behind a confirmation. A signed-out device
 * keeps working until its access token expires, then has to sign in again.
 *
 * @returns The card, with its confirmation dialog.
 */
export function SessionsCard() {
  const sessions = useSessions();
  const { revoke, pendingId } = useRevokeSession();
  const { revokeOthers, pending: revokingOthers } = useRevokeOtherSessions();
  const [confirming, setConfirming] = useState(false);

  const list = sessions.data ?? [];
  const knowsCurrent = list.some((s) => s.current);
  const others = list.filter((s) => !s.current);
  const canRevokeOthers = knowsCurrent && others.length > 0;
  const bulkHint = !sessions.data
    ? undefined
    : !knowsCurrent
      ? "We couldn't tell which of these is this device, so sign devices out one at a time."
      : others.length === 0
        ? "No other devices are signed in."
        : undefined;

  /**
   * Signs out every other device, closing the dialog when it worked.
   *
   * @returns Nothing; failures toast and keep the dialog open.
   */
  const confirmRevokeOthers = async () => {
    if (await revokeOthers()) setConfirming(false);
  };

  return (
    <Card>
      <CardHeader
        title="Signed-in devices"
        action={
          <OutlineBtn
            onClick={() => setConfirming(true)}
            disabled={!canRevokeOthers || revokingOthers}
            aria-describedby={bulkHint ? "sessions-bulk-hint" : undefined}
            className="text-xs px-3 py-1.5"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden /> Sign out of other devices
          </OutlineBtn>
        }
      />
      <div className="p-5 space-y-3">
        {bulkHint && (
          <p id="sessions-bulk-hint" className="text-xs text-tl-muted">
            {bulkHint}
          </p>
        )}

        {sessions.isLoading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Loading signed-in devices">
            {[0, 1].map((i) => (
              <div key={i} className="h-14 bg-tl-track rounded-lg animate-pulse" />
            ))}
          </div>
        ) : sessions.isError ? (
          <Notice
            tone="danger"
            icon={<AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />}
          >
            {settingsErrorMessage(sessions.error, "We couldn't load your signed-in devices.")}{" "}
            <button
              type="button"
              onClick={() => void sessions.refetch()}
              className="underline font-medium"
            >
              Try again
            </button>
          </Notice>
        ) : list.length === 0 ? (
          <p className="text-sm text-tl-muted">No signed-in devices to show.</p>
        ) : (
          <ul className="divide-y divide-tl-line-soft" aria-label="Signed-in devices">
            {list.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                canSignOut={!session.current}
                pending={pendingId === session.id}
                onSignOut={() => void revoke(session)}
              />
            ))}
          </ul>
        )}
      </div>

      <AnimatePresence>
        {confirming && (
          <ModalShell
            title="Sign out of other devices?"
            onClose={() => (revokingOthers ? undefined : setConfirming(false))}
          >
            <div className="space-y-4">
              <p className="text-sm text-tl-body">
                {others.length === 1
                  ? "1 other device will have to sign in again."
                  : `${others.length} other devices will have to sign in again.`}{" "}
                This device stays signed in.
              </p>
              <div className="flex gap-3 justify-end">
                <OutlineBtn onClick={() => setConfirming(false)} disabled={revokingOthers}>
                  Cancel
                </OutlineBtn>
                <button
                  type="button"
                  onClick={() => void confirmRevokeOthers()}
                  disabled={revokingOthers}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-tl-danger hover:opacity-90 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                  {revokingOthers && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />}
                  Sign out other devices
                </button>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
    </Card>
  );
}

/**
 * One device: what it is, where and when it was used, and its action.
 *
 * @param props.session - The session.
 * @param props.canSignOut - False for this device (it signs out from the header menu).
 * @param props.pending - True while it is being signed out.
 * @param props.onSignOut - Signs it out.
 * @returns The list item.
 */
function SessionRow({
  session,
  canSignOut,
  pending,
  onSignOut,
}: {
  session: AuthSession;
  canSignOut: boolean;
  pending: boolean;
  onSignOut: () => void;
}) {
  const Icon = ICONS[deviceKind(session)];
  const title = sessionTitle(session);
  const details = sessionDetails(session);
  const lastActive = lastActiveLabel(session);
  const lastUsed = session.lastUsedAt || session.createdAt;

  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="w-9 h-9 rounded-lg bg-tl-select flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-tl-brand" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-tl-ink flex flex-wrap items-center gap-2">
          <span className="truncate">{title}</span>
          {session.current && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border bg-tl-select text-tl-link border-tl-control">
              This device
            </span>
          )}
        </p>
        <p className="text-xs text-tl-muted truncate">
          {details && `${details} · `}
          <time dateTime={lastUsed} title={new Date(lastUsed).toLocaleString()}>
            {lastActive}
          </time>
        </p>
      </div>
      {canSignOut && (
        <button
          type="button"
          onClick={onSignOut}
          disabled={pending}
          aria-label={`Sign out ${title}${session.ip ? ` (${session.ip})` : ""}`}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-tl-danger hover:bg-tl-danger-bg disabled:opacity-50 shrink-0"
        >
          {pending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
          ) : (
            <LogOut className="w-3.5 h-3.5" aria-hidden />
          )}
          Sign out
        </button>
      )}
    </li>
  );
}
