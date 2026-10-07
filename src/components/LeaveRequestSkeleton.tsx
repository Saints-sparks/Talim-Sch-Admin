import React from "react";
import { skeletonBlock } from "@/components/tl/styles";

/**
 * First-load placeholder for the leave-request queue: the filter row and a
 * grid of cards in the tl look, in the shape the real queue takes so the list
 * does not jump when the data lands. Announced once as busy.
 *
 * @returns The skeleton.
 */
const LeaveRequestSkeleton: React.FC = () => {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="flex flex-col gap-[18px]">
      <span className="sr-only">Loading leave requests</span>

      <div aria-hidden className="flex flex-wrap items-center justify-between gap-3">
        <div className={`${skeletonBlock} h-[52px] w-[420px] max-w-full rounded-[13px]`} />
        <div className={`${skeletonBlock} h-11 w-[320px] max-w-full rounded-[13px]`} />
      </div>

      <div
        aria-hidden
        className="grid gap-[18px] [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]"
      >
        {[0, 1, 2, 3, 4, 5].map((card) => (
          <div key={card} className="rounded-[22px] border border-tl-line bg-tl-surface p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className={`${skeletonBlock} h-11 w-11 rounded-full`} />
              <div className={`${skeletonBlock} h-4 flex-1 rounded`} />
              <div className={`${skeletonBlock} h-6 w-20 rounded-full`} />
            </div>
            <div className="space-y-2.5">
              <div className={`${skeletonBlock} h-5 w-44 rounded`} />
              <div className={`${skeletonBlock} h-5 w-52 rounded`} />
              <div className={`${skeletonBlock} h-5 w-32 rounded`} />
              <div className={`${skeletonBlock} h-16 w-full rounded-2xl`} />
            </div>
            {card < 3 && (
              <div className="mt-4 flex gap-2.5 border-t border-tl-line-soft pt-3.5">
                <div className={`${skeletonBlock} h-11 flex-1 rounded-[14px]`} />
                <div className={`${skeletonBlock} h-11 flex-1 rounded-[14px]`} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaveRequestSkeleton;
