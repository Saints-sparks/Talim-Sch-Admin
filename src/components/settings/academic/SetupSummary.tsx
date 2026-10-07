import type { AcademicProgress } from "@/hooks/settings/useAcademicSetup";
import { Card, StatusBadge } from "@/components/settings/ui";
import { formatSetupDate } from "./academicForms";

/** One of the three summary tiles at the top of the section. */
function SummaryCard({
  label,
  value,
  range,
}: {
  label: string;
  value?: string;
  range?: { startDate: string; endDate: string };
}) {
  return (
    <Card className="p-4">
      <p className="text-xs text-tl-muted mb-1">{label}</p>
      <p className="text-lg font-bold text-tl-ink">{value || "Not set"}</p>
      {range && (
        <>
          <StatusBadge status="Active" />
          <p className="text-xs text-tl-muted mt-2">
            {formatSetupDate(range.startDate)} – {formatSetupDate(range.endDate)}
          </p>
        </>
      )}
    </Card>
  );
}

/** The year-progress tile. */
function ProgressCard({ progress }: { progress: AcademicProgress | null }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-tl-muted mb-1">Academic Progress</p>
      {progress ? (
        <>
          <p className="text-lg font-bold text-tl-ink">{progress.pct}%</p>
          <div className="w-full bg-tl-track rounded-full h-1.5 mt-2">
            <div
              className="bg-tl-brand-fill h-1.5 rounded-full transition-all"
              style={{ width: `${progress.pct}%` }}
            />
          </div>
          <p className="text-xs text-tl-muted mt-1">
            {progress.daysElapsed}d elapsed · {progress.daysRemaining}d remaining
          </p>
        </>
      ) : (
        <p className="text-sm text-tl-faint">No active year</p>
      )}
    </Card>
  );
}

interface SetupSummaryProps {
  currentYear?: { year: string; startDate: string; endDate: string };
  currentTerm?: { name: string; startDate: string; endDate: string };
  progress: AcademicProgress | null;
}

/** The current year, current term and year-progress tiles. */
export function SetupSummary({ currentYear, currentTerm, progress }: SetupSummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <SummaryCard label="Current Academic Year" value={currentYear?.year} range={currentYear} />
      <SummaryCard label="Current Term" value={currentTerm?.name} range={currentTerm} />
      <ProgressCard progress={progress} />
    </div>
  );
}
