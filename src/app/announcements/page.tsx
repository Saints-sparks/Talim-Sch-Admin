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
import AnnouncementsSkeleton from "@/components/AnnouncementsSkeleton";
import { useAuth } from "@/context/AuthContext";
import TalimModal from "@/components/ui/TalimModal";
import { uploadToCloudinary, validateImageFile } from "../utils/cloudinary";
import { FiCamera, FiX, FiFile, FiFileText } from "react-icons/fi";

interface Announcement {
  title: string;
  content: string;
  attachment?: string;
}

const Announcement: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(
    null
  );
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
    console.log("Toggling announcement:", id);
    console.log("Current expanded:", Array.from(expandedAnnouncements));

    setExpandedAnnouncements((prevExpanded) => {
      const newExpanded = new Set(prevExpanded);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
        console.log("Closing announcement:", id);
      } else {
        newExpanded.add(id);
        console.log("Opening announcement:", id);
      }
      console.log("New expanded state:", Array.from(newExpanded));
      return newExpanded;
    });
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.userId) {
        throw new Error("User not authenticated");
      }

      const response = await getAnnouncementsBySender(
        user.userId,
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

    setIsSubmitting(true);
    try {
      const announcementData = {
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        attachment: newAnnouncement.attachment || undefined,
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
      setAttachmentPreview(null);
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error creating announcement:", error);
      toast.error(
        "Failed to create announcement. Please try again.",
        error.message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate file for attachments (supports multiple types)
  const validateAttachmentFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      // Images
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      // Text files
      "text/plain",
      "text/csv",
      // Archives
      "application/zip",
      "application/x-rar-compressed",
    ];

    if (file.size > maxSize) {
      return { valid: false, error: "File size must be less than 10MB" };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error:
          "File type not supported. Please upload images, PDFs, documents, or text files.",
      };
    }

    return { valid: true };
  };

  // Handle file upload for attachments
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file using the new validation function
      const validation = validateAttachmentFile(file);
      if (!validation.valid) {
        toast.error(validation.error || "Invalid file");
        e.target.value = ""; // Reset input
        return;
      }

      // Show preview immediately for images, or file info for other types
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target) {
            setAttachmentPreview(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files, store file info
        setAttachmentPreview(
          JSON.stringify({
            name: file.name,
            size: file.size,
            type: file.type,
          })
        );
      }

      // Upload to Cloudinary
      setIsUploadingImage(true);
      setUploadProgress(0);

      const uploadingToast = toast.loading("Uploading attachment...");

      try {
        const imageUrl = await uploadToCloudinary(file, (progress) => {
          setUploadProgress(progress);
        });

        // Update form data with the Cloudinary URL
        setNewAnnouncement((prev) => ({ ...prev, attachment: imageUrl }));
        toast.dismiss(uploadingToast);
        toast.success("Attachment uploaded successfully!");
      } catch (error) {
        console.error("Error uploading attachment:", error);
        toast.dismiss(uploadingToast);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload attachment"
        );

        // Reset preview on error
        setAttachmentPreview(null);
        setNewAnnouncement((prev) => ({ ...prev, attachment: undefined }));
      } finally {
        setIsUploadingImage(false);
        setUploadProgress(0);
        e.target.value = ""; // Reset input for potential re-upload
      }
    }
  };

  // Remove attachment
  const removeAttachment = () => {
    setAttachmentPreview(null);
    setNewAnnouncement((prev) => ({ ...prev, attachment: undefined }));
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
                              const uniqueId =
                                announcement.id || `announcement-${index}`;
                              const isExpanded =
                                expandedAnnouncements.has(uniqueId);

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
      <TalimModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Announcement"
        subtitle="Share important updates with your school community"
        icon={<FiMessageSquare className="w-6 h-6" />}
        isSubmitting={isSubmitting}
        footer={
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="announcement-form"
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <FiPlus className="w-4 h-4" />
                  <span>Create Announcement</span>
                </>
              )}
            </button>
          </div>
        }
      >
        <form
          id="announcement-form"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="Enter announcement title..."
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 bg-gray-50 focus:bg-white"
              rows={4}
              placeholder="Write your announcement content..."
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Attachment Upload Section */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700">
              Attachment (Optional)
            </label>

            {/* Upload Area */}
            {!attachmentPreview && !newAnnouncement.attachment ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="attachment-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                  disabled={isSubmitting || isUploadingImage}
                />
                <label
                  htmlFor="attachment-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FiFile className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {isUploadingImage
                        ? "Uploading..."
                        : "Click to upload a file"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Images, PDFs, Documents up to 10MB
                    </p>
                  </div>
                  {isUploadingImage && (
                    <div className="mt-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {uploadProgress}%
                      </p>
                    </div>
                  )}
                </label>
              </div>
            ) : (
              /* Preview Area */
              <div className="border border-gray-300 rounded-xl p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {(() => {
                      // Check if it's an image preview (data URL) or file info (JSON string)
                      if (attachmentPreview) {
                        try {
                          const fileInfo = JSON.parse(attachmentPreview);
                          // It's file info, show appropriate icon
                          const getFileIcon = (type: string) => {
                            if (type.includes("pdf"))
                              return (
                                <FiFileText className="w-8 h-8 text-red-600" />
                              );
                            if (
                              type.includes("word") ||
                              type.includes("document")
                            )
                              return (
                                <FiFileText className="w-8 h-8 text-blue-600" />
                              );
                            if (
                              type.includes("excel") ||
                              type.includes("sheet")
                            )
                              return (
                                <FiFile className="w-8 h-8 text-green-600" />
                              );
                            if (
                              type.includes("powerpoint") ||
                              type.includes("presentation")
                            )
                              return (
                                <FiFile className="w-8 h-8 text-orange-600" />
                              );
                            if (type.includes("zip") || type.includes("rar"))
                              return (
                                <FiFile className="w-8 h-8 text-purple-600" />
                              );
                            return <FiFile className="w-8 h-8 text-gray-600" />;
                          };
                          return (
                            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                              {getFileIcon(fileInfo.type)}
                            </div>
                          );
                        } catch {
                          // It's an image preview
                          return (
                            <img
                              src={attachmentPreview}
                              alt="Attachment preview"
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          );
                        }
                      } else if (newAnnouncement.attachment) {
                        // Existing attachment URL - assume it's an image
                        return (
                          <img
                            src={newAnnouncement.attachment}
                            alt="Attachment preview"
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="flex-1">
                    {(() => {
                      if (attachmentPreview) {
                        try {
                          const fileInfo = JSON.parse(attachmentPreview);
                          return (
                            <>
                              <p className="text-sm font-medium text-gray-700">
                                {fileInfo.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {(fileInfo.size / 1024 / 1024).toFixed(2)} MB •{" "}
                                {fileInfo.type}
                              </p>
                            </>
                          );
                        } catch {
                          return (
                            <>
                              <p className="text-sm font-medium text-gray-700">
                                Image attachment ready
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                This image will be included with your
                                announcement
                              </p>
                            </>
                          );
                        }
                      }
                      return (
                        <>
                          <p className="text-sm font-medium text-gray-700">
                            File attachment ready
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            This file will be included with your announcement
                          </p>
                        </>
                      );
                    })()}
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    disabled={isSubmitting || isUploadingImage}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center space-x-2 text-blue-600">
              <FiPaperclip className="h-4 w-4" />
              <span className="text-sm font-medium">About Attachments</span>
            </div>
            <p className="text-blue-700 text-sm mt-1">
              You can optionally include a file attachment with your
              announcement. Supported formats include images (PNG, JPG, GIF),
              documents (PDF, Word, Excel, PowerPoint), text files, and
              archives.
            </p>
          </div>
        </form>
      </TalimModal>
    </>
  );
};

export default Announcement;
