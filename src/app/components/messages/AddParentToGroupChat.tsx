// components/chat/AddParentToGroupChat.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { parentService } from "@/app/services/parent.service";
import { logger } from "@/lib/logger";
import { useChatsContext } from "@/context/ChatsContext";
import { MemberPickerDialog } from "./MemberPickerDialog";

interface ParentWithUser {
  _id: string;
  userId: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  } | null;
  children: unknown[];
  schoolId: string;
}

/** Props for {@link AddParentToGroupChatModal}. */
interface AddParentToGroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatRoomId: string;
  onSuccess?: () => void;
}

/**
 * Adds parents to a group: the school's parents not yet in it, searchable,
 * picked one by one or all at once, then added by their user ids.
 *
 * @param props - See {@link AddParentToGroupChatModalProps}.
 * @param props.isOpen - Whether it is shown.
 * @param props.onClose - Closes it.
 * @param props.chatRoomId - The group.
 * @param props.onSuccess - Called after the parents are added.
 * @returns The dialog, or null while closed.
 */
export default function AddParentToGroupChatModal({
  isOpen,
  onClose,
  chatRoomId,
  onSuccess,
}: AddParentToGroupChatModalProps) {
  const [parents, setParents] = useState<ParentWithUser[]>([]);
  const [filteredParents, setFilteredParents] = useState<ParentWithUser[]>([]);
  const [selectedParents, setSelectedParents] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addParticipantsToRoom, chatRooms } = useChatsContext();

  // People already in the group aren't offered again.
  const memberIds = useMemo(
    () => new Set((chatRooms.find((r) => r._id === chatRoomId)?.participants ?? []).map((p) => p.userId)),
    [chatRooms, chatRoomId]
  );
  const available = useMemo(
    () => parents.filter((item) => !memberIds.has(item.userId?._id ?? "")),
    [parents, memberIds]
  );
  const alreadyInGroup = parents.length - available.length;

  // Fetch parents when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchParents();
    }
  }, [isOpen]);

  // Filter parents based on search term
  useEffect(() => {
    if (searchTerm.trim() && available.length > 0) {
      const term = searchTerm.toLowerCase().trim();
      const filtered = available.filter((parent) => {
        const firstName = parent.userId?.firstName || "";
        const lastName = parent.userId?.lastName || "";
        const email = parent.userId?.email || "";
        const fullName = `${firstName} ${lastName}`.toLowerCase();
        return (
          firstName.toLowerCase().includes(term) ||
          lastName.toLowerCase().includes(term) ||
          email.toLowerCase().includes(term) ||
          fullName.includes(term)
        );
      });
      setFilteredParents(filtered);
    } else {
      setFilteredParents(available);
    }
  }, [searchTerm, available]);

  const fetchParents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get parents from the service
      const parentsData = await parentService.getParentsBySchoolId();
      // Data is already in the correct format
      setParents(parentsData as ParentWithUser[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch parents");
      logger.error("chat", "Error fetching parents", err);
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
      // Extract the actual user IDs from the parent objects
      const participantIds = Array.from(selectedParents).map((parentId) => {
        const parent = parents.find((p) => p._id === parentId);

        // Validate that parent exists and has a userId
        if (!parent?.userId || typeof parent.userId !== "object") {
          throw new Error(`Invalid parent data for ID: ${parentId}`);
        }

        // Return the actual user ID (not the parent document ID)
        return parent.userId._id;
      });

      // Log the participantIds being sent to the backend

      // Validate that all IDs are 24-character hex strings
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      for (const id of participantIds) {
        if (!objectIdPattern.test(id)) {
          throw new Error(`Invalid user ID format: ${id}`);
        }
      }

      await addParticipantsToRoom(chatRoomId, participantIds);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add parents");
      logger.error("chat", "Error adding parents", err);
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

  // Helper function to get parent display name
  const getParentName = (parent: ParentWithUser) => {
    if (parent.userId && typeof parent.userId === "object") {
      const { firstName, lastName, _id } = parent.userId;
      if (firstName || lastName) {
        return `${firstName || ""} ${lastName || ""}`.trim();
      }
      if (_id) {
        return `Parent (${_id.substring(0, 8)}...)`;
      }
    }
    return "Unknown Parent";
  };

  // Helper function to get parent email
  const getParentEmail = (parent: ParentWithUser) => {
    if (parent.userId && typeof parent.userId === "object" && parent.userId.email) {
      return parent.userId.email;
    }
    return "Email not available";
  };

  // Helper function to get parent initials
  const getParentInitials = (parent: ParentWithUser) => {
    if (parent.userId && typeof parent.userId === "object") {
      const { firstName, lastName } = parent.userId;
      if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
      } else if (firstName) {
        return firstName[0].toUpperCase();
      } else if (lastName) {
        return lastName[0].toUpperCase();
      }
    }
    return "P";
  };

  if (!isOpen) return null;

  return (
    <MemberPickerDialog
      title="Add Parents to Group"
      searchLabel="Search parents"
      searchPlaceholder="Search parents..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      people={filteredParents.map((parent) => {
        const childCount = parent.children?.length || 0;
        return {
          id: parent._id,
          name: getParentName(parent),
          initials: getParentInitials(parent),
          details: [
            getParentEmail(parent),
            ...(childCount > 0 ? [`${childCount} child${childCount !== 1 ? "ren" : ""}`] : []),
          ],
        };
      })}
      selected={selectedParents}
      onToggle={toggleParentSelection}
      onSelectAll={handleSelectAll}
      isLoading={isLoading}
      loadingLabel="Loading parents..."
      error={error}
      onRetry={fetchParents}
      emptyText={
        searchTerm
          ? "No parents found matching your search"
          : alreadyInGroup > 0
            ? "Everyone is already in this group"
            : "No parents available"
      }
      isAdding={isAdding}
      addLabel={`Add ${selectedParents.size} Parent${selectedParents.size !== 1 ? "s" : ""}`}
      onAdd={handleAddParents}
      onClose={onClose}
    />
  );
}
