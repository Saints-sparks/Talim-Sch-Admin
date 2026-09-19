"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Permission } from "@/lib/permissions";
import type { TeacherDraft } from "@/hooks/users/useTeacherEditor";

/** Sets one field of the teacher draft. */
export type SetField = <K extends keyof TeacherDraft>(field: K, value: TeacherDraft[K]) => void;
/** Ticks or unticks one value in one of the draft's list fields. */
export type ToggleList = (
  field: "assignedClasses" | "assignedCourses" | "availabilityDays",
  value: string,
) => void;

/** Input surface classes shared by every field of the editor. */
export const inputClass = "bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600";

/** A field with its label. */
export function Labelled({ htmlFor, label, children }: { htmlFor: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-gray-700 dark:text-slate-300">
        {label}
      </Label>
      {children}
    </div>
  );
}

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
  children: React.ReactNode;
}

/** One tab of the editor: its fields, an Update button and the deactivate action. */
export function SectionShell({
  title,
  onSubmit,
  isSaving,
  onDeactivate,
  isDeactivated,
  children,
}: SectionShellProps) {
  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between pt-6 border-t border-gray-200 dark:border-slate-700">
          <PermissionGate permission={Permission.MANAGE_TEACHERS}>
            <Button
              type="button"
              variant="outline"
              className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={onDeactivate}
              disabled={isDeactivated}
            >
              {isDeactivated ? "Already Deactivated" : "Deactivate Teacher"}
            </Button>
          </PermissionGate>
          <Button type="submit" className="bg-blue-900 hover:bg-blue-800 px-8" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Props every tab of the editor takes. */
export interface TabProps {
  draft: TeacherDraft;
  setField: SetField;
  onSubmit: (event: React.FormEvent) => void;
  isSaving: boolean;
  onDeactivate: () => void;
  isDeactivated: boolean;
}

/** A titled, scrollable list of tick boxes. */
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
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{legend}</legend>
      <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 p-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">{emptyMessage}</p>
        ) : (
          items.map((item) => (
            <label key={item.id} className="flex items-center gap-3 text-sm text-gray-700 dark:text-slate-200">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
