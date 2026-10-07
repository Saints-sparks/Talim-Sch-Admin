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
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-tl-muted">
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
          className="w-full px-3 py-2.5 border border-tl-line rounded-lg focus:outline-none focus:ring-2 focus:ring-tl-link focus:border-tl-link transition text-tl-ink text-sm"
        />
      ) : (
        <p className="text-tl-ink font-medium">
          {value || <span className="text-tl-faint font-normal">Not set</span>}
        </p>
      )}
      {note && <p className="text-xs text-tl-faint">{note}</p>}
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
      <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-tl-muted">
        <Icon className="w-4 h-4" />
        {label}
      </label>
      {editing ? (
        <div className="relative">
          <select
            id={id}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full appearance-none px-3 py-2.5 border border-tl-line rounded-lg focus:outline-none focus:ring-2 focus:ring-tl-link focus:border-tl-link transition text-tl-ink text-sm pr-8"
          >
            <option value="">{placeholder || "Select…"}</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
            <svg
              className="w-4 h-4 text-tl-faint"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      ) : (
        <p className="text-tl-ink font-medium">
          {value || <span className="text-tl-faint font-normal">Not set</span>}
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
    <div className="bg-tl-track px-6 py-4 flex items-center justify-between border-b border-tl-line">
      <h2 className="text-base font-semibold text-tl-ink">{title}</h2>
      {canEdit && (
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 text-sm font-medium text-tl-muted hover:text-tl-brand transition-colors"
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
    <div className="flex items-center gap-3 pt-4 mt-2 border-t border-tl-line-soft">
      <button
        type="button"
        onClick={onSave}
        disabled={saving || blocked}
        className="flex items-center gap-2 px-5 py-2.5 bg-tl-brand-fill text-white text-sm font-semibold rounded-lg hover:bg-tl-brand-fill-hover transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? (
          <>
            <div className="w-4 h-4 border-2 border-tl-surface border-t-transparent rounded-full animate-spin" />
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
        className="px-5 py-2.5 text-sm font-medium text-tl-muted bg-tl-surface border border-tl-line rounded-lg hover:bg-tl-bg transition disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}
