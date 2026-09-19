import { useRef } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IMAGE_ACCEPT } from "@/components/chat-kit";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";

interface GroupPictureBlockProps {
  /** The picture's URL, or "" for none. */
  pictureUrl: string;
  /** The group's name, used for the fallback initials and colour. */
  groupName: string;
  /** True while the picture is uploading. */
  uploading: boolean;
  /** Shows the change / remove controls. */
  canManage: boolean;
  /** Disables the controls while anything is being saved. */
  busy: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

/** The round group picture with, for managers, "Change picture" and "Remove". */
export function GroupPictureBlock({
  pictureUrl,
  groupName,
  uploading,
  canManage,
  busy,
  onFileChange,
  onRemove,
}: GroupPictureBlockProps) {
  const pictureInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="relative mx-auto w-20 h-20">
        <Avatar className="w-20 h-20 rounded-full">
          <AvatarImage src={pictureUrl || undefined} />
          <AvatarFallback
            className="text-white font-medium text-lg"
            style={{ backgroundColor: generateColorFromString(groupName) }}
          >
            {getUserInitials(groupName)}
          </AvatarFallback>
        </Avatar>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <Loader2 size={20} className="animate-spin text-white" />
          </div>
        )}
      </div>
      {canManage && (
        <div className="mt-2 flex justify-center gap-3 text-xs">
          <input
            ref={pictureInputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            className="hidden"
            onChange={onFileChange}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => pictureInputRef.current?.click()}
            className="flex items-center gap-1 text-blue-600 hover:underline disabled:opacity-50"
          >
            <Camera size={14} />
            {pictureUrl ? "Change picture" : "Add picture"}
          </button>
          {pictureUrl && (
            <button
              type="button"
              disabled={busy}
              onClick={onRemove}
              className="flex items-center gap-1 text-red-600 hover:underline disabled:opacity-50"
            >
              <Trash2 size={14} />
              Remove
            </button>
          )}
        </div>
      )}
    </>
  );
}
