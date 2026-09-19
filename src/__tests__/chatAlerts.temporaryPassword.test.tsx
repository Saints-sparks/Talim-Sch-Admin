/** @jest-environment jsdom */
import { render, waitFor } from "@testing-library/react";
import { ChatAlertsProvider } from "@/context/ChatAlertsContext";
import { chatService } from "@/app/services/chat.service";

let mockUser: { userId: string; mustChangePassword?: boolean } | null = null;
jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: mockUser }) }));
const unsubscribe = () => () => undefined;
const socket = {
  subscribe: unsubscribe,
  onConnect: unsubscribe,
  onUnreadMessagesUpdate: unsubscribe,
  onNotification: unsubscribe,
  fetchUnreadCountViaSocket: jest.fn(),
};
jest.mock("@/context/WebSocketContext", () => ({ useWebSocketContext: () => socket }));
const router = { push: jest.fn() };
jest.mock("next/navigation", () => ({ useRouter: () => router, usePathname: () => "/set-password" }));
jest.mock("@/app/services/chat.service", () => ({ chatService: { getUnreadMessageCount: jest.fn() } }));
jest.mock("@/app/hooks/usePushNotifications", () => ({ reconcileWebPushForUser: jest.fn() }));
jest.mock("@/components/CustomToast", () => ({ toast: { info: jest.fn() } }));

const unreadCount = chatService.getUnreadMessageCount as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  unreadCount.mockResolvedValue(3);
});

describe("ChatAlertsProvider", () => {
  it("does not ask for the unread count while a temporary password is in use", async () => {
    mockUser = { userId: "u1", mustChangePassword: true };
    render(<ChatAlertsProvider>x</ChatAlertsProvider>);
    await Promise.resolve();
    expect(unreadCount).not.toHaveBeenCalled();
  });

  it("asks as soon as the password is replaced", async () => {
    mockUser = { userId: "u1", mustChangePassword: true };
    const { rerender } = render(<ChatAlertsProvider>x</ChatAlertsProvider>);
    expect(unreadCount).not.toHaveBeenCalled();

    mockUser = { userId: "u1", mustChangePassword: false };
    rerender(<ChatAlertsProvider>x</ChatAlertsProvider>);
    await waitFor(() => expect(unreadCount).toHaveBeenCalledTimes(1));
  });

  it("asks for an ordinary admin on sign-in", async () => {
    mockUser = { userId: "u1" };
    render(<ChatAlertsProvider>x</ChatAlertsProvider>);
    await waitFor(() => expect(unreadCount).toHaveBeenCalledTimes(1));
  });
});
