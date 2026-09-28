"use client";

import React, { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AlertCircle, CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { useAcademicYears, useTerms } from "@/hooks/queries/reference";
import { useCalendarEventActions, useCalendarEvents } from "@/hooks/calendar/useCalendarEvents";
import type { CalendarEvent } from "@/app/services/calendar-events.service";
import {
  Card,
  CardHeader,
  ModalShell,
  OutlineBtn,
  PrimaryBtn,
  SectionError,
  SectionHeader,
  SectionSkeleton,
} from "@/components/settings/ui";
import { CalendarEventDialog } from "./calendar/CalendarEventDialog";
import {
  emptyCalendarForm,
  eventDayCount,
  eventTypeLabel,
  formatEventRange,
  groupByMonth,
  termIdFor,
  toCalendarForm,
  toCreateEventPayload,
  toUpdateEventPayload,
  type CalendarFormValues,
  type TermWindow,
} from "./calendar/calendarForm";

const TITLE = "School Calendar";
const DESC = "Holidays, events and early closes for the term";

const TYPE_STYLES: Record<CalendarEvent["type"], string> = {
  holiday: "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  event: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  early_close:
    "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
};

/** Today in the browser's clock, `YYYY-MM-DD`. */
function todayDay(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type DialogState = { mode: "create" } | { mode: "edit"; event: CalendarEvent } | null;

/**
 * Settings → School Calendar (`/calendar-events`): the term's holidays,
 * events and early closes, grouped by month, with a dialog to add or change
 * one and a confirmation before deleting. Teachers see these on Today and
 * Timetable; a holiday cancels the day's lessons, an early close the lessons
 * from its closing time.
 *
 * @param props.canManage - False hides add, edit and delete.
 */
export function SchoolCalendarSection({ canManage }: { canManage: boolean }) {
  const termsQuery = useTerms();
  const yearsQuery = useAcademicYears();
  const [pickedTermId, setPickedTermId] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [deleting, setDeleting] = useState<CalendarEvent | null>(null);
  const actions = useCalendarEventActions();

  const terms = useMemo<TermWindow[]>(() => {
    const years = new Map((yearsQuery.data ?? []).map((y) => [y._id, y.year]));
    return (termsQuery.data ?? [])
      .filter((t) => t.startDate && t.endDate)
      .map((t) => ({
        id: t._id,
        name: years.has(t.academicYearId) ? `${years.get(t.academicYearId)} · ${t.name}` : t.name,
        start: t.startDate.slice(0, 10),
        end: t.endDate.slice(0, 10),
        isCurrent: t.isCurrent,
      }))
      .sort((a, b) => a.start.localeCompare(b.start));
  }, [termsQuery.data, yearsQuery.data]);

  const today = todayDay();
  const term =
    terms.find((t) => t.id === pickedTermId) ??
    terms.find((t) => t.isCurrent) ??
    terms.find((t) => t.start <= today && today <= t.end);
  // Without a term, show everything from today on.
  const from = term?.start ?? today;
  const to = term?.end ?? "";

  const eventsQuery = useCalendarEvents(from, to, { enabled: !termsQuery.isLoading });
  const groups = useMemo(() => groupByMonth(eventsQuery.data ?? []), [eventsQuery.data]);

  if (termsQuery.isLoading || eventsQuery.isLoading) return <SectionSkeleton title={TITLE} desc={DESC} rows={2} />;
  if (eventsQuery.isError) {
    return (
      <SectionError
        title={TITLE}
        desc={DESC}
        error={eventsQuery.error}
        fallback="Failed to load the school calendar."
        onRetry={() => void eventsQuery.refetch()}
      />
    );
  }

  const defaultDay = term && (today < term.start || today > term.end) ? term.start : today;

  const submit = async (values: CalendarFormValues) => {
    const termId = termIdFor(terms, values.startDate);
    if (dialog?.mode === "edit") {
      await actions.update({ id: dialog.event.id, payload: toUpdateEventPayload(values, termId) });
    } else {
      await actions.create(toCreateEventPayload(values, termId));
    }
    setDialog(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await actions.remove(deleting.id);
      setDeleting(null);
    } catch {
      // The hook has toasted; keep the dialog open to retry or cancel.
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader title={TITLE} desc={DESC} />

      <Card>
        <CardHeader
          title={term ? term.name : "Upcoming"}
          action={
            <div className="flex items-center gap-2">
              {terms.length > 0 && (
                <>
                  <label htmlFor="cal-term" className="sr-only">
                    Term
                  </label>
                  <select
                    id="cal-term"
                    value={term?.id ?? ""}
                    onChange={(e) => setPickedTermId(e.target.value)}
                    className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:ring-2 focus:ring-[#003366]/10 outline-none"
                  >
                    {!term && <option value="">Upcoming</option>}
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                        {t.isCurrent ? " (current)" : ""}
                      </option>
                    ))}
                  </select>
                </>
              )}
              {canManage && (
                <PrimaryBtn onClick={() => setDialog({ mode: "create" })} className="!px-3 !py-1.5 !text-xs">
                  <Plus className="w-3.5 h-3.5" aria-hidden />
                  Add event
                </PrimaryBtn>
              )}
            </div>
          }
        />

        <div className="p-5">
          {groups.length === 0 ? (
            <div className="py-10 text-center">
              <CalendarDays className="w-8 h-8 mx-auto text-gray-300 dark:text-slate-600" aria-hidden />
              <p className="mt-3 text-sm font-medium text-gray-700 dark:text-slate-200">Nothing on the calendar yet</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                {canManage
                  ? "Add holidays, school events and early closes so teachers' days show them."
                  : "Holidays, events and early closes will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <section key={group.key} aria-labelledby={`cal-month-${group.key}`}>
                  <h4
                    id={`cal-month-${group.key}`}
                    className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400 mb-2"
                  >
                    {group.label}
                  </h4>
                  <ul className="divide-y divide-gray-100 dark:divide-slate-700 rounded-lg border border-gray-200 dark:border-slate-700">
                    {group.events.map((event) => (
                      <EventRow
                        key={event.id}
                        event={event}
                        canManage={canManage}
                        onEdit={() => setDialog({ mode: "edit", event })}
                        onDelete={() => setDeleting(event)}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </Card>

      <AnimatePresence>
        {dialog && (
          <CalendarEventDialog
            key={dialog.mode === "edit" ? dialog.event.id : "new"}
            title={dialog.mode === "edit" ? "Edit event" : "Add event"}
            initial={dialog.mode === "edit" ? toCalendarForm(dialog.event) : emptyCalendarForm(defaultDay)}
            saving={actions.saving}
            onCancel={() => setDialog(null)}
            onSubmit={submit}
          />
        )}
        {deleting && (
          <ModalShell title="Delete event?" onClose={() => (actions.deleting ? undefined : setDeleting(null))}>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-red-500" aria-hidden />
              </div>
              <div>
                <p className="text-sm text-gray-700 dark:text-slate-200 font-medium">
                  Delete &ldquo;{deleting.title}&rdquo;?
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {formatEventRange(deleting.startDate, deleting.endDate)} ·{" "}
                  {deleting.type === "holiday"
                    ? "lessons on these days will be back on teachers' timetables."
                    : "it disappears from teachers' calendars."}
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <OutlineBtn onClick={() => setDeleting(null)} disabled={actions.deleting}>
                  Cancel
                </OutlineBtn>
                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  disabled={actions.deleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                  {actions.deleting ? "Deleting…" : "Delete event"}
                </button>
              </div>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>
    </div>
  );
}

/** One event in the month list. */
function EventRow({
  event,
  canManage,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const days = eventDayCount(event.startDate, event.endDate);
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${TYPE_STYLES[event.type]}`}
      >
        {eventTypeLabel(event.type)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{event.title}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          {formatEventRange(event.startDate, event.endDate)}
          {days > 1 ? ` · ${days} days` : ""}
          {event.type === "early_close" && event.endsAt ? ` · closes at ${event.endsAt}` : ""}
        </p>
      </div>
      {canManage && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${event.title}`}
            className="p-2 rounded-md text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#003366] dark:focus-visible:ring-blue-500"
          >
            <Pencil className="w-4 h-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${event.title}`}
            className="p-2 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <Trash2 className="w-4 h-4" aria-hidden />
          </button>
        </div>
      )}
    </li>
  );
}
