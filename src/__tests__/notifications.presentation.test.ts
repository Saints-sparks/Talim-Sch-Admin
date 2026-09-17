import {
  filterNotifications,
  isPaymentNotification,
  parseAmount,
} from "@/components/notifications/notification.presentation";
import type { AdminNotification } from "@/app/services/notification.service";

function notification(overrides: Partial<AdminNotification> = {}): AdminNotification {
  return {
    id: "n1",
    title: "Term starts Monday",
    message: "Classes resume at 8am.",
    source: "school",
    sourceLabel: "School Announcement",
    category: "announcement",
    priority: "medium",
    status: "sent",
    sentBy: "Talim",
    isRead: false,
    createdAt: "2026-09-01T08:00:00.000Z",
    attachments: [],
    ...overrides,
  };
}

describe("filterNotifications", () => {
  const inbox = [
    notification({ id: "a", source: "system", isRead: false }),
    notification({ id: "b", source: "talim", isRead: true }),
    notification({ id: "c", source: "school", isRead: true }),
  ];

  it("keeps everything on the all tab", () => {
    expect(filterNotifications(inbox, "all")).toHaveLength(3);
  });

  it("shows only what the server says is unread", () => {
    expect(filterNotifications(inbox, "unread").map((n) => n.id)).toEqual(["a"]);
  });

  it("filters by source", () => {
    expect(filterNotifications(inbox, "system").map((n) => n.id)).toEqual(["a"]);
    expect(filterNotifications(inbox, "talim").map((n) => n.id)).toEqual(["b"]);
  });
});

describe("isPaymentNotification", () => {
  it("spots money in the title or the message", () => {
    expect(isPaymentNotification(notification({ title: "Payment received" }))).toBe(true);
    expect(isPaymentNotification(notification({ message: "₦45,000 credited" }))).toBe(true);
    expect(isPaymentNotification(notification({ message: "Your wallet was funded" }))).toBe(true);
  });

  it("leaves ordinary notices alone", () => {
    expect(isPaymentNotification(notification())).toBe(false);
  });
});

describe("parseAmount", () => {
  it("pulls the first currency amount out of the message", () => {
    expect(parseAmount("₦45,000.00 credited to your wallet")).toBe("₦45,000.00");
    expect(parseAmount("Paid $1,200")).toBe("$1,200");
  });

  it("returns null when there is no amount", () => {
    expect(parseAmount("Classes resume at 8am.")).toBeNull();
  });
});
