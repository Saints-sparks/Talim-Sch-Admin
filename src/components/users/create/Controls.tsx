"use client";

import React from "react";
import { inputClass, type ControlSize } from "./ui";

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange" | "id">;
type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size" | "onChange" | "id">;

/** Props of {@link TextInput}. */
interface TextInputProps extends InputProps {
  /** Ties the control to its `FormField` label and error. */
  id: string;
  /** Control density. */
  size: ControlSize;
  /** The field's error, which paints the border and is announced. */
  error?: string;
  /** Called with the new value. */
  onValueChange: (value: string) => void;
}

/**
 * A tl text input wired to its inline error.
 *
 * @param props - Native input props plus the id, density, error and a value callback.
 * @param props.id - The input's id.
 * @param props.size - Density.
 * @param props.error - The error.
 * @param props.onValueChange - Change handler.
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
  /** Ties the control to its `FormField` label and error. */
  id: string;
  /** Control density. */
  size: ControlSize;
  /** The field's error, which paints the border and is announced. */
  error?: string;
  /** Called with the new value. */
  onValueChange: (value: string) => void;
}

/**
 * A tl select wired to its inline error.
 *
 * @param props - Native select props plus the id, density, error and a value callback.
 * @param props.id - The select's id.
 * @param props.size - Density.
 * @param props.error - The error.
 * @param props.onValueChange - Change handler.
 * @param props.children - The options.
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
