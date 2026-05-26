"use client";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Mic,
  Square,
  SendHorizontal,
  Paperclip,
  Loader2,
  X,
  FileText,
  ImageIcon,
} from "lucide-react";

interface MessageInputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend?: () => void;
  onSendFile?: (file: File) => void;
  onSendVoice?: (blob: Blob, durationSeconds: number) => void;
  disabled?: boolean;
  isSending?: boolean;
  placeholder?: string;
}

export default function MessageInput({
  value,
  onChange,
  onSend,
  onSendFile,
  onSendVoice,
  disabled = false,
  isSending = false,
  placeholder = "Type something here...",
}: MessageInputProps) {
  const [message, setMessage] = useState(value || "");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e);
    else setMessage(e.target.value);
  };

  const currentMessage = value !== undefined ? value : message;
  const hasText = currentMessage.trim().length > 0;
  const canSend = (hasText || selectedFile !== null) && !isRecording;

  const handleSend = () => {
    if (selectedFile && onSendFile) {
      onSendFile(selectedFile);
      setSelectedFile(null);
      return;
    }
    if (hasText && onSend) {
      onSend();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && canSend && !disabled && !isSending) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    e.target.value = "";
  };

  const startRecording = async () => {
    if (disabled || isSending) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        stream.getTracks().forEach((t) => t.stop());
        if (onSendVoice) onSendVoice(blob, duration);
      };

      startTimeRef.current = Date.now();
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      // microphone denied or unavailable
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
      {/* Selected file preview */}
      {selectedFile && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
          {selectedFile.type.startsWith("image/") ? (
            <ImageIcon size={14} className="text-blue-500 flex-shrink-0" />
          ) : (
            <FileText size={14} className="text-gray-500 flex-shrink-0" />
          )}
          <span className="text-xs text-gray-700 flex-1 truncate">{selectedFile.name}</span>
          <button
            onClick={() => setSelectedFile(null)}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            <X size={12} className="text-gray-500" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 sm:gap-3">
        {isRecording ? (
          /* Recording bar */
          <div className="flex-1 flex items-center gap-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
            <span className="text-sm text-red-600 font-medium">Recording</span>
            <span className="text-sm text-red-500 ml-auto tabular-nums">
              {formatTime(recordingSeconds)}
            </span>
          </div>
        ) : (
          <>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
              onChange={handleFileChange}
            />

            {/* Attachment button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 rounded-full hover:bg-gray-100 flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isSending}
              title="Attach file"
            >
              <Paperclip size={16} className="text-gray-500" />
            </Button>

            {/* Text input */}
            <div className="flex-1">
              <Input
                placeholder={isSending ? "Sending..." : placeholder}
                className="border border-gray-300 rounded-full bg-gray-50 focus:bg-white focus:border-blue-500 transition-colors"
                value={currentMessage}
                onChange={handleChange}
                disabled={disabled || isSending}
                onKeyDown={handleKeyDown}
              />
            </div>
          </>
        )}

        {/* Mic / Stop button — shown when no text and no file selected */}
        {!hasText && !selectedFile && (
          <Button
            variant="ghost"
            size="sm"
            className={`w-8 h-8 p-0 rounded-full flex-shrink-0 ${
              isRecording ? "hover:bg-red-100" : "hover:bg-gray-100"
            }`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled || isSending}
            title={isRecording ? "Stop recording" : "Record voice note"}
          >
            {isRecording ? (
              <Square size={16} className="text-red-500" fill="currentColor" />
            ) : (
              <Mic size={16} className="text-gray-500" />
            )}
          </Button>
        )}

        {/* Send button — shown when text or file is ready */}
        {canSend && (
          <Button
            className={`w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full transition-all flex-shrink-0 ${
              !isSending
                ? "bg-blue-500 hover:bg-blue-600 shadow-md"
                : "bg-gray-300 cursor-not-allowed"
            }`}
            onClick={handleSend}
            disabled={disabled || isSending}
          >
            {isSending ? (
              <Loader2 size={16} className="text-white animate-spin" />
            ) : (
              <SendHorizontal size={16} className="text-white" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
