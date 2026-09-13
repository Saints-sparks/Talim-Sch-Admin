/**
 * Route-level loading state. A neutral page skeleton so navigation never
 * shows a blank frame; pages render their own section skeletons on top.
 */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-6 p-6" aria-busy="true" aria-label="Loading">
      <div className="h-7 w-56 rounded-md bg-gray-200 dark:bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-slate-800" />
        ))}
      </div>
      <div className="h-72 rounded-xl bg-gray-200 dark:bg-slate-800" />
    </div>
  );
}
