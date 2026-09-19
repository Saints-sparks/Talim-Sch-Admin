import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnnouncementAudience } from "@/app/services/announcement.service";
import { AUDIENCE_OPTIONS } from "../announcement.presentation";
import type { Schedule } from "./announcementForm";

const SCHEDULE_OPTIONS: ReadonlyArray<{ value: Schedule; title: string; caption: string }> = [
  { value: "now", title: "Publish immediately", caption: "Send this announcement right away." },
  { value: "later", title: "Schedule for later", caption: "Choose a future date and time." },
];

interface AudienceSchedulePanelProps {
  audience: AnnouncementAudience[];
  schedule: Schedule;
  scheduledFor: string;
  onToggleAudience: (audience: AnnouncementAudience) => void;
  onScheduleChange: (schedule: Schedule) => void;
  onScheduledForChange: (value: string) => void;
}

/** The side column: who receives it and when it goes out. */
export function AudienceSchedulePanel({
  audience,
  schedule,
  scheduledFor,
  onToggleAudience,
  onScheduleChange,
  onScheduledForChange,
}: AudienceSchedulePanelProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Audience</p>
        <div className="mt-2 grid gap-2">
          {AUDIENCE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={audience.includes(option.value)}
              onClick={() => onToggleAudience(option.value)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition",
                audience.includes(option.value)
                  ? "border-[#003366] bg-blue-50 dark:bg-blue-900/30 text-[#003366] dark:text-blue-400 dark:border-blue-700"
                  : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700",
              )}
            >
              <Users className="h-4 w-4" />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Schedule</p>
        <div className="mt-2 grid gap-2">
          {SCHEDULE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={schedule === option.value}
              onClick={() => onScheduleChange(option.value)}
              className={cn(
                "rounded-xl border p-3 text-left transition",
                schedule === option.value
                  ? "border-[#003366] bg-blue-50 dark:bg-blue-900/30 dark:border-blue-700"
                  : "border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700",
              )}
            >
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{option.title}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{option.caption}</p>
            </button>
          ))}
        </div>
        {schedule === "later" && (
          <input
            type="datetime-local"
            aria-label="Scheduled date and time"
            value={scheduledFor}
            onChange={(event) => onScheduledForChange(event.target.value)}
            className="mt-3 h-11 w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm focus:border-[#003366] dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
          />
        )}
      </div>
    </div>
  );
}
