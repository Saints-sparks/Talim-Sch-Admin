/** How the announcement will read to a recipient. */
export function RecipientPreview({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-2xl border border-tl-line bg-tl-subtle p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-tl-faint">
        Recipient preview
      </p>
      <h3 className="mt-3 text-lg font-bold text-tl-ink">{title || "Announcement title"}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-tl-muted">
        {content || "Your announcement content will appear here."}
      </p>
    </div>
  );
}
