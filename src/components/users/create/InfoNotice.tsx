import React from "react";
import { Banner } from "@/components/tl";

/** The colour family of a notice. */
export type NoticeTone = "info" | "success" | "warning" | "danger";

/** Props for {@link InfoNotice}. */
interface InfoNoticeProps {
  /** The meaning; sets the colours and icon. */
  tone?: NoticeTone;
  /** Bold first line; omit for a single paragraph. */
  title?: string;
  /** The notice text. */
  children: React.ReactNode;
  /** Announced to screen readers when it appears (used for errors). */
  alert?: boolean;
  /** Kept for the callers; every notice wears the tl banner's corners. */
  rounded?: "lg" | "xl";
}

/**
 * A tinted callout with a status icon (the tl `Banner`), readable in both
 * themes.
 *
 * @param props - Tone, optional title and the message.
 * @param props.tone - The meaning.
 * @param props.title - The bold line.
 * @param props.children - The message.
 * @param props.alert - Whether to announce it.
 * @returns The notice.
 */
export function InfoNotice({ tone = "info", title, children, alert = false }: InfoNoticeProps) {
  return (
    <Banner tone={tone} title={title} role={alert ? "alert" : undefined}>
      {children}
    </Banner>
  );
}
