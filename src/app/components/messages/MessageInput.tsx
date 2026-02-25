import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Mic, 
  SendHorizontal, 
  FileText, 
  Image, 
  FileVideo, 
  Plus,
  Paperclip
} from "lucide-react";

interface MessageInputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Type something here..."
}: MessageInputProps) {
  const [message, setMessage] = useState(value || "");
  const [showAttachments, setShowAttachments] = useState(false);
  
  // Handle internal state changes if not controlled
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e);
    } else {
      setMessage(e.target.value);
    }
  };
  
  // Handle send button click
  const handleSend = () => {
    if (onSend) {
      onSend();
    } else {
      console.log("Message sent:", message);
      setMessage("");
    }
  };

  const currentMessage = value !== undefined ? value : message;

  return (
    <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
      {/* Attachment options - Mobile */}
      {showAttachments && (
        <div className="flex sm:hidden gap-2 mb-3 overflow-x-auto pb-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 h-8 px-3 text-xs"
          >
            <FileText size={14} className="mr-1" />
            Doc
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 h-8 px-3 text-xs"
          >
            <Image size={14} className="mr-1" />
            Photo
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 h-8 px-3 text-xs"
          >
            <FileVideo size={14} className="mr-1" />
            Video
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2 sm:gap-3">
        {/* Attachment button - Mobile */}
        <Button
          variant="ghost"
          size="sm"
          className="flex sm:hidden w-8 h-8 p-0 rounded-full"
          onClick={() => setShowAttachments(!showAttachments)}
        >
          <Plus size={18} className="text-gray-500" />
        </Button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <Input
            placeholder={placeholder}
            className="pr-12 border border-gray-300 rounded-full bg-gray-50 focus:bg-white focus:border-blue-500 transition-colors"
            value={currentMessage}
            onChange={handleChange}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          
          {/* Voice note button - when no text */}
          {!currentMessage.trim() && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 p-0 rounded-full hover:bg-gray-200"
            >
              <Mic size={16} className="text-gray-500" />
            </Button>
          )}
        </div>

        {/* Desktop attachment options */}
        <div className="hidden sm:flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 rounded-full hover:bg-gray-100"
            title="Attach file"
          >
            <Paperclip size={16} className="text-gray-500" />
          </Button>
        </div>

        {/* Send button */}
        <Button
          className={`w-8 h-8 sm:w-10 sm:h-10 p-0 rounded-full transition-all ${
            currentMessage.trim() 
              ? "bg-blue-500 hover:bg-blue-600 shadow-md" 
              : "bg-gray-300 cursor-not-allowed"
          }`}
          onClick={handleSend}
          disabled={disabled || !currentMessage.trim()}
        >
          <SendHorizontal 
            size={16} 
            className={currentMessage.trim() ? "text-white" : "text-gray-500"} 
          />
        </Button>
      </div>
    </div>
  );
}
