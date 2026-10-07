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
        <p className="text-sm font-bold text-tl-body">Audience</p>
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
                  ? "border-tl-brand bg-tl-select text-tl-brand"
                  : "border-tl-line text-tl-muted hover:bg-tl-bg"
              )}
            >
              <Users className="h-4 w-4" />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-tl-body">Schedule</p>
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
                  ? "border-tl-brand bg-tl-select"
                  : "border-tl-line hover:bg-tl-bg"
              )}
            >
              <p className="text-sm font-bold text-tl-ink">{option.title}</p>
              <p className="mt-1 text-xs text-tl-muted">{option.caption}</p>
            </button>
          ))}
        </div>
        {schedule === "later" && (
          <input
            type="datetime-local"
            aria-label="Scheduled date and time"
            value={scheduledFor}
            onChange={(event) => onScheduledForChange(event.target.value)}
            className="mt-3 h-11 w-full rounded-xl border border-tl-line bg-tl-surface px-3 text-sm font-semibold text-tl-body shadow-sm focus:border-tl-link focus:ring-2 focus:ring-tl-link"
          />
        )}
      </div>
    </div>
  );
}
