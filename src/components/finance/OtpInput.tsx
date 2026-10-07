"use client";

import { useRef } from "react";

/** Props for {@link OtpInput}. */
interface OtpInputProps {
  /** The code so far; always 0–6 digits. */
  value: string;
  /** Called with the new code. */
  onChange: (value: string) => void;
  /** Locks the boxes (while verifying). */
  disabled?: boolean;
}

/**
 * Six single-digit boxes for the emailed withdrawal code.
 *
 * Typing advances, backspace on an empty box steps back, and a pasted code
 * fills every box at once — a 6-digit code pasted from an email is the normal
 * case, not the exception.
 *
 * @param props - Current value, change handler and disabled flag.
 * @param props.value - The code so far.
 * @param props.onChange - Change handler.
 * @param props.disabled - Whether the boxes are locked.
 * @returns The OTP entry row.
 */
export function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  /**
   * Puts a digit in one box and moves to the next.
   *
   * @param index - The box.
   * @param char - What was typed.
   */
  const handleChange = (index: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const next = [...digits];
    next[index] = char;
    onChange(next.join("").slice(0, 6));
    if (char && index < 5) inputs.current[index + 1]?.focus();
  };

  /**
   * Backspace on an empty box steps back.
   *
   * @param index - The box.
   * @param event - The key press.
   */
  const handleKeyDown = (index: number, event: React.KeyboardEvent) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  /**
   * A pasted code fills every box.
   *
   * @param event - The paste.
   */
  const handlePaste = (event: React.ClipboardEvent) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      onChange(pasted);
      inputs.current[Math.min(pasted.length, 5)]?.focus();
    }
    event.preventDefault();
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(element) => {
            inputs.current[index] = element;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          aria-label={`Digit ${index + 1} of 6`}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          // Filled boxes take the brand border; the colours are Tailwind
          // classes rather than an inline style so dark mode can reach them.
          className={`h-14 w-11 rounded-[13px] border-2 bg-tl-surface text-center text-2xl font-extrabold text-tl-ink transition-colors focus:border-tl-link focus:outline-none focus:ring-2 focus:ring-tl-link/30 disabled:opacity-40 sm:w-12 ${
            digit ? "border-tl-brand" : "border-tl-control"
          }`}
        />
      ))}
    </div>
  );
}
