"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, Mail, Phone, MoreVertical, Loader2 } from "lucide-react";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";
import { teacherService, Teacher } from "@/app/services/teacher.service";
import AddTeacherToGroupChatModal from "./AddTeacherToGroupChat";

// Extend the Teacher interface to match API response
interface ApiTeacher {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    userAvatar?: string;
  };
  specialization: string;
  employmentRole: string;
  assignedClasses?: Array<{
    _id: string;
    name: string;
  }>;
  assignedCourses?: Array<{
    _id: string;
    title: string;
    courseCode?: string;
  }>;
  schoolId: string;
  isActive: boolean;
}

interface TeachersProps {
  chatRoomId?: string;
  onAddTeacherSuccess?: () => void;
}

export default function Teachers({ chatRoomId, onAddTeacherSuccess }: TeachersProps) {
  const [teachers, setTeachers] = useState<ApiTeacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<ApiTeacher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddTeacherModalOpen, setIsAddTeacherModalOpen] = useState(false);

  // Fetch teachers when component mounts
  useEffect(() => {
    fetchTeachers();
  }, []);

  // Filter teachers based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const filtered = teachers.filter((teacher) => {
        const firstName = teacher.userId?.firstName || '';
        const lastName = teacher.userId?.lastName || '';
        const email = teacher.userId?.email || '';
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
      const teachersData = await teacherService.getAllTeachers();
      // The data might already be in the correct format
      setTeachers(teachersData as unknown as ApiTeacher[]);
      setFilteredTeachers(teachersData as unknown as ApiTeacher[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch teachers");
      console.error("Error fetching teachers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTeacherSuccess = () => {
    onAddTeacherSuccess?.();
    // Refresh the teachers list
    fetchTeachers();
  };

  // Get teacher display name
  const getTeacherName = (teacher: ApiTeacher) => {
    if (teacher.userId) {
      return `${teacher.userId.firstName || ''} ${teacher.userId.lastName || ''}`.trim() || 'Unknown Teacher';
    }
    return 'Unknown Teacher';
  };

  // Get teacher email
  const getTeacherEmail = (teacher: ApiTeacher) => {
    return teacher.userId?.email || 'No email';
  };

  // Get teacher phone
  const getTeacherPhone = (teacher: ApiTeacher) => {
    return teacher.userId?.phoneNumber || '';
  };

  // Get teacher role/specialization
  const getTeacherRole = (teacher: ApiTeacher) => {
    if (teacher.employmentRole) {
      return teacher.employmentRole;
    }
    if (teacher.specialization) {
      return teacher.specialization;
    }
    return 'Teacher';
  };

  // Get assigned classes count
  const getAssignedClassesCount = (teacher: ApiTeacher) => {
    return teacher.assignedClasses?.length || 0;
  };

  // Get assigned courses count
  const getAssignedCoursesCount = (teacher: ApiTeacher) => {
    return teacher.assignedCourses?.length || 0;
  };

  return (
    <div className="mt-4">
      {/* Header with Add Teacher button */}
      {chatRoomId && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-700">
            Teachers ({teachers.length})
          </h3>
          <Button
            onClick={() => setIsAddTeacherModalOpen(true)}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <UserPlus size={16} className="mr-1" />
            Add Teachers
          </Button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search teachers by name, email, or role..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        />
      </div>

      {/* Teachers List */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
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
        ) : filteredTeachers.length > 0 ? (
          filteredTeachers.map((teacher) => {
            const fullName = getTeacherName(teacher);
            const email = getTeacherEmail(teacher);
            const phone = getTeacherPhone(teacher);
            const role = getTeacherRole(teacher);
            const initials = getUserInitials(fullName);
            const bgColor = generateColorFromString(fullName);
            const classesCount = getAssignedClassesCount(teacher);
            const coursesCount = getAssignedCoursesCount(teacher);

            return (
              <div
                key={teacher._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback 
                      className="text-white font-medium"
                      style={{ backgroundColor: bgColor }}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm text-gray-900">
                      {fullName}
                    </p>
                    <p className="text-xs text-purple-600 font-medium">
                      {role}
                    </p>
                    <div className="space-y-1 mt-1">
                      {email && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail size={12} />
                          {email}
                        </p>
                      )}
                      {phone && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Phone size={12} />
                          {phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Classes and Courses info */}
                <div className="flex gap-1">
                  {classesCount > 0 && (
                    <div className="text-xs text-gray-400 bg-white px-2 py-1 rounded-full" title={`${classesCount} class${classesCount !== 1 ? 'es' : ''}`}>
                      {classesCount} class{classesCount !== 1 ? 'es' : ''}
                    </div>
                  )}
                  {coursesCount > 0 && (
                    <div className="text-xs text-gray-400 bg-white px-2 py-1 rounded-full" title={`${coursesCount} course${coursesCount !== 1 ? 's' : ''}`}>
                      {coursesCount} course{coursesCount !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">
              {searchTerm
                ? "No teachers found matching your search"
                : "No teachers available"}
            </p>
          </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      {chatRoomId && (
        <AddTeacherToGroupChatModal
          isOpen={isAddTeacherModalOpen}
          onClose={() => setIsAddTeacherModalOpen(false)}
          chatRoomId={chatRoomId}
          onSuccess={handleAddTeacherSuccess}
        />
      )}
    </div>
  );
}