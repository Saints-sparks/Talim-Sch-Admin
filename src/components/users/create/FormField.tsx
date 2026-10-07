"use client";

import React from "react";
import { fieldErrorClass, labelClass } from "./ui";

/** Props for {@link FormField}. */
interface FormFieldProps {
  /** Text shown above the control. */
  label: string;
  /** The control's id, so the label and the error are wired to it. */
  htmlFor: string;
  /** Adds the red asterisk. */
  required?: boolean;
  /** Inline error for this field, if any. */
  error?: string;
  /** Tighter label spacing, used by the student wizard. */
  compact?: boolean;
  /** Extra classes on the wrapper, e.g. `md:col-span-2`. */
  className?: string;
  /** The input, select or textarea. */
  children: React.ReactNode;
}

/**
 * A labelled form control with an inline error slot, in the tl field look.
 *
 * @param props - Label, control id, required flag, error and the control.
 * @param props.label - The label.
 * @param props.htmlFor - The control's id.
 * @param props.required - Whether to show the asterisk.
 * @param props.error - The inline error.
 * @param props.compact - Tighter label spacing.
 * @param props.className - Extra wrapper classes.
 * @param props.children - The control.
 * @returns The field wrapper.
 */
export function FormField({
  label,
  htmlFor,
  required = false,
  error,
  compact = false,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={`${labelClass} ${compact ? "mb-1.5" : "mb-2"}`}>
        {label}
        {required && <span className="text-tl-danger"> *</span>}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className={fieldErrorClass}>
          {error}
        </p>
      )}
    </div>
  );
}
