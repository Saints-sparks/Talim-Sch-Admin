"use client";

import { useState, useEffect, useMemo } from "react";
import { teacherService } from "@/app/services/teacher.service";
import { logger } from "@/lib/logger";
import { useChatsContext } from "@/context/ChatsContext";
import { MemberPickerDialog } from "./MemberPickerDialog";

// Define the interface to match the API response (flat structure)
interface TeacherWithUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  userAvatar?: string;
  role: string;
  specialization?: string;
  employmentRole?: string;
  assignedClasses?: unknown[];
  assignedCourses?: unknown[];
  schoolId: string;
  isActive: boolean;
}

/** Props for {@link AddTeacherToGroupChatModal}. */
interface AddTeacherToGroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatRoomId: string;
  onSuccess?: () => void;
}

/**
 * Adds teachers to a group: the school's teachers not yet in it, searchable,
 * picked one by one or all at once.
 *
 * @param props - See {@link AddTeacherToGroupChatModalProps}.
 * @param props.isOpen - Whether it is shown.
 * @param props.onClose - Closes it.
 * @param props.chatRoomId - The group.
 * @param props.onSuccess - Called after the teachers are added.
 * @returns The dialog, or null while closed.
 */
export default function AddTeacherToGroupChatModal({
  isOpen,
  onClose,
  chatRoomId,
  onSuccess,
}: AddTeacherToGroupChatModalProps) {
  const [teachers, setTeachers] = useState<TeacherWithUser[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<TeacherWithUser[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set());
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
    () => teachers.filter((item) => !memberIds.has(item._id)),
    [teachers, memberIds]
  );
  const alreadyInGroup = teachers.length - available.length;

  // Fetch teachers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
    }
  }, [isOpen]);

  // Filter teachers based on search term
  useEffect(() => {
    if (searchTerm.trim() && available.length > 0) {
      const term = searchTerm.toLowerCase().trim();
      const filtered = available.filter((teacher) => {
        const firstName = teacher.firstName || "";
        const lastName = teacher.lastName || "";
        const email = teacher.email || "";
        const specialization = teacher.specialization || "";
        const employmentRole = teacher.employmentRole || "";
        const fullName = `${firstName} ${lastName}`.toLowerCase();

        return (
          firstName.toLowerCase().includes(term) ||
          lastName.toLowerCase().includes(term) ||
          email.toLowerCase().includes(term) ||
          fullName.includes(term) ||
          specialization.toLowerCase().includes(term) ||
          employmentRole.toLowerCase().includes(term)
        );
      });
      setFilteredTeachers(filtered);
    } else {
      setFilteredTeachers(available);
    }
  }, [searchTerm, available]);

  const fetchTeachers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get teachers from the service
      const teachersData = await teacherService.getAllTeachers();
      // Data is already in the flat format
      setTeachers(teachersData as TeacherWithUser[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch teachers");
      logger.error("chat", "Error fetching teachers", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTeacherSelection = (teacherId: string) => {
    const newSelected = new Set(selectedTeachers);
    if (newSelected.has(teacherId)) {
      newSelected.delete(teacherId);
    } else {
      newSelected.add(teacherId);
    }
    setSelectedTeachers(newSelected);
  };

  const handleAddTeachers = async () => {
    if (selectedTeachers.size === 0) return;

    setIsAdding(true);
    setError(null);
    try {
      // With flat structure, the teacher's _id IS the user ID
      const participantIds = Array.from(selectedTeachers);

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
      setError(err instanceof Error ? err.message : "Failed to add teachers");
      logger.error("chat", "Error adding teachers", err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedTeachers.size === filteredTeachers.length) {
      setSelectedTeachers(new Set());
    } else {
      setSelectedTeachers(new Set(filteredTeachers.map((t) => t._id)));
    }
  };

  // Helper function to get teacher display name - UPDATED for flat structure
  const getTeacherName = (teacher: TeacherWithUser) => {
    return `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() || "Unknown Teacher";
  };

  // Helper function to get teacher email - UPDATED for flat structure
  const getTeacherEmail = (teacher: TeacherWithUser) => {
    return teacher.email || "Email not available";
  };

  // Helper function to get teacher role
  const getTeacherRole = (teacher: TeacherWithUser) => {
    if (teacher.employmentRole) {
      return teacher.employmentRole;
    }
    if (teacher.specialization) {
      return teacher.specialization;
    }
    return "Teacher";
  };

  // Helper function to get teacher initials
  const getTeacherInitials = (teacher: TeacherWithUser) => {
    const { firstName, lastName } = teacher;
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    } else if (firstName) {
      return firstName[0].toUpperCase();
    } else if (lastName) {
      return lastName[0].toUpperCase();
    }
    return "T";
  };

  if (!isOpen) return null;

  return (
    <MemberPickerDialog
      title="Add Teachers to Group"
      searchLabel="Search teachers"
      searchPlaceholder="Search teachers by name, email, or role..."
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      people={filteredTeachers.map((teacher) => {
        const classesCount = teacher.assignedClasses?.length || 0;
        const coursesCount = teacher.assignedCourses?.length || 0;
        const load = [
          classesCount > 0 ? `${classesCount} class${classesCount !== 1 ? "es" : ""}` : "",
          coursesCount > 0 ? `${coursesCount} course${coursesCount !== 1 ? "s" : ""}` : "",
        ]
          .filter(Boolean)
          .join(" • ");
        return {
          id: teacher._id,
          name: getTeacherName(teacher),
          initials: getTeacherInitials(teacher),
          details: [getTeacherRole(teacher), getTeacherEmail(teacher), ...(load ? [load] : [])],
        };
      })}
      selected={selectedTeachers}
      onToggle={toggleTeacherSelection}
      onSelectAll={handleSelectAll}
      isLoading={isLoading}
      loadingLabel="Loading teachers..."
      error={error}
      onRetry={fetchTeachers}
      emptyText={
        searchTerm
          ? "No teachers found matching your search"
          : alreadyInGroup > 0
            ? "Everyone is already in this group"
            : "No teachers available"
      }
      isAdding={isAdding}
      addLabel={`Add ${selectedTeachers.size} Teacher${selectedTeachers.size !== 1 ? "s" : ""}`}
      onAdd={handleAddTeachers}
      onClose={onClose}
    />
  );
}
