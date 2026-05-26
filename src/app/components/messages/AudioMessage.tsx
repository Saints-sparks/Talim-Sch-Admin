"use client";
import { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";

interface Props {
  sender: string;
  audioUrl?: string;
  duration?: number;
}

const AudioMessage = ({ sender, audioUrl, duration }: Props) => {
  const isMe = sender === "me";
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatDuration = (secs?: number) => {
    if (!secs) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      <button
        onClick={togglePlay}
        className="flex-shrink-0 focus:outline-none"
        disabled={!audioUrl}
      >
        {isPlaying ? (
          <Pause fill={isMe ? "white" : "#030E18"} className="w-4 h-4" />
        ) : (
          <Play fill={isMe ? "white" : "#030E18"} className="w-4 h-4" />
        )}
      </button>

      <div className="flex items-center gap-[2px]">
        {[5, 4, 3, 2, 5, 6, 5, 3, 3, 3, 3].map((height, index) => (
          <div
            key={index}
            className={`w-1 rounded-full ${isMe ? "bg-white/80" : "bg-[#003666]"}`}
            style={{ height: `${height * 3}px` }}
          />
        ))}
      </div>

      <span className={`text-xs ${isMe ? "text-white/70" : "text-[#030E18]"}`}>
        {formatDuration(duration)}
      </span>
    </div>
  );
};

export default AudioMessage;
