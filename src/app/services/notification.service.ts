import { API_ENDPOINTS } from "../lib/api/config";
import { apiClient } from "@/lib/apiClient";

export type AdminNotificationSource = "talim" | "system" | "school";

export type AdminNotificationCategory =
  | "announcement"
  | "attendance"
  | "academics"
  | "grading"
  | "resources"
  | "messages"
  | "account"
  | "other";

export type AdminNotificationStatus = "delivered" | "scheduled" | "draft" | "pending";

export type AdminNotification = {
  id: string;
  rawId: string;
  endpoint: "notification" | "announcement";
  title: string;
  message: string;
  source: AdminNotificationSource;
  sourceLabel: string;
  category: AdminNotificationCategory;
  audienceLabel: string;
  sentBy: string;
  sentByEmail?: string;
  status: AdminNotificationStatus;
  priority: "low" | "medium" | "high";
  createdAt: string;
  scheduledFor?: string | null;
  deliveredRate: number;
  attachments: string[];
  targetSchools: Array<{ id: string; name: string }>;
  recipientRoles: string[];
  totalRecipients: number;
  deliveredCount: number;
  pendingCount: number;
  failedCount: number;
};

export type NotificationFormPayload = {
  title: string;
  message: string;
  source: AdminNotificationSource;
  category: AdminNotificationCategory;
  priority: "low" | "medium" | "high";
  status: "send_now" | "scheduled" | "draft";
  scheduledFor?: string;
  targetSchools: string[];
  recipientRoles: string[];
  deliveryMethods: string[];
};

type PaginatedResponse<T> = {
  data?: T[];
  announcements?: T[];
  meta?: {
    total?: number;
  };
};

const getErrorMessage = async (response: Response, fallback: string) => {
  const payload = await response.json().catch(() => null);
  const message = payload?.message || payload?.error || fallback;
  return Array.isArray(message) ? message.join(", ") : message;
};

const getItems = (payload: PaginatedResponse<any> | any): any[] => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.announcements)) return payload.announcements;
  if (Array.isArray(payload)) return payload;
  return [];
};

const getId = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

const getName = (value: any, fallback = "All Schools") => {
  if (!value) return fallback;
  if (typeof value === "string") return fallback;
  return value.name || value.schoolName || value.title || fallback;
};

const getSenderName = (item: any, fallback = "Talim Admin") => {
  if (item.senderName) return item.senderName;
  if (item.senderDisplay?.name) return item.senderDisplay.name;
  const sender = item.senderId || item.createdBy;
  if (!sender || typeof sender === "string") return fallback;
  const name = [sender.firstName, sender.lastName].filter(Boolean).join(" ");
  return name || sender.email || fallback;
};

const getSenderEmail = (item: any) => {
  const sender = item.senderId || item.createdBy;
  return item.senderEmail || item.senderDisplay?.email || sender?.email;
};

const getAttachments = (item: any) => [
  ...(Array.isArray(item.attachments) ? item.attachments : []),
  ...(item.attachment ? [item.attachment] : []),
];

const toStatus = (item: any): AdminNotificationStatus => {
  const status = String(item.status || "").toLowerCase();
  if (status.includes("draft")) return "draft";
  if (status.includes("scheduled") || item.scheduledFor) return "scheduled";
  if (status.includes("pending")) return "pending";
  return "delivered";
};

const normalizeRoles = (roles: any): string[] => {
  if (!Array.isArray(roles)) return [];
  return roles.map((role) => String(role)).filter(Boolean);
};

const buildAudienceLabel = (item: any) => {
  const targetSchools = Array.isArray(item.targetSchools) ? item.targetSchools : [];
  const schoolCount = targetSchools.length;
  const roles = normalizeRoles(item.recipientRoles || item.audience);

  if (schoolCount > 1) return `${schoolCount} Schools`;
  if (schoolCount === 1) return getName(targetSchools[0]);
  if (roles.length) return roles.map(formatRole).join(", ");
  return "Global";
};

const formatRole = (role: string) =>
  role
    .replace(/^all_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const normalizeNotification = (item: any): AdminNotification => {
  const targetSchools = (Array.isArray(item.targetSchools) ? item.targetSchools : []).map((school: any) => ({
    id: getId(school),
    name: getName(school),
  }));
  const readCount = item.readCount || item.readBy?.length || 0;
  const audienceCount = item.audienceCount || targetSchools.length || 1;

  return {
    id: `notification:${item._id || item.id}`,
    rawId: item._id || item.id,
    endpoint: "notification",
    title: item.title || "Notification",
    message: item.message || item.body || "No message provided.",
    source: item.source || item.metadata?.source || "system",
    sourceLabel: item.sourceLabel || (item.source === "talim" ? "Talim Notification" : "System Notification"),
    category: item.category || item.metadata?.category || "other",
    audienceLabel: buildAudienceLabel(item),
    sentBy: getSenderName(item),
    sentByEmail: getSenderEmail(item),
    status: toStatus(item),
    priority: item.priority || "medium",
    createdAt: item.createdAt || new Date().toISOString(),
    scheduledFor: item.scheduledFor,
    deliveredRate: audienceCount ? Math.min(100, Math.round((readCount / audienceCount) * 100)) : 0,
    attachments: getAttachments(item),
    targetSchools,
    recipientRoles: normalizeRoles(item.recipientRoles),
    totalRecipients: audienceCount,
    deliveredCount: readCount,
    pendingCount: Math.max(0, audienceCount - readCount),
    failedCount: 0,
  };
};

const normalizeAnnouncement = (item: any): AdminNotification => {
  const targetSchools = item.schoolId
    ? [{ id: getId(item.schoolId), name: getName(item.schoolId, "Current School") }]
    : [];
  const readCount = item.readCount || item.readBy?.length || 0;
  const audienceCount = item.audienceCount || item.targetAudience?.length || 1;

  return {
    id: `announcement:${item._id || item.id}`,
    rawId: item._id || item.id,
    endpoint: "announcement",
    title: item.title || "School announcement",
    message: item.message || item.content || "No message provided.",
    source: "school",
    sourceLabel: "School Announcement",
    category: item.category || "announcement",
    audienceLabel: buildAudienceLabel({ ...item, targetSchools }),
    sentBy: getSenderName(item, "School Admin"),
    sentByEmail: getSenderEmail(item),
    status: toStatus(item),
    priority: "medium",
    createdAt: item.publishedAt || item.createdAt || new Date().toISOString(),
    scheduledFor: item.scheduledFor,
    deliveredRate: item.readRate ?? (audienceCount ? Math.round((readCount / audienceCount) * 100) : 0),
    attachments: getAttachments(item),
    targetSchools,
    recipientRoles: normalizeRoles(item.audience),
    totalRecipients: audienceCount,
    deliveredCount: readCount,
    pendingCount: Math.max(0, audienceCount - readCount),
    failedCount: 0,
  };
};

export const getAdminNotifications = async (userId?: string) => {
  const [notificationsResponse, announcementsResponse] = await Promise.allSettled([
    userId
      ? apiClient.get(`/notifications?page=1&limit=100&recipientId=${userId}`)
      : apiClient.get("/notifications?page=1&limit=100"),
    userId
      ? apiClient.get(`${API_ENDPOINTS.GET_ANNOUNCEMENTS_BY_SENDER(userId)}?page=1&limit=100`)
      : Promise.reject(new Error("Missing user id")),
  ]);

  const notifications =
    notificationsResponse.status === "fulfilled" && notificationsResponse.value.ok
      ? getItems(await notificationsResponse.value.json()).map(normalizeNotification)
      : [];

  const announcements =
    announcementsResponse.status === "fulfilled" && announcementsResponse.value.ok
      ? getItems(await announcementsResponse.value.json()).map(normalizeAnnouncement)
      : [];

  return [...notifications, ...announcements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const res = await apiClient.get(`/notifications/unread/${userId}`);
    if (!res.ok) return 0;
    const data = await res.json();
    return Array.isArray(data) ? data.length : (data?.count ?? data?.total ?? 0);
  } catch {
    return 0;
  }
};

export const getIncomingNotifications = async (userId: string): Promise<AdminNotification[]> => {
  try {
    const res = await apiClient.get(`/notifications?page=1&limit=100&recipientId=${userId}`);
    if (!res.ok) return [];
    const data = await res.json();
    const items = getItems(data);
    return items.map(normalizeNotification);
  } catch {
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await apiClient.patch(`/notifications/${notificationId}/read`, {});
  } catch {
    // Fail silently — UI state is already updated optimistically
  }
};

export const createAdminNotification = async (
  payload: NotificationFormPayload,
  senderId: string,
  fallbackSchoolId?: string,
) => {
  const targetSchools = payload.targetSchools.length
    ? payload.targetSchools
    : fallbackSchoolId
      ? [fallbackSchoolId]
      : [];

  if (payload.source === "school") {
    const announcementPayload = {
      title: payload.title,
      message: payload.message,
      content: payload.message,
      category: payload.category,
      audience: payload.recipientRoles.length
        ? payload.recipientRoles.map((role) => `all_${role}`)
        : ["all_teachers", "all_students", "all_parents"],
      status:
        payload.status === "draft"
          ? "DRAFT"
          : payload.status === "scheduled"
            ? "SCHEDULED"
            : "PUBLISHED",
      scheduledFor: payload.scheduledFor || undefined,
      isPinned: false,
    };

    const response = await apiClient.post(API_ENDPOINTS.CREATE_ANNOUNCEMENT, announcementPayload);
    if (!response.ok) {
      throw new Error(await getErrorMessage(response, "Failed to create school announcement"));
    }
    return response.json();
  }

  const notificationPayload = {
    title: payload.title,
    message: payload.message,
    senderId,
    targetSchools,
    recipientRoles: payload.recipientRoles,
    priority: payload.priority,
    type: `${payload.category}_notification`,
    source: payload.source,
    category: payload.category,
    scheduledFor: payload.status === "scheduled" ? payload.scheduledFor : undefined,
    isScheduled: payload.status === "scheduled",
    metadata: {
      deliveryMethods: payload.deliveryMethods,
      source: payload.source,
      category: payload.category,
      module: payload.category,
    },
  };

  const response = await apiClient.post("/notifications", notificationPayload);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to create notification"));
  }
  return response.json();
};
