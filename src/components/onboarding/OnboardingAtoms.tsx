/**
 * The small pieces the two onboarding screens share: the step badge in the
 * progress rail, a read-only detail row, and the field/button wrappers every
 * setup form uses.
 *
 * They live here so the pages stay a shell over their steps, and so a change
 * to (say) the input ring is made once rather than in nine forms.
 */
"use client";

import React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

/** Shared input styling for every onboarding form control. */
export const inputCls =
  "w-full h-10 px-3 border border-tl-line bg-tl-subtle rounded-lg text-sm text-tl-ink focus:outline-none focus:ring-2 focus:ring-tl-link focus:border-tl-link transition-all";

/**
 * One numbered dot in the two-step progress rail.
 *
 * @param props.num - Step number shown when it is not yet done.
 * @param props.active - Whether this is the step being filled in.
 * @param props.done - Whether the step is already finished.
 * @returns The badge.
 */
export function StepBadge({ num, active, done }: { num: number; active: boolean; done: boolean }) {
  if (done) {
    return (
      <div className="w-8 h-8 rounded-full bg-tl-brand-fill flex items-center justify-center shrink-0">
        <CheckCircle2 className="h-4 w-4 text-white" />
      </div>
    );
  }
  return (
    <div
      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 text-sm font-bold transition-colors ${
        active ? "border-tl-brand bg-tl-brand-fill text-white" : "border-tl-control text-tl-faint"
      }`}
    >
      {num}
    </div>
  );
}

/**
 * A detail the school cannot change here (school name, email, phone), shown
 * with its icon so the screen still reads as a form.
 *
 * @param props.icon - Leading icon.
 * @param props.label - Field label.
 * @param props.value - Current value; an em dash stands in when empty.
 * @returns The row.
 */
export function ReadOnlyField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-tl-subtle border border-tl-line-soft">
      <span className="text-tl-faint">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-tl-faint">{label}</p>
        <p className="text-sm font-medium text-tl-body truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

/**
 * Labelled wrapper for a setup-form control.
 *
 * @param props.label - The field label.
 * @param props.hint - Optional example shown beside the label.
 * @param props.children - The control itself.
 * @returns The labelled field.
 */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-tl-ink mb-1.5">
        {label}
        {hint && <span className="text-tl-faint font-normal ml-1">— {hint}</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * The submit button every step form ends with.
 *
 * @param props.loading - Swaps the label for a spinner and blocks re-submits.
 * @param props.children - Button label and icon.
 * @returns The button.
 */
export function PrimaryBtn({
  loading,
  children,
  ...rest
}: {
  loading?: boolean;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 h-11 px-6 bg-tl-brand-fill hover:bg-tl-brand-fill-hover text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

/**
 * The two-dot indicator inside the academic-year step.
 *
 * @param props.num - Sub-step number.
 * @param props.active - Whether this sub-step is being filled in.
 * @param props.done - Whether it is finished.
 * @param props.label - Short caption.
 * @returns The badge.
 */
export function SubStepBadge({
  num,
  active,
  done,
  label,
}: {
  num: number;
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
          done
            ? "bg-tl-success text-white"
            : active
              ? "bg-tl-brand-fill text-white"
              : "border-2 border-tl-control text-tl-faint"
        }`}
      >
        {done ? "✓" : num}
      </div>
      <span className={`text-xs font-medium ${active ? "text-tl-brand" : "text-tl-faint"}`}>
        {label}
      </span>
    </div>
  );
}
