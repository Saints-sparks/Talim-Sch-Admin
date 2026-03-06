"use client";

import { useState, useEffect } from "react";
import { X, Search, Loader2, Check, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { teacherService } from "@/app/services/teacher.service";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";
import { useChats } from "@/hooks/useChats";

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
  assignedClasses?: any[];
  assignedCourses?: any[];
  schoolId: string;
  isActive: boolean;
}

interface AddTeacherToGroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatRoomId: string;
  onSuccess?: () => void;
}

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
  
  const { addParticipantsToRoom } = useChats();

  // Fetch teachers when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTeachers();
    }
  }, [isOpen]);

  // Filter teachers based on search term
  useEffect(() => {
    if (searchTerm.trim() && teachers.length > 0) {
      const term = searchTerm.toLowerCase().trim();
      const filtered = teachers.filter((teacher) => {
        const firstName = teacher.firstName || '';
        const lastName = teacher.lastName || '';
        const email = teacher.email || '';
        const specialization = teacher.specialization || '';
        const employmentRole = teacher.employmentRole || '';
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
      setFilteredTeachers(teachers);
    }
  }, [searchTerm, teachers]);

  const fetchTeachers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get teachers from the service
      const teachersData = await teacherService.getAllTeachers();
      // Data is already in the flat format
      setTeachers(teachersData as TeacherWithUser[]);
      setFilteredTeachers(teachersData as TeacherWithUser[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch teachers");
      console.error("Error fetching teachers:", err);
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
      console.log('🚀 Sending teacher participantIds to backend:', participantIds);

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
      console.error("Error adding teachers:", err);
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
    return `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || 'Unknown Teacher';
  };

  // Helper function to get teacher email - UPDATED for flat structure
  const getTeacherEmail = (teacher: TeacherWithUser) => {
    return teacher.email || 'Email not available';
  };

  // Helper function to get teacher role
  const getTeacherRole = (teacher: TeacherWithUser) => {
    if (teacher.employmentRole) {
      return teacher.employmentRole;
    }
    if (teacher.specialization) {
      return teacher.specialization;
    }
    return 'Teacher';
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
    return 'T';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserPlus size={20} />
            Add Teachers to Group
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
              placeholder="Search teachers by name, email, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Select All / Clear */}
        {filteredTeachers.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 flex justify-between items-center">
            <button
              onClick={handleSelectAll}
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              {selectedTeachers.size === filteredTeachers.length
                ? "Clear All"
                : "Select All"}
            </button>
            <span className="text-sm text-gray-500">
              {selectedTeachers.size} selected
            </span>
          </div>
        )}

        {/* Teachers List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm">Loading teachers...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm mb-3">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchTeachers}
                className="text-xs"
              >
                Try Again
              </Button>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                {searchTerm
                  ? "No teachers found matching your search"
                  : "No teachers available"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTeachers.map((teacher) => {
                const isSelected = selectedTeachers.has(teacher._id);
                const fullName = getTeacherName(teacher);
                const email = getTeacherEmail(teacher);
                const role = getTeacherRole(teacher);
                const initials = getTeacherInitials(teacher);
                const bgColor = generateColorFromString(teacher._id);
                const classesCount = teacher.assignedClasses?.length || 0;
                const coursesCount = teacher.assignedCourses?.length || 0;

                return (
                  <div
                    key={teacher._id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "bg-purple-50 border border-purple-200"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                    onClick={() => toggleTeacherSelection(teacher._id)}
                  >
                    <div className="relative">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: bgColor }}
                      >
                        {initials}
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">
                        {fullName}
                      </p>
                      <p className="text-xs text-purple-600 font-medium">
                        {role}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {email}
                      </p>
                      {(classesCount > 0 || coursesCount > 0) && (
                        <p className="text-xs text-gray-400 mt-1">
                          {classesCount > 0 && `${classesCount} class${classesCount !== 1 ? 'es' : ''}`}
                          {classesCount > 0 && coursesCount > 0 && ' • '}
                          {coursesCount > 0 && `${coursesCount} course${coursesCount !== 1 ? 's' : ''}`}
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
            onClick={handleAddTeachers}
            disabled={selectedTeachers.size === 0 || isAdding}
            className="bg-purple-600 hover:bg-purple-700 text-white min-w-[120px]"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              `Add ${selectedTeachers.size} Teacher${selectedTeachers.size !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}