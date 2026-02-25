"use client";
import { PlayCircle, Video } from "lucide-react";

interface VideoMessageProps {
  videoThumbnail: string;
  videoDuration: string;
  messageText: string;
  onClick?: () => void;
}

export default function VideoMessage({
  videoThumbnail,
  videoDuration,
  messageText,
  onClick,
}: VideoMessageProps) {
  return (
    <div
      className="flex flex-col max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg bg-white rounded-lg cursor-pointer"
      onClick={onClick}
    >
      {/* Video Container */}
      <div className="relative w-full rounded-lg overflow-hidden">
        <img
          src={videoThumbnail}
          alt="Video Thumbnail"
          className="w-full h-auto object-cover"
        />

        {/* Play Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
          <PlayCircle
            size={48}
            strokeWidth="1px"
            fill="white"
            className="text-black border-none"
          />
        </div>

        {/* Video Duration */}
        <div className="absolute bottom-2 left-2 flex gap-1 bg-white bg-opacity-70 text-[#030E18] text-xs px-2 py-1 rounded">
          <Video size={14} />
          {videoDuration}
        </div>
      </div>

      {/* Message Text */}
      <p className="text-sm text-[#030E18] mt-2">{messageText}</p>
    </div>
  );
}
