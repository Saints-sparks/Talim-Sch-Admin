import type React from "react";
import { ChevronLeft, Loader2, X } from "lucide-react";
import { COLOR_MAP, nextSteps, type GroupColor, type GroupKind } from "./createGroup";

/** The dialog's title bar: back arrow on step 2, heading, and close. */
export function CreateGroupHeader({
  step,
  title,
  subtitle,
  submitting,
  onBack,
  onClose,
}: {
  step: 1 | 2;
  /** Label of the chosen kind, shown on step 2. */
  title?: string;
  subtitle?: string;
  submitting: boolean;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
      <div className="flex items-center gap-2">
        {step === 2 && (
          <button
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors mr-1"
            disabled={submitting}
          >
            <ChevronLeft size={18} className="text-gray-500" />
          </button>
        )}
        <div>
          <h2 className="text-lg font-bold text-gray-900">{step === 1 ? "Create Group" : `New ${title}`}</h2>
          <p className="text-xs text-gray-500">{step === 1 ? "Choose a group type" : subtitle}</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        disabled={submitting}
      >
        <X size={18} />
      </button>
    </div>
  );
}

/** A required `<select>` that shows a spinner line while its options load. */
export function OptionSelect({
  label,
  loadingLabel,
  placeholder,
  loading,
  disabled,
  value,
  onChange,
  children,
}: {
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
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} <span className="text-red-500">*</span>
      </label>
      {loading ? (
        <div className="flex items-center gap-2 py-2.5 text-sm text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" /> {loadingLabel}
        </div>
      ) : (
        <select
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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

/** The coloured "What happens next" card. */
export function NextStepsCard({
  kind,
  color,
  schoolName,
}: {
  kind: GroupKind;
  color: GroupColor;
  schoolName?: string;
}) {
  const colors = COLOR_MAP[color];
  return (
    <div className={`p-3 rounded-xl border ${colors.bg} border-opacity-50`}>
      <p className={`text-xs font-semibold ${colors.text} mb-1`}>What happens next:</p>
      <ul className={`text-xs ${colors.text} space-y-1 list-disc list-inside opacity-80`}>
        {nextSteps(kind, schoolName).map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}
