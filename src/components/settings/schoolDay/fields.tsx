import React from "react";

/**
 * Small form atoms for the School Day and School Calendar sections: a label
 * bound to its control by id, and an error tied to the control through
 * `aria-describedby`, so a screen reader announces the problem with the field.
 */

/** Input and select classes, matching `InputField` in `settings/ui`. */
export function controlClasses(hasError: boolean): string {
  return `w-full px-3 py-2.5 text-sm border rounded-lg bg-tl-surface text-tl-ink focus:ring-2 focus:ring-tl-link  outline-none transition disabled:opacity-60 ${
    hasError ? "border-tl-danger focus:border-tl-danger" : "border-tl-control focus:border-tl-link"
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
    <p id={errorId(controlId)} className="mt-1 text-xs text-tl-danger">
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
    <label htmlFor={htmlFor} className="block text-xs font-medium text-tl-body mb-1">
      {children}
      {required && (
        <span className="text-tl-danger" aria-hidden>
          {" "}
          *
        </span>
      )}
    </label>
  );
}
