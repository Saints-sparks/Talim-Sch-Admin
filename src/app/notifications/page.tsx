"use client";

import React from "react";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
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
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/CustomToast";
import { cn } from "@/lib/utils";
import {
  AdminNotification,
  AdminNotificationCategory,
  AdminNotificationSource,
  createAdminNotification,
  getAdminNotifications,
  NotificationFormPayload,
} from "../services/notification.service";

type TabKey = "all" | "sent" | "scheduled" | "draft";

const templates = [
  {
    title: "Maintenance Alert",
    message:
      "We would like to inform you that Talim will undergo scheduled maintenance. During this time, the platform may be temporarily unavailable.",
    category: "account" as AdminNotificationCategory,
  },
  {
    title: "New Feature Announcement",
    message:
      "We are excited to announce new improvements to Talim. Please explore the latest updates in your dashboard.",
    category: "other" as AdminNotificationCategory,
  },
  {
    title: "Subscription Reminder",
    message:
      "This is a reminder about your upcoming Talim subscription renewal. Please contact support for assistance.",
    category: "account" as AdminNotificationCategory,
  },
  {
    title: "Policy Update",
    message:
      "Talim policies have been updated. Please review the latest platform guidelines.",
    category: "account" as AdminNotificationCategory,
  },
  {
    title: "General Announcement",
    message: "Please take note of this important update from Talim.",
    category: "announcement" as AdminNotificationCategory,
  },
];

const sourceMeta: Record<
  AdminNotificationSource,
  { label: string; Icon: React.ComponentType<{ className?: string }>; color: string; badge: string }
> = {
  talim: {
    label: "Talim",
    Icon: Send,
    color: "bg-blue-50 text-blue-700",
    badge: "bg-blue-50 text-blue-700 ring-blue-100",
  },
  system: {
    label: "System",
    Icon: ShieldCheck,
    color: "bg-violet-50 text-violet-700",
    badge: "bg-violet-50 text-violet-700 ring-violet-100",
  },
  school: {
    label: "School",
    Icon: Bell,
    color: "bg-emerald-50 text-emerald-700",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  },
};

const statusStyles = {
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  scheduled: "bg-amber-50 text-amber-700 ring-amber-100",
  draft: "bg-blue-50 text-blue-700 ring-blue-100",
  pending: "bg-slate-50 text-slate-700 ring-slate-100",
};

const roleOptions = [
  { value: "teachers", label: "Teachers" },
  { value: "students", label: "Students" },
  { value: "parents", label: "Parents" },
  { value: "school_admin", label: "School Admins" },
];

const categoryOptions: Array<{ value: AdminNotificationCategory; label: string }> = [
  { value: "announcement", label: "Announcement" },
  { value: "attendance", label: "Attendance" },
  { value: "academics", label: "Academics" },
  { value: "grading", label: "Grading" },
  { value: "resources", label: "Resources" },
  { value: "messages", label: "Messages" },
  { value: "account", label: "Account" },
  { value: "other", label: "Other" },
];

const getSchoolId = (schoolId: any): string => {
  if (!schoolId) return "";
  if (typeof schoolId === "string") return schoolId;
  return schoolId._id || schoolId.id || "";
};

const getSchoolName = (user: any) => {
  if (user?.schoolName) return user.schoolName;
  if (user?.schoolId && typeof user.schoolId === "object") {
    return user.schoolId.name || user.schoolId.schoolName || "Current School";
  }
  return "Current School";
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

const formatRole = (role: string) =>
  role.replace(/^all_/, "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<AdminNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<TabKey>("all");
  const [search, setSearch] = React.useState("");
  const [sourceFilter, setSourceFilter] = React.useState<"all" | AdminNotificationSource>("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | TabKey>("all");
  const [selected, setSelected] = React.useState<AdminNotification | null>(null);
  const [isCreateOpen, setCreateOpen] = React.useState(false);
  const [draftTemplate, setDraftTemplate] = React.useState<(typeof templates)[number] | null>(null);

  const userId = user?.userId || user?._id || "";
  const schoolId = getSchoolId(user?.schoolId);
  const schoolName = getSchoolName(user);

  const loadNotifications = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await getAdminNotifications(userId);
      setNotifications(items);
      setSelected((current) => current || items[0] || null);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  React.useEffect(() => {
    if (userId) {
      loadNotifications();
    }
  }, [loadNotifications, userId]);

  const stats = React.useMemo(() => {
    const delivered = notifications.filter((item) => item.status === "delivered");
    return {
      total: notifications.length,
      delivered: delivered.length,
      scheduled: notifications.filter((item) => item.status === "scheduled").length,
      drafts: notifications.filter((item) => item.status === "draft").length,
      deliveryRate: notifications.length ? Math.round((delivered.length / notifications.length) * 100) : 0,
    };
  }, [notifications]);

  const filteredNotifications = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return notifications.filter((notification) => {
      const matchesTab =
        activeTab === "all"
          ? true
          : activeTab === "sent"
            ? notification.status === "delivered"
            : activeTab === "scheduled"
              ? notification.status === "scheduled"
              : notification.status === "draft";
      const matchesSource = sourceFilter === "all" || notification.source === sourceFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "sent" ? notification.status === "delivered" : notification.status === statusFilter);
      const matchesSearch = query
        ? [notification.title, notification.message, notification.sentBy, notification.audienceLabel]
            .join(" ")
            .toLowerCase()
            .includes(query)
        : true;
      return matchesTab && matchesSource && matchesStatus && matchesSearch;
    });
  }, [activeTab, notifications, search, sourceFilter, statusFilter]);

  const handleCreate = async (payload: NotificationFormPayload) => {
    if (!userId) {
      toast.error("You need to be signed in to send notifications.");
      return;
    }

    await createAdminNotification(payload, userId, schoolId);
    toast.success(payload.source === "school" ? "School announcement created" : "Talim notification sent");
    setCreateOpen(false);
    setDraftTemplate(null);
    await loadNotifications();
  };

  const openTemplate = (template: (typeof templates)[number]) => {
    setDraftTemplate(template);
    setCreateOpen(true);
  };

  return (
    <div className="h-full overflow-y-auto bg-[#F7F9FC] p-4 sm:p-6">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#101828]">Notifications</h1>
            <p className="mt-1 text-sm text-[#667085]">
              Send and manage Talim notifications and school announcements.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE5F2] bg-white px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#F8FBFF]">
              <ShieldCheck className="h-4 w-4" />
              Notification Templates
            </button>
            <button
              onClick={() => {
                setDraftTemplate(null);
                setCreateOpen(true);
              }}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#003366] px-4 text-sm font-semibold text-white shadow-sm shadow-[#003366]/20 transition hover:bg-[#00264D]"
            >
              <Plus className="h-4 w-4" />
              New Notification
            </button>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<Send className="h-5 w-5" />} label="Total Sent" value={stats.total} tone="blue" />
          <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Delivered" value={stats.delivered} tone="emerald" />
          <StatCard icon={<Clock3 className="h-5 w-5" />} label="Scheduled" value={stats.scheduled} tone="amber" />
          <StatCard icon={<FileText className="h-5 w-5" />} label="Drafts" value={stats.drafts} tone="violet" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-xl border border-[#E5EAF2] bg-white shadow-sm">
            <div className="border-b border-[#E8EDF5] px-4 pt-4">
              <div className="flex gap-6 overflow-x-auto">
                {[
                  ["all", "All Notifications"],
                  ["sent", "Sent"],
                  ["scheduled", "Scheduled"],
                  ["draft", "Drafts"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as TabKey)}
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

            <div className="grid gap-3 border-b border-[#E8EDF5] p-4 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
              <div className="flex h-10 items-center rounded-lg border border-[#DCE5F2] bg-white px-3">
                <Search className="mr-2 h-4 w-4 text-[#98A2B3]" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search notifications..."
                  className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm outline-none"
                />
              </div>
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value as any)}
                className="h-10 rounded-lg border border-[#DCE5F2] bg-white px-3 text-sm text-[#344054] outline-none"
              >
                <option value="all">All Sources</option>
                <option value="talim">Talim</option>
                <option value="system">System</option>
                <option value="school">School</option>
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as any)}
                className="h-10 rounded-lg border border-[#DCE5F2] bg-white px-3 text-sm text-[#344054] outline-none"
              >
                <option value="all">All Status</option>
                <option value="sent">Delivered</option>
                <option value="scheduled">Scheduled</option>
                <option value="draft">Draft</option>
              </select>
              <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DCE5F2] bg-white px-4 text-sm font-semibold text-[#344054]">
                <Filter className="h-4 w-4" />
                Filter
              </button>
            </div>

            <NotificationTable
              loading={loading}
              error={error}
              notifications={filteredNotifications}
              total={notifications.length}
              selectedId={selected?.id}
              onSelect={setSelected}
              onRetry={loadNotifications}
            />
          </section>

          <aside className="space-y-4">
            <section className="rounded-xl border border-[#E5EAF2] bg-white p-4 shadow-sm">
              <h2 className="font-semibold text-[#101828]">Quick Templates</h2>
              <p className="mt-1 text-xs text-[#667085]">Use templates to send notifications quickly.</p>
              <div className="mt-4 space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.title}
                    onClick={() => openTemplate(template)}
                    className="flex w-full items-center justify-between rounded-lg border border-[#E8EDF5] bg-white p-3 text-left transition hover:border-[#BFD7FF] hover:bg-[#F8FBFF]"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-[#101828]">{template.title}</span>
                      <span className="line-clamp-1 text-xs text-[#667085]">{template.message}</span>
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF5FF] text-[#0B63CE]">
                      <Send className="h-4 w-4" />
                    </span>
                  </button>
                ))}
              </div>
              <button className="mt-3 h-10 w-full rounded-lg border border-[#DCE5F2] text-sm font-semibold text-[#344054] transition hover:bg-[#F8FBFF]">
                View All Templates
              </button>
            </section>

            {selected ? <NotificationPreview notification={selected} /> : null}
          </aside>
        </div>
      </div>

      {isCreateOpen ? (
        <CreateNotificationModal
          template={draftTemplate}
          schoolId={schoolId}
          schoolName={schoolName}
          onClose={() => {
            setCreateOpen(false);
            setDraftTemplate(null);
          }}
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
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", tones[tone])}>{icon}</div>
      <div>
        <p className="text-2xl font-semibold text-[#101828]">{value}</p>
        <p className="text-xs text-[#667085]">{label}</p>
      </div>
    </div>
  );
}

function NotificationTable({
  loading,
  error,
  notifications,
  total,
  selectedId,
  onSelect,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  notifications: AdminNotification[];
  total: number;
  selectedId?: string;
  onSelect: (notification: AdminNotification) => void;
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
        <button onClick={onRetry} className="rounded-lg bg-[#003366] px-4 py-2 text-sm font-semibold text-white">
          Try again
        </button>
      </div>
    );
  }

  if (!notifications.length) {
    return (
      <div className="flex min-h-[340px] items-center justify-center p-6 text-center text-sm text-[#667085]">
        No notifications match this view.
      </div>
    );
  }

  return (
    <div>
      <div className="hidden grid-cols-[minmax(240px,1.3fr)_180px_180px_140px_160px_120px] gap-4 border-b border-[#E8EDF5] px-4 py-3 text-xs font-semibold uppercase text-[#667085] lg:grid">
        <span>Title</span>
        <span>Audience</span>
        <span>Sent By</span>
        <span>Status</span>
        <span>Sent / Scheduled</span>
        <span>Actions</span>
      </div>
      <div className="divide-y divide-[#EEF2F7]">
        {notifications.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            selected={selectedId === notification.id}
            onSelect={onSelect}
          />
        ))}
      </div>
      <div className="flex items-center justify-between px-4 py-4 text-xs text-[#667085]">
        <span>
          Showing {notifications.length} of {total} notifications
        </span>
        <span className="hidden sm:inline">Talim notifications and school announcements are shown together.</span>
      </div>
    </div>
  );
}

function NotificationRow({
  notification,
  selected,
  onSelect,
}: {
  notification: AdminNotification;
  selected: boolean;
  onSelect: (notification: AdminNotification) => void;
}) {
  const meta = sourceMeta[notification.source] || sourceMeta.system;
  const Icon = meta.Icon;

  return (
    <div
      className={cn(
        "grid gap-4 px-4 py-4 transition hover:bg-[#F8FBFF] lg:grid-cols-[minmax(240px,1.3fr)_180px_180px_140px_160px_120px]",
        selected && "bg-[#F4F8FF]",
      )}
    >
      <button onClick={() => onSelect(notification)} className="flex min-w-0 gap-3 text-left">
        <span className={cn("mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", meta.color)}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-[#101828]">{notification.title}</span>
          <span className="mt-1 line-clamp-1 text-xs text-[#667085]">{notification.message}</span>
          <span className={cn("mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1", meta.badge)}>
            {notification.sourceLabel}
          </span>
        </span>
      </button>
      <div className="text-sm text-[#344054]">
        <p className="font-medium">{notification.audienceLabel}</p>
        <p className="text-xs text-[#667085]">
          {notification.recipientRoles.length
            ? notification.recipientRoles.map(formatRole).join(", ")
            : "All Users"}
        </p>
      </div>
      <div className="text-sm">
        <p className="font-medium text-[#344054]">{notification.sentBy}</p>
        <p className="truncate text-xs text-[#667085]">{notification.sentByEmail || "admin@talim.com"}</p>
      </div>
      <div>
        <span className={cn("rounded-full px-2 py-1 text-xs font-semibold capitalize ring-1", statusStyles[notification.status])}>
          {notification.status}
        </span>
        {notification.status === "delivered" ? (
          <p className="mt-1 text-xs text-emerald-600">{notification.deliveredRate}%</p>
        ) : null}
      </div>
      <div className="text-sm text-[#344054]">{formatDateTime(notification.scheduledFor || notification.createdAt)}</div>
      <div className="flex items-center gap-2">
        <button onClick={() => onSelect(notification)} className="rounded-lg border border-[#DCE5F2] p-2 text-[#667085] hover:bg-white">
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

function NotificationPreview({ notification }: { notification: AdminNotification }) {
  const meta = sourceMeta[notification.source] || sourceMeta.system;
  const Icon = meta.Icon;

  return (
    <section className="rounded-xl border border-[#E5EAF2] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-[#101828]">{notification.title}</h2>
          <p className="mt-1 text-xs text-[#667085]">{notification.sourceLabel}</p>
        </div>
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", meta.color)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-4 rounded-xl bg-gradient-to-br from-[#EAF3FF] via-white to-[#FFF6DF] p-5 text-center">
        <Icon className="mx-auto h-12 w-12 text-[#003366]" />
      </div>
      <p className="mt-4 text-sm leading-6 text-[#344054]">{notification.message}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <InfoPill label="Recipients" value={String(notification.totalRecipients)} />
        <InfoPill label="Delivered" value={String(notification.deliveredCount)} />
        <InfoPill label="Pending" value={String(notification.pendingCount)} />
        <InfoPill label="Failed" value={String(notification.failedCount)} />
      </div>
      {notification.attachments.length ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-[#101828]">Attachments ({notification.attachments.length})</p>
          {notification.attachments.map((attachment) => (
            <a
              key={attachment}
              href={attachment}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-lg border border-[#E8EDF5] p-3 text-sm text-[#344054]"
            >
              <Paperclip className="h-4 w-4 text-[#667085]" />
              <span className="truncate">{attachment.split("/").pop() || "Attachment"}</span>
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

function CreateNotificationModal({
  template,
  schoolId,
  schoolName,
  onClose,
  onSubmit,
}: {
  template: (typeof templates)[number] | null;
  schoolId: string;
  schoolName: string;
  onClose: () => void;
  onSubmit: (payload: NotificationFormPayload) => Promise<void>;
}) {
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState<NotificationFormPayload>({
    title: template?.title || "",
    message: template?.message || "",
    source: "talim",
    category: template?.category || "other",
    priority: "medium",
    status: "send_now",
    targetSchools: schoolId ? [schoolId] : [],
    recipientRoles: ["teachers"],
    deliveryMethods: ["in_app", "email", "push"],
  });

  const setField = <K extends keyof NotificationFormPayload>(key: K, value: NotificationFormPayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleRole = (role: string) => {
    setForm((current) => ({
      ...current,
      recipientRoles: current.recipientRoles.includes(role)
        ? current.recipientRoles.filter((item) => item !== role)
        : [...current.recipientRoles, role],
    }));
  };

  const toggleDelivery = (method: string) => {
    setForm((current) => ({
      ...current,
      deliveryMethods: current.deliveryMethods.includes(method)
        ? current.deliveryMethods.filter((item) => item !== method)
        : [...current.deliveryMethods, method],
    }));
  };

  const submit = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error("Title and message are required.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(form);
    } catch (err: any) {
      toast.error(err.message || "Failed to send notification");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
      <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#E8EDF5] p-5">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF5FF] text-[#0B63CE]">
              <Send className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-xl font-semibold text-[#101828]">Create New Notification</h2>
              <p className="text-sm text-[#667085]">Send a notification to schools, user types or specific users.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg border border-[#DCE5F2] p-2 text-[#667085] hover:bg-[#F8FBFF]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <FormStep number={1} title="Basic Information" />
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
            <label className="text-sm font-medium text-[#344054]">
              Title *
              <input
                value={form.title}
                onChange={(event) => setField("title", event.target.value)}
                placeholder="Enter notification title..."
                className="mt-2 h-11 w-full rounded-lg border border-[#DCE5F2] px-3 text-sm outline-none focus:border-[#0B63CE] focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label className="text-sm font-medium text-[#344054]">
              Priority
              <select
                value={form.priority}
                onChange={(event) => setField("priority", event.target.value as any)}
                className="mt-2 h-11 w-full rounded-lg border border-[#DCE5F2] px-3 text-sm outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Normal</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>

          <label className="block text-sm font-medium text-[#344054]">
            Message *
            <textarea
              value={form.message}
              onChange={(event) => setField("message", event.target.value)}
              placeholder="Write your notification message..."
              maxLength={2000}
              className="mt-2 min-h-32 w-full rounded-lg border border-[#DCE5F2] p-3 text-sm outline-none focus:border-[#0B63CE] focus:ring-4 focus:ring-blue-100"
            />
            <span className="mt-1 block text-right text-xs text-[#667085]">{form.message.length}/2000</span>
          </label>

          <FormStep number={2} title="Audience" />
          <div className="grid gap-3 md:grid-cols-3">
            {([
              ["talim", "Talim Notification", "Platform-wide alert from Talim."],
              ["system", "System Notification", "Automated platform notification."],
              ["school", "School Announcement", "Message from this school."],
            ] as const).map(([value, label, description]) => (
              <button
                key={value}
                onClick={() => setField("source", value)}
                className={cn(
                  "rounded-xl border p-4 text-left transition",
                  form.source === value
                    ? "border-[#0B63CE] bg-[#F4F8FF] ring-2 ring-blue-100"
                    : "border-[#DCE5F2] hover:bg-[#F8FBFF]",
                )}
              >
                <span className="block font-semibold text-[#101828]">{label}</span>
                <span className="mt-1 block text-xs text-[#667085]">{description}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-medium text-[#344054]">
              Select Schools *
              <select
                value={form.targetSchools[0] || ""}
                onChange={(event) => setField("targetSchools", event.target.value ? [event.target.value] : [])}
                className="mt-2 h-11 w-full rounded-lg border border-[#DCE5F2] px-3 text-sm outline-none"
              >
                <option value={schoolId}>{schoolName}</option>
              </select>
            </label>
            <label className="text-sm font-medium text-[#344054]">
              Category
              <select
                value={form.category}
                onChange={(event) => setField("category", event.target.value as AdminNotificationCategory)}
                className="mt-2 h-11 w-full rounded-lg border border-[#DCE5F2] px-3 text-sm outline-none"
              >
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-[#344054]">
              Schedule
              <select
                value={form.status}
                onChange={(event) => setField("status", event.target.value as any)}
                className="mt-2 h-11 w-full rounded-lg border border-[#DCE5F2] px-3 text-sm outline-none"
              >
                <option value="send_now">Send Now</option>
                <option value="scheduled">Schedule for Later</option>
                <option value="draft">Save as Draft</option>
              </select>
            </label>
          </div>

          {form.status === "scheduled" ? (
            <input
              type="datetime-local"
              value={form.scheduledFor || ""}
              onChange={(event) => setField("scheduledFor", event.target.value)}
              className="h-11 w-full rounded-lg border border-[#DCE5F2] px-3 text-sm outline-none md:w-64"
            />
          ) : null}

          <div>
            <p className="mb-2 text-sm font-medium text-[#344054]">Select User Types</p>
            <div className="flex flex-wrap gap-2">
              {roleOptions.map((role) => (
                <button
                  key={role.value}
                  onClick={() => toggleRole(role.value)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition",
                    form.recipientRoles.includes(role.value)
                      ? "border-[#0B63CE] bg-[#EFF5FF] text-[#0B63CE]"
                      : "border-[#DCE5F2] text-[#344054] hover:bg-[#F8FBFF]",
                  )}
                >
                  <Users className="h-4 w-4" />
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-[#EFF6FF] p-3 text-sm text-[#315A8A]">
            Notification will be sent to selected user types under {schoolName}.
          </div>

          <FormStep number={3} title="Delivery Settings" />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-medium text-[#344054]">Delivery Method</p>
              {[
                ["in_app", "In-App Notification"],
                ["email", "Email"],
                ["push", "Push Notification"],
              ].map(([value, label]) => (
                <label key={value} className="mb-3 flex items-center gap-2 text-sm text-[#344054]">
                  <input
                    type="checkbox"
                    checked={form.deliveryMethods.includes(value)}
                    onChange={() => toggleDelivery(value)}
                    className="h-4 w-4 accent-[#0B63CE]"
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="rounded-xl border border-[#E8EDF5] bg-[#FBFCFE] p-4">
              <p className="text-sm font-semibold text-[#101828]">Preview Difference</p>
              <p className="mt-2 text-sm text-[#667085]">
                Talim/System notifications appear as platform alerts. School announcements appear as school-originated messages.
              </p>
              <span className={cn("mt-3 inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1", sourceMeta[form.source].badge)}>
                {sourceMeta[form.source].label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E8EDF5] p-5">
          <button onClick={onClose} className="h-10 rounded-lg border border-[#DCE5F2] px-4 text-sm font-semibold text-[#344054]">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#003366] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Notification
          </button>
        </div>
      </div>
    </div>
  );
}

function FormStep({ number, title }: { number: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0B63CE] text-xs font-semibold text-white">
        {number}
      </span>
      <h3 className="font-semibold text-[#101828]">{title}</h3>
    </div>
  );
}
