"use client";

import React, { useId, useRef, useState } from "react";
import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { fieldError, ghostButton } from "@/components/tl";
import { IMPORT_FILE_ACCEPT, importFileProblem } from "./importState";

/** Props for {@link ImportDropzone}. */
export interface ImportDropzoneProps {
  /** Called with a file that passed the kind and size checks. */
  onFile: (file: File) => void;
  /** True while an upload runs: the zone is inert. */
  disabled?: boolean;
}

/**
 * The upload area: drop a file on it or choose one. A file of the wrong kind
 * or over 50 MB is refused here, with the reason, before anything is sent.
 *
 * @param props - See {@link ImportDropzoneProps}.
 * @param props.onFile - Receives the accepted file.
 * @param props.disabled - Whether uploads are paused.
 * @returns The drop zone.
 */
export function ImportDropzone({ onFile, disabled = false }: ImportDropzoneProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const take = (file: File | undefined) => {
    if (!file || disabled) return;
    const reason = importFileProblem(file);
    setProblem(reason);
    if (!reason) onFile(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        data-testid="import-dropzone"
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          take(event.dataTransfer.files?.[0]);
        }}
        className={`flex flex-col items-center gap-3 rounded-[18px] border-2 border-dashed px-5 py-8 text-center transition-colors ${
          dragging ? "border-tl-brand bg-tl-select" : "border-tl-control bg-tl-subtle"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-tl-surface text-tl-brand">
          {dragging ? (
            <FileSpreadsheet className="h-6 w-6" aria-hidden />
          ) : (
            <UploadCloud className="h-6 w-6" aria-hidden />
          )}
        </span>
        <div>
          <p className="text-[15px] font-bold text-tl-ink">Drop your filled-in template here</p>
          <p className="mt-0.5 text-[13px] text-tl-muted">
            Excel workbook (.xlsx), a ZIP of CSV files (.zip) or one CSV file, up to 50 MB.
          </p>
        </div>
        <button
          type="button"
          className={ghostButton}
          disabled={disabled}
          aria-describedby={problem ? errorId : undefined}
          onClick={() => input.current?.click()}
        >
          Choose file
        </button>
        <input
          ref={input}
          id={inputId}
          type="file"
          tabIndex={-1}
          aria-label="Past records file"
          accept={IMPORT_FILE_ACCEPT}
          disabled={disabled}
          aria-invalid={Boolean(problem)}
          aria-describedby={problem ? errorId : undefined}
          className="sr-only"
          onChange={(event) => {
            take(event.target.files?.[0]);
            // Let the same file be chosen again after a fix.
            if (input.current) input.current.value = "";
          }}
        />
      </div>
      {problem ? (
        <p id={errorId} role="alert" className={fieldError}>
          {problem}
        </p>
      ) : null}
    </div>
  );
}

export default ImportDropzone;
