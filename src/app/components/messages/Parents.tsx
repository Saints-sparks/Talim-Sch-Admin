// components/chat/Parents.tsx
"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UserPlus, Mail, Phone, MoreVertical, Loader2 } from "lucide-react";
import { generateColorFromString, getUserInitials } from "@/lib/colorUtils";
import { parentService, Parent } from "@/app/services/parent.service";
import AddParentToGroupChatModal from "./AddParentToGroupChat";

// Extend the Parent interface to match API response
interface ApiParent {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
  children: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  schoolId: string;
}

interface ParentsProps {
  chatRoomId?: string;
  onAddParentSuccess?: () => void;
}

export default function Parents({ chatRoomId, onAddParentSuccess }: ParentsProps) {
  const [parents, setParents] = useState<ApiParent[]>([]);
  const [filteredParents, setFilteredParents] = useState<ApiParent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddParentModalOpen, setIsAddParentModalOpen] = useState(false);

  // Fetch parents when component mounts
  useEffect(() => {
    fetchParents();
  }, []);

  // Filter parents based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      const filtered = parents.filter((parent) => {
        const firstName = parent.userId?.firstName || '';
        const lastName = parent.userId?.lastName || '';
        const email = parent.userId?.email || '';
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
      setFilteredParents(parents);
    }
  }, [searchTerm, parents]);

  const fetchParents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const parentsData = await parentService.getParentsBySchoolId();
      // The data might already be in the correct format
      setParents(parentsData as unknown as ApiParent[]);
      setFilteredParents(parentsData as unknown as ApiParent[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch parents");
      console.error("Error fetching parents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddParentSuccess = () => {
    onAddParentSuccess?.();
    // Refresh the parents list
    fetchParents();
  };

  // Get parent display name
  const getParentName = (parent: ApiParent) => {
    if (parent.userId) {
      return `${parent.userId.firstName || ''} ${parent.userId.lastName || ''}`.trim() || 'Unknown Parent';
    }
    return 'Unknown Parent';
  };

  // Get parent email
  const getParentEmail = (parent: ApiParent) => {
    return parent.userId?.email || 'No email';
  };

  // Get parent phone
  const getParentPhone = (parent: ApiParent) => {
    return parent.userId?.phoneNumber || '';
  };

  return (
    <div className="mt-4">
      {/* Header with Add Parent button */}
      {chatRoomId && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-700">
            Parents ({parents.length})
          </h3>
          <Button
            onClick={() => setIsAddParentModalOpen(true)}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <UserPlus size={16} className="mr-1" />
            Add Parents
          </Button>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search parents by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Parents List */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
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
        ) : filteredParents.length > 0 ? (
          filteredParents.map((parent) => {
            const fullName = getParentName(parent);
            const email = getParentEmail(parent);
            const phone = getParentPhone(parent);
            const initials = getUserInitials(fullName);
            const bgColor = generateColorFromString(fullName);
            const childCount = parent.children?.length || 0;

            return (
              <div
                key={parent._id}
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
                    <div className="space-y-1">
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
                
                {/* Children info */}
                {childCount > 0 && (
                  <div className="text-xs text-gray-400 bg-white px-2 py-1 rounded-full">
                    {childCount} child{childCount !== 1 ? 'ren' : ''}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">
              {searchTerm
                ? "No parents found matching your search"
                : "No parents available"}
            </p>
          </div>
        )}
      </div>

      {/* Add Parent Modal */}
      {chatRoomId && (
        <AddParentToGroupChatModal
          isOpen={isAddParentModalOpen}
          onClose={() => setIsAddParentModalOpen(false)}
          chatRoomId={chatRoomId}
          onSuccess={handleAddParentSuccess}
        />
      )}
    </div>
  );
}