import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** "Add Parents" and "Add Teachers": managers only, never in direct messages. */
export function AddMembersButtons({
  onAddParents,
  onAddTeachers,
}: {
  onAddParents: () => void;
  onAddTeachers: () => void;
}) {
  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Button
        onClick={onAddParents}
        className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2"
      >
        <UserPlus size={18} />
        Add Parents
      </Button>
      <Button
        onClick={onAddTeachers}
        className="bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center gap-2"
      >
        <UserPlus size={18} />
        Add Teachers
      </Button>
    </div>
  );
}
