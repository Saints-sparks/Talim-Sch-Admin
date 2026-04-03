"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useChats } from "@/hooks/useChats";
import { ChatRoomType } from "@/types/chat.types";
import { GraduationCap, Loader2, X } from "lucide-react";
import { toast } from "react-toastify";

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ 
  open, 
  onClose,
  onSuccess 
}) => {
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [schoolDetails, setSchoolDetails] = useState<{
    id: string;
    name: string;
    logo?: string;
  } | null>(null);

  const { user } = useAuth();
  const { createGroupChat, fetchChatRooms } = useChats();

  // Set school details from user context when modal opens
  useEffect(() => {
    if (!open) return;

    console.log('📋 Modal opened, user:', user);
    
    if (user?.schoolId && user?.schoolName) {
      console.log('✅ Using school from user context:', {
        id: user.schoolId,
        name: user.schoolName
      });
      setSchoolDetails({
        id: user.schoolId,
        name: user.schoolName,
        logo: user.schoolLogo
      });
    } else {
      // Fallback to localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          console.log('📦 User from localStorage:', userData);
          if (userData.schoolId && userData.schoolName) {
            setSchoolDetails({
              id: userData.schoolId,
              name: userData.schoolName,
              logo: userData.schoolLogo
            });
          }
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
        }
      }
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (!schoolDetails?.id) {
      toast.error("School information not available");
      return;
    }

    setLoading(true);
    
    try {
      console.log('🚀 Creating parent/admin group with:', {
        name: groupName.trim(),
        schoolId: schoolDetails.id
      });
      
      // Create group chat with just name and schoolId
      // The backend will:
      // 1. Set type = 'class_group' or appropriate type
      // 2. Add the admin as a participant automatically
      // 3. Allow parents to be added later
      const groupData = {
        name: groupName.trim(),
        // The schoolId comes from the authenticated user on the backend
        // We don't need to send it explicitly
      };

      console.log('📤 Sending group data:', groupData);

      // Add group type selection UI
      // For now, default to admin_parent_group
      const newGroup = await createGroupChat({
        name: groupName.trim(),
        type: 'admin_parent_group', // Use new type for admin-parent group
        // No classId or courseId needed
      });

      if (newGroup) {
        console.log('✅ Group created:', newGroup);
        toast.success("Parent group created successfully!");
        
        // Reset form
        setGroupName("");
        
        // Close modal first
        onClose();

        // Notify parent to force-refresh its own chat rooms list
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error: any) {
      console.error("❌ Error creating group:", error);
      
      // Show more detailed error
      let errorMessage = "Failed to create parent group";
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMessage = error.response.data.message.join(', ');
        } else {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGroupName("");
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-300 relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          disabled={loading}
        >
          <X size={20} />
        </button>

        {/* Header with school logo/icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center overflow-hidden">
            {schoolDetails?.logo ? (
              <img
                src={schoolDetails.logo}
                alt={schoolDetails.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    const fallback = parent.querySelector(".fallback-icon");
                    if (fallback) {
                      (fallback as HTMLElement).style.display = "block";
                    }
                  }
                }}
              />
            ) : null}
            <GraduationCap
              className={`w-6 h-6 text-blue-600 fallback-icon ${
                schoolDetails?.logo ? "hidden" : "block"
              }`}
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create Parent Group</h2>
            <p className="text-sm text-gray-500">Create a group for parents and admins</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="e.g., Grade 5 Parents, School Announcements"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          {/* School Information - Read Only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              School
            </label>
            <div className="relative">
              <input
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 bg-gray-50 text-gray-600 cursor-not-allowed"
                value={schoolDetails?.name || "Loading school information..."}
                disabled
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Group will be created for {schoolDetails?.name || 'your school'}
            </p>
          </div>

          {/* Group Type Info */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800 font-medium mb-1">Group Details:</p>
            <ul className="text-xs text-blue-600 space-y-1 list-disc list-inside">
              <li>Only admins and parents will be able to join</li>
              <li>You will be automatically added as a participant</li>
              <li>Parents can be added manually later</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2"
              disabled={loading || !groupName.trim() || !schoolDetails?.id}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creating..." : "Create Parent Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;