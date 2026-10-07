"use client";

/** The withdrawal's four steps, in order. */
export const WITHDRAWAL_STEP_LABELS = ["Amount", "Email code", "Confirm", "Submitted"] as const;

/**
 * The eyebrow above a withdrawal step's title ("Step 2 of 4 · Email code").
 *
 * @param step - The zero-based step.
 * @returns The line.
 */
export function withdrawalStepEyebrow(step: number): string {
  return `Step ${step + 1} of ${WITHDRAWAL_STEP_LABELS.length} · ${WITHDRAWAL_STEP_LABELS[step]}`;
}

/**
 * The withdrawal's progress: one bar per step, filled up to the current one.
 * Decorative; the step is named in the dialog's eyebrow.
 *
 * @param props - The current step.
 * @param props.current - The zero-based step.
 * @returns The bars.
 */
export function WithdrawalSteps({ current }: { current: number }) {
  return (
    <div aria-hidden className="flex gap-1.5">
      {WITHDRAWAL_STEP_LABELS.map((label, index) => (
        <span
          key={label}
          className={`h-1.5 flex-1 rounded-full ${index <= current ? "bg-tl-brand-fill" : "bg-tl-track"}`}
        />
      ))}
    </div>
  );
}
