"use client";

/**
 * The "Recent Curriculum Content" card: the five newest entries teachers have
 * published as edge-to-edge rows, with its own loading, error and empty
 * states so a failed request never leaves the dashboard half-drawn.
 */
import React from "react";
import { Book, FileText } from "lucide-react";
import type { CurriculumContent } from "@/app/services/subjects.service";
import {
  contentTeacherDisplay,
  courseDisplay,
  termDisplay,
} from "@/components/curriculum/curriculum.presentation";
import {
  Banner,
  CardHeader,
  EmptyNote,
  Pill,
  cardFrame,
  rowButton,
  skeletonBlock,
  toneClass,
} from "@/components/tl";
import { getErrorMessage } from "@/lib/apiError";

/** Props for {@link RecentCurriculumContent}. */
interface RecentCurriculumContentProps {
  /** The entries, already sorted newest first. */
  entries: CurriculumContent[];
  /** True while they load. */
  isLoading: boolean;
  /** Why they failed, if they did. */
  error: unknown;
  /** Loads them again. */
  onRetry: () => void;
}

/**
 * Renders the card.
 *
 * @param props - The entries (already sorted newest first) and query state.
 * @param props.entries - The entries.
 * @param props.isLoading - Whether they load.
 * @param props.error - Why they failed.
 * @param props.onRetry - Retries.
 * @returns The card.
 */
export function RecentCurriculumContent({
  entries,
  isLoading,
  error,
  onRetry,
}: RecentCurriculumContentProps) {
  return (
    <section className={cardFrame}>
      <div className="px-[clamp(18px,2.4vw,24px)] pt-[clamp(18px,2.4vw,24px)]">
        <CardHeader
          title="Recent Curriculum Content"
          subtitle="The newest entries teachers have published."
        />
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div
            aria-busy="true"
            aria-label="Loading curriculum content"
            className="flex flex-col gap-3 px-[clamp(18px,2.4vw,24px)] pb-6"
          >
            {[0, 1, 2].map((row) => (
              <div key={row} aria-hidden className={`${skeletonBlock} h-16 rounded-2xl`} />
            ))}
          </div>
        ) : error ? (
          <div className="px-[clamp(18px,2.4vw,24px)] pb-6">
            <Banner
              tone="danger"
              role="alert"
              action={
                <button type="button" onClick={onRetry} className={rowButton}>
                  Try again
                </button>
              }
            >
              {getErrorMessage(error, "Could not load curriculum content.")}
            </Banner>
          </div>
        ) : entries.length > 0 ? (
          <ul>
            {entries.map((content) => (
              <li
                key={content._id}
                className="flex flex-wrap items-center gap-3.5 border-t border-tl-line-soft px-[clamp(18px,2.4vw,24px)] py-3.5 transition-colors hover:bg-tl-subtle"
              >
                <span
                  aria-hidden
                  className={`${toneClass(content.course?._id ?? content._id)} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-tone-bd bg-tone-bg text-tone-fg`}
                >
                  <Book className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold text-tl-ink">
                    {courseDisplay(content.course)}
                  </div>
                  <div className="mt-0.5 truncate text-[13px] text-tl-muted">
                    {termDisplay(content.term)} • {contentTeacherDisplay(content)}
                  </div>
                </div>
                <Pill tone="muted">{new Date(content.createdAt).toLocaleDateString()}</Pill>
              </li>
            ))}
          </ul>
        ) : (
          <div className="border-t border-tl-line-soft">
            <EmptyNote icon={<FileText />} title="No curriculum content yet">
              Start creating curriculum content to see them appear here
            </EmptyNote>
          </div>
        )}
      </div>
    </section>
  );
}
