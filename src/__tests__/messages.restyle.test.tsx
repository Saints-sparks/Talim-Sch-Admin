/** @jest-environment jsdom */
/**
 * Messages in the tl design system: the conversation list card in its
 * loading, empty, error and filled states, the two-pane layout with nothing
 * open, the bubbles' frames, the composer and the thread notices. Behaviour
 * is covered by the other messages.* suites; these pin the restyled states.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/react";
import type { ChatRoom } from "@/types/chat.types";
import { normalizeRoom } from "@/lib/chat/rooms";
import type { UseChatsReturn } from "@/hooks/useChats";
import ChatSidebar from "@/app/components/messages/ChatSidebar";
import MessagesLayout from "@/app/components/messages/MessagesLayout";
import PrivateMessageBubble from "@/app/components/messages/PrivateMessageBubble";
import GroupMessageBubble from "@/app/components/messages/GroupMessageBubble";
import MessageInput from "@/app/components/messages/MessageInput";
import ThreadNotices from "@/app/components/messages/ThreadNotices";

const ME = "u-admin";
let layoutRooms: ChatRoom[] = [];

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));
jest.mock("@/hooks/useChats", () => ({
  useChats: () => ({
    chatRooms: layoutRooms,
    currentUserId: "u-admin",
    selectChatRoom: jest.fn(),
    resetCurrentRoom: jest.fn(),
    removedRoom: null,
    isConnected: true,
    threadStatus: "idle",
    threadError: null,
    retryCurrentRoom: jest.fn(),
    isRoomsLoading: false,
    roomsError: null,
    fetchChatRooms: jest.fn(),
  }),
}));
jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/app/components/messages/NewMessageModal", () => ({ __esModule: true, default: () => null }));
jest.mock("@/app/components/messages/CreateGroupModal", () => ({ __esModule: true, default: () => null }));

const office = normalizeRoom({
  _id: "office-1",
  type: "office",
  name: "School office",
  category: "office",
  subtitle: "Office thread · Tola Teacher",
  participants: [
    { _id: ME, userId: ME, firstName: "Sam", lastName: "Admin", role: "school_admin" },
    { _id: "u-t", userId: "u-t", firstName: "Tola", lastName: "Teacher", role: "teacher" },
  ],
  unreadCount: 2,
  lastMessage: { _id: "m1", senderId: "u-t", senderName: "Tola", preview: "Can I leave early?", createdAt: "2026-09-29T08:00:00Z" },
});

/**
 * The chat state the list card reads.
 *
 * @param overrides - Fields to change.
 * @returns A `useChats` result.
 */
function chats(overrides: Partial<UseChatsReturn> = {}): UseChatsReturn {
  return {
    chatRooms: [],
    isRoomsLoading: false,
    roomsError: null,
    fetchChatRooms: jest.fn(),
    currentUserId: ME,
    ...overrides,
  } as unknown as UseChatsReturn;
}

beforeEach(() => {
  layoutRooms = [];
});

describe("the conversation list card", () => {
  it("shows grey rows while the first load runs, and no empty note", () => {
    const { container } = render(
      <ChatSidebar onSelectChat={jest.fn()} selectedRoomId={null} chats={chats({ isRoomsLoading: true })} />,
    );
    expect(screen.getByRole("status", { name: "Loading conversations" })).toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByText("No chats yet")).not.toBeInTheDocument();
  });

  it("is empty with its heading, search, filter and actions, and nothing pulsing", () => {
    const { container } = render(<ChatSidebar onSelectChat={jest.fn()} selectedRoomId={null} chats={chats()} />);
    expect(screen.getByRole("heading", { level: 1, name: /Messages/ })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Search conversations" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter: All chats" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /New message/ })).toHaveAttribute("data-guide", "messages-new-message");
    expect(screen.getByRole("button", { name: /Create Group/ })).toHaveAttribute("data-guide", "messages-create-group");
    expect(screen.getByText("No chats yet")).toBeInTheDocument();
    expect(screen.getByText("Start by creating a group chat")).toBeInTheDocument();
    expect(container.querySelector(".animate-pulse")).toBeNull();
  });

  it("says why the list failed and retries", async () => {
    const user = userEvent.setup();
    const fetchChatRooms = jest.fn();
    render(
      <ChatSidebar
        onSelectChat={jest.fn()}
        selectedRoomId={null}
        chats={chats({ roomsError: "Network down", fetchChatRooms } as Partial<UseChatsReturn>)}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Network down");
    await user.click(within(alert).getByRole("button", { name: "Retry" }));
    expect(fetchChatRooms).toHaveBeenCalled();
  });

  it("draws a room as a selectable row with its unread badge and a paragraph preview", () => {
    render(<ChatSidebar onSelectChat={jest.fn()} selectedRoomId="office-1" chats={chats({ chatRooms: [office] })} />);
    const row = screen.getByText("Office thread · Tola Teacher").closest("[role='button']") as HTMLElement;
    expect(row).toHaveAttribute("data-category", "office");
    expect(row).toHaveAttribute("aria-current", "true");
    expect(row.className).toContain("bg-tl-select");
    expect(within(row).getByLabelText("2 unread")).toBeInTheDocument();
    // The browser suite tells the preview from a bubble by its element: the preview is a paragraph.
    expect(within(row).getByText("Can I leave early?").tagName).toBe("P");
  });
});

describe("the two-pane layout", () => {
  it("shows the list and the empty conversation card when nothing is open", () => {
    render(<MessagesLayout replyingMessage={null} setReplyingMessage={jest.fn()} />);
    const chatArea = document.querySelector('[data-guide="messages-chat-area"]') as HTMLElement;
    expect(chatArea.className).toContain("rounded-[22px]");
    expect(within(chatArea).getByText("No chat selected")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: /Messages/ })).toBeInTheDocument();
  });
});

describe("bubbles", () => {
  const base = { _id: "m1", avatar: "", type: "text", time: "09:00" };

  it("draws mine navy and theirs white with a border, the text in a span", () => {
    render(
      <>
        <PrivateMessageBubble msg={{ ...base, senderType: "self", sender: "Me", text: "Mine here" }} />
        <PrivateMessageBubble msg={{ ...base, _id: "m2", senderType: "other", sender: "Tola Teacher", text: "Theirs here" }} />
      </>,
    );
    const mine = screen.getByText("Mine here");
    const theirs = screen.getByText("Theirs here");
    expect(mine.tagName).toBe("SPAN");
    expect(mine.closest(".rounded-2xl")?.className).toContain("bg-tl-brand-fill");
    expect(theirs.closest(".rounded-2xl")?.className).toContain("border-tl-line");
  });

  it("names the sender over someone else's group message, and counts readers under mine", () => {
    render(
      <>
        <GroupMessageBubble msg={{ ...base, senderType: "other", sender: "Ada Parent", text: "Hello" }} />
        <GroupMessageBubble
          msg={{ ...base, _id: "m3", senderType: "self", sender: "Sam Admin", text: "Hi", deliveryState: "read", readByCount: 2 }}
        />
      </>,
    );
    expect(screen.getByText("Ada Parent").className).toContain("text-tone-fg");
    expect(screen.getByText("Read by 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Read")).toBeInTheDocument();
  });
});

describe("the composer", () => {
  it("offers the voice note when empty and Send once there is text", () => {
    const { rerender } = render(<MessageInput value="" onValueChange={jest.fn()} onSend={jest.fn()} onSendVoice={jest.fn()} />);
    expect(screen.getByRole("textbox", { name: "Message" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record voice note" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send" })).not.toBeInTheDocument();
    rerender(<MessageInput value="Hello" onValueChange={jest.fn()} onSend={jest.fn()} onSendVoice={jest.fn()} />);
    expect(screen.getByRole("button", { name: "Send" })).toHaveClass("bg-tl-brand-fill");
  });
});

describe("thread notices", () => {
  it("shows the offline strip and the load error with Retry", () => {
    const onRetry = jest.fn();
    render(
      <ThreadNotices isConnected={false} threadStatus="error" threadError="Couldn't load this chat" hasMessages={false} onRetry={onRetry} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/offline/);
    const alert = screen.getByRole("alert");
    expect(alert.className).toContain("bg-tl-danger-bg");
    within(alert).getByRole("button", { name: "Retry" }).click();
    expect(onRetry).toHaveBeenCalled();
  });
});
