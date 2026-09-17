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
  "w-full h-10 px-3 border border-[#E5E7EB] bg-[#F9FAFB] rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#003366]/30 focus:border-[#003366] transition-all dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

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
      <div className="w-8 h-8 rounded-full bg-[#003366] flex items-center justify-center shrink-0">
        <CheckCircle2 className="h-4 w-4 text-white" />
      </div>
    );
  }
  return (
    <div
      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 text-sm font-bold transition-colors ${
        active
          ? "border-[#003366] bg-[#003366] text-white"
          : "border-gray-300 text-gray-400 dark:border-slate-600 dark:text-slate-500"
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
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 dark:bg-slate-800 dark:border-slate-700">
      <span className="text-gray-400 dark:text-slate-500">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 dark:text-slate-500">{label}</p>
        <p className="text-sm font-medium text-gray-700 truncate dark:text-slate-200">{value || "—"}</p>
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
      <label className="block text-sm font-medium text-[#030E18] mb-1.5 dark:text-slate-200">
        {label}
        {hint && <span className="text-gray-400 font-normal ml-1 dark:text-slate-500">— {hint}</span>}
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
}: { loading?: boolean; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 h-11 px-6 bg-[#003366] hover:bg-[#002244] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
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
            ? "bg-green-500 text-white"
            : active
            ? "bg-[#003366] text-white"
            : "border-2 border-gray-300 text-gray-400 dark:border-slate-600 dark:text-slate-500"
        }`}
      >
        {done ? "✓" : num}
      </div>
      <span
        className={`text-xs font-medium ${active ? "text-[#003366] dark:text-blue-300" : "text-gray-400 dark:text-slate-500"}`}
      >
        {label}
      </span>
    </div>
  );
}
