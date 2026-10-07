"use client";

import { Toggle } from "@/components/tl";

/**
 * A labelled on/off switch used by the fee settings section: the design
 * system's switch beside its label and description.
 *
 * @param props - Current value, change handler and the label/description.
 * @param props.checked - Whether the switch is on.
 * @param props.onChange - Called with the new value.
 * @param props.label - The switch's name.
 * @param props.description - A line under the label.
 * @param props.disabled - Locks the switch.
 * @param props.describedBy - Id of extra text that explains the switch.
 * @returns The toggle row.
 */
export function FeeToggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  describedBy,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  describedBy?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-bold text-tl-ink">{label}</p>
        {description && <p className="mt-0.5 text-[13px] text-tl-muted">{description}</p>}
      </div>
      <Toggle
        checked={checked}
        onChange={onChange}
        label={label}
        describedBy={describedBy}
        disabled={disabled}
      />
    </div>
  );
}
