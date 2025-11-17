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
  FiCamera,
  FiX,
  FiFile,
  FiFileText,
} from "react-icons/fi";
import { FaMountainSun } from "react-icons/fa6";
import { FaPlay } from "react-icons/fa";

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
import { uploadToCloudinary } from "../utils/cloudinary";

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
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState<Announcement>({
    title: "",
    content: "",
    attachment: undefined,
  });
  const [announcements, setAnnouncements] = useState<CreateAnnouncementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedAnnouncements, setExpandedAnnouncements] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    lastPage: 1,
  });

  const toggleAnnouncement = (id: string) => {
    setExpandedAnnouncements((prevExpanded) => {
      const newExpanded = new Set(prevExpanded);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
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

      toast.success("Announcement created successfully!");
      fetchAnnouncements();
      setNewAnnouncement({ title: "", content: "", attachment: undefined });
      setAttachmentPreview(null);
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(
        "Failed to create announcement. Please try again.",
        error.message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateAttachmentFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "text/csv",
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateAttachmentFile(file);
      if (!validation.valid) {
        toast.error(validation.error || "Invalid file");
        e.target.value = "";
        return;
      }

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target) {
            setAttachmentPreview(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(
          JSON.stringify({
            name: file.name,
            size: file.size,
            type: file.type,
          })
        );
      }

      setIsUploadingImage(true);
      setUploadProgress(0);

      const uploadingToast = toast.loading("Uploading attachment...");

      try {
        const imageUrl = await uploadToCloudinary(file, (progress) => {
          setUploadProgress(progress);
        });

        setNewAnnouncement((prev) => ({ ...prev, attachment: imageUrl }));
        toast.dismiss(uploadingToast);
        toast.success("Attachment uploaded successfully!");
      } catch (error) {
        toast.dismiss(uploadingToast);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload attachment"
        );
        setAttachmentPreview(null);
        setNewAnnouncement((prev) => ({ ...prev, attachment: undefined }));
      } finally {
        setIsUploadingImage(false);
        setUploadProgress(0);
        e.target.value = "";
      }
    }
  };

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
              ? "bg-[#003366] text-white shadow-lg"
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
            <div className="flex-shrink-0 bg-[#F8F8F8] border-b border-gray-200 px-4 sm:px-6 py-4">
              <div className="flex flex-col gap-4">
                          {/* Create input */}
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <h1 className="text-xl font-semibold text-gray-900">Announcement</h1>
                        </div>

          {/* Card container */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
            {/* Input row (avatar + fake input) */}
            <div
              className="flex items-center gap-3 cursor-text"
              // allow clicking anywhere on this row to open modal
              onClick={() => setIsModalOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsModalOpen(true);
              }}
              role="button"
              tabIndex={0}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                {/* User avatar */}
                <img
                  src="/default-avatar.png"
                  alt="User avatar"
                  className="w-full h-full object-cover"
                  onError={(ev) => {
                    // hide broken img so the bg placeholder displays
                    (ev.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>

              {/* Read-only input that opens modal when focused/clicked */}
              <input
                type="text"
                readOnly
                placeholder="Create Announcement"
                className="flex-1 px-4 py-3 rounded-xl border border-transparent bg-transparent text-gray-600 placeholder-gray-400 focus:outline-none"
                onFocus={() => setIsModalOpen(true)}
                aria-label="Create Announcement"
              />
        </div>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                <FaMountainSun className="w-4 h-4" />
                <span>Photos</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                <FaPlay className="w-4 h-4" />
                <span>Videos</span>
              </button>
            </div>
          </div>
              </div>
              </div>
              </div>


          {/* --- end --- */}
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
                              Create your first announcement to keep everyone informed.
                            </p>
                            <button
                              onClick={() => setIsModalOpen(true)}
                              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#003366] text-white transition-all duration-300"
                            >
                              <FiPlus className="h-4 w-4" />
                              <span>Create Announcement</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mx-auto">
                          {/* Announcements List */}
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                           {announcements.map((announcement, index) => {
                            const uniqueId = announcement.id || `announcement-${index}`;
                            const isExpanded = expandedAnnouncements.has(uniqueId);
                            const isImageAttachment =
                              announcement.attachment &&
                              /\.(jpg|jpeg|png|gif|webp)$/i.test(announcement.attachment);

                            const contentPreview = announcement.content.length > 120 && !isExpanded
                              ? `${announcement.content.substring(0, 120)}...`
                              : announcement.content;

                            return (
                              <div
                                key={uniqueId}
                                className="bg-white border border-gray-200 rounded-2xl p-5 mb-5 shadow-sm hover:shadow-md transition-all duration-300"
                              >
                                {/* Header */}
                                <div className="flex items-start gap-3">
                                  {/* Avatar */}
                                  <div className="w-10 h-10 rounded-full bg-[#003366]/10 flex items-center justify-center text-[#003366] font-semibold text-lg">
                                    {announcement.title?.charAt(0).toUpperCase()}
                                  </div>

                                  {/* Title and Date */}
                                  <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      {announcement.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                      {formatDateTime(announcement.createdAt)}
                                    </p>
                                  </div>

                                  {/* Expand / Collapse icon */}
                                  <button
                                    onClick={() => toggleAnnouncement(uniqueId)}
                                    className="text-[#003366] hover:text-[#002244] transition"
                                  >
                                    {isExpanded ? (
                                      <FiChevronUp className="w-5 h-5" />
                                    ) : (
                                      <FiChevronDown className="w-5 h-5" />
                                    )}
                                  </button>
                                </div>

                                {/* Content Preview */}
                                <div className="mt-3 text-gray-700 leading-relaxed">
                                  <p>{contentPreview}</p>
                                  {announcement.content.length > 120 && (
                                    <button
                                      onClick={() => toggleAnnouncement(uniqueId)}
                                      className="mt-2 text-[#003366] text-sm font-medium hover:underline focus:outline-none"
                                    >
                                      {isExpanded ? "See less" : "See more"}
                                    </button>
                                  )}
                                </div>

                                {/* Attachment (if present) */}
                                {isImageAttachment && (
                                  <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
                                    <img
                                      src={announcement.attachment}
                                      alt="Announcement Attachment"
                                      className="w-full h-56 object-cover"
                                    />
                                  </div>
                                )}

                                {!isImageAttachment && announcement.attachment && (
                                  <div className="mt-4">
                                    <a
                                      href={announcement.attachment}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#003366] text-white text-sm rounded-lg hover:bg-[#003366]/90 transition-all duration-300"
                                    >
                                      <FiPaperclip className="w-4 h-4" />
                                      <span>View Attachment</span>
                                    </a>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

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
        icon={<FiMessageSquare className="w-6 h-6 text-white" />}
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
              className="px-6 py-3 bg-[#003366] text-white rounded-xl hover:bg-[#003366]/90 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        {/* Modal Form */}
        <form
  id="announcement-form"
  onSubmit={handleSubmit}
  className="p-2 sm:p-4 flex flex-col gap-6"
>
  {/* Profile + Audience dropdown */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-[#003366]/10 flex items-center justify-center text-[#003366] font-semibold text-lg">
        M
      </div>
      <div>
        <p className="font-semibold text-gray-900">MR. Adeyemo Isaac</p>
        <p className="text-sm text-gray-500">Admin</p>
      </div>
    </div>

    <select
      name="audience"
      defaultValue="everyone"
      className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#003366]"
    >
      <option value="everyone">Send to Everyone</option>
      <option value="teachers">Send to Teachers</option>
      <option value="students">Send to Students</option>
    </select>
  </div>

  {/* Title input */}
  <input
    type="text"
    name="title"
    value={newAnnouncement.title}
    onChange={(e) =>
      setNewAnnouncement((prev) => ({ ...prev, title: e.target.value }))
    }
    placeholder="Enter announcement title"
    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#003366] text-gray-800"
    required
  />

  {/* Content textarea */}
  <textarea
    name="content"
    value={newAnnouncement.content}
    onChange={(e) =>
      setNewAnnouncement((prev) => ({ ...prev, content: e.target.value }))
    }
    placeholder="Write your announcement here..."
    className="w-full min-h-[180px] p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] text-gray-800 resize-none"
    required
  />

  {/* Attachment preview */}
  {attachmentPreview && (
    <div className="relative w-full mt-2">
      {attachmentPreview.startsWith("data:image") ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img
            src={attachmentPreview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={removeAttachment}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black transition"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-3">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <FiFile className="w-4 h-4 text-[#003366]" />
            <span>Attachment ready</span>
          </div>
          <button
            type="button"
            onClick={removeAttachment}
            className="text-red-500 text-xs hover:underline"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )}

  {/* Attachment buttons */}
  <div className="flex items-center gap-3 flex-wrap">
    <label
      htmlFor="photo-upload"
      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 cursor-pointer hover:bg-gray-100 transition"
    >
      <FiCamera className="w-4 h-4" />
      <span>Photos</span>
    </label>
    <input
      id="photo-upload"
      type="file"
      accept="image/*"
      onChange={handleFileChange}
      className="hidden"
    />

    <label
      htmlFor="video-upload"
      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-700 cursor-pointer hover:bg-gray-100 transition"
    >
      <FiFileText className="w-4 h-4" />
      <span>Videos</span>
    </label>
    <input
      id="video-upload"
      type="file"
      accept="video/*"
      onChange={handleFileChange}
      className="hidden"
    />
  </div>
</form>

      </TalimModal>
    </>
  );
};

export default Announcement;
