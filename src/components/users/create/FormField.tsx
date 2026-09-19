"use client";

import React from "react";
import { fieldErrorClass, labelClass } from "./ui";

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
 * A labelled form control with an inline error slot.
 *
 * @param props - Label, control id, required flag, error and the control.
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
        {required && <span className="text-red-500"> *</span>}
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
