"use client";

import React, { useState, useEffect } from 'react';
import { Header } from "@/components/Header";
import { createAnnouncement, AnnouncementResponse, getAnnouncementsBySender, CreateAnnouncementResponse } from "../services/announcement.service";
import { toast } from "react-toastify";
import { getLocalStorageItem } from '../lib/localStorage';
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
    const [announcements, setAnnouncements] = useState<CreateAnnouncementResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        lastPage: 1
    });

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            setError(null);

            const userId = getLocalStorageItem('user')?.userId;
            if (!userId) {
                throw new Error('User ID not found');
            }

            const response = await getAnnouncementsBySender(userId, pagination.page, pagination.limit);
            setAnnouncements(response.data || []);
            setPagination(prev => ({
                ...prev,
                total: response.meta.total,
                lastPage: response.meta.lastPage
            }));
        } catch (error) {
            console.error("Error fetching announcements:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch announcements. Please try again.";
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
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newAnnouncement.title || !newAnnouncement.content) {
            toast.error("All fields are required");
            return;
        }

        try {
            const attachmentUrl = 'https://res.cloudinary.com/iknowsaint/image/upload/v1741563890/images/xglmcp793rhnbjgn1gnz.jpg';
            const announcementData = {
                title: newAnnouncement.title,
                content: newAnnouncement.content,
                attachment: attachmentUrl,
            };

            const response = await createAnnouncement(announcementData);
            if (!response) {
                throw new Error('Failed to create announcement');
            }

            console.log("Announcement created:");
            toast.success('Announcement created successfully!');

            // Refresh the announcements list
            fetchAnnouncements();
            setNewAnnouncement({ title: "", content: "", attachment: undefined });
        } catch (error: any) {
            console.error("Error creating announcement:", error);
            toast.error("Failed to create announcement. Please try again.", error.message);
        } finally {
            setIsModalOpen(false);
        }
    };

    const formatDateTime = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderPagination = () => {
        const pages = [];
        for (let i = 1; i <= pagination.lastPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-1 mx-1 rounded transition-colors ${pagination.page === i
                            ? 'bg-[#154473] text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                >
                    {i}
                </button>
            );
        }

        return (
            <div className="flex justify-center space-x-2 mt-4">
                <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Previous
                </button>
                {pages}
                <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.lastPage}
                    className="px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                <div className="p-6 bg-gray-100">
                    {/* Header */}
                    <Header />

                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-800">Announcements</h1>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Create Announcement
                        </button>
                    </div>

                    {error ? (
                        <div className="text-center py-12">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
                                <div className="text-red-600 text-lg font-semibold mb-2">Error Loading Announcements</div>
                                <p className="text-red-600 mb-4">{error}</p>
                                <button
                                    onClick={fetchAnnouncements}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-6">
                                {announcements.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-md mx-auto">
                                            <div className="text-gray-400 text-6xl mb-4">📢</div>
                                            <div className="text-gray-600 text-lg font-semibold mb-2">No Announcements Found</div>
                                            <p className="text-gray-500 mb-4">
                                                Get started by creating your first announcement to keep everyone informed.
                                            </p>
                                            <button
                                                onClick={() => setIsModalOpen(true)}
                                                className="px-4 py-2 bg-[#154473] text-white rounded hover:bg-blue-700 transition-colors"
                                            >
                                                Create First Announcement
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    announcements.map((announcement) => (
                                        <div key={announcement.id} className="bg-white rounded-lg shadow-md p-6 ">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h2 className="text-xl font-semibold mb-1 text-gray-800">{announcement.title}</h2>
                                                    <p className="text-sm text-gray-500">
                                                        {formatDateTime(announcement.createdAt)}
                                                    </p>
                                                </div>
                                                {announcement.attachment && (
                                                    <a
                                                        href={announcement.attachment}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-500 hover:text-blue-700"
                                                    >
                                                        View Attachment
                                                    </a>
                                                )}
                                            </div>
                                            <div className="prose max-w-none mb-4 text-gray-800">
                                                <p>{announcement.content}</p>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <button className="text-blue-500 hover:text-blue-700">👍</button>
                                                <button className="text-red-500 hover:text-red-700">❤️</button>
                                                <button className="text-gray-500 hover:text-gray-700">👎</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Pagination */}
                            {pagination.lastPage > 1 && renderPagination()}
                        </>
                    )}
                </div>
            )}

            {/* Create Announcement Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-semibold mb-4">Create Announcement</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={newAnnouncement.title}
                                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Content</label>
                                <textarea
                                    name="content"
                                    value={newAnnouncement.content}
                                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                                    className="w-full px-3 py-2 border rounded-md"
                                    rows={4}
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-[#154473] text-white rounded-md hover:bg-blue-700 transition"
                                >
                                    Create
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
