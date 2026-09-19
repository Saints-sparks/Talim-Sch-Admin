import { AlertCircle } from "lucide-react";
import { ModalShell, OutlineBtn } from "@/components/settings/ui";

interface ChangeTermModalProps {
  /** Name of the term about to become current. */
  nextName?: string;
  /** Name of the term that stops being current, if any. */
  currentName?: string;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Asks for confirmation before another term becomes the current one. */
export function ChangeTermModal({ nextName, currentName, submitting, onCancel, onConfirm }: ChangeTermModalProps) {
  return (
    <ModalShell title="Change Current Term?" onClose={onCancel}>
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <p className="text-sm text-gray-700 dark:text-slate-200 font-medium">
            {nextName} will become the current term.
          </p>
          {currentName && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{currentName} will be set to Upcoming.</p>
          )}
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <OutlineBtn onClick={onCancel} disabled={submitting}>
            Cancel
          </OutlineBtn>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            {submitting ? "Updating…" : "Change Term"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
