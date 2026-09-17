"use client";

import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import type { FeeCategory } from "@/app/services/fees.service";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import {
  headingClass,
  inputClass,
  modalBackdropClass,
  modalPanelClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./ui";

/** Limits copied from `CreateFeeCategoryDto` so the form fails before the API does. */
const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;

interface FeeCategoryModalProps {
  open: boolean;
  onClose: () => void;
  /** Resolves when the category is saved; rejects to keep the modal open. */
  onSave: (name: string, description: string) => Promise<unknown>;
  /** The category being edited, or null when creating. */
  editing?: FeeCategory | null;
  /** True while the save request is in flight. */
  saving?: boolean;
}

/**
 * Create / edit dialog for a fee category. Validation mirrors the backend DTO:
 * a name of 1–100 characters and a description of at most 500.
 *
 * @param props - Open state, the category being edited and the save handler.
 * @returns The modal, or null when closed.
 */
export function FeeCategoryModal({
  open,
  onClose,
  onSave,
  editing,
  saving = false,
}: FeeCategoryModalProps) {
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  useBodyScrollLock(open);

  useEffect(() => {
    setName(editing?.name ?? "");
    setDescription(editing?.description ?? "");
    setError(null);
  }, [editing, open]);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Give the category a name.");
      return;
    }
    if (trimmedName.length > NAME_MAX) {
      setError(`Keep the name to ${NAME_MAX} characters or fewer.`);
      return;
    }
    if (description.trim().length > DESCRIPTION_MAX) {
      setError(`Keep the description to ${DESCRIPTION_MAX} characters or fewer.`);
      return;
    }
    setError(null);
    try {
      await onSave(trimmedName, description.trim());
      onClose();
    } catch {
      /* the mutation has already toasted; leave the modal open to retry */
    }
  };

  return (
    <div className={modalBackdropClass} role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className={`${modalPanelClass} max-w-md space-y-4`}>
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${headingClass}`}>
            {editing ? "Edit Category" : "Create Category"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FiX size={20} />
          </button>
        </div>

        <div>
          <label
            htmlFor="fee-category-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Category Name <span className="text-red-500">*</span>
          </label>
          <input
            id="fee-category-name"
            type="text"
            value={name}
            maxLength={NAME_MAX}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Tuition Fees"
            className={inputClass}
            required
          />
        </div>

        <div>
          <label
            htmlFor="fee-category-description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Description
          </label>
          <textarea
            id="fee-category-description"
            value={description}
            rows={3}
            maxLength={DESCRIPTION_MAX}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe this fee category..."
            className={`${inputClass} resize-none`}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-3 justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm ${secondaryButtonClass}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className={`px-4 py-2 rounded-lg text-sm ${primaryButtonClass}`}
          >
            {saving ? "Saving..." : editing ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
