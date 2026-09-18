"use client";

import { useRef } from "react";

interface OtpInputProps {
  /** The code so far; always 0–6 digits. */
  value: string;
  onChange: (value: string) => void;
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
 * @returns The OTP entry row.
 */
export function OtpInput({ value, onChange, disabled }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  const handleChange = (index: number, char: string) => {
    if (!/^\d?$/.test(char)) return;
    const next = [...digits];
    next[index] = char;
    onChange(next.join("").slice(0, 6));
    if (char && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      onChange(pasted);
      inputs.current[Math.min(pasted.length, 5)]?.focus();
    }
    event.preventDefault();
  };

  return (
    <div className="flex gap-3 justify-center" onPaste={handlePaste}>
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
          className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:border-[#003366] transition-colors disabled:opacity-40 ${
            digit ? "border-[#003366]" : "border-gray-200"
          }`}
        />
      ))}
    </div>
  );
}
