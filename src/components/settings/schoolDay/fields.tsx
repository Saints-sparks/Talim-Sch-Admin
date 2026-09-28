import React from "react";

/**
 * Small form atoms for the School Day and School Calendar sections: a label
 * bound to its control by id, and an error tied to the control through
 * `aria-describedby`, so a screen reader announces the problem with the field.
 */

/** Input and select classes, matching `InputField` in `settings/ui`. */
export function controlClasses(hasError: boolean): string {
  return `w-full px-3 py-2.5 text-sm border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-[#003366]/10 dark:focus:ring-blue-500/30 outline-none transition disabled:opacity-60 ${
    hasError
      ? "border-red-400 dark:border-red-500 focus:border-red-500"
      : "border-gray-300 dark:border-slate-600 focus:border-[#003366] dark:focus:border-blue-500"
  }`;
}

/** The id of a control's error message. */
export function errorId(controlId: string): string {
  return `${controlId}-error`;
}

/** Accessibility props for a control that may be invalid. */
export function describedBy(controlId: string, error?: string, hintId?: string) {
  const ids = [error ? errorId(controlId) : null, hintId ?? null].filter(Boolean).join(" ");
  return {
    "aria-invalid": Boolean(error) || undefined,
    "aria-describedby": ids || undefined,
  } as const;
}

/** A control's error line (renders nothing without a message). */
export function FieldError({ controlId, message }: { controlId: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={errorId(controlId)} className="mt-1 text-xs text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

/** A label above a control. */
export function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
      {children}
      {required && (
        <span className="text-red-500" aria-hidden>
          {" "}
          *
        </span>
      )}
    </label>
  );
}
