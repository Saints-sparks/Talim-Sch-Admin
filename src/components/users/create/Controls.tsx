"use client";

import React from "react";
import { inputClass, type ControlSize } from "./ui";

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange" | "id">;
type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size" | "onChange" | "id">;

/** Props of {@link TextInput}. */
interface TextInputProps extends InputProps {
  /** Ties the control to its `FormField` label and error. */
  id: string;
  size: ControlSize;
  /** The field's error, which paints the border and is announced. */
  error?: string;
  onValueChange: (value: string) => void;
}

/**
 * A themed text input wired to its inline error.
 *
 * @param props - Native input props plus the id, density, error and a value callback.
 * @returns The input.
 */
export function TextInput({ id, size, error, onValueChange, ...rest }: TextInputProps) {
  return (
    <input
      {...rest}
      id={id}
      className={inputClass(size, Boolean(error))}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      onChange={(event) => onValueChange(event.target.value)}
    />
  );
}

/** Props of {@link SelectInput}. */
interface SelectInputProps extends SelectProps {
  id: string;
  size: ControlSize;
  error?: string;
  onValueChange: (value: string) => void;
}

/**
 * A themed select wired to its inline error.
 *
 * @param props - Native select props plus the id, density, error and a value callback.
 * @returns The select.
 */
export function SelectInput({ id, size, error, onValueChange, children, ...rest }: SelectInputProps) {
  return (
    <select
      {...rest}
      id={id}
      className={inputClass(size, Boolean(error))}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {children}
    </select>
  );
}
