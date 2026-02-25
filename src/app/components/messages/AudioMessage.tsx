import { Play } from "lucide-react";

interface Props {
  sender: string;
}

const AudioMessage = ({ sender }: Props) => {
  const isMe = sender === "me";

  return (
    <div className="flex items-center gap-2">
      {/* Play Button */}

      <Play fill={`${isMe ? "white" : "#030E18"}`} className="w-3 h-3" />

      {/* Fake Waveform */}
      <div className="flex items-center gap-[2px]">
        {[5, 4, 3, 2, 5, 6, 5, 3, 3, 3, 3].map((height, index) => (
          <div
            key={index}
            className={`w-1 rounded-full ${isMe ? "bg-white" : "bg-[#003666]"}`}
            style={{ height: `${height * 3}px` }}
          ></div>
        ))}
      </div>

      {/* Duration */}
      <span className={`text-sm ${isMe ? "text-[#003366]" : "text-[#030E18]"}`}>
        00:08
      </span>
    </div>
  );
};

export default AudioMessage;
