import { Loader2, Pencil } from "lucide-react";
import { fieldHint, focusRing, ghostButton, primaryButton, sectionTitle, textareaControl } from "@/components/tl";
import { DESCRIPTION_MAX } from "./groupInfo";

/** Props for {@link GroupDescriptionField}. */
interface GroupDescriptionFieldProps {
  editing: boolean;
  /** The description being typed. */
  draft: string;
  /** The saved description, if any. */
  description?: string;
  saving: boolean;
  canManage: boolean;
  onDraftChange: (value: string) => void;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}

/**
 * The "About" block: the group's description, or an inline editor (at most
 * {@link DESCRIPTION_MAX} characters) for those who may edit it. Not shown
 * for direct messages or office threads.
 *
 * @param props - The field's state and handlers; `canManage` offers the editor.
 * @param props.editing - Whether the editor is open.
 * @param props.draft - The text being typed.
 * @param props.description - The saved description.
 * @param props.saving - True while the save runs.
 * @param props.canManage - Whether the viewer may edit it.
 * @param props.onDraftChange - Typing handler.
 * @param props.onStartEdit - Opens the editor.
 * @param props.onCancel - Closes the editor.
 * @param props.onSave - Saves the draft.
 * @returns The block.
 */
export function GroupDescriptionField({
  editing,
  draft,
  description,
  saving,
  canManage,
  onDraftChange,
  onStartEdit,
  onCancel,
  onSave,
}: GroupDescriptionFieldProps) {
  return (
    <div className="mt-6 text-left">
      <div className="mb-2 flex items-center justify-between">
        <p className={sectionTitle}>About</p>
        {canManage && !editing && (
          <button
            type="button"
            onClick={onStartEdit}
            aria-label="Edit group description"
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-[13px] font-bold text-tl-link hover:underline ${focusRing}`}
          >
            <Pencil size={13} aria-hidden />
            Edit
          </button>
        )}
      </div>
      {editing ? (
        <div>
          <textarea
            value={draft}
            maxLength={DESCRIPTION_MAX}
            onChange={(e) => onDraftChange(e.target.value)}
            rows={4}
            autoFocus
            aria-label="Group description"
            aria-describedby="group-description-count"
            placeholder="What is this group for?"
            className={textareaControl}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span id="group-description-count" className={fieldHint}>
              {draft.length}/{DESCRIPTION_MAX}
            </span>
            <div className="flex gap-2">
              <button type="button" className={ghostButton} onClick={onCancel} disabled={saving}>
                Cancel
              </button>
              <button type="button" className={primaryButton} onClick={onSave} disabled={saving}>
                {saving && <Loader2 size={14} className="animate-spin" aria-hidden />}
                Save
              </button>
            </div>
          </div>
        </div>
      ) : description ? (
        <p className="whitespace-pre-line break-words rounded-2xl border border-tl-line-soft bg-tl-subtle p-3.5 text-sm leading-relaxed text-tl-body">
          {description}
        </p>
      ) : (
        <p className="rounded-2xl border border-tl-line-soft bg-tl-subtle p-3.5 text-sm italic text-tl-muted">
          No description
        </p>
      )}
    </div>
  );
}
