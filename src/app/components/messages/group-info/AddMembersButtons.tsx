import { UserPlus } from "lucide-react";
import { ghostButton } from "@/components/tl";

/**
 * "Add Parents" and "Add Teachers": managers only, never in direct messages
 * or office threads.
 *
 * @param props - The two handlers.
 * @param props.onAddParents - Opens the add-parents dialog.
 * @param props.onAddTeachers - Opens the add-teachers dialog.
 * @returns The two buttons.
 */
export function AddMembersButtons({
  onAddParents,
  onAddTeachers,
}: {
  onAddParents: () => void;
  onAddTeachers: () => void;
}) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
      <button type="button" onClick={onAddParents} className={ghostButton}>
        <UserPlus className="h-4 w-4" aria-hidden />
        Add Parents
      </button>
      <button type="button" onClick={onAddTeachers} className={ghostButton}>
        <UserPlus className="h-4 w-4" aria-hidden />
        Add Teachers
      </button>
    </div>
  );
}
