"use client";

import React, { useId, type ReactNode } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyNote, focusRing, ghostButton, primaryButton, quietButton } from "@/components/tl";
import { DialogTitleBar, PersonAvatar, TextSearch, dialogOverlay, dialogPanel } from "./parts";

/** One person the picker offers. */
export interface PickerPerson {
  /** The id the selection is kept by. */
  id: string;
  /** The name shown. */
  name: string;
  /** The avatar's initials. */
  initials: string;
  /** The grey lines under the name (role, email, children). */
  details: ReactNode[];
}

/** Props for {@link MemberPickerDialog}. */
export interface MemberPickerDialogProps {
  /** The heading ("Add Teachers to Group"); also the dialog's name. */
  title: string;
  /** The search box's accessible name. */
  searchLabel: string;
  /** The search box's placeholder. */
  searchPlaceholder: string;
  /** The search text. */
  searchTerm: string;
  /** Search change handler. */
  onSearchChange: (value: string) => void;
  /** The people shown (already searched). */
  people: PickerPerson[];
  /** The ids picked. */
  selected: Set<string>;
  /** Picks or unpicks one. */
  onToggle: (id: string) => void;
  /** Picks all shown, or clears the picks when all are picked. */
  onSelectAll: () => void;
  /** True while the list loads. */
  isLoading: boolean;
  /** "Loading teachers...". */
  loadingLabel: string;
  /** Why the list or the add failed. */
  error: string | null;
  /** Loads the list again. */
  onRetry: () => void;
  /** What to say when nobody is shown. */
  emptyText: string;
  /** True while the add runs. */
  isAdding: boolean;
  /** The add button's words ("Add 2 Teachers"). */
  addLabel: string;
  /** Adds the picked people. */
  onAdd: () => void;
  /** Closes the dialog. */
  onClose: () => void;
}

/**
 * The add-members dialog of a group (parents or teachers): search, Select
 * All, the people as toggle buttons with a tick on the picked ones, and
 * Cancel / Add N. Purely presentational; the two dialogs keep their own
 * loading and adding.
 *
 * @param props - See {@link MemberPickerDialogProps}.
 * @param props.title - The heading.
 * @param props.searchLabel - The search box's name.
 * @param props.searchPlaceholder - Its placeholder.
 * @param props.searchTerm - The search text.
 * @param props.onSearchChange - Search handler.
 * @param props.people - The people shown.
 * @param props.selected - The picked ids.
 * @param props.onToggle - Toggles one.
 * @param props.onSelectAll - Select All / Clear All.
 * @param props.isLoading - Whether the list loads.
 * @param props.loadingLabel - The loading words.
 * @param props.error - The error, if any.
 * @param props.onRetry - Reloads the list.
 * @param props.emptyText - The empty words.
 * @param props.isAdding - Whether the add runs.
 * @param props.addLabel - The add button's words.
 * @param props.onAdd - Add handler.
 * @param props.onClose - Close handler.
 * @returns The dialog.
 */
export function MemberPickerDialog({
  title,
  searchLabel,
  searchPlaceholder,
  searchTerm,
  onSearchChange,
  people,
  selected,
  onToggle,
  onSelectAll,
  isLoading,
  loadingLabel,
  error,
  onRetry,
  emptyText,
  isAdding,
  addLabel,
  onAdd,
  onClose,
}: MemberPickerDialogProps) {
  const titleId = useId();
  return (
    <div className={`${dialogOverlay} z-50`}>
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className={`${dialogPanel} sm:max-w-[520px]`}>
        <DialogTitleBar title={title} titleId={titleId} onClose={onClose} />

        {/* Search */}
        <div className="border-b border-tl-line-soft px-5 py-3.5">
          <TextSearch
            value={searchTerm}
            onChange={onSearchChange}
            label={searchLabel}
            placeholder={searchPlaceholder}
          />
        </div>

        {/* Select All / Clear */}
        {people.length > 0 && (
          <div className="flex items-center justify-between bg-tl-subtle px-5 py-1">
            <button type="button" onClick={onSelectAll} className={cn(quietButton, "-ml-3 text-tl-link")}>
              {selected.size === people.length ? "Clear All" : "Select All"}
            </button>
            <span className="text-sm text-tl-muted">{selected.size} selected</span>
          </div>
        )}

        {/* People */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-tl-muted" role="status">
              <Loader2 className="h-7 w-7 animate-spin text-tl-brand" aria-hidden />
              <p className="text-sm">{loadingLabel}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center" role="alert">
              <p className="text-sm font-bold text-tl-danger">{error}</p>
              <button type="button" onClick={onRetry} className={ghostButton}>
                Try Again
              </button>
            </div>
          ) : people.length === 0 ? (
            <EmptyNote compact title={emptyText} />
          ) : (
            <div className="flex flex-col gap-1.5">
              {people.map((person) => {
                const isSelected = selected.has(person.id);
                return (
                  <button
                    key={person.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onToggle(person.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${focusRing} ${
                      isSelected ? "border-tl-control bg-tl-select" : "border-transparent hover:bg-tl-subtle"
                    }`}
                  >
                    <span className="relative">
                      <PersonAvatar id={person.id} name={person.name} initials={person.initials} size={40} />
                      {isSelected && (
                        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-tl-brand-fill text-tl-on-brand">
                          <Check className="h-3 w-3" aria-hidden />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-tl-ink">{person.name}</span>
                      {person.details.map((line, index) => (
                        <span key={index} className="block truncate text-xs text-tl-muted">
                          {line}
                        </span>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 border-t border-tl-line-soft px-5 py-4">
          <button type="button" onClick={onClose} className={ghostButton} disabled={isAdding}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onAdd}
            disabled={selected.size === 0 || isAdding}
            className={`${primaryButton} min-w-[120px]`}
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Adding...
              </>
            ) : (
              addLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
