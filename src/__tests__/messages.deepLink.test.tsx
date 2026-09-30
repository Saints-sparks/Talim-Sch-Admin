/**
 * @jest-environment jsdom
 *
 * `/messages?room=<id>` opens that room, also after React's development
 * double mount: the first mount's cleanup leaves the room (useChats), so the
 * remount must open it again, or the thread waits on "Loading messages..." for
 * ever (found by the Round 4 browser run on `next dev`).
 */
import React, { StrictMode } from "react";
import { render } from "@testing-library/react";
import MessagesLayout from "@/app/components/messages/MessagesLayout";

const selectChatRoom = jest.fn();
const resetCurrentRoom = jest.fn();
const replace = jest.fn();
let room: string | null = "68c0a1b2c3d4e5f6000000c1";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: jest.fn() }),
  useSearchParams: () => ({ get: (key: string) => (key === "room" ? room : null) }),
}));
jest.mock("@/hooks/useChats", () => ({
  useChats: () => ({
    chatRooms: [],
    currentUserId: "u1",
    selectChatRoom,
    resetCurrentRoom,
    removedRoom: null,
    isConnected: true,
    threadStatus: "loading",
    threadError: null,
    retryCurrentRoom: jest.fn(),
  }),
}));
jest.mock("@/app/components/messages/ChatSidebar", () => ({ __esModule: true, default: () => null }));
jest.mock("@/app/components/messages/GroupChat", () => ({ __esModule: true, default: () => null }));
jest.mock("@/app/components/messages/PrivateChat", () => ({ __esModule: true, default: () => null }));
jest.mock("@/app/components/messages/ThreadNotices", () => ({ __esModule: true, default: () => null }));

beforeEach(() => {
  jest.clearAllMocks();
  room = "68c0a1b2c3d4e5f6000000c1";
});

describe("MessagesLayout deep link", () => {
  it("opens the linked room on load", () => {
    render(<MessagesLayout replyingMessage={null} setReplyingMessage={jest.fn()} />);
    expect(selectChatRoom).toHaveBeenCalledWith("68c0a1b2c3d4e5f6000000c1");
  });

  it("opens it again after React's development remount, which left the room", () => {
    render(
      <StrictMode>
        <MessagesLayout replyingMessage={null} setReplyingMessage={jest.fn()} />
      </StrictMode>,
    );
    // Once for the first mount, once more after the simulated unmount and remount.
    expect(selectChatRoom.mock.calls.map(([id]) => id)).toEqual(["68c0a1b2c3d4e5f6000000c1", "68c0a1b2c3d4e5f6000000c1"]);
  });

  it("does not open a room without a link", () => {
    room = null;
    render(<MessagesLayout replyingMessage={null} setReplyingMessage={jest.fn()} />);
    expect(selectChatRoom).not.toHaveBeenCalled();
  });
});
