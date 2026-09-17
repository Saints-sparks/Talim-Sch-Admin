/**
 * The administrator's own notification inbox.
 *
 * Notifications are per-user, not per-school: every call here is scoped by the
 * signed-in user's id, and the API refuses to show one user another's inbox.
 *
 * Read state lives on the server (`readBy` on the notification, surfaced as
 * `isRead` for the requesting recipient), so it survives a reload and agrees
 * with the bell in the header. Nothing here keeps read state in the browser.
 *
 * See `talimBE-V2/src/modules/notification/controllers/notifications.controller.ts`
 * and `fcm.controller.ts`. Every function throws `ApiError` on a non-2xx
 * response.
 */
import { api } from "@/lib/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Who sent a notification (`NotificationSource` on the backend). */
export type NotificationSource = "school" | "talim" | "system";

/** What a notification is about (`NotificationCategory` on the backend). */
export type NotificationCategory =
  | "announcement"
  | "attendance"
  | "academics"
  | "grading"
  | "resources"
  | "messages"
  | "account"
  | "other";

/** How loudly it should be shown (`NotificationPriority` on the backend). */
export type NotificationPriority = "low" | "medium" | "high";

/** Where delivery got to (`NotificationStatus` on the backend). */
export type NotificationDeliveryStatus = "pending" | "sent" | "failed";

/** One notification, normalised for the inbox. */
export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  source: NotificationSource;
  /** Human-readable source, e.g. "Talim Notification" — the API supplies it. */
  sourceLabel: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  status: NotificationDeliveryStatus;
  /** Display name of the sender. */
  sentBy: string;
  sentByEmail?: string;
  /** True when this recipient has already opened it. */
  isRead: boolean;
  createdAt: string;
  attachments: string[];
}

/** A notification exactly as the API sends it, before normalisation. */
interface RawNotification {
  _id?: string;
  id?: string;
  title?: string;
  message?: string;
  body?: string;
  source?: string;
  sourceLabel?: string;
  category?: string;
  priority?: string;
  status?: string;
  senderName?: string;
  senderEmail?: string;
  senderId?: string | { firstName?: string; lastName?: string; email?: string };
  isRead?: boolean;
  attachment?: string;
  attachments?: string[];
  createdAt?: string;
}

/** The pagination envelope `GET /notifications` replies with. */
interface NotificationPage {
  data?: RawNotification[];
  meta?: { total?: number };
}

// ─── Normalisation ────────────────────────────────────────────────────────────

const SOURCES = new Set<NotificationSource>(["school", "talim", "system"]);
const CATEGORIES = new Set<NotificationCategory>([
  "announcement",
  "attendance",
  "academics",
  "grading",
  "resources",
  "messages",
  "account",
  "other",
]);
const PRIORITIES = new Set<NotificationPriority>(["low", "medium", "high"]);
const STATUSES = new Set<NotificationDeliveryStatus>(["pending", "sent", "failed"]);

/** The sender's display name, from whichever field the API populated. */
function senderName(raw: RawNotification): string {
  if (raw.senderName) return raw.senderName;
  const sender = raw.senderId;
  if (!sender || typeof sender === "string") return "Talim";
  const name = [sender.firstName, sender.lastName].filter(Boolean).join(" ").trim();
  return name || sender.email || "Talim";
}

/** The sender's email, when the API populated the sender. */
function senderEmail(raw: RawNotification): string | undefined {
  if (raw.senderEmail) return raw.senderEmail;
  const sender = raw.senderId;
  return sender && typeof sender !== "string" ? sender.email : undefined;
}

/**
 * Narrows a value from the API onto one of a known set, falling back when the
 * server sends something this build has not heard of.
 */
function oneOf<T extends string>(value: unknown, allowed: Set<T>, fallback: T): T {
  const candidate = String(value ?? "").toLowerCase() as T;
  return allowed.has(candidate) ? candidate : fallback;
}

/** Turns an API notification into the shape the inbox renders. */
function normalize(raw: RawNotification): AdminNotification {
  const source = oneOf<NotificationSource>(raw.source, SOURCES, "system");

  return {
    id: raw._id ?? raw.id ?? "",
    title: raw.title || "Notification",
    message: raw.message || raw.body || "No message provided.",
    source,
    sourceLabel: raw.sourceLabel || (source === "talim" ? "Talim Notification" : "System Notification"),
    category: oneOf<NotificationCategory>(raw.category, CATEGORIES, "other"),
    priority: oneOf<NotificationPriority>(raw.priority, PRIORITIES, "medium"),
    status: oneOf<NotificationDeliveryStatus>(raw.status, STATUSES, "sent"),
    sentBy: senderName(raw),
    sentByEmail: senderEmail(raw),
    isRead: raw.isRead === true,
    createdAt: raw.createdAt || new Date().toISOString(),
    attachments: [
      ...(Array.isArray(raw.attachments) ? raw.attachments : []),
      ...(raw.attachment ? [raw.attachment] : []),
    ],
  };
}

// ─── Calls ────────────────────────────────────────────────────────────────────

/** How many notifications one request asks for. */
const PAGE_SIZE = 100;

/**
 * The notifications addressed to one user, newest first.
 *
 * @param userId - The recipient's user id.
 * @returns The recipient's notifications.
 */
export async function getIncomingNotifications(userId: string): Promise<AdminNotification[]> {
  const params = new URLSearchParams({
    page: "1",
    limit: String(PAGE_SIZE),
    recipientId: userId,
  });
  const page = await api.get<NotificationPage>(`/notifications?${params.toString()}`);

  return (page.data ?? [])
    .map(normalize)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * One notification, for the deep link a push notification opens.
 *
 * The API refuses a notification the caller may not see, so a bad or foreign
 * id is a `NOT_FOUND` rather than someone else's message.
 *
 * @param notificationId - The notification's id.
 * @returns The notification.
 */
export async function getNotification(notificationId: string): Promise<AdminNotification> {
  const raw = await api.get<RawNotification>(
    `/notifications/${encodeURIComponent(notificationId)}`
  );
  return normalize(raw);
}

/**
 * How many notifications a user has not opened yet — what the header bell
 * shows.
 *
 * @param userId - The recipient's user id.
 * @returns The unread count.
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const data = await api.get<RawNotification[] | { count?: number; total?: number }>(
    `/notifications/unread/${encodeURIComponent(userId)}`
  );

  if (Array.isArray(data)) return data.length;
  return data?.count ?? data?.total ?? 0;
}

/**
 * Marks one notification read for the signed-in user.
 *
 * The reader is taken from the bearer token; a user id in the body is ignored
 * by the API.
 *
 * @param notificationId - The notification's id.
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await api.put(`/notifications/${encodeURIComponent(notificationId)}/read`);
}

/**
 * Marks every notification read for the signed-in user, in one request.
 *
 * @returns Nothing; the caller invalidates the inbox afterwards.
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  await api.patch("/notifications/read-all");
}
