"use client";

/**
 * The "Subjects Overview" grid on the curriculum dashboard's Structure tab:
 * one tile per subject in its tone.
 *
 * Read-only: the tile opens the subject, and the "create your first subject"
 * call to action is gated on `manage:curriculum`.
 */
import React from "react";
import { BookOpen, ChevronRight, GraduationCap, Plus } from "lucide-react";
import type { Subject } from "@/app/services/subjects.service";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  Banner,
  CardHeader,
  EmptyNote,
  Pill,
  card,
  focusRing,
  primaryButton,
  rowButton,
  skeletonBlock,
  toneClass,
} from "@/components/tl";
import { Permission } from "@/lib/permissions";
import { getErrorMessage } from "@/lib/apiError";

/** Props for {@link SubjectsOverview}. */
interface SubjectsOverviewProps {
  /** The subjects to show (already filtered by the search). */
  subjects: Subject[];
  /** True while they load. */
  isLoading: boolean;
  /** Why they failed, if they did. */
  error: unknown;
  /** Loads them again. */
  onRetry: () => void;
  /** True when the empty grid is the result of a search rather than no data. */
  isFiltered: boolean;
  /** Opens one subject in the structure screen. */
  onOpenSubject: (subjectId: string) => void;
  /** Opens the add-subject sheet. */
  onAddSubject: () => void;
}

/**
 * Renders the subject grid.
 *
 * @param props - The subjects to show plus query and filter state.
 * @param props.subjects - The subjects.
 * @param props.isLoading - Whether they load.
 * @param props.error - Why they failed.
 * @param props.onRetry - Retries.
 * @param props.isFiltered - Whether a search narrowed them.
 * @param props.onOpenSubject - Opens a subject.
 * @param props.onAddSubject - Adds a subject.
 * @returns The card.
 */
export function SubjectsOverview({
  subjects,
  isLoading,
  error,
  onRetry,
  isFiltered,
  onOpenSubject,
  onAddSubject,
}: SubjectsOverviewProps) {
  return (
    <section className={card}>
      <CardHeader
        title="Subjects Overview"
        subtitle="Open a subject to see and change its courses."
      />

      <div className="mt-[18px]">
        {isLoading ? (
          <div
            aria-busy="true"
            aria-label="Loading subjects"
            className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))]"
          >
            {[0, 1, 2].map((tile) => (
              <div key={tile} aria-hidden className={`${skeletonBlock} h-32 rounded-2xl`} />
            ))}
          </div>
        ) : error ? (
          <Banner
            tone="danger"
            role="alert"
            action={
              <button type="button" onClick={onRetry} className={rowButton}>
                Try again
              </button>
            }
          >
            {getErrorMessage(error, "Could not load subjects.")}
          </Banner>
        ) : subjects.length > 0 ? (
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))]">
            {subjects.map((subject) => {
              const count = subject.courseCount ?? subject.courses?.length ?? 0;
              return (
                <button
                  key={subject._id}
                  type="button"
                  onClick={() => onOpenSubject(subject._id)}
                  className={`${toneClass(subject._id)} group flex flex-col gap-3 rounded-2xl border border-tl-line-soft bg-tl-surface p-4 text-left transition-colors hover:border-tl-control hover:bg-tl-subtle ${focusRing}`}
                >
                  <span className="flex w-full items-start justify-between gap-2">
                    <span
                      aria-hidden
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-tone-bd bg-tone-bg text-tone-fg"
                    >
                      <BookOpen className="h-[18px] w-[18px]" />
                    </span>
                    <Pill tone="info">{subject.code}</Pill>
                  </span>
                  <span className="text-[15px] font-extrabold text-tl-ink">{subject.name}</span>
                  <span className="flex w-full items-center justify-between gap-2 text-[13px] text-tl-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4" aria-hidden />
                      {count} courses
                    </span>
                    <ChevronRight
                      aria-hidden
                      className="h-4 w-4 text-tl-faint transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <EmptyNote
            icon={<BookOpen />}
            title={isFiltered ? "No subjects found" : "No subjects created yet"}
            action={
              !isFiltered ? (
                <PermissionGate permission={Permission.MANAGE_CURRICULUM}>
                  <button type="button" onClick={onAddSubject} className={primaryButton}>
                    <Plus className="h-4 w-4" aria-hidden />
                    Create Your First Subject
                  </button>
                </PermissionGate>
              ) : undefined
            }
          >
            {isFiltered
              ? "Try adjusting your search criteria to find what you're looking for."
              : "Get started by creating your first subject to organize your curriculum."}
          </EmptyNote>
        )}
      </div>
    </section>
  );
}
