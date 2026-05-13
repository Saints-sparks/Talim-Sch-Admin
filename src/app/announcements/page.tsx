"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  Megaphone,
  MoreVertical,
  Paperclip,
  Pencil,
  Pin,
  Plus,
  Search,
  Send,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import {
  AnnouncementStats,
  createAnnouncement,
  CreateAnnouncementResponse,
  getAnnouncementStatsBySender,
  getAnnouncementsBySender,
} from "../services/announcement.service";
import { uploadFileAttachment } from "../services/files.service";
import { toast } from "@/components/CustomToast";
import AnnouncementsSkeleton from "@/components/AnnouncementsSkeleton";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type AnnouncementStatus = "Published" | "Scheduled" | "Draft" | "Archived";
type Audience = "All Parents" | "All Students" | "All Teachers" | "Custom";
type ActiveTab = "Published" | "Scheduled" | "Drafts" | "Archived";

type DashboardAnnouncement = Omit<
  CreateAnnouncementResponse,
  "audience" | "status"
> & {
  audience: Audience[];
  status: AnnouncementStatus;
  publishDate: string | null;
  readRate: number;
  pinned: boolean;
  views: number;
};

type NewAnnouncement = {
  title: string;
  content: string;
  attachment?: string;
  audience: Audience[];
  schedule: "now" | "later";
  scheduledFor?: string;
  preview: boolean;
};

const tabs: ActiveTab[] = ["Published", "Scheduled", "Drafts", "Archived"];

const statConfig = [
  { label: "Total announcements", icon: Megaphone, tone: "bg-blue-50 text-[#003366]" },
  { label: "Published", icon: Send, tone: "bg-blue-50 text-[#003366]" },
  { label: "Scheduled", icon: Clock3, tone: "bg-slate-100 text-slate-700" },
  { label: "Drafts", icon: Archive, tone: "bg-slate-100 text-slate-700" },
];

const defaultAnnouncementStats: AnnouncementStats = {
  totalAnnouncements: 0,
  published: 0,
  scheduled: 0,
  drafts: 0,
  archived: 0,
  readRate: 0,
  parentEngagement: 0,
  studentEngagement: 0,
  dailyViews: [],
  weeklyChange: {
    totalAnnouncements: 0,
    published: 0,
    scheduled: 0,
    drafts: 0,
  },
};

const audienceStyles: Record<Audience, string> = {
  "All Parents": "bg-blue-50 text-[#003366] border-blue-100",
  "All Students": "bg-blue-50 text-[#003366] border-blue-100",
  "All Teachers": "bg-slate-100 text-slate-700 border-slate-200",
  Custom: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusStyles: Record<AnnouncementStatus, string> = {
  Published: "bg-blue-50 text-[#003366] border-blue-100",
  Scheduled: "bg-blue-50 text-[#003366] border-blue-100",
  Draft: "bg-slate-100 text-slate-700 border-slate-200",
  Archived: "bg-slate-100 text-slate-600 border-slate-200",
};

const formatDateTime = (dateString: string | null) => {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
};

const clampPercent = (value: number) => Math.min(Math.max(value, 0), 100);

const normalizeStatus = (status?: string): AnnouncementStatus => {
  const normalized = status?.toUpperCase();
  if (normalized === "SCHEDULED") return "Scheduled";
  if (normalized === "DRAFT") return "Draft";
  if (normalized === "ARCHIVED") return "Archived";
  return "Published";
};

const normalizeAudience = (audience?: string[]): Audience[] => {
  const labels: Record<string, Audience> = {
    all_parents: "All Parents",
    parents: "All Parents",
    "all parents": "All Parents",
    all_students: "All Students",
    students: "All Students",
    "all students": "All Students",
    all_teachers: "All Teachers",
    teachers: "All Teachers",
    "all teachers": "All Teachers",
    custom: "Custom",
  };

  const normalized = audience
    ?.map((item) => labels[item.toLowerCase()] ?? (item as Audience))
    .filter(Boolean);

  return normalized?.length ? normalized : ["All Parents"];
};

const getDerivedAnnouncement = (
  announcement: CreateAnnouncementResponse
): DashboardAnnouncement => ({
  ...announcement,
  audience: normalizeAudience(announcement.audience),
  status: normalizeStatus(announcement.status),
  publishDate:
    announcement.publishedAt ?? announcement.scheduledFor ?? announcement.createdAt,
  readRate: announcement.readRate ?? 0,
  pinned: announcement.isPinned ?? false,
  views: announcement.readCount ?? 0,
});

const AnnouncementDashboard = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("Published");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<DashboardAnnouncement[]>([]);
  const [announcementStats, setAnnouncementStats] = useState<AnnouncementStats>(
    defaultAnnouncementStats
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    lastPage: 1,
  });
  const [newAnnouncement, setNewAnnouncement] = useState<NewAnnouncement>({
    title: "",
    content: "",
    attachment: undefined,
    audience: ["All Parents"],
    schedule: "now",
    scheduledFor: undefined,
    preview: false,
  });

  const fetchAnnouncements = async () => {
    if (isAuthLoading) return;

    if (!user?.userId) {
      setAnnouncements([]);
      setAnnouncementStats(defaultAnnouncementStats);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [response, statsResponse] = await Promise.all([
        getAnnouncementsBySender(user.userId, {
          page: pagination.page,
          limit: pagination.limit,
        }),
        getAnnouncementStatsBySender(user.userId),
      ]);
      const apiAnnouncements = response.data.map(getDerivedAnnouncement);
      setAnnouncements(apiAnnouncements);
      setAnnouncementStats(statsResponse ?? defaultAnnouncementStats);
      setPagination((prev) => ({
        ...prev,
        total: response.meta.total,
        lastPage: Math.max(response.meta.lastPage, 1),
      }));
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setAnnouncements([]);
      setAnnouncementStats(defaultAnnouncementStats);
      toast.error("Failed to fetch announcements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthLoading, user?.userId, pagination.page]);

  const stats = [
    announcementStats.totalAnnouncements,
    announcementStats.published,
    announcementStats.scheduled,
    announcementStats.drafts,
  ];

  const weeklyChanges = [
    announcementStats.weeklyChange?.totalAnnouncements ?? 0,
    announcementStats.weeklyChange?.published ?? 0,
    announcementStats.weeklyChange?.scheduled ?? 0,
    announcementStats.weeklyChange?.drafts ?? 0,
  ];

  const formatWeeklyChange = (value: number) =>
    `${value > 0 ? "+" : ""}${value}% this week`;

  const shouldShowPagination = pagination.total > pagination.limit;

  const goToPage = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      page: Math.min(Math.max(page, 1), prev.lastPage),
    }));
  };

  const visibleAnnouncements = useMemo(() => {
    const statusByTab: Record<ActiveTab, AnnouncementStatus> = {
      Published: "Published",
      Scheduled: "Scheduled",
      Drafts: "Draft",
      Archived: "Archived",
    };

    return announcements.filter((announcement) => {
      const matchesTab = announcement.status === statusByTab[activeTab];
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        announcement.title.toLowerCase().includes(query) ||
        announcement.content.toLowerCase().includes(query) ||
        announcement.audience.some((audience) => audience.toLowerCase().includes(query));

      return matchesTab && matchesSearch;
    });
  }, [activeTab, announcements, searchTerm]);

  const averageReadRate = useMemo(() => {
    return Math.round(announcementStats.readRate ?? 0);
  }, [announcementStats.readRate]);

  const dailyViews = useMemo(() => {
    if (announcementStats.dailyViews?.length) {
      return announcementStats.dailyViews;
    }

    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return { date: date.toISOString(), views: 0 };
    });
  }, [announcementStats.dailyViews]);

  const maxDailyViews = Math.max(...dailyViews.map((item) => item.views), 1);

  const handleAudienceToggle = (audience: Audience) => {
    setNewAnnouncement((prev) => {
      const exists = prev.audience.includes(audience);
      const nextAudience = exists
        ? prev.audience.filter((item) => item !== audience)
        : [...prev.audience, audience];

      return { ...prev, audience: nextAudience.length ? nextAudience : [audience] };
    });
  };

  const validateAttachmentFile = (file: File) => {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }
    return null;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateAttachmentFile(file);
    if (validationError) {
      toast.error(validationError);
      e.target.value = "";
      return;
    }

    setAttachmentName(file.name);
    setIsUploadingAttachment(true);
    setUploadProgress(0);

    try {
      const attachmentUrl = await uploadFileAttachment(file, setUploadProgress);
      setNewAnnouncement((prev) => ({ ...prev, attachment: attachmentUrl }));
      toast.success("Attachment uploaded successfully.");
    } catch (error) {
      console.error("Error uploading attachment:", error);
      setAttachmentName(null);
      toast.error("Failed to upload attachment. Please try again.");
    } finally {
      setIsUploadingAttachment(false);
      setUploadProgress(0);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      toast.error("Title and content are required.");
      return;
    }

    if (newAnnouncement.schedule === "later" && !newAnnouncement.scheduledFor) {
      toast.error("Choose a date and time for scheduled announcements.");
      return;
    }

    try {
      setIsSubmitting(true);
      const scheduledFor =
        newAnnouncement.schedule === "later" && newAnnouncement.scheduledFor
          ? new Date(newAnnouncement.scheduledFor).toISOString()
          : undefined;

      const created = await createAnnouncement({
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        attachment: newAnnouncement.attachment,
        attachments: newAnnouncement.attachment
          ? [newAnnouncement.attachment]
          : undefined,
        audience: newAnnouncement.audience,
        status:
          newAnnouncement.schedule === "later" ? "SCHEDULED" : "PUBLISHED",
        scheduledFor,
      });

      setAnnouncements((prev) => [getDerivedAnnouncement(created), ...prev]);
      setNewAnnouncement({
        title: "",
        content: "",
        attachment: undefined,
        audience: ["All Parents"],
        schedule: "now",
        scheduledFor: undefined,
        preview: false,
      });
      setAttachmentName(null);
      setIsModalOpen(false);
      await fetchAnnouncements();
      toast.success("Announcement created successfully.");
    } catch (error: any) {
      console.error("Error creating announcement:", error);
      toast.error(error?.message || "Failed to create announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <AnnouncementsSkeleton />;
  }

  return (
    <>
      <div className="min-h-full max-w-full overflow-x-hidden bg-white">
        <section
          className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8"
          data-guide="announcements-header"
        >
          <div className="mx-auto w-full max-w-[1480px]">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#003366]">
                  <Megaphone className="h-3.5 w-3.5" />
                  School-wide communications
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                  Announcements
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  Create, schedule, analyze, and manage every school announcement
                  from one calm command center.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search announcements..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-[#003366] focus:ring-2 focus:ring-blue-100 sm:w-72"
                  />
                </div>
                <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50">
                  <Filter className="h-4 w-4" />
                  Filters
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  data-guide="announcements-create"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#003366] px-5 text-sm font-semibold text-white shadow-lg shadow-blue-950/15 hover:bg-[#002952]"
                >
                  <Plus className="h-4 w-4" />
                  New Announcement
                </button>
              </div>
            </div>

            <div
              className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              data-guide="announcements-stats"
            >
              {statConfig.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className={cn("rounded-2xl p-3", stat.tone)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium text-slate-400">
                        {formatWeeklyChange(weeklyChanges[index])}
                      </span>
                    </div>
                    <p className="mt-5 text-3xl font-bold text-slate-950">
                      {stats[index]}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0 space-y-6">
              <div
                className="rounded-2xl border border-slate-200 bg-white shadow-sm"
                data-guide="announcements-list"
              >
                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition",
                          activeTab === tab
                            ? "bg-[#003366] text-white shadow-sm"
                            : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                        )}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <CheckCircle2 className="h-4 w-4 text-[#003366]" />
                    {visibleAnnouncements.length} records visible
                  </div>
                </div>

                <div className="overflow-hidden">
                  <table className="w-full table-fixed text-left">
                    <colgroup>
                      <col className="w-[28%]" />
                      <col className="w-[18%]" />
                      <col className="w-[13%]" />
                      <col className="w-[15%]" />
                      <col className="w-[14%]" />
                      <col className="w-[12%]" />
                    </colgroup>
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-4">Announcement</th>
                        <th className="px-4 py-4">Audience</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4">Publish Date</th>
                        <th className="px-4 py-4">Read Rate</th>
                        <th className="px-4 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleAnnouncements.length ? (
                        visibleAnnouncements.map((announcement) => (
                        <tr
                          key={announcement.id}
                          className="group transition hover:bg-slate-50/80"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#003366]">
                                {announcement.pinned ? (
                                  <Pin className="h-5 w-5" />
                                ) : announcement.hasAttachment ? (
                                  <FileText className="h-5 w-5" />
                                ) : (
                                  <Bell className="h-5 w-5" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="truncate font-semibold text-slate-950">
                                    {announcement.title}
                                  </p>
                                  {announcement.pinned && (
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#003366]">
                                      Pinned
                                    </span>
                                  )}
                                  {announcement.hasAttachment && (
                                    <Paperclip className="h-4 w-4 text-slate-400" />
                                  )}
                                </div>
                                <p className="mt-1 truncate text-sm text-slate-500">
                                  {announcement.content}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {announcement.audience.map((audience) => (
                                <span
                                  key={audience}
                                  className={cn(
                                    "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold",
                                    audienceStyles[audience]
                                  )}
                                >
                                  <Users className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{audience}</span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
                                statusStyles[announcement.status]
                              )}
                            >
                              {announcement.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-slate-600">
                            <span className="inline-flex min-w-0 items-center gap-2">
                              <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
                              {formatDateTime(announcement.publishDate)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-[#003366]"
                                  style={{ width: `${clampPercent(announcement.readRate)}%` }}
                                />
                              </div>
                              <span className="shrink-0 text-sm font-semibold text-slate-700">
                                {announcement.readRate}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-1.5">
                              {[Eye, Pencil, MoreVertical].map((Icon, index) => (
                                <button
                                  key={index}
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-blue-100 hover:bg-blue-50 hover:text-[#003366]"
                                >
                                  <Icon className="h-4 w-4" />
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-5 py-12 text-center text-sm text-slate-500"
                          >
                            No announcements found for this view.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    {shouldShowPagination
                      ? `Showing ${
                          visibleAnnouncements.length
                            ? (pagination.page - 1) * pagination.limit + 1
                            : 0
                        } to ${Math.min(
                          pagination.page * pagination.limit,
                          pagination.total
                        )} of ${pagination.total} announcements`
                      : `Showing ${visibleAnnouncements.length} of ${pagination.total} announcements`}
                  </p>
                  {shouldShowPagination && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={pagination.page <= 1}
                        onClick={() => goToPage(pagination.page - 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-[#003366] px-3 text-sm font-bold text-[#003366]">
                        {pagination.page}
                      </span>
                      <button
                        type="button"
                        disabled={pagination.page >= pagination.lastPage}
                        onClick={() => goToPage(pagination.page + 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="min-w-0 space-y-6" data-guide="announcements-analytics">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Read rate
                    </p>
                    <p className="mt-1 text-3xl font-bold text-slate-950">
                      {averageReadRate}%
                    </p>
                  </div>
                  <div className="rounded-2xl bg-blue-50 p-3 text-[#003366]">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#003366]"
                    style={{ width: `${clampPercent(averageReadRate)}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                {[
                  [
                    "Parent engagement",
                    `${announcementStats.parentEngagement ?? 0}%`,
                    "Read rate across guardians",
                  ],
                  [
                    "Student engagement",
                    `${announcementStats.studentEngagement ?? 0}%`,
                    "Average student reads",
                  ],
                ].map(([label, value, caption]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
                    <p className="mt-1 text-sm text-slate-500">{caption}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-slate-950">
                      Daily announcement views
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Views over the last school week
                    </p>
                  </div>
                  <Eye className="h-5 w-5 text-slate-400" />
                </div>
                <div className="mt-6 flex h-44 items-end gap-3">
                  {dailyViews.map((item) => (
                    <div key={item.date} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-xl bg-[#003366]"
                        style={{
                          height: `${Math.max(
                            item.views ? (item.views / maxDailyViews) * 100 : 4,
                            4
                          )}%`,
                        }}
                        title={`${item.views} views`}
                      />
                      <span className="text-xs font-semibold text-slate-400">
                        {new Intl.DateTimeFormat("en-GB", {
                          weekday: "short",
                        })
                          .format(new Date(item.date))
                          .slice(0, 1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#003366]">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">
                    Create Announcement
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Share important updates with your school community.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              id="announcement-form"
              onSubmit={handleSubmit}
              className="flex-1 space-y-6 overflow-y-auto px-6 py-5"
            >
              <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      Title
                    </label>
                    <input
                      value={newAnnouncement.title}
                      onChange={(e) =>
                        setNewAnnouncement((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      maxLength={100}
                      placeholder="Enter announcement title..."
                      className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 text-sm shadow-sm focus:border-[#003366] focus:ring-2 focus:ring-blue-100"
                    />
                    <p className="mt-1 text-right text-xs text-slate-400">
                      {newAnnouncement.title.length}/100
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      Content
                    </label>
                    <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-3 py-2">
                        {["Paragraph", "B", "I", "U"].map((item) => (
                          <button
                            key={item}
                            type="button"
                            className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-white"
                          >
                            {item}
                          </button>
                        ))}
                        <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-white">
                          <ImageIcon className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-white">
                          <Paperclip className="h-4 w-4" />
                        </button>
                      </div>
                      <textarea
                        value={newAnnouncement.content}
                        onChange={(e) =>
                          setNewAnnouncement((prev) => ({
                            ...prev,
                            content: e.target.value,
                          }))
                        }
                        maxLength={2000}
                        rows={7}
                        placeholder="Write your announcement content..."
                        className="w-full resize-none border-0 p-4 text-sm focus:ring-0"
                      />
                    </div>
                    <p className="mt-1 text-right text-xs text-slate-400">
                      {newAnnouncement.content.length}/2000
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      Audience
                    </label>
                    <div className="mt-2 grid gap-2">
                      {(["All Parents", "All Students", "All Teachers", "Custom"] as Audience[]).map(
                        (audience) => (
                          <button
                            key={audience}
                            type="button"
                            onClick={() => handleAudienceToggle(audience)}
                            className={cn(
                              "flex items-center gap-2 rounded-xl border px-3 py-3 text-sm font-semibold transition",
                              newAnnouncement.audience.includes(audience)
                                ? "border-[#003366] bg-blue-50 text-[#003366]"
                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            <Users className="h-4 w-4" />
                            {audience}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      Schedule
                    </label>
                    <div className="mt-2 grid gap-2">
                      {[
                        ["now", "Publish immediately", "Send this announcement right away."],
                        ["later", "Schedule for later", "Choose a future date and time."],
                      ].map(([value, title, caption]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setNewAnnouncement((prev) => ({
                              ...prev,
                              schedule: value as "now" | "later",
                              scheduledFor:
                                value === "now" ? undefined : prev.scheduledFor,
                            }))
                          }
                          className={cn(
                            "rounded-xl border p-3 text-left transition",
                            newAnnouncement.schedule === value
                              ? "border-[#003366] bg-blue-50"
                              : "border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          <p className="text-sm font-bold text-slate-800">{title}</p>
                          <p className="mt-1 text-xs text-slate-500">{caption}</p>
                        </button>
                      ))}
                    </div>
                    {newAnnouncement.schedule === "later" && (
                      <input
                        type="datetime-local"
                        value={newAnnouncement.scheduledFor ?? ""}
                        onChange={(event) =>
                          setNewAnnouncement((prev) => ({
                            ...prev,
                            scheduledFor: event.target.value,
                          }))
                        }
                        className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 shadow-sm focus:border-[#003366] focus:ring-2 focus:ring-blue-100"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-slate-700">
                  Attachment
                </label>
                <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-4 py-7 text-center hover:border-[#003366] hover:bg-blue-50/40">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isUploadingAttachment || isSubmitting}
                  />
                  <UploadCloud className="h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    {attachmentName || "Click to upload or drag and drop"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Images, PDFs, and documents up to 10MB
                  </p>
                  {isUploadingAttachment && (
                    <div className="mt-4 h-2 w-52 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full bg-[#003366]"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                </label>
              </div>

              <button
                type="button"
                onClick={() =>
                  setNewAnnouncement((prev) => ({ ...prev, preview: !prev.preview }))
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Eye className="h-4 w-4" />
                Preview {newAnnouncement.preview ? "on" : "off"}
              </button>

              {newAnnouncement.preview && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Recipient preview
                  </p>
                  <h3 className="mt-3 text-lg font-bold text-slate-950">
                    {newAnnouncement.title || "Announcement title"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {newAnnouncement.content || "Your announcement content will appear here."}
                  </p>
                </div>
              )}
            </form>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="announcement-form"
                disabled={isSubmitting || isUploadingAttachment}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#003366] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/15 hover:bg-[#002952] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {isSubmitting ? "Creating..." : "Create Announcement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AnnouncementDashboard;
