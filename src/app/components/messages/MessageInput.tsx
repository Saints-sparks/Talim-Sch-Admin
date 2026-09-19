"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
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
    <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
      <ComposerAttachments
        files={files}
        onRemove={(index) => setFiles((prev) => prev.filter((_, i) => i !== index))}
        errors={fileErrors}
        onDismissErrors={() => setFileErrors([])}
        disabled={busy}
        className="mb-2"
      />

      {recorder.error && !recorder.isRecording && (
        <div role="alert" className="mb-2 flex items-center gap-2 rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-700">
          <span className="flex-1">{recorder.error}</span>
          <button
            type="button"
            onClick={recorder.clearError}
            className="rounded p-0.5 hover:bg-red-100"
            aria-label="Dismiss"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 sm:gap-3">
        {recorder.isRecording ? (
          /* Recording bar */
          <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" aria-hidden />
            <span className="text-sm text-red-600 font-medium">Recording</span>
            <span className="text-sm text-red-500 ml-auto tabular-nums" aria-live="polite">
              {formatDuration(recorder.elapsed)}
            </span>
            <button
              type="button"
              onClick={recorder.cancel}
              className="p-1 rounded-full hover:bg-red-100"
              title="Cancel recording"
              aria-label="Cancel recording"
            >
              <X size={16} className="text-red-500" />
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

            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 rounded-full hover:bg-gray-100 flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              title="Attach files"
              aria-label="Attach files"
            >
              <Paperclip size={16} className="text-gray-500" />
            </Button>

            <div className="flex-1">
              <ComposerTextarea
                aria-label="Message"
                placeholder={isSending ? "Sending..." : hasFiles ? "Add a caption..." : placeholder}
                className="block w-full border border-gray-300 rounded-2xl bg-gray-50 px-4 py-2 text-sm leading-6 outline-none focus:bg-white focus:border-blue-500 transition-colors disabled:opacity-60"
                value={currentMessage}
                onValueChange={handleChange}
                onSubmit={handleSubmit}
                disabled={busy}
              />
            </div>
          </>
        )}

        {recorder.isRecording ? (
          <Button
            className="h-8 sm:h-10 px-3 rounded-full bg-red-500 hover:bg-red-600 text-white flex-shrink-0 gap-1.5"
            onClick={() => void stopAndSend()}
            title="Stop and send"
            aria-label="Stop and send voice note"
          >
            <SendHorizontal size={16} />
            <span className="hidden sm:inline text-sm">Send</span>
          </Button>
        ) : canSend ? (
          <Button
            className={`w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full transition-all flex-shrink-0 ${
              !isSending ? "bg-blue-500 hover:bg-blue-600 shadow-md" : "bg-gray-300 cursor-not-allowed"
            }`}
            onClick={handleSend}
            disabled={busy}
            aria-label="Send"
          >
            {isSending ? (
              <Loader2 size={16} className="text-white animate-spin" />
            ) : (
              <SendHorizontal size={16} className="text-white" />
            )}
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 rounded-full flex-shrink-0 hover:bg-gray-100"
            onClick={() => void startRecording()}
            disabled={busy || !onSendVoice}
            title="Record voice note"
            aria-label="Record voice note"
          >
            <Mic size={16} className="text-gray-500" />
          </Button>
        )}
      </div>
    </div>
  );
}
