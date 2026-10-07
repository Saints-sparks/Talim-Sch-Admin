import { Loader2, Pencil } from "lucide-react";
import { fieldControl, fieldHint, ghostButton, iconButton, primaryButton } from "@/components/tl";
import { NAME_MAX } from "./groupInfo";

/** Props for {@link GroupNameField}. */
interface GroupNameFieldProps {
  editing: boolean;
  /** The name being typed. */
  draft: string;
  /** The name shown when not editing. */
  name: string;
  saving: boolean;
  canManage: boolean;
  onDraftChange: (value: string) => void;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

/**
 * The group's name: a heading with a pencil for those who may rename it, or
 * an inline editor (Enter saves, Escape cancels).
 *
 * @param props - See {@link GroupNameFieldProps}.
 * @param props.editing - Whether the editor is open.
 * @param props.draft - The name being typed.
 * @param props.name - The name shown.
 * @param props.saving - True while the save runs.
 * @param props.canManage - Whether the viewer may rename it.
 * @param props.onDraftChange - Typing handler.
 * @param props.onStartEdit - Opens the editor.
 * @param props.onCancel - Closes the editor.
 * @param props.onSave - Saves the draft.
 * @returns The heading or the editor.
 */
export function GroupNameField({
  editing,
  draft,
  name,
  saving,
  canManage,
  onDraftChange,
  onStartEdit,
  onCancel,
  onSave,
}: GroupNameFieldProps) {
  if (editing) {
    return (
      <div className="mx-auto mt-4 max-w-sm text-left">
        <input
          value={draft}
          maxLength={NAME_MAX}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") onCancel();
          }}
          autoFocus
          aria-label="Group name"
          className={fieldControl}
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className={fieldHint}>
            {draft.trim().length}/{NAME_MAX}
          </span>
          <div className="flex gap-2">
            <button type="button" className={ghostButton} onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="button" className={primaryButton} onClick={onSave} disabled={saving || !draft.trim()}>
              {saving && <Loader2 size={14} className="animate-spin" aria-hidden />}
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center justify-center gap-1">
      <h2 className="break-words text-[21px] font-extrabold leading-tight tracking-[-0.4px] text-tl-ink">{name}</h2>
      {canManage && (
        <button type="button" onClick={onStartEdit} className={iconButton} aria-label="Edit group name">
          <Pencil size={15} aria-hidden />
        </button>
      )}
    </div>
  );
}
