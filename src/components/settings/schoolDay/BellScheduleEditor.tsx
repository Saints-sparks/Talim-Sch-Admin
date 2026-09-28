"use client";

import React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Coffee, Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, OutlineBtn } from "@/components/settings/ui";
import {
  addPeriod,
  isInTimeOrder,
  movePeriod,
  previewDay,
  removePeriod,
  sortByStart,
  updatePeriod,
  type PeriodDraft,
  type PeriodErrors,
} from "./bellSchedule";
import { FieldError, controlClasses, describedBy } from "./fields";

interface BellScheduleEditorProps {
  rows: PeriodDraft[];
  errors: PeriodErrors;
  canManage: boolean;
  onChange: (rows: PeriodDraft[]) => void;
}

/**
 * The bell schedule: an ordered list of periods and breaks, each with a name,
 * a start and an end. Rows move with the arrow buttons (the pair swaps time
 * slots, see `movePeriod`); keys are generated when a row is added and never
 * change, because timetable entries point at them.
 */
export function BellScheduleEditor({ rows, errors, canManage, onChange }: BellScheduleEditorProps) {
  const outOfOrder = !isInTimeOrder(rows);

  return (
    <Card>
      <CardHeader
        title="Bell schedule"
        action={
          canManage ? (
            <div className="flex gap-2">
              <OutlineBtn onClick={() => onChange(addPeriod(rows, true))} className="!px-3 !py-1.5 !text-xs">
                <Coffee className="w-3.5 h-3.5" aria-hidden />
                Add break
              </OutlineBtn>
              <OutlineBtn onClick={() => onChange(addPeriod(rows, false))} className="!px-3 !py-1.5 !text-xs">
                <Plus className="w-3.5 h-3.5" aria-hidden />
                Add period
              </OutlineBtn>
            </div>
          ) : undefined
        }
      />
      <div className="p-5 space-y-3">
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Periods teachers pick on the timetable, in time order. Breaks show on teachers&apos; days but
          cannot hold lessons. A period may start the minute the one before it ends.
        </p>

        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 dark:border-slate-600 p-6 text-center text-sm text-gray-500 dark:text-slate-400">
            No bell schedule yet. The timetable keeps free start and end times until you add periods.
          </div>
        ) : (
          <ol className="space-y-2" aria-label="Periods">
            {rows.map((row, index) => (
              <PeriodRow
                key={row.id}
                row={row}
                index={index}
                count={rows.length}
                errors={errors[row.id] ?? {}}
                canManage={canManage}
                onPatch={(patch) => onChange(updatePeriod(rows, row.id, patch))}
                onMove={(direction) => onChange(movePeriod(rows, index, direction))}
                onRemove={() => onChange(removePeriod(rows, row.id))}
              />
            ))}
          </ol>
        )}

        {canManage && outOfOrder && (
          <OutlineBtn onClick={() => onChange(sortByStart(rows))} className="!text-xs">
            <ArrowUpDown className="w-3.5 h-3.5" aria-hidden />
            Sort by time
          </OutlineBtn>
        )}

        <DayPreview rows={rows} />
      </div>
    </Card>
  );
}

interface PeriodRowProps {
  row: PeriodDraft;
  index: number;
  count: number;
  errors: PeriodErrors[string];
  canManage: boolean;
  onPatch: (patch: Partial<Pick<PeriodDraft, "label" | "startTime" | "endTime" | "isBreak">>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}

/** One period or break. */
function PeriodRow({ row, index, count, errors, canManage, onPatch, onMove, onRemove }: PeriodRowProps) {
  const base = `period-${row.id}`;
  const name = row.label.trim() || `Row ${index + 1}`;
  const iconBtn =
    "p-1.5 rounded-md text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003366] dark:focus-visible:ring-blue-500";

  return (
    <li
      className={`rounded-lg border p-3 ${
        row.isBreak
          ? "border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/10"
          : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
      }`}
    >
      <div className="flex flex-wrap items-start gap-3">
        {canManage && (
          <div className="flex flex-col pt-5">
            <button
              type="button"
              className={iconBtn}
              onClick={() => onMove(-1)}
              disabled={index === 0}
              aria-label={`Move ${name} earlier`}
            >
              <ArrowUp className="w-3.5 h-3.5" aria-hidden />
            </button>
            <button
              type="button"
              className={iconBtn}
              onClick={() => onMove(1)}
              disabled={index === count - 1}
              aria-label={`Move ${name} later`}
            >
              <ArrowDown className="w-3.5 h-3.5" aria-hidden />
            </button>
          </div>
        )}

        <div className="flex-1 min-w-[10rem]">
          <label htmlFor={`${base}-label`} className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
            Name
          </label>
          <input
            id={`${base}-label`}
            type="text"
            value={row.label}
            maxLength={60}
            disabled={!canManage}
            onChange={(e) => onPatch({ label: e.target.value })}
            className={controlClasses(Boolean(errors.label))}
            {...describedBy(`${base}-label`, errors.label, `${base}-key`)}
          />
          <FieldError controlId={`${base}-label`} message={errors.label} />
          <p id={`${base}-key`} className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">
            Key <span className="font-mono">{row.key}</span>
          </p>
        </div>

        <div className="w-32">
          <label htmlFor={`${base}-start`} className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
            Starts
          </label>
          <input
            id={`${base}-start`}
            type="time"
            value={row.startTime}
            disabled={!canManage}
            onChange={(e) => onPatch({ startTime: e.target.value })}
            className={controlClasses(Boolean(errors.startTime))}
            {...describedBy(`${base}-start`, errors.startTime)}
          />
          <FieldError controlId={`${base}-start`} message={errors.startTime} />
        </div>

        <div className="w-32">
          <label htmlFor={`${base}-end`} className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
            Ends
          </label>
          <input
            id={`${base}-end`}
            type="time"
            value={row.endTime}
            disabled={!canManage}
            onChange={(e) => onPatch({ endTime: e.target.value })}
            className={controlClasses(Boolean(errors.endTime))}
            {...describedBy(`${base}-end`, errors.endTime)}
          />
          <FieldError controlId={`${base}-end`} message={errors.endTime} />
        </div>

        <div className="flex items-center gap-2 pt-7">
          <input
            id={`${base}-break`}
            type="checkbox"
            checked={row.isBreak}
            disabled={!canManage}
            onChange={(e) => onPatch({ isBreak: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 text-[#003366] focus:ring-[#003366]"
          />
          <label htmlFor={`${base}-break`} className="text-xs text-gray-700 dark:text-slate-300">
            Break
          </label>
        </div>

        {canManage && (
          <div className="pt-6">
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Delete ${name}`}
              className="p-2 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <Trash2 className="w-4 h-4" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

/** The school day drawn to scale, with a text list for screen readers. */
function DayPreview({ rows }: { rows: PeriodDraft[] }) {
  const segments = previewDay(rows);
  if (!segments.length) return null;
  const first = segments[0].startTime;
  const last = segments[segments.length - 1].endTime;

  return (
    <div className="pt-3 border-t border-gray-100 dark:border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-slate-300">Preview of the day</h4>
        <span className="text-xs text-gray-500 dark:text-slate-400">
          {first} – {last}
        </span>
      </div>
      <div className="flex h-9 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700" aria-hidden>
        {segments.map((s, i) => (
          <div
            key={`${s.startTime}-${i}`}
            style={{ width: `${s.percent}%` }}
            title={`${s.label}: ${s.startTime}–${s.endTime} (${s.minutes} min)`}
            className={`flex items-center justify-center truncate px-1 text-[10px] font-medium border-r border-white/60 dark:border-slate-900/60 last:border-r-0 ${
              s.kind === "period"
                ? "bg-[#EBF0F7] dark:bg-blue-900/40 text-[#003366] dark:text-blue-200"
                : s.kind === "break"
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                  : "bg-gray-50 dark:bg-slate-900/40 text-gray-400 dark:text-slate-500"
            }`}
          >
            {s.percent > 6 ? s.label : ""}
          </div>
        ))}
      </div>
      <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600 dark:text-slate-300">
        {segments.map((s, i) => (
          <li key={`${s.startTime}-${i}-row`} className="flex justify-between gap-2">
            <span className={s.kind === "gap" ? "italic text-gray-400 dark:text-slate-500" : ""}>{s.label}</span>
            <span className="tabular-nums text-gray-500 dark:text-slate-400">
              {s.startTime}–{s.endTime} · {s.minutes} min
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
