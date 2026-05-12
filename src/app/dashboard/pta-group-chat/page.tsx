"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/CustomToast";
import PTAGroupChatMessages from "./PTAGroupChatMessages";

const PTAGroupChatPage = () => {
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }
    setIsCreating(true);
    // TODO: Call backend API to create group chat for this school
    setTimeout(() => {
      setIsCreating(false);
      toast.success("PTA Group Chat created!");
      setGroupName("");
    }, 1000);
  };

  return (
    <div>
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Create PTA Group Chat</h2>
        <Input
          placeholder="Enter group name (e.g. PTA 2026)"
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          className="mb-4"
        />
        <Button onClick={handleCreateGroup} disabled={isCreating}>
          {isCreating ? "Creating..." : "Create Group Chat"}
        </Button>
      </div>
      <PTAGroupChatMessages />
    </div>
  );
};

export default PTAGroupChatPage;
