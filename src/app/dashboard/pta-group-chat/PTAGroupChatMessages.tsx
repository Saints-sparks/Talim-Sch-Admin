import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  sender: string;
  content: string;
  timestamp: string;
}

const PTAGroupChatMessages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([
      ...messages,
      {
        sender: "Admin",
        content: input,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setInput("");
  };

  return (
    <div className="max-w-xl mx-auto mt-8 bg-white rounded shadow p-4">
      <h3 className="text-lg font-semibold mb-2">PTA Group Chat</h3>
      <div className="h-64 overflow-y-auto border rounded p-2 mb-2 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-center mt-20">No messages yet.</div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="mb-2">
              <span className="font-bold text-blue-900 mr-2">{msg.sender}:</span>
              <span>{msg.content}</span>
              <span className="text-xs text-gray-400 ml-2">{msg.timestamp}</span>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={e => e.key === "Enter" && handleSend()}
        />
        <Button onClick={handleSend} disabled={!input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
};

export default PTAGroupChatMessages;
