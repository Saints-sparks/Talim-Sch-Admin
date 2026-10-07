import type React from "react";
import { ChevronLeft, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldLabel, iconButton, pillTone, selectControl } from "@/components/tl";
import { COLOR_TONE, nextSteps, type GroupColor, type GroupKind } from "./createGroup";

/**
 * The dialog's title bar: back arrow on step 2, the heading and its line, and
 * close.
 *
 * @param props - The step, the chosen kind's words and the handlers.
 * @param props.step - 1 (the kinds) or 2 (the form).
 * @param props.title - Label of the chosen kind, shown on step 2.
 * @param props.subtitle - Its description.
 * @param props.titleId - The heading's id, for the dialog's name.
 * @param props.submitting - Disables the controls while creating.
 * @param props.onBack - Back to step 1.
 * @param props.onClose - Closes the dialog.
 * @returns The title bar.
 */
export function CreateGroupHeader({
  step,
  title,
  subtitle,
  titleId,
  submitting,
  onBack,
  onClose,
}: {
  step: 1 | 2;
  /** Label of the chosen kind, shown on step 2. */
  title?: string;
  subtitle?: string;
  titleId?: string;
  submitting: boolean;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start gap-1 border-b border-tl-line-soft px-5 pb-4 pt-5">
      {step === 2 && (
        <button
          type="button"
          onClick={onBack}
          className={`${iconButton} -ml-2`}
          disabled={submitting}
          aria-label="Back to group types"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
      )}
      <div className="min-w-0 flex-1 pt-1">
        <h2 id={titleId} className="text-[19px] font-extrabold leading-tight tracking-[-0.3px] text-tl-ink">
          {step === 1 ? "Create Group" : `New ${title}`}
        </h2>
        <p className="mt-1 text-[13px] text-tl-muted">{step === 1 ? "Choose a group type" : subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className={`${iconButton} -mr-2 -mt-1`}
        disabled={submitting}
        aria-label="Close"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}

/**
 * A required `<select>` that shows a spinner line while its options load.
 *
 * @param props - The label, the loading words, the value and the options.
 * @param props.id - The select's id, for its label.
 * @param props.label - The visible label.
 * @param props.loadingLabel - Shown while the options load.
 * @param props.placeholder - The empty option.
 * @param props.loading - True while the options load.
 * @param props.disabled - Disables it.
 * @param props.value - The chosen id.
 * @param props.onChange - Change handler.
 * @param props.children - The options.
 * @returns The field.
 */
export function OptionSelect({
  id,
  label,
  loadingLabel,
  placeholder,
  loading,
  disabled,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  loadingLabel: string;
  placeholder: string;
  loading: boolean;
  disabled: boolean;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={fieldLabel}>
        {label}{" "}
        <span aria-hidden className="text-tl-danger">
          *
        </span>
      </label>
      {loading ? (
        <div className="flex min-h-[46px] items-center gap-2 text-sm text-tl-muted" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> {loadingLabel}
        </div>
      ) : (
        <select
          id={id}
          className={cn(selectControl, "min-h-[46px] w-full")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {children}
        </select>
      )}
    </div>
  );
}

/**
 * The "What happens next" card, on the chosen kind's tone.
 *
 * @param props - The kind, its colour and the school's name.
 * @param props.kind - The chosen kind.
 * @param props.color - Its accent colour.
 * @param props.schoolName - The admin's school, for the parent group's first line.
 * @returns The card.
 */
export function NextStepsCard({
  kind,
  color,
  schoolName,
}: {
  kind: GroupKind;
  color: GroupColor;
  schoolName?: string;
}) {
  return (
    <div className={`rounded-2xl p-3.5 ${pillTone[COLOR_TONE[color]]}`}>
      <p className="mb-1 text-xs font-extrabold">What happens next:</p>
      <ul className="list-inside list-disc space-y-1 text-xs font-semibold">
        {nextSteps(kind, schoolName).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
