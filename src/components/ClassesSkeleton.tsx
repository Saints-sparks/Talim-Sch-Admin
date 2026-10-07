import React from "react";
import { pagePad, pageStack, skeletonBlock } from "@/components/tl";

/** How many card placeholders fill the grid — one page of the real list. */
const CARDS = 8;

/**
 * The class list's loading state, in the tl look.
 *
 * Mirrors the real screen — the heading with its action, then a grid of
 * class cards — so the layout does not jump when the data lands. It pulses
 * only while it is on screen, and is announced once as busy.
 *
 * @returns The skeleton.
 */
const ClassesSkeleton: React.FC = () => {
  return (
    <div
      className={`${pagePad} ${pageStack}`}
      role="status"
      aria-busy="true"
      aria-label="Loading classes"
    >
      <span className="sr-only">Loading classes…</span>
      <div aria-hidden className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <div className={`${skeletonBlock} h-9 w-64 max-w-full rounded-lg`} />
          <div className={`${skeletonBlock} h-5 w-80 max-w-full rounded`} />
        </div>
        <div className={`${skeletonBlock} h-11 w-36 rounded-[14px]`} />
      </div>

      <div
        aria-hidden
        className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))]"
      >
        {Array.from({ length: CARDS }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 rounded-[22px] border border-tl-line bg-tl-surface p-[clamp(18px,2.4vw,24px)]"
          >
            <div className="flex items-center gap-3">
              <div className={`${skeletonBlock} h-12 w-12 rounded-2xl`} />
              <div className="flex flex-1 flex-col gap-2">
                <div className={`${skeletonBlock} h-5 w-28 rounded`} />
                <div className={`${skeletonBlock} h-3.5 w-20 rounded`} />
              </div>
            </div>
            <div className="flex gap-2">
              <div className={`${skeletonBlock} h-6 w-24 rounded-full`} />
              <div className={`${skeletonBlock} h-6 w-28 rounded-full`} />
            </div>
            <div className={`${skeletonBlock} h-12 w-full rounded-2xl`} />
            <div className={`${skeletonBlock} h-11 w-full rounded-[14px]`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassesSkeleton;
