/**
 * The pieces both profile cards share: a labelled field that flips between a
 * read-only value and an input, the card header with its Edit/Cancel toggle,
 * and the save bar.
 */
"use client";

import React from "react";
import { Pencil, Save, X } from "lucide-react";

/** Props for {@link ProfileField}. */
export interface ProfileFieldProps {
  /** The field label. */
  label: string;
  /** Leading icon. */
  icon: React.ElementType;
  /** Current value. */
  value: string;
  /** Whether the field is editable right now. */
  editing: boolean;
  /** Input type. */
  type?: string;
  /** Placeholder shown while editing. */
  placeholder?: string;
  /** Note shown under a field that cannot be edited here. */
  note?: string;
  /** Called with the new value. */
  onChange?: (value: string) => void;
}

/**
 * @param props - See {@link ProfileFieldProps}.
 * @returns One profile field.
 */
export function ProfileField({
  label,
  icon: Icon,
  value,
  editing,
  type = "text",
  placeholder,
  note,
  onChange,
}: ProfileFieldProps) {
  const id = `profile-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-slate-400"
      >
        <Icon className="w-4 h-4" />
        {label}
      </label>
      {editing ? (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition text-gray-900 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
      ) : (
        <p className="text-gray-900 font-medium dark:text-slate-100">
          {value || <span className="text-gray-400 font-normal dark:text-slate-500">Not set</span>}
        </p>
      )}
      {note && <p className="text-xs text-gray-400 dark:text-slate-500">{note}</p>}
    </div>
  );
}

/** Props for {@link ProfileSelectField}. */
export interface ProfileSelectFieldProps {
  /** The field label. */
  label: string;
  /** Leading icon. */
  icon: React.ElementType;
  /** Current value. */
  value: string;
  /** Whether the field is editable right now. */
  editing: boolean;
  /** The options to choose from. */
  options: ReadonlyArray<{ value: string; label: string }>;
  /** Placeholder for the empty option. */
  placeholder?: string;
  /** Called with the new value. */
  onChange?: (value: string) => void;
}

/**
 * @param props - See {@link ProfileSelectFieldProps}.
 * @returns One profile select field.
 */
export function ProfileSelectField({
  label,
  icon: Icon,
  value,
  editing,
  options,
  placeholder,
  onChange,
}: ProfileSelectFieldProps) {
  const id = `profile-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-slate-400"
      >
        <Icon className="w-4 h-4" />
        {label}
      </label>
      {editing ? (
        <div className="relative">
          <select
            id={id}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full appearance-none px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition text-gray-900 text-sm pr-8 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">{placeholder || "Select…"}</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      ) : (
        <p className="text-gray-900 font-medium dark:text-slate-100">
          {value || <span className="text-gray-400 font-normal dark:text-slate-500">Not set</span>}
        </p>
      )}
    </div>
  );
}

/** Props for {@link ProfileCardHeader}. */
export interface ProfileCardHeaderProps {
  /** The card's title. */
  title: string;
  /** Whether this card is the one being edited. */
  editing: boolean;
  /** Whether the signed-in role may edit it at all; hides the toggle when not. */
  canEdit: boolean;
  /** Starts or cancels editing. */
  onToggle: () => void;
}

/**
 * @param props - See {@link ProfileCardHeaderProps}.
 * @returns The card header.
 */
export function ProfileCardHeader({ title, editing, canEdit, onToggle }: ProfileCardHeaderProps) {
  return (
    <div className="bg-gray-100 px-6 py-4 flex items-center justify-between border-b border-gray-200 dark:bg-slate-800 dark:border-slate-700">
      <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">{title}</h2>
      {canEdit && (
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-[#003366] transition-colors dark:text-slate-300 dark:hover:text-blue-300"
        >
          {editing ? (
            <>
              <X className="w-4 h-4" /> Cancel
            </>
          ) : (
            <>
              <Pencil className="w-4 h-4" /> Edit
            </>
          )}
        </button>
      )}
    </div>
  );
}

/** Props for {@link ProfileSaveBar}. */
export interface ProfileSaveBarProps {
  /** True while the save is in flight. */
  saving: boolean;
  /** True while an image upload is still running. */
  blocked?: boolean;
  /** Commits the edit. */
  onSave: () => void;
  /** Abandons the edit. */
  onCancel: () => void;
}

/**
 * @param props - See {@link ProfileSaveBarProps}.
 * @returns The save/cancel bar shown under a card being edited.
 */
export function ProfileSaveBar({ saving, blocked = false, onSave, onCancel }: ProfileSaveBarProps) {
  return (
    <div className="flex items-center gap-3 pt-4 mt-2 border-t border-gray-100 dark:border-slate-700">
      <button
        type="button"
        onClick={onSave}
        disabled={saving || blocked}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#003366] text-white text-sm font-semibold rounded-lg hover:bg-[#002244] transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Changes
          </>
        )}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Cancel
      </button>
    </div>
  );
}
