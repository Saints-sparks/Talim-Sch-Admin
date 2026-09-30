import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DESCRIPTION_MAX } from "./groupInfo";

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
    <div className="mt-5 text-left">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 dark:text-slate-300">About</p>
        {canManage && !editing && (
          <button
            type="button"
            onClick={onStartEdit}
            aria-label="Edit group description"
            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Pencil size={12} aria-hidden />
            Edit
          </button>
        )}
      </div>
      {editing ? (
        <div>
          <Textarea
            value={draft}
            maxLength={DESCRIPTION_MAX}
            onChange={(e) => onDraftChange(e.target.value)}
            rows={4}
            autoFocus
            aria-label="Group description"
            aria-describedby="group-description-count"
            placeholder="What is this group for?"
          />
          <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
            <span id="group-description-count">
              {draft.length}/{DESCRIPTION_MAX}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" onClick={onSave} disabled={saving}>
                {saving && <Loader2 size={14} className="mr-1 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : description ? (
        <p className="text-sm p-3 border border-[#F0F0F0] rounded-lg text-[#545454] dark:text-slate-300 whitespace-pre-line break-words">
          {description}
        </p>
      ) : (
        <p className="text-sm p-3 border border-[#F0F0F0] rounded-lg text-gray-400 italic">No description</p>
      )}
    </div>
  );
}
