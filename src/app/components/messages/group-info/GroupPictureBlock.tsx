import { useRef } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { IMAGE_ACCEPT } from "@/components/chat-kit";
import { focusRing } from "@/components/tl";
import { PersonAvatar } from "../parts";

/** "Change picture" and "Remove": small text buttons, 44px tall to touch. */
const actionClass = `inline-flex min-h-[44px] items-center gap-1 rounded-lg px-2 text-[13px] font-bold hover:underline disabled:opacity-50 ${focusRing}`;

/** Props for {@link GroupPictureBlock}. */
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

/**
 * The round group picture with, for managers, "Change picture" (or "Add
 * picture") and "Remove".
 *
 * @param props - See {@link GroupPictureBlockProps}.
 * @param props.pictureUrl - The picture, or "".
 * @param props.groupName - The name, for the initials and tone.
 * @param props.uploading - True while uploading.
 * @param props.canManage - Shows the controls.
 * @param props.busy - Disables them while saving.
 * @param props.onFileChange - Takes the chosen file.
 * @param props.onRemove - Removes the picture.
 * @returns The block.
 */
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
      <div className="relative mx-auto h-20 w-20">
        <PersonAvatar id={groupName} name={groupName} src={pictureUrl || null} size={80} />
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[rgba(15,27,46,0.45)]" role="status">
            <Loader2 size={20} className="animate-spin text-tl-on-brand" aria-hidden />
            <span className="sr-only">Uploading the picture</span>
          </div>
        )}
      </div>
      {canManage && (
        <div className="mt-1 flex justify-center gap-1">
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
            className={`${actionClass} text-tl-link`}
          >
            <Camera size={14} aria-hidden />
            {pictureUrl ? "Change picture" : "Add picture"}
          </button>
          {pictureUrl && (
            <button type="button" disabled={busy} onClick={onRemove} className={`${actionClass} text-tl-danger`}>
              <Trash2 size={14} aria-hidden />
              Remove
            </button>
          )}
        </div>
      )}
    </>
  );
}
