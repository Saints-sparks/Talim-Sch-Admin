import React from "react";

/** The colour family of a notice. */
export type NoticeTone = "info" | "success" | "warning" | "danger";

const TONES: Record<NoticeTone, { box: string; icon: string; text: string; title: string }> = {
  info: {
    box: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900",
    icon: "text-blue-600 dark:text-blue-300",
    text: "text-blue-700 dark:text-blue-200",
    title: "text-blue-900 dark:text-blue-100",
  },
  success: {
    box: "bg-green-50 dark:bg-green-950/40 border-green-100 dark:border-green-900",
    icon: "text-green-600 dark:text-green-400",
    text: "text-green-900 dark:text-green-200",
    title: "text-green-900 dark:text-green-100",
  },
  warning: {
    box: "bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900",
    icon: "text-amber-600 dark:text-amber-400",
    text: "text-amber-900 dark:text-amber-200",
    title: "text-amber-900 dark:text-amber-100",
  },
  danger: {
    box: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900",
    icon: "text-red-600 dark:text-red-400",
    text: "text-red-800 dark:text-red-200",
    title: "text-red-900 dark:text-red-100",
  },
};

const ICON_PATHS: Record<NoticeTone, string> = {
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  warning: "M12 9v3.75m0 3.75h.008v.008H12V16.5zm9-4.5a9 9 0 11-18 0 9 9 0 0118 0z",
  danger: "M12 9v3.75m0 3.75h.008v.008H12V16.5zm9-4.5a9 9 0 11-18 0 9 9 0 0118 0z",
};

interface InfoNoticeProps {
  tone?: NoticeTone;
  /** Bold first line; omit for a single paragraph. */
  title?: string;
  /** The notice text. */
  children: React.ReactNode;
  /** Announced to screen readers when it appears (used for errors). */
  alert?: boolean;
  /** Box shape: the teacher wizard uses larger corners. */
  rounded?: "lg" | "xl";
}

/**
 * A coloured callout with a status icon, readable in both themes.
 *
 * @param props - Tone, optional title and the message.
 * @returns The notice.
 */
export function InfoNotice({
  tone = "info",
  title,
  children,
  alert = false,
  rounded = "xl",
}: InfoNoticeProps) {
  const t = TONES[tone];
  return (
    <div
      role={alert ? "alert" : undefined}
      className={`border p-4 ${rounded === "xl" ? "rounded-xl" : "rounded-lg"} ${t.box}`}
    >
      <div className="flex items-start gap-3">
        <svg
          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${t.icon}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICON_PATHS[tone]} />
        </svg>
        <div>
          {title && <h5 className={`text-sm font-medium mb-1 ${t.title}`}>{title}</h5>}
          <div className={`text-sm leading-relaxed ${t.text}`}>{children}</div>
        </div>
      </div>
    </div>
  );
}
