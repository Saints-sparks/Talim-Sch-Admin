"use client";

import { useEffect, useState } from "react";
import type { FeeCategory } from "@/app/services/fees.service";
import {
  Sheet,
  fieldControl,
  fieldError,
  fieldLabel,
  ghostButton,
  primaryButton,
  textareaControl,
} from "@/components/tl";

/** Limits copied from `CreateFeeCategoryDto` so the form fails before the API does. */
const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;

/** Props for {@link FeeCategoryModal}. */
interface FeeCategoryModalProps {
  /** Whether the dialog is shown. */
  open: boolean;
  /** Closes it (Cancel, Escape, the close button, the overlay). */
  onClose: () => void;
  /** Resolves when the category is saved; rejects to keep the modal open. */
  onSave: (name: string, description: string) => Promise<unknown>;
  /** The category being edited, or null when creating. */
  editing?: FeeCategory | null;
  /** True while the save request is in flight. */
  saving?: boolean;
}

/**
 * Create / edit dialog for a fee category, in the design system's sheet.
 * Validation mirrors the backend DTO: a name of 1–100 characters and a
 * description of at most 500.
 *
 * @param props - Open state, the category being edited and the save handler.
 * @param props.open - Whether it is shown.
 * @param props.onClose - Closes it.
 * @param props.onSave - Saves the category.
 * @param props.editing - The category being edited, or null.
 * @param props.saving - Whether the save is in flight.
 * @returns The sheet, or null when closed.
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

  useEffect(() => {
    setName(editing?.name ?? "");
    setDescription(editing?.description ?? "");
    setError(null);
  }, [editing, open]);

  if (!open) return null;

  /**
   * Checks the fields, then saves and closes; a failed save keeps it open.
   *
   * @param event - The form's submit event.
   */
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
    <Sheet
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={editing ? "Edit Category" : "Create Category"}
      dismissible={!saving}
      footer={
        <>
          <button type="button" onClick={onClose} className={`${ghostButton} flex-1`}>
            Cancel
          </button>
          <button
            type="submit"
            form="fee-category-form"
            disabled={saving || !name.trim()}
            className={`${primaryButton} flex-1`}
          >
            {saving ? "Saving..." : editing ? "Update" : "Create"}
          </button>
        </>
      }
    >
      <form id="fee-category-form" onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="fee-category-name" className={fieldLabel}>
            Category Name <span className="text-tl-danger">*</span>
          </label>
          <input
            id="fee-category-name"
            type="text"
            value={name}
            maxLength={NAME_MAX}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Tuition Fees"
            className={fieldControl}
            required
            data-autofocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="fee-category-description" className={fieldLabel}>
            Description
          </label>
          <textarea
            id="fee-category-description"
            value={description}
            rows={3}
            maxLength={DESCRIPTION_MAX}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe this fee category..."
            className={`${textareaControl} resize-none`}
          />
        </div>

        {error && <p className={fieldError}>{error}</p>}
      </form>
    </Sheet>
  );
}
