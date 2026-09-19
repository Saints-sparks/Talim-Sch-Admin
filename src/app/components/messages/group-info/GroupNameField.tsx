import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NAME_MAX } from "./groupInfo";

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

/** The group's name: a heading with a pencil, or an inline editor. */
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
      <div className="mt-3 mx-auto max-w-sm text-left">
        <Input
          value={draft}
          maxLength={NAME_MAX}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") onCancel();
          }}
          autoFocus
          aria-label="Group name"
        />
        <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
          <span>
            {draft.trim().length}/{NAME_MAX}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSave} disabled={saving || !draft.trim()}>
              {saving && <Loader2 size={14} className="mr-1 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center justify-center gap-1.5">
      <h2 className="text-lg text-[#030E18] font-medium break-words">{name}</h2>
      {canManage && (
        <button
          type="button"
          onClick={onStartEdit}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Edit group name"
        >
          <Pencil size={14} />
        </button>
      )}
    </div>
  );
}
