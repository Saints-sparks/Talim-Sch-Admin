/** How the announcement will read to a recipient. */
export function RecipientPreview({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Recipient preview
      </p>
      <h3 className="mt-3 text-lg font-bold text-slate-950 dark:text-white">{title || "Announcement title"}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600 dark:text-slate-300">
        {content || "Your announcement content will appear here."}
      </p>
    </div>
  );
}
