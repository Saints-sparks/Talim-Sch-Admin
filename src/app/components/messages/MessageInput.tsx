"use client";
import { useRef, useState } from "react";
import { focusRing } from "@/components/tl";
import { Mic, SendHorizontal, Paperclip, Loader2, X } from "lucide-react";
import {
  ATTACHMENT_ACCEPT,
  ComposerAttachments,
  ComposerTextarea,
  addToSelection,
  formatDuration,
  useVoiceRecorder,
  type VoiceRecording,
} from "@/components/chat-kit";

/** The attach and record buttons: 44px outlined squares. */
const squareButton = `flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] border border-tl-control text-tl-muted transition-colors hover:bg-tl-bg hover:text-tl-ink disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

/** Send (and Stop and send): a 44px filled button; add its colours. */
const sendClass = `flex h-11 min-w-[44px] shrink-0 items-center justify-center gap-1.5 rounded-[13px] px-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 ${focusRing}`;

/** Props for {@link MessageInput}. */
interface MessageInputProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onSend?: () => void;
  /** Sends the picked files, with whatever was typed as their caption. Return false to keep them. */
  onSendFiles?: (files: File[], caption: string) => boolean | void;
  onSendVoice?: (file: File, durationSeconds: number) => void;
  disabled?: boolean;
  isSending?: boolean;
  placeholder?: string;
}

/**
 * The composer in the thread's bottom bar: attach, the message box (Enter
 * sends with a mouse), and Send once there is something to send, else the
 * voice-note button; while recording, the recording bar and Stop and send.
 *
 * @param props - See {@link MessageInputProps}.
 * @param props.value - The draft, when the parent keeps it.
 * @param props.onValueChange - Draft change handler.
 * @param props.onSend - Sends the text.
 * @param props.onSendFiles - Sends picked files with the caption.
 * @param props.onSendVoice - Sends a voice note.
 * @param props.disabled - Disables the composer.
 * @param props.isSending - True while a send runs.
 * @param props.placeholder - The box's placeholder.
 * @returns The composer.
 */
export default function MessageInput({
  value,
  onValueChange,
  onSend,
  onSendFiles,
  onSendVoice,
  disabled = false,
  isSending = false,
  placeholder = "Type something here...",
}: MessageInputProps) {
  const [message, setMessage] = useState(value || "");
  const [files, setFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendRecording = (recording: VoiceRecording | null) => {
    if (recording) onSendVoice?.(recording.file, recording.duration);
  };

  // Stops without sending (and releases the mic) when the chat unmounts or the room changes.
  const recorder = useVoiceRecorder({ onAutoStop: sendRecording });

  const handleChange = (text: string) => {
    if (onValueChange) onValueChange(text);
    else setMessage(text);
  };

  const currentMessage = value !== undefined ? value : message;
  const hasText = currentMessage.trim().length > 0;
  const hasFiles = files.length > 0;
  const canSend = (hasText || hasFiles) && !recorder.isRecording;
  const busy = disabled || isSending;

  const handleSend = () => {
    if (hasFiles && onSendFiles) {
      if (onSendFiles(files, currentMessage) !== false) {
        setFiles([]);
        setFileErrors([]);
      }
      return;
    }
    if (hasText && onSend) onSend();
  };

  // Enter sends with a mouse; on a touch screen it is a new line and the Send button sends.
  const handleSubmit = () => {
    if (canSend && !busy) handleSend();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0) return;
    const result = addToSelection(files, picked);
    setFiles(result.files);
    setFileErrors(result.errors);
  };

  const startRecording = async () => {
    if (busy) return;
    recorder.clearError();
    await recorder.start();
  };

  const stopAndSend = async () => {
    sendRecording(await recorder.stop());
  };

  return (
    <div className="flex flex-col gap-2 border-t border-tl-line-soft bg-tl-surface p-3 sm:px-[18px]">
      <ComposerAttachments
        files={files}
        onRemove={(index) => setFiles((prev) => prev.filter((_, i) => i !== index))}
        errors={fileErrors}
        onDismissErrors={() => setFileErrors([])}
        disabled={busy}
      />

      {recorder.error && !recorder.isRecording && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl bg-tl-danger-bg px-3 py-1.5 text-xs font-bold text-tl-danger"
        >
          <span className="flex-1">{recorder.error}</span>
          <button
            type="button"
            onClick={recorder.clearError}
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${focusRing}`}
            aria-label="Dismiss"
          >
            <X size={14} aria-hidden />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {recorder.isRecording ? (
          /* Recording bar */
          <div className="flex min-h-[44px] flex-1 items-center gap-3 rounded-[13px] border border-tl-danger/30 bg-tl-danger-bg px-4">
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-tl-danger" aria-hidden />
            <span className="text-sm font-bold text-tl-danger">Recording</span>
            <span className="ml-auto text-sm tabular-nums text-tl-danger" aria-live="polite">
              {formatDuration(recorder.elapsed)}
            </span>
            <button
              type="button"
              onClick={recorder.cancel}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-tl-danger hover:bg-tl-surface ${focusRing}`}
              title="Cancel recording"
              aria-label="Cancel recording"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept={ATTACHMENT_ACCEPT}
              onChange={handleFileChange}
            />

            <button
              type="button"
              className={squareButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              title="Attach files"
              aria-label="Attach files"
            >
              <Paperclip size={17} aria-hidden />
            </button>

            <div className="min-w-0 flex-1">
              <ComposerTextarea
                aria-label="Message"
                placeholder={isSending ? "Sending..." : hasFiles ? "Add a caption..." : placeholder}
                className="block min-h-[44px] w-full rounded-[13px] border border-tl-control bg-tl-surface px-3.5 py-2.5 text-[15px] font-medium leading-6 text-tl-ink outline-none transition-colors placeholder:text-tl-faint focus-visible:ring-2 focus-visible:ring-tl-link disabled:opacity-60"
                value={currentMessage}
                onValueChange={handleChange}
                onSubmit={handleSubmit}
                disabled={busy}
              />
            </div>
          </>
        )}

        {recorder.isRecording ? (
          <button
            type="button"
            className={`${sendClass} bg-tl-danger text-tl-surface hover:opacity-90`}
            onClick={() => void stopAndSend()}
            title="Stop and send"
            aria-label="Stop and send voice note"
          >
            <SendHorizontal size={16} aria-hidden />
            <span className="hidden sm:inline">Send</span>
          </button>
        ) : canSend ? (
          <button
            type="button"
            className={`${sendClass} bg-tl-brand-fill text-tl-on-brand hover:bg-tl-brand-fill-hover`}
            onClick={handleSend}
            disabled={busy}
            aria-label="Send"
          >
            {isSending ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : (
              <SendHorizontal size={16} aria-hidden />
            )}
            <span className="hidden sm:inline">Send</span>
          </button>
        ) : (
          <button
            type="button"
            className={squareButton}
            onClick={() => void startRecording()}
            disabled={busy || !onSendVoice}
            title="Record voice note"
            aria-label="Record voice note"
          >
            <Mic size={17} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
