// ReplyPreview.tsx
import React from "react";
import { X } from "lucide-react";

interface ReplyPreviewProps {
  replyingMessage: {
    sender: string;
    text: string;
  };
  onCancel: () => void;
}

const ReplyPreview = ({ replyingMessage, onCancel }: ReplyPreviewProps) => {
  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 mx-2 sm:mx-4 flex justify-between items-start">
      <div className="flex-1 min-w-0 mr-3">
        <p className="font-medium text-blue-700 text-sm mb-1">
          Replying to {replyingMessage.sender}
        </p>
        <p className="text-sm text-gray-700 leading-tight truncate">
          {replyingMessage.text}
        </p>
      </div>
      <button
        onClick={onCancel}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-blue-200 transition-colors"
        aria-label="Cancel reply"
      >
        <X size={14} className="text-blue-600" />
      </button>
    </div>
  );
};

export default ReplyPreview;
