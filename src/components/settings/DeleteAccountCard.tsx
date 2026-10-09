"use client";

import React, { useEffect, useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, MessageSquare } from "lucide-react";
import { CardHeader } from "@/components/tl/Page";
import { ConfirmSheet } from "@/components/tl/ConfirmSheet";
import { Banner } from "@/components/tl/states";
import { Field, describedByFor } from "@/components/tl/bits";
import {
  card,
  dangerGhostButton,
  fieldControl,
  ghostButton,
  iconButton,
  textLink,
  textareaControl,
} from "@/components/tl/styles";
import { useRequestAccountDeletion } from "@/hooks/settings/useAdminProfile";
import { DELETION_REASON_MAX, deletionFailure, type DeletionFailure } from "@/lib/authPolicy";
import { DELETE_ACCOUNT_INFO_URL } from "@/lib/publicLinks";

/** What deleting does, on the card and in the sheet. */
const DELETION_SUMMARY =
  "Your account will be deleted in 30 days, and signing in before then cancels it. After that your name, email, phone number and photo are erased. Your school keeps grades, attendance and payments, with your details removed.";

/** No failure shown. */
const NO_FAILURE: DeletionFailure = { field: null, banner: null, code: null };

/** Props for {@link DeleteAccountSheet}. */
export interface DeleteAccountSheetProps {
  /** Whether the sheet is shown. */
  open: boolean;
  /** Opens or closes it. */
  onOpenChange: (open: boolean) => void;
}

/**
 * The Delete account confirmation: the password (with a show toggle, like
 * Change Password), an optional reason and an "I understand" box. Delete
 * stays disabled until the box is ticked and a password is typed. A wrong
 * password shows on the field; `LAST_SCHOOL_ADMIN` shows the server's message
 * with a link to Help & support; any other refusal shows in a banner. On
 * success `useRequestAccountDeletion` signs out and goes to sign-in with the
 * date. The tl `Sheet` supplies the labelled heading, focus trap and Escape.
 *
 * @param props - See {@link DeleteAccountSheetProps}.
 * @param props.open - Whether the sheet is shown.
 * @param props.onOpenChange - Opens or closes it.
 * @returns The sheet.
 */
export function DeleteAccountSheet({ open, onOpenChange }: DeleteAccountSheetProps) {
  const request = useRequestAccountDeletion();
  const { reset } = request;
  const formId = useId();
  const passwordId = useId();
  const reasonId = useId();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [reason, setReason] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [failure, setFailure] = useState<DeletionFailure>(NO_FAILURE);

  useEffect(() => {
    if (!open) return;
    setPassword("");
    setShowPassword(false);
    setReason("");
    setUnderstood(false);
    setFailure(NO_FAILURE);
    reset();
  }, [open, reset]);

  const busy = request.isPending;
  const ready = understood && password.length > 0 && !busy;

  /** Sends the request, or shows why it was refused. */
  const submit = () => {
    if (!ready) return;
    setFailure(NO_FAILURE);
    const trimmed = reason.trim();
    request.mutate(
      { password, ...(trimmed ? { reason: trimmed } : {}) },
      { onError: (error) => setFailure(deletionFailure(error)) }
    );
  };

  /**
   * Enter in a field submits once the sheet is complete.
   *
   * @param event - The form submit.
   */
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit();
  };

  return (
    <ConfirmSheet
      open={open}
      onCancel={() => onOpenChange(false)}
      onConfirm={submit}
      eyebrowText="Danger zone"
      title="Delete your account?"
      body={`You'll be signed out on every device now. ${DELETION_SUMMARY}`}
      confirmLabel="Delete account"
      busyLabel="Deleting…"
      busy={busy}
      confirmDisabled={!ready}
      danger
    >
      <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-[18px]" noValidate>
        {failure.banner ? (
          <Banner
            tone="danger"
            role="alert"
            action={
              failure.code === "LAST_SCHOOL_ADMIN" ? (
                <Link href="/help" className={ghostButton}>
                  <MessageSquare className="h-4 w-4" aria-hidden /> Contact Talim support
                </Link>
              ) : undefined
            }
          >
            {failure.banner}
          </Banner>
        ) : null}
        <Field id={passwordId} label="Password" error={failure.field}>
          <div className="relative">
            <input
              id={passwordId}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              disabled={busy}
              aria-invalid={Boolean(failure.field)}
              aria-describedby={describedByFor(passwordId, undefined, failure.field)}
              onChange={(event) => {
                setPassword(event.target.value);
                if (failure.field) setFailure(NO_FAILURE);
              }}
              className={`${fieldControl} pr-12`}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
              className={`${iconButton} absolute right-0.5 top-1/2 -translate-y-1/2`}
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
          </div>
        </Field>
        <Field id={reasonId} label="Why are you leaving? (optional)">
          <textarea
            id={reasonId}
            value={reason}
            maxLength={DELETION_REASON_MAX}
            disabled={busy}
            onChange={(event) => setReason(event.target.value)}
            className={`${textareaControl} min-h-[88px] text-sm`}
          />
        </Field>
        <label className="flex min-h-[44px] cursor-pointer items-start gap-3 text-sm leading-[1.6] text-tl-body">
          <input
            type="checkbox"
            checked={understood}
            disabled={busy}
            onChange={(event) => setUnderstood(event.target.checked)}
            className="mt-[3px] h-5 w-5 shrink-0 accent-tl-danger"
          />
          <span>I understand my account will be deleted in 30 days unless I sign in before then.</span>
        </label>
        {/* Enter in a field submits through this hidden button; the visible one is in the footer. */}
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </ConfirmSheet>
  );
}

/**
 * The danger zone card on Settings → Admin Profile and on `/profile`: what
 * deleting the account does, a link to the full explanation on
 * www.mytalim.com, and "Delete account", which opens
 * {@link DeleteAccountSheet}.
 *
 * @param props - Where it sits.
 * @param props.level - The heading level: 3 under a settings section heading, 2 on a page.
 * @returns The card.
 */
export function DeleteAccountCard({ level = 2 }: { level?: 2 | 3 }) {
  const [open, setOpen] = useState(false);
  return (
    <section className={`${card} border-tl-danger/30`} aria-label="Danger zone">
      <CardHeader title="Danger zone" subtitle={DELETION_SUMMARY} level={level} />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <a
          href={DELETE_ACCOUNT_INFO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${textLink} whitespace-normal`}
        >
          What happens when you delete your account
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <button type="button" className={dangerGhostButton} onClick={() => setOpen(true)}>
          Delete account
        </button>
      </div>
      <DeleteAccountSheet open={open} onOpenChange={setOpen} />
    </section>
  );
}
