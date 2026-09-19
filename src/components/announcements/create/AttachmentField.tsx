import { UploadCloud } from "lucide-react";

interface AttachmentFieldProps {
  /** Name of the chosen file, once one is picked. */
  fileName: string | null;
  isUploading: boolean;
  /** Upload progress, 0-100. */
  progress: number;
  disabled: boolean;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

/** The dashed drop zone that uploads one attachment. */
export function AttachmentField({ fileName, isUploading, progress, disabled, onFileChange }: AttachmentFieldProps) {
  return (
    <div>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Attachment</p>
      <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 px-4 py-7 text-center hover:border-[#003366] dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-900/10">
        <input type="file" className="hidden" onChange={onFileChange} disabled={disabled} />
        <UploadCloud className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        <span className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300">
          {fileName || "Click to upload or drag and drop"}
        </span>
        <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Images, PDFs, and documents up to 10MB
        </span>
        {isUploading && (
          <span className="mt-4 h-2 w-52 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <span className="block h-full bg-[#003366] dark:bg-blue-500" style={{ width: `${progress}%` }} />
          </span>
        )}
      </label>
    </div>
  );
}
