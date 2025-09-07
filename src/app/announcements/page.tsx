"use client";

import React, { useState, useEffect } from "react";
import {
  FiPlus,
  FiPaperclip,
  FiCalendar,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiMessageSquare,
} from "react-icons/fi";
import {
  createAnnouncement,
  AnnouncementResponse,
  getAnnouncementsBySender,
  CreateAnnouncementResponse,
} from "../services/announcement.service";
import { toast } from "react-toastify";
import { getLocalStorageItem } from "../lib/localStorage";
import AnnouncementsSkeleton from "@/components/AnnouncementsSkeleton";

interface Announcement {
  title: string;
  content: string;
  attachment?: string;
}

const Announcement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState<Announcement>({
    title: "",
    content: "",
    attachment: undefined,
  });
  const [announcements, setAnnouncements] = useState<
    CreateAnnouncementResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<
    Set<string>
  >(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    lastPage: 1,
  });

  const toggleAnnouncement = (id: string) => {
    console.log('Toggling announcement:', id);
    console.log('Current expanded:', Array.from(expandedAnnouncements));
    
    setExpandedAnnouncements(prevExpanded => {
      const newExpanded = new Set(prevExpanded);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
        console.log('Closing announcement:', id);
      } else {
        newExpanded.add(id);
        console.log('Opening announcement:', id);
      }
      console.log('New expanded state:', Array.from(newExpanded));
      return newExpanded;
    });
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = getLocalStorageItem("user")?.userId;
      if (!userId) {
        throw new Error("User ID not found");
      }

      const response = await getAnnouncementsBySender(
        userId,
        pagination.page,
        pagination.limit
      );
      setAnnouncements(response.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.meta.total,
        lastPage: response.meta.lastPage,
      }));
    } catch (error) {
      console.error("Error fetching announcements:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch announcements. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [pagination.page, pagination.limit]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.lastPage) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error("All fields are required");
      return;
    }

    try {
      const attachmentUrl =
        "https://res.cloudinary.com/iknowsaint/image/upload/v1741563890/images/xglmcp793rhnbjgn1gnz.jpg";
      const announcementData = {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        attachment: attachmentUrl,
      };

      const response = await createAnnouncement(announcementData);
      if (!response) {
        throw new Error("Failed to create announcement");
      }

      console.log("Announcement created:");
      toast.success("Announcement created successfully!");

      // Refresh the announcements list
      fetchAnnouncements();
      setNewAnnouncement({ title: "", content: "", attachment: undefined });
    } catch (error: any) {
      console.error("Error creating announcement:", error);
      toast.error(
        "Failed to create announcement. Please try again.",
        error.message
      );
    } finally {
      setIsModalOpen(false);
    }
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= pagination.lastPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-4 py-2 mx-1 rounded-lg font-medium transition-all duration-300 ${
            pagination.page === i
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-center space-x-2">
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.lastPage}
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <>
      {loading ? (
        <AnnouncementsSkeleton />
      ) : (
        <div className="flex h-screen bg-[#F8F8F8]">
          <main className="flex-grow flex flex-col">
            {/* Navigation Header */}
            <div className="flex-shrink-0 bg-[#F8F8F8] border-b border-gray-200 px-4 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex flex-wrap items-center text-sm text-gray-600 gap-x-2">
                  <FiMessageSquare className="w-5 h-5 mr-2" />
                  <span className="text-gray-900 font-medium text-xl">
                    Announcements
                  </span>
                  <span className="text-gray-500">
                    • Keep your school community informed
                  </span>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <FiPlus className="h-4 w-4" />
                  <span className="font-medium">New Announcement</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto">
                <div className="p-6">
                  {error ? (
                    <div className="max-w-2xl mx-auto">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <FiRefreshCw className="h-8 w-8 text-red-600 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-red-800 mb-2">
                          Error Loading Announcements
                        </h3>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                          onClick={fetchAnnouncements}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {announcements.length === 0 ? (
                        <div className="text-center py-16">
                          <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-md mx-auto shadow-sm">
                            <FiMessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                              No Announcements Yet
                            </h3>
                            <p className="text-gray-600 mb-6">
                              Create your first announcement to keep everyone
                              informed.
                            </p>
                            <button
                              onClick={() => setIsModalOpen(true)}
                              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
                            >
                              <FiPlus className="h-4 w-4" />
                              <span>Create Announcement</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className=" mx-auto">
                          {/* Announcements List */}
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {announcements.map((announcement, index) => {
                              // Use a more reliable identifier that combines id and index
                              const uniqueId = announcement.id || `announcement-${index}`;
                              const isExpanded = expandedAnnouncements.has(uniqueId);

                              return (
                                <div
                                  key={uniqueId}
                                  className={`border-b border-gray-100 last:border-b-0 transition-all duration-300 ${
                                    isExpanded
                                      ? "bg-blue-50"
                                      : "hover:bg-gray-50"
                                  }`}
                                >
                                  {/* List Item Header */}
                                  <div
                                    className="p-4 cursor-pointer"
                                    onClick={() => toggleAnnouncement(uniqueId)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-3">
                                          <div className="flex-shrink-0">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                              <FiMessageSquare className="h-5 w-5 text-blue-600" />
                                            </div>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                                              {announcement.title}
                                            </h3>
                                            <div className="flex items-center space-x-4 mt-1">
                                              <div className="flex items-center text-sm text-gray-500">
                                                <FiCalendar className="h-4 w-4 mr-1" />
                                                {formatDateTime(
                                                  announcement.createdAt
                                                )}
                                              </div>
                                              {announcement.attachment && (
                                                <div className="flex items-center text-sm text-blue-600">
                                                  <FiPaperclip className="h-4 w-4 mr-1" />
                                                  Has attachment
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        {isExpanded ? (
                                          <FiChevronUp className="h-5 w-5 text-gray-400" />
                                        ) : (
                                          <FiChevronDown className="h-5 w-5 text-gray-400" />
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Expandable Content */}
                                  {isExpanded && (
                                    <div className="px-4 pb-4 bg-white border-t border-blue-100">
                                      <div className="pl-13">
                                        <div className="bg-gray-50 rounded-lg p-4 mt-3">
                                          <p className="text-gray-800 leading-relaxed">
                                            {announcement.content}
                                          </p>
                                          {announcement.attachment && (
                                            <div className="mt-4 pt-4 border-t border-gray-200">
                                              <a
                                                href={announcement.attachment}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm font-medium"
                                              >
                                                <FiPaperclip className="h-4 w-4" />
                                                <span>View Attachment</span>
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Pagination */}
                          {pagination.lastPage > 1 && (
                            <div className="mt-6 flex justify-center">
                              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                {renderPagination()}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Create Announcement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Create Announcement
              </h2>
              <p className="text-gray-600 mt-1">
                Share important updates with your school community
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={newAnnouncement.title}
                  onChange={(e) =>
                    setNewAnnouncement((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter announcement title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  name="content"
                  value={newAnnouncement.content}
                  onChange={(e) =>
                    setNewAnnouncement((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                  placeholder="Write your announcement content..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 font-medium"
                >
                  Create Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Announcement;
