/** @jest-environment jsdom */
/**
 * The school office inbox (Round 4 §27–28): office threads are listed under
 * "Teachers · Office" with their subtitle, admins reply as in any room, and
 * nobody can remove the teacher, add members or leave.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/react";
import type { ChatRoom } from "@/types/chat.types";
import { normalizeRoom, toDisplayRoom } from "@/lib/chat/rooms";
import { filterRooms, unreadOfficeThreads } from "@/app/components/messages/roomFilter";
import GroupMemberList from "@/app/components/messages/GroupMemberList";
import ChatHeader from "@/app/components/messages/ChatHeader";
import GroupInfoModal from "@/app/components/messages/GroupInfoModal";
import ChatSidebar from "@/app/components/messages/ChatSidebar";
import type { UseChatsReturn } from "@/hooks/useChats";

const ME = "u-admin";
const TEACHER = "u-teacher";

let chatRooms: ChatRoom[] = [];
const removeParticipant = jest.fn();
const leaveRoom = jest.fn();

jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: { role: "school_admin", userId: ME } }) }));
jest.mock("@/context/ChatsContext", () => ({
  useChatsContext: () => ({
    chatRooms,
    messages: [],
    currentRoomId: null,
    currentUserId: ME,
    removeParticipant,
    leaveRoom,
    updateRoomDetails: jest.fn(),
  }),
}));
jest.mock("@/app/services/chat.service", () => ({ chatService: { uploadChatAttachment: jest.fn() } }));
jest.mock("@/app/components/messages/SharedMedia", () => ({ __esModule: true, default: () => null }));
jest.mock("@/app/components/messages/AddParentToGroupChat", () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>add parents dialog</div> : null),
}));
jest.mock("@/app/components/messages/AddTeacherToGroupChat", () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>add teachers dialog</div> : null),
}));
jest.mock("@/app/components/messages/NewMessageModal", () => ({ __esModule: true, default: () => null }));
jest.mock("@/app/components/messages/CreateGroupModal", () => ({ __esModule: true, default: () => null }));

const members = [
  { _id: ME, userId: ME, firstName: "Sam", lastName: "Admin", role: "school_admin" },
  { _id: TEACHER, userId: TEACHER, firstName: "Tola", lastName: "Teacher", role: "teacher" },
  { _id: "u-sub", userId: "u-sub", firstName: "Ola", lastName: "Office", role: "school_sub_admin" },
];

const office = normalizeRoom({
  _id: "office-1",
  type: "office",
  name: "School office",
  category: "office",
  subtitle: "Office thread · Tola Teacher",
  participants: members,
  unreadCount: 2,
  lastMessage: { _id: "m1", senderId: TEACHER, senderName: "Tola", preview: "Can I leave early?", createdAt: "2026-09-29T08:00:00Z" },
});
const group = normalizeRoom({
  _id: "group-1",
  type: "custom_group",
  name: "Staff room",
  category: "group",
  subtitle: "Group · 3 members",
  participants: members,
  lastMessage: { _id: "m2", senderId: TEACHER, senderName: "Tola", preview: "Hello all", createdAt: "2026-09-29T07:00:00Z" },
});
const dm = normalizeRoom({
  _id: "dm-1",
  type: "one_to_one",
  category: "colleague",
  subtitle: "Mathematics · colleague",
  participants: members.slice(0, 2),
  lastMessage: { _id: "m3", senderId: TEACHER, senderName: "Tola", preview: "Thanks", createdAt: "2026-09-29T06:00:00Z" },
});

beforeEach(() => {
  jest.clearAllMocks();
  chatRooms = [office, group, dm];
});

describe("room filter", () => {
  const rooms = [office, group, dm].map((r) => toDisplayRoom(r, ME));

  it("lists office threads only under Teachers · Office", () => {
    expect(filterRooms(rooms, "office", "").map((r) => r.roomId)).toEqual(["office-1"]);
    expect(filterRooms(rooms, "groups", "").map((r) => r.roomId)).toEqual(["group-1"]);
    expect(filterRooms(rooms, "teachers", "").map((r) => r.roomId)).toEqual(["dm-1"]);
    expect(filterRooms(rooms, "all", "")).toHaveLength(3);
  });

  it("searches the subtitle too, and counts unread office threads", () => {
    expect(filterRooms(rooms, "all", "office thread").map((r) => r.roomId)).toEqual(["office-1"]);
    expect(filterRooms(rooms, "all", "mathematics").map((r) => r.roomId)).toEqual(["dm-1"]);
    expect(unreadOfficeThreads(rooms)).toBe(1);
  });
});

describe("GroupMemberList in an office thread", () => {
  it("offers no Remove and no Leave, even when told the viewer can manage", () => {
    render(<GroupMemberList room={office} currentUserId={ME} canManage />);
    expect(screen.getByText("Tola Teacher")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Remove / })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Leave group/ })).not.toBeInTheDocument();
  });

  it("still offers both in an ordinary group", () => {
    render(<GroupMemberList room={group} currentUserId={ME} canManage />);
    expect(screen.getByRole("button", { name: "Remove Tola Teacher" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Leave group/ })).toBeInTheDocument();
  });
});

describe("ChatHeader for an office thread", () => {
  function renderHeader(roomId: string, roomType: string) {
    return render(
      <ChatHeader
        avatar=""
        name="Tola Teacher"
        status="Office thread · Tola Teacher"
        currentUserId={ME}
        participants={members}
        isGroup
        roomType={roomType}
        chatRoomId={roomId}
      />
    );
  }

  it("has no Add control and a members list without adding", async () => {
    const user = userEvent.setup();
    renderHeader("office-1", "office");
    expect(screen.getByText("Office thread · Tola Teacher")).toBeInTheDocument();
    expect(screen.queryByTitle("Add Participants to Group")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "More options" }));
    expect(await screen.findByRole("menuitem", { name: /View Members/ })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /Add Parents/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /Add Teachers/ })).not.toBeInTheDocument();
  });

  it("keeps the Add control for an admin in an ordinary group", () => {
    renderHeader("group-1", "custom_group");
    expect(screen.getByTitle("Add Participants to Group")).toBeInTheDocument();
  });
});

describe("GroupInfoModal for an office thread", () => {
  it("explains the shared inbox and offers no editing or adding", () => {
    render(<GroupInfoModal isOpen onClose={jest.fn()} avatar="" name="Tola Teacher" chatRoomId="office-1" roomType="office" />);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Office thread · Tola Teacher")).toBeInTheDocument();
    expect(within(dialog).getByText(/Shared school office inbox/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /Add parents/i })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /Add teachers/i })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /Edit group name/i })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /^Remove / })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /Leave group/ })).not.toBeInTheDocument();
  });

  it("keeps editing, adding and removing for an ordinary group", () => {
    render(<GroupInfoModal isOpen onClose={jest.fn()} avatar="" name="Staff room" chatRoomId="group-1" roomType="custom_group" />);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByText(/Shared school office inbox/)).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /Add parents/i })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: /Edit group name/i })).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Remove Tola Teacher" })).toBeInTheDocument();
  });
});

describe("ChatSidebar", () => {
  function chats(): UseChatsReturn {
    return {
      chatRooms,
      isRoomsLoading: false,
      roomsError: null,
      fetchChatRooms: jest.fn(),
      currentUserId: ME,
    } as unknown as UseChatsReturn;
  }

  it("shows the office subtitle and filters to office threads", async () => {
    const user = userEvent.setup();
    const onSelectChat = jest.fn();
    render(<ChatSidebar onSelectChat={onSelectChat} selectedRoomId={null} chats={chats()} />);

    // Subtitles show in the list generally.
    expect(screen.getByText("Office thread · Tola Teacher")).toBeInTheDocument();
    expect(screen.getByText("Group · 3 members")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Filter: All chats" }));
    await user.click(await screen.findByRole("menuitem", { name: /Teachers · Office/ }));

    expect(screen.getByRole("button", { name: "Filter: Teachers · Office" })).toBeInTheDocument();
    expect(screen.queryByText("Staff room")).not.toBeInTheDocument();
    expect(screen.queryByText("Group · 3 members")).not.toBeInTheDocument();
    const row = screen.getByText("Office thread · Tola Teacher").closest("[role='button']") as HTMLElement;
    expect(row).toHaveAttribute("data-category", "office");

    // Rows open from the keyboard.
    row.focus();
    await user.keyboard("{Enter}");
    expect(onSelectChat).toHaveBeenCalledWith(expect.objectContaining({ roomId: "office-1", isOffice: true }));
  });
});
