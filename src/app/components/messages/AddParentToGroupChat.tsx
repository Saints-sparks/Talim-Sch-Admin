// components/chat/AddParentToGroupChatModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X, Search, Loader2, Check, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { parentService, Parent } from "@/app/services/parent.service";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";
import { useChats } from "@/hooks/useChats";

interface AddParentToGroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatRoomId: string;
  onSuccess?: () => void;
}

export default function AddParentToGroupChatModal({
  isOpen,
  onClose,
  chatRoomId,
  onSuccess,
}: AddParentToGroupChatModalProps) {
  const [parents, setParents] = useState<Parent[]>([]);
  const [filteredParents, setFilteredParents] = useState<Parent[]>([]);
  const [selectedParents, setSelectedParents] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { addParticipantsToRoom } = useChats();

  // Fetch parents when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchParents();
    }
  }, [isOpen]);

  // Filter parents based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const filtered = parents.filter(
        (parent) =>
          parent.firstName.toLowerCase().includes(term) ||
          parent.lastName.toLowerCase().includes(term) ||
          parent.email.toLowerCase().includes(term) ||
          `${parent.firstName} ${parent.lastName}`.toLowerCase().includes(term)
      );
      setFilteredParents(filtered);
    } else {
      setFilteredParents(parents);
    }
  }, [searchTerm, parents]);

  const fetchParents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const parentsData = await parentService.getParentsBySchoolId();
      setParents(parentsData);
      setFilteredParents(parentsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch parents");
      console.error("Error fetching parents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleParentSelection = (parentId: string) => {
    const newSelected = new Set(selectedParents);
    if (newSelected.has(parentId)) {
      newSelected.delete(parentId);
    } else {
      newSelected.add(parentId);
    }
    setSelectedParents(newSelected);
  };

  const handleAddParents = async () => {
    if (selectedParents.size === 0) return;

    setIsAdding(true);
    setError(null);
    try {
      await addParticipantsToRoom(chatRoomId, Array.from(selectedParents));
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add parents");
      console.error("Error adding parents:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedParents.size === filteredParents.length) {
      setSelectedParents(new Set());
    } else {
      setSelectedParents(new Set(filteredParents.map((p) => p._id)));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus size={20} />
            Add Parents to Group
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white"
              placeholder="Search parents by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Select All / Clear */}
        {filteredParents.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 flex justify-between items-center">
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {selectedParents.size === filteredParents.length
                ? "Clear All"
                : "Select All"}
            </button>
            <span className="text-sm text-gray-500">
              {selectedParents.size} selected
            </span>
          </div>
        )}

        {/* Parents List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm">Loading parents...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm mb-3">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchParents}
                className="text-xs"
              >
                Try Again
              </Button>
            </div>
          ) : filteredParents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                {searchTerm
                  ? "No parents found matching your search"
                  : "No parents available"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredParents.map((parent) => {
                const isSelected = selectedParents.has(parent._id);
                const fullName = `${parent.firstName} ${parent.lastName}`;
                const initials = getUserInitials(fullName);
                const bgColor = generateColorFromString(fullName);

                return (
                  <div
                    key={parent._id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                    onClick={() => toggleParentSelection(parent._id)}
                  >
                    <div className="relative">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: bgColor }}
                      >
                        {initials}
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">
                        {fullName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {parent.email}
                      </p>
                      {parent.phoneNumber && (
                        <p className="text-xs text-gray-400">
                          {parent.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-gray-600"
            disabled={isAdding}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddParents}
            disabled={selectedParents.size === 0 || isAdding}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              `Add ${selectedParents.size} Parent${selectedParents.size !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}