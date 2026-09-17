import React from "react";

/**
 * First-load placeholder for the announcements dashboard: the header band, the
 * four stat cards, the list and the analytics rail, in the shape the real page
 * takes so nothing shifts when the data lands.
 */
const AnnouncementsSkeleton: React.FC = () => {
  const bar = "rounded bg-slate-200 dark:bg-slate-700";
  const card =
    "rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5";

  return (
    <div className="min-h-full bg-white dark:bg-slate-900" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading announcements</span>

      <section className="animate-pulse border-b border-slate-200 dark:border-slate-700 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1480px]">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className={`h-6 w-56 ${bar}`} />
              <div className={`h-9 w-72 ${bar}`} />
              <div className={`h-4 w-96 max-w-full ${bar}`} />
            </div>
            <div className="flex gap-3">
              <div className={`h-11 w-64 ${bar}`} />
              <div className={`h-11 w-44 ${bar}`} />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className={card}>
                <div className={`h-11 w-11 ${bar}`} />
                <div className={`mt-5 h-8 w-20 ${bar}`} />
                <div className={`mt-2 h-4 w-32 ${bar}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1480px] animate-pulse px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 px-5 py-4">
              {[0, 1, 2, 3].map((tab) => (
                <div key={tab} className={`h-9 w-24 ${bar}`} />
              ))}
            </div>
            <div className="space-y-4 p-5">
              {[0, 1, 2, 3, 4].map((row) => (
                <div key={row} className={`h-12 ${bar}`} />
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            {[0, 1, 2].map((item) => (
              <div key={item} className={card}>
                <div className={`h-4 w-24 ${bar}`} />
                <div className={`mt-4 h-24 ${bar}`} />
              </div>
            ))}
          </aside>
        </div>
      </main>
    </div>
  );
};

export default AnnouncementsSkeleton;
