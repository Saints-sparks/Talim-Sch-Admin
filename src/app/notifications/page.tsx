"use client";

import React from "react";
import {
  Bell,
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  FileText,
  Filter,
  Loader2,
  MoreVertical,
  Paperclip,
  Plus,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/CustomToast";
import { cn } from "@/lib/utils";
import {
  Announcement,
  AnnouncementStats,
  CreateAnnouncementResponse,
  createAnnouncement,
  getAnnouncementsBySender,
  getAnnouncementStatsBySender,
} from "../services/announcement.service";

type TabKey = "all" | "published" | "scheduled" | "draft";

const audienceOptions = [
  { value: "all_teachers", label: "Teachers" },
  { value: "all_students", label: "Students" },
  { value: "all_parents", label: "Parents" },
];

const statusStyles: Record<string, string> = {
  PUBLISHED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  SCHEDULED: "bg-amber-50 text-amber-700 ring-amber-100",
  DRAFT: "bg-blue-50 text-blue-700 ring-blue-100",
  ARCHIVED: "bg-slate-50 text-slate-700 ring-slate-100",
};

const formatDateTime = (date?: string | null) => {
  if (!date) return "-";
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

const defaultStats: AnnouncementStats = {
  totalAnnouncements: 0,
  published: 0,
  scheduled: 0,
  drafts: 0,
  archived: 0,
  readRate: 0,
  parentEngagement: 0,
  studentEngagement: 0,
  dailyViews: [],
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = React.useState<CreateAnnouncementResponse[]>([]);
  const [stats, setStats] = React.useState<AnnouncementStats>(defaultStats);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabKey>("all");
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState<CreateAnnouncementResponse | null>(null);
  const [isCreateOpen, setCreateOpen] = React.useState(false);

  const senderId = user?.userId || user?._id || "";

  const loadData = React.useCallback(async () => {
    if (!senderId) return;
    try {
      setLoading(true);
      setError(null);
      const [announcementResponse, statsResponse] = await Promise.allSettled([
        getAnnouncementsBySender(senderId, { page: 1, limit: 100 }),
        getAnnouncementStatsBySender(senderId),
      ]);

      const items =
        announcementResponse.status === "fulfilled" ? announcementResponse.value.data : [];
      const resolvedStats =
        statsResponse.status === "fulfilled" ? statsResponse.value : defaultStats;

      setAnnouncements(items);
      setStats(resolvedStats);
      setSelected((current) => current || items[0] || null);
    } catch (err: any) {
      setError(err.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, [senderId]);

  React.useEffect(() => {
    if (senderId) {
      loadData();
    }
  }, [loadData, senderId]);

  const filteredAnnouncements = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return announcements.filter((item) => {
      const status = item.status ?? "PUBLISHED";
      const tabMatch =
        activeTab === "all"
          ? true
          : activeTab === "published"
            ? status === "PUBLISHED"
            : activeTab === "scheduled"
              ? status === "SCHEDULED"
              : status === "DRAFT";
      const searchMatch = query
        ? [item.title, item.content].join(" ").toLowerCase().includes(query)
        : true;
      return tabMatch && searchMatch;
    });
  }, [activeTab, announcements, search]);

  const handleCreate = async (payload: Announcement) => {
    await createAnnouncement(payload);
    toast.success("Announcement created successfully");
    setCreateOpen(false);
    await loadData();
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F7F9FC] p-4 sm:p-6">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#101828]">Notifications & Announcements</h1>
            <p className="mt-1 text-sm text-[#667085]">
              Send and manage school announcements for your teachers, students, and parents.
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#003366] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00264D]"
          >
            <Plus className="h-4 w-4" />
            New Announcement
          </button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<Send className="h-5 w-5" />} label="Total" value={stats.totalAnnouncements} tone="blue" />
          <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Published" value={stats.published} tone="emerald" />
          <StatCard icon={<Clock3 className="h-5 w-5" />} label="Scheduled" value={stats.scheduled} tone="amber" />
          <StatCard icon={<FileText className="h-5 w-5" />} label="Drafts" value={stats.drafts} tone="violet" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-xl border border-[#E5EAF2] bg-white shadow-sm">
            <div className="border-b border-[#E8EDF5] px-4 pt-4">
              <div className="flex gap-6 overflow-x-auto">
                {(
                  [
                    ["all", "All"],
                    ["published", "Published"],
                    ["scheduled", "Scheduled"],
                    ["draft", "Drafts"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={cn(
                      "border-b-2 px-1 pb-3 text-sm font-semibold transition",
                      activeTab === key
                        ? "border-[#0B63CE] text-[#0B63CE]"
                        : "border-transparent text-[#667085] hover:text-[#101828]",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 border-b border-[#E8EDF5] p-4 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex h-10 items-center rounded-lg border border-[#DCE5F2] bg-white px-3">
                <Search className="mr-2 h-4 w-4 text-[#98A2B3]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search announcements..."
                  className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                />
              </div>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE5F2] bg-white px-4 text-sm font-semibold text-[#344054]">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>

            <AnnouncementTable
              loading={loading}
              error={error}
              announcements={filteredAnnouncements}
              total={announcements.length}
              selectedId={selected?.id}
              onSelect={setSelected}
              onRetry={loadData}
            />
          </section>

          <aside className="space-y-4">
            {selected ? <AnnouncementPreview announcement={selected} /> : null}
          </aside>
        </div>
      </div>

      {isCreateOpen ? (
        <CreateAnnouncementModal
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      ) : null}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "blue" | "emerald" | "amber" | "violet";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#E5EAF2] bg-white p-5 shadow-sm">
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", tones[tone])}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-semibold text-[#101828]">{value}</p>
        <p className="text-xs text-[#667085]">{label}</p>
      </div>
    </div>
  );
}

function AnnouncementTable({
  loading,
  error,
  announcements,
  total,
  selectedId,
  onSelect,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  announcements: CreateAnnouncementResponse[];
  total: number;
  selectedId?: string;
  onSelect: (announcement: CreateAnnouncementResponse) => void;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <div className="flex min-h-[340px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#003366]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[340px] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="font-semibold text-red-600">{error}</p>
        <button
          onClick={onRetry}
          className="rounded-lg bg-[#003366] px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!announcements.length) {
    return (
      <div className="flex min-h-[340px] items-center justify-center p-6 text-center text-sm text-[#667085]">
        No announcements match this view.
      </div>
    );
  }

  return (
    <div>
      <div className="hidden grid-cols-[minmax(240px,1.3fr)_180px_140px_160px_120px] gap-4 border-b border-[#E8EDF5] px-4 py-3 text-xs font-semibold uppercase text-[#667085] lg:grid">
        <span>Title</span>
        <span>Audience</span>
        <span>Status</span>
        <span>Date</span>
        <span>Actions</span>
      </div>
      <div className="divide-y divide-[#EEF2F7]">
        {announcements.map((announcement) => (
          <AnnouncementRow
            key={announcement.id}
            announcement={announcement}
            selected={selectedId === announcement.id}
            onSelect={onSelect}
          />
        ))}
      </div>
      <div className="flex items-center justify-between px-4 py-4 text-xs text-[#667085]">
        <span>
          Showing {announcements.length} of {total} announcements
        </span>
      </div>
    </div>
  );
}

function AnnouncementRow({
  announcement,
  selected,
  onSelect,
}: {
  announcement: CreateAnnouncementResponse;
  selected: boolean;
  onSelect: (announcement: CreateAnnouncementResponse) => void;
}) {
  const status = announcement.status ?? "PUBLISHED";
  const audience = (announcement.audience ?? announcement.targetAudience ?? [])
    .map((role) =>
      role
        .replace(/^all_/, "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    )
    .join(", ");

  return (
    <div
      className={cn(
        "grid gap-4 px-4 py-4 transition hover:bg-[#F8FBFF] lg:grid-cols-[minmax(240px,1.3fr)_180px_140px_160px_120px]",
        selected && "bg-[#F4F8FF]",
      )}
    >
      <button onClick={() => onSelect(announcement)} className="flex min-w-0 gap-3 text-left">
        <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Bell className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[#101828]">
            {announcement.title}
          </span>
          <span className="mt-1 line-clamp-1 text-xs text-[#667085]">
            {announcement.content}
          </span>
        </span>
      </button>
      <div className="text-sm text-[#344054]">
        <p className="text-xs text-[#667085]">{audience || "All Users"}</p>
      </div>
      <div>
        <span
          className={cn(
            "rounded-full px-2 py-1 text-xs font-semibold capitalize ring-1",
            statusStyles[status] || statusStyles.PUBLISHED,
          )}
        >
          {status.toLowerCase()}
        </span>
      </div>
      <div className="text-sm text-[#344054]">
        {formatDateTime(announcement.scheduledFor || announcement.createdAt)}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSelect(announcement)}
          className="rounded-lg border border-[#DCE5F2] p-2 text-[#667085] hover:bg-white"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button className="rounded-lg border border-[#DCE5F2] p-2 text-[#667085] hover:bg-white">
          <Copy className="h-4 w-4" />
        </button>
        <button className="rounded-lg border border-[#DCE5F2] p-2 text-[#667085] hover:bg-white">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function AnnouncementPreview({
  announcement,
}: {
  announcement: CreateAnnouncementResponse;
}) {
  const status = announcement.status ?? "PUBLISHED";

  return (
    <section className="rounded-xl border border-[#E5EAF2] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[#101828]">{announcement.title}</h2>
          <p className="mt-1 text-xs text-[#667085]">School Announcement</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Bell className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-4 rounded-xl bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF6DF] p-5 text-center">
        <Bell className="mx-auto h-12 w-12 text-[#003366]" />
      </div>
      <p className="mt-4 text-sm leading-6 text-[#344054]">{announcement.content}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <InfoPill label="Status" value={status.toLowerCase()} />
        <InfoPill
          label="Read Rate"
          value={announcement.readRate != null ? `${announcement.readRate}%` : "-"}
        />
        <InfoPill label="Read Count" value={String(announcement.readCount ?? 0)} />
        <InfoPill label="Audience" value={String(announcement.audienceCount ?? "-")} />
      </div>
      {(announcement.attachments ?? (announcement.attachment ? [announcement.attachment] : [])).length ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-[#101828]">Attachments</p>
          {(announcement.attachments ?? [announcement.attachment!]).map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-[#E8EDF5] p-3 text-sm text-[#344054]"
            >
              <Paperclip className="h-4 w-4 text-[#667085]" />
              <span className="truncate">{url.split("/").pop() || "Attachment"}</span>
            </a>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E8EDF5] bg-[#FBFCFE] p-3">
      <p className="text-[#667085]">{label}</p>
      <p className="mt-1 font-semibold text-[#101828]">{value}</p>
    </div>
  );
}

function CreateAnnouncementModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (payload: Announcement) => Promise<void>;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState<Announcement>({
    title: "",
    content: "",
    audience: ["all_teachers"],
    status: "PUBLISHED",
  });

  const toggleAudience = (value: string) => {
    setForm((current) => ({
      ...current,
      audience: current.audience?.includes(value)
        ? current.audience.filter((item) => item !== value)
        : [...(current.audience ?? []), value],
    }));
  };

  const submit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(form);
    } catch (err: any) {
      toast.error(err.message || "Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#E8EDF5] p-5">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF5FF] text-[#0B63CE]">
              <Bell className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-[#101828]">Create Announcement</h2>
              <p className="text-sm text-[#667085]">
                Send a school announcement to your teachers, students, or parents.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#DCE5F2] p-2 text-[#667085] hover:bg-[#F8FBFF]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <label className="block text-sm font-medium text-[#344054]">
            Title *
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="Enter announcement title..."
              className="mt-2 h-11 w-full rounded-lg border border-[#DCE5F2] px-3 text-sm outline-none focus:border-[#0B63CE] focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block text-sm font-medium text-[#344054]">
            Content *
            <textarea
              value={form.content}
              onChange={(event) =>
                setForm((current) => ({ ...current, content: event.target.value }))
              }
              placeholder="Write your announcement..."
              maxLength={2000}
              className="mt-2 min-h-32 w-full rounded-lg border border-[#DCE5F2] p-3 text-sm outline-none focus:border-[#0B63CE] focus:ring-4 focus:ring-blue-100"
            />
            <span className="mt-1 block text-right text-xs text-[#667085]">
              {form.content.length}/2000
            </span>
          </label>

          <div>
            <p className="mb-2 text-sm font-medium text-[#344054]">Audience</p>
            <div className="flex flex-wrap gap-2">
              {audienceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleAudience(option.value)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition",
                    form.audience?.includes(option.value)
                      ? "border-[#0B63CE] bg-[#EFF5FF] text-[#0B63CE]"
                      : "border-[#DCE5F2] text-[#344054] hover:bg-[#F8FBFF]",
                  )}
                >
                  <Users className="h-4 w-4" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-[#344054]">
              Schedule
              <select
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as Announcement["status"],
                  }))
                }
                className="mt-2 h-11 w-full rounded-lg border border-[#DCE5F2] px-3 text-sm outline-none"
              >
                <option value="PUBLISHED">Publish Now</option>
                <option value="SCHEDULED">Schedule for Later</option>
                <option value="DRAFT">Save as Draft</option>
              </select>
            </label>

            {form.status === "SCHEDULED" ? (
              <label className="text-sm font-medium text-[#344054]">
                Scheduled For
                <input
                  type="datetime-local"
                  value={form.scheduledFor || ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, scheduledFor: event.target.value }))
                  }
                  className="mt-2 h-11 w-full rounded-lg border border-[#DCE5F2] px-3 text-sm outline-none"
                />
              </label>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E8EDF5] p-5">
          <button
            onClick={onClose}
            className="h-10 rounded-lg border border-[#DCE5F2] px-4 text-sm font-semibold text-[#344054]"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#003366] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {form.status === "DRAFT" ? "Save Draft" : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}
