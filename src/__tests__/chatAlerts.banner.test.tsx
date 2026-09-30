/** @jest-environment jsdom */
/**
 * The in-app chat banner: every message reaches every member, so the room
 * open on screen gets no banner while the page is focused, and does while it
 * is in the background.
 */
import { act, render } from "@testing-library/react";
import { ChatAlertsProvider } from "@/context/ChatAlertsContext";
import { openChatRoom } from "@/lib/chat/openRoom";
import { toast } from "@/components/CustomToast";

const handlers = new Map<string, (data: unknown) => void>();
const noop = () => () => undefined;
const socket = {
  subscribe: (event: string, fn: (data: unknown) => void) => {
    handlers.set(event, fn);
    return () => handlers.delete(event);
  },
  onConnect: noop,
  onUnreadMessagesUpdate: noop,
  onNotification: noop,
  fetchUnreadCountViaSocket: jest.fn(),
};

jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: { userId: "u-admin" } }) }));
jest.mock("@/context/WebSocketContext", () => ({ useWebSocketContext: () => socket }));
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }), usePathname: () => "/messages" }));
jest.mock("@/app/services/chat.service", () => ({ chatService: { getUnreadMessageCount: jest.fn().mockResolvedValue(0) } }));
jest.mock("@/app/hooks/usePushNotifications", () => ({ reconcileWebPushForUser: jest.fn() }));
jest.mock("@/components/CustomToast", () => ({ toast: { info: jest.fn() } }));

let focused = true;

beforeEach(() => {
  jest.clearAllMocks();
  handlers.clear();
  focused = true;
  jest.spyOn(document, "hasFocus").mockImplementation(() => focused);
  openChatRoom.set("r1");
});

afterEach(() => openChatRoom.set(null));

/** Sends a `chat-room-activity` event from someone else. */
function activity(roomId: string, messageId: string) {
  act(() =>
    handlers.get("chat-room-activity")!({
      roomId,
      lastMessage: { _id: messageId, senderId: "u-teacher", senderName: "Tola", preview: "Hello", createdAt: new Date().toISOString() },
    })
  );
}

describe("ChatAlertsProvider banner", () => {
  it("stays quiet for the open room while the page is focused", () => {
    render(<ChatAlertsProvider>x</ChatAlertsProvider>);
    activity("r1", "m1");
    expect(toast.info).not.toHaveBeenCalled();
  });

  it("shows for the open room when the page isn't focused", () => {
    focused = false;
    render(<ChatAlertsProvider>x</ChatAlertsProvider>);
    activity("r1", "m1");
    expect(toast.info).toHaveBeenCalledWith("Tola: Hello", undefined, 6000, expect.any(Object));
  });

  it("shows for another room while focused", () => {
    render(<ChatAlertsProvider>x</ChatAlertsProvider>);
    activity("r2", "m2");
    expect(toast.info).toHaveBeenCalledTimes(1);
  });
});
