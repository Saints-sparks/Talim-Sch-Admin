import React from "react";

/**
 * First-load placeholder for the leave-request queue: the header, the filter
 * tabs and a grid of cards, in the shape the real queue takes so the list does
 * not jump when the data lands.
 */
const LeaveRequestSkeleton: React.FC = () => {
  const bar = "rounded bg-slate-200 dark:bg-slate-700";

  return (
    <div className="animate-pulse" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading leave requests</span>

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className={`h-6 w-40 ${bar}`} />
        <div className="flex flex-wrap gap-2">
          <div className={`h-10 w-[300px] max-w-full ${bar}`} />
          {[0, 1, 2, 3].map((tab) => (
            <div key={tab} className={`h-9 w-24 ${bar}`} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((card) => (
          <div
            key={card}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="mb-4 flex items-center">
              <div className={`mr-3 h-11 w-11 rounded-full bg-slate-200 dark:bg-slate-700`} />
              <div className="flex-1 space-y-2">
                <div className={`h-4 w-32 ${bar}`} />
                <div className={`h-3 w-20 ${bar}`} />
              </div>
              <div className={`h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700`} />
            </div>

            <div className="space-y-3">
              <div className={`h-6 w-40 ${bar}`} />
              <div className={`h-6 w-52 ${bar}`} />
              <div className={`h-6 w-36 ${bar}`} />
              <div className={`h-16 w-full ${bar}`} />
            </div>

            {card < 3 && (
              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                <div className={`h-9 flex-1 ${bar}`} />
                <div className={`h-9 flex-1 ${bar}`} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaveRequestSkeleton;
