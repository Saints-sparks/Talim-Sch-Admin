import { Image as ImageIcon, Paperclip } from "lucide-react";
import { CONTENT_MAX, TITLE_MAX } from "./announcementForm";

interface ContentFieldsProps {
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
}

/** The title input and the content box, each with its character counter. */
export function ContentFields({ title, content, onTitleChange, onContentChange }: ContentFieldsProps) {
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="announcement-title" className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Title
        </label>
        <input
          id="announcement-title"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          maxLength={TITLE_MAX}
          placeholder="Enter announcement title..."
          className="mt-2 h-12 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 text-sm shadow-sm focus:border-[#003366] dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
        />
        <p className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">
          {title.length}/{TITLE_MAX}
        </p>
      </div>

      <div>
        <label htmlFor="announcement-content" className="text-sm font-bold text-slate-700 dark:text-slate-300">
          Content
        </label>
        <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-2">
            <span className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Plain text
            </span>
            <span className="ml-auto flex items-center gap-2 text-slate-400 dark:text-slate-500">
              <ImageIcon className="h-4 w-4" />
              <Paperclip className="h-4 w-4" />
            </span>
          </div>
          <textarea
            id="announcement-content"
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            maxLength={CONTENT_MAX}
            rows={7}
            placeholder="Write your announcement content..."
            className="w-full resize-none border-0 bg-white dark:bg-slate-700 p-4 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0"
          />
        </div>
        <p className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">
          {content.length}/{CONTENT_MAX}
        </p>
      </div>
    </div>
  );
}
