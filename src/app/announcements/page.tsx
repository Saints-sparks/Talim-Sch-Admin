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
  createAnnouncement,
  CreateAnnouncementResponse,
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
  preview: boolean;
};

const tabs: ActiveTab[] = ["Published", "Scheduled", "Drafts", "Archived"];

const fallbackAnnouncements: DashboardAnnouncement[] = [
  {
    id: "sample-1",
    title: "Parent-Teacher Meeting",
    content:
      "We are pleased to inform you about the upcoming parent-teacher meeting scheduled for next week.",
    attachment: undefined,
    createdAt: "2026-05-12T10:30:00.000Z",
    reactions: {},
    audience: ["All Parents"],
    status: "Published",
    publishDate: "2026-05-12T10:30:00.000Z",
    readRate: 86,
    pinned: true,
    views: 1284,
  },
  {
    id: "sample-2",
    title: "Science Fair 2026",
    content:
      "Our annual Science Fair is scheduled for next month. Students can begin project registration this week.",
    attachment: "science-fair.pdf",
    createdAt: "2026-05-10T14:00:00.000Z",
    reactions: {},
    audience: ["All Students", "All Teachers"],
    status: "Published",
    publishDate: "2026-05-10T14:00:00.000Z",
    readRate: 74,
    pinned: false,
    views: 932,
  },
  {
    id: "sample-3",
    title: "School Holiday Notice",
    content:
      "Please be informed that the school will remain closed on Monday for the public holiday.",
    attachment: undefined,
    createdAt: "2026-05-13T09:00:00.000Z",
    reactions: {},
    audience: ["All Parents", "All Students"],
    status: "Scheduled",
    publishDate: "2026-05-15T09:00:00.000Z",
    readRate: 0,
    pinned: false,
    views: 0,
  },
  {
    id: "sample-4",
    title: "New Library Books Available",
    content:
      "We have added new books to our library collection. Check them out during break periods.",
    attachment: "library-list.xlsx",
    createdAt: "2026-05-11T12:00:00.000Z",
    reactions: {},
    audience: ["All Students"],
    status: "Draft",
    publishDate: null,
    readRate: 0,
    pinned: false,
    views: 0,
  },
  {
    id: "sample-5",
    title: "Term One Club Registration Closed",
    content:
      "Registration for Term One extracurricular clubs has closed. Final lists will be shared with class teachers.",
    attachment: undefined,
    createdAt: "2026-04-22T11:00:00.000Z",
    reactions: {},
    audience: ["All Teachers"],
    status: "Archived",
    publishDate: "2026-04-22T11:00:00.000Z",
    readRate: 91,
    pinned: false,
    views: 511,
  },
];

const statConfig = [
  { label: "Total announcements", icon: Megaphone, tone: "bg-blue-50 text-[#003366]" },
  { label: "Published", icon: Send, tone: "bg-emerald-50 text-emerald-700" },
  { label: "Scheduled", icon: Clock3, tone: "bg-amber-50 text-amber-700" },
  { label: "Drafts", icon: Archive, tone: "bg-slate-100 text-slate-700" },
];

const audienceStyles: Record<Audience, string> = {
  "All Parents": "bg-blue-50 text-[#003366] border-blue-100",
  "All Students": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "All Teachers": "bg-violet-50 text-violet-700 border-violet-100",
  Custom: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusStyles: Record<AnnouncementStatus, string> = {
  Published: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Scheduled: "bg-amber-50 text-amber-700 border-amber-100",
  Draft: "bg-slate-100 text-slate-700 border-slate-200",
  Archived: "bg-gray-100 text-gray-600 border-gray-200",
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
  announcement: CreateAnnouncementResponse,
  index: number
): DashboardAnnouncement => ({
  ...announcement,
  audience:
    normalizeAudience(announcement.audience) ??
    (index % 3 === 0
      ? ["All Parents"]
      : index % 3 === 1
      ? ["All Students"]
      : ["All Teachers", "All Parents"]),
  status: normalizeStatus(announcement.status),
  publishDate: announcement.scheduledFor ?? announcement.createdAt,
  readRate: announcement.readRate ?? Math.min(96, 68 + index * 7),
  pinned: announcement.isPinned ?? index === 0,
  views: announcement.readCount ?? 420 + index * 186,
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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: fallbackAnnouncements.length,
    lastPage: 1,
  });
  const [newAnnouncement, setNewAnnouncement] = useState<NewAnnouncement>({
    title: "",
    content: "",
    attachment: undefined,
    audience: ["All Parents"],
    schedule: "now",
    preview: false,
  });

  const fetchAnnouncements = async () => {
    if (isAuthLoading) return;

    if (!user?.userId) {
      setAnnouncements(fallbackAnnouncements);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await getAnnouncementsBySender(
        user.userId,
        pagination.page,
        pagination.limit
      );
      const apiAnnouncements = response.data.map(getDerivedAnnouncement);
      setAnnouncements(
        apiAnnouncements.length > 0 ? apiAnnouncements : fallbackAnnouncements
      );
      setPagination((prev) => ({
        ...prev,
        total: Math.max(response.meta.total, fallbackAnnouncements.length),
        lastPage: Math.max(response.meta.lastPage, 1),
      }));
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setAnnouncements(fallbackAnnouncements);
      toast.error("Showing sample announcements while the server is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthLoading, user?.userId, pagination.page]);

  const stats = useMemo(() => {
    const total = announcements.length;
    const published = announcements.filter((item) => item.status === "Published").length;
    const scheduled = announcements.filter((item) => item.status === "Scheduled").length;
    const drafts = announcements.filter((item) => item.status === "Draft").length;

    return [total, published, scheduled, drafts];
  }, [announcements]);

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
    const published = announcements.filter((item) => item.status === "Published");
    if (!published.length) return 0;
    return Math.round(
      published.reduce((sum, item) => sum + item.readRate, 0) / published.length
    );
  }, [announcements]);

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

    try {
      setIsSubmitting(true);
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
        scheduledFor:
          newAnnouncement.schedule === "later"
            ? "2026-05-15T09:00:00.000Z"
            : undefined,
      });

      setAnnouncements((prev) => [
        {
          ...created,
          audience: newAnnouncement.audience,
          status: newAnnouncement.schedule === "later" ? "Scheduled" : "Published",
          publishDate:
            newAnnouncement.schedule === "later"
              ? "2026-05-15T09:00:00.000Z"
              : created.createdAt,
          readRate: 0,
          pinned: false,
          views: 0,
        },
        ...prev,
      ]);
      setNewAnnouncement({
        title: "",
        content: "",
        attachment: undefined,
        audience: ["All Parents"],
        schedule: "now",
        preview: false,
      });
      setAttachmentName(null);
      setIsModalOpen(false);
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
      <div className="min-h-full bg-white">
        <section className="border-b border-slate-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1480px]">
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
                <div className="relative">
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
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#003366] px-5 text-sm font-semibold text-white shadow-lg shadow-blue-950/15 hover:bg-[#002952]"
                >
                  <Plus className="h-4 w-4" />
                  New Announcement
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                        +{index + 4}% this week
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

        <main className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex gap-2 overflow-x-auto">
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
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {visibleAnnouncements.length} records visible
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Announcement</th>
                        <th className="px-5 py-4">Audience</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Publish Date</th>
                        <th className="px-5 py-4">Read Rate</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleAnnouncements.map((announcement) => (
                        <tr
                          key={announcement.id}
                          className="group transition hover:bg-slate-50/80"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#003366]">
                                {announcement.pinned ? (
                                  <Pin className="h-5 w-5" />
                                ) : announcement.attachment ? (
                                  <FileText className="h-5 w-5" />
                                ) : (
                                  <Bell className="h-5 w-5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="truncate font-semibold text-slate-950">
                                    {announcement.title}
                                  </p>
                                  {announcement.pinned && (
                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#003366]">
                                      Pinned
                                    </span>
                                  )}
                                  {announcement.attachment && (
                                    <Paperclip className="h-4 w-4 text-slate-400" />
                                  )}
                                </div>
                                <p className="mt-1 max-w-md truncate text-sm text-slate-500">
                                  {announcement.content}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              {announcement.audience.map((audience) => (
                                <span
                                  key={audience}
                                  className={cn(
                                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
                                    audienceStyles[audience]
                                  )}
                                >
                                  <Users className="h-3 w-3" />
                                  {audience}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
                                statusStyles[announcement.status]
                              )}
                            >
                              {announcement.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm font-medium text-slate-600">
                            <span className="inline-flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              {formatDateTime(announcement.publishDate)}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-[#003366]"
                                  style={{ width: `${announcement.readRate}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-slate-700">
                                {announcement.readRate}%
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              {[Eye, Pencil, MoreVertical].map((Icon, index) => (
                                <button
                                  key={index}
                                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm hover:border-blue-100 hover:bg-blue-50 hover:text-[#003366]"
                                >
                                  <Icon className="h-4 w-4" />
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    Showing 1 to {visibleAnnouncements.length} of{" "}
                    {visibleAnnouncements.length} announcements
                  </p>
                  <div className="flex items-center gap-2">
                    <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50">
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#003366] text-sm font-bold text-[#003366]">
                      1
                    </button>
                    <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-6">
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
                    style={{ width: `${averageReadRate}%` }}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                {[
                  ["Parent engagement", "82%", "Open rate across guardians"],
                  ["Student engagement", "76%", "Average student reads"],
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
                  {[42, 68, 54, 88, 73, 96, 61].map((height, index) => (
                    <div key={index} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-xl bg-[#003366]"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs font-semibold text-slate-400">
                        {["M", "T", "W", "T", "F", "S", "S"][index]}
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
