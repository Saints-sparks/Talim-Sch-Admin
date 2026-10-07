"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import {
  card,
  cardTitle,
  dangerGhostButton,
  fieldLabel,
  focusRing,
  primaryButton,
} from "@/components/tl";
import type { TeacherDraft } from "@/hooks/users/useTeacherEditor";

/** Sets one field of the teacher draft. */
export type SetField = <K extends keyof TeacherDraft>(field: K, value: TeacherDraft[K]) => void;
/** Ticks or unticks one value in one of the draft's list fields. */
export type ToggleList = (
  field: "assignedClasses" | "assignedCourses" | "availabilityDays",
  value: string,
) => void;

/**
 * A field with its label.
 *
 * @param props - The control's id, the label and the control.
 * @param props.htmlFor - The control's id.
 * @param props.label - The label.
 * @param props.children - The control.
 * @returns The field.
 */
export function Labelled({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={fieldLabel}>
        {label}
      </label>
      {children}
    </div>
  );
}

/** Props for {@link SectionShell}. */
interface SectionShellProps {
  /** Section title. */
  title: string;
  /** Submits this section. */
  onSubmit: (event: React.FormEvent) => void;
  /** True while this section is saving. */
  isSaving: boolean;
  /** Deactivates the teacher. */
  onDeactivate: () => void;
  /** True when the teacher is already deactivated. */
  isDeactivated: boolean;
  /** The section's fields. */
  children: React.ReactNode;
}

/**
 * One tab of the editor as a card: its fields, then Update and the deactivate
 * action along the bottom.
 *
 * @param props - See {@link SectionShellProps}.
 * @param props.title - The heading.
 * @param props.onSubmit - Save handler.
 * @param props.isSaving - Whether this section is saving.
 * @param props.onDeactivate - Deactivate handler.
 * @param props.isDeactivated - Whether the teacher is deactivated.
 * @param props.children - The fields.
 * @returns The form card.
 */
export function SectionShell({
  title,
  onSubmit,
  isSaving,
  onDeactivate,
  isDeactivated,
  children,
}: SectionShellProps) {
  return (
    <form onSubmit={onSubmit} className={card}>
      <h2 className={cardTitle}>{title}</h2>
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">{children}</div>

      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-tl-line-soft pt-5 sm:flex-row sm:justify-between">
        <PermissionGate permission={Permission.MANAGE_TEACHERS}>
          <button
            type="button"
            className={dangerGhostButton}
            onClick={onDeactivate}
            disabled={isDeactivated}
          >
            {isDeactivated ? "Already Deactivated" : "Deactivate Teacher"}
          </button>
        </PermissionGate>
        <button type="submit" className={`${primaryButton} sm:min-w-[140px]`} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Updating...
            </>
          ) : (
            "Update"
          )}
        </button>
      </div>
    </form>
  );
}

/** Props every tab of the editor takes. */
export interface TabProps {
  /** The editable copy of the profile. */
  draft: TeacherDraft;
  /** Sets one field. */
  setField: SetField;
  /** Saves this section. */
  onSubmit: (event: React.FormEvent) => void;
  /** True while this section is saving. */
  isSaving: boolean;
  /** Deactivates the teacher. */
  onDeactivate: () => void;
  /** True when the teacher is already deactivated. */
  isDeactivated: boolean;
}

/**
 * A titled, scrollable list of tick boxes, each row 44px tall.
 *
 * @param props - The legend, the items and the selection.
 * @param props.legend - The list's title.
 * @param props.emptyMessage - Shown when there are no items.
 * @param props.items - The choices.
 * @param props.selected - The ticked ids.
 * @param props.onToggle - Ticks or unticks one.
 * @returns The fieldset.
 */
export function CheckboxList({
  legend,
  emptyMessage,
  items,
  selected,
  onToggle,
}: {
  legend: string;
  emptyMessage: string;
  items: Array<{ id: string; label: string }>;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className={`${fieldLabel} mb-1.5`}>{legend}</legend>
      <div className="max-h-60 overflow-y-auto rounded-2xl border border-tl-line-soft bg-tl-subtle p-1.5">
        {items.length === 0 ? (
          <p className="px-2.5 py-2 text-sm text-tl-muted">{emptyMessage}</p>
        ) : (
          items.map((item) => (
            <label
              key={item.id}
              className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl px-2.5 text-sm font-semibold text-tl-body hover:bg-tl-surface"
            >
              <input
                type="checkbox"
                className={`h-[18px] w-[18px] shrink-0 cursor-pointer accent-tl-brand-fill ${focusRing}`}
                checked={selected.includes(item.id)}
                onChange={() => onToggle(item.id)}
              />
              <span>{item.label}</span>
            </label>
          ))
        )}
      </div>
    </fieldset>
  );
}
