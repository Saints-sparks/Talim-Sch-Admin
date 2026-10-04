/** @jest-environment jsdom */
/**
 * Office threads owned by a teacher or, from Part B (B10), a parent: both are
 * listed under "School office" by their owner's name with the API's subtitle
 * ("Office thread · {parent} (parent of …)"), both work before the API sends
 * `ownerRole`, and neither can be added to, removed from or left.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@testing-library/react";
import type { ChatRoom } from "@/types/chat.types";
import {
  canEditRoomDetails,
  canLeaveRoom,
  canManageRoom,
  normalizeRoom,
  officeOwnerName,
  officeOwnerRole,
  officeTeacherName,
  toDisplayRoom,
} from "@/lib/chat/rooms";
import { filterRooms, unreadOfficeThreads } from "@/app/components/messages/roomFilter";
import GroupMemberList from "@/app/components/messages/GroupMemberList";
import GroupInfoModal from "@/app/components/messages/GroupInfoModal";
import ChatSidebar from "@/app/components/messages/ChatSidebar";
import type { UseChatsReturn } from "@/hooks/useChats";

const ME = "u-admin";
const TEACHER = "u-teacher";
const PARENT = "u-parent";

let chatRooms: ChatRoom[] = [];

jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { role: "school_admin", userId: ME } }),
}));
jest.mock("@/context/ChatsContext", () => ({
  useChatsContext: () => ({
    chatRooms,
    messages: [],
    currentRoomId: null,
    currentUserId: ME,
    removeParticipant: jest.fn(),
    leaveRoom: jest.fn(),
    updateRoomDetails: jest.fn(),
  }),
}));
jest.mock("@/app/services/chat.service", () => ({
  chatService: { uploadChatAttachment: jest.fn() },
}));
jest.mock("@/app/components/messages/SharedMedia", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/app/components/messages/AddParentToGroupChat", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/app/components/messages/AddTeacherToGroupChat", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/app/components/messages/NewMessageModal", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/app/components/messages/CreateGroupModal", () => ({
  __esModule: true,
  default: () => null,
}));

const admin = { _id: ME, userId: ME, firstName: "Sam", lastName: "Admin", role: "school_admin" };
const sub = {
  _id: "u-sub",
  userId: "u-sub",
  firstName: "Ola",
  lastName: "Office",
  role: "school_sub_admin",
};
const teacher = {
  _id: TEACHER,
  userId: TEACHER,
  firstName: "Tola",
  lastName: "Teacher",
  role: "teacher",
};
const parent = { _id: PARENT, userId: PARENT, firstName: "Chidi", lastName: "Obi", role: "parent" };

/** A teacher's office room as Round 4 sends it (no owner role yet). */
const teacherOffice = normalizeRoom({
  _id: "office-t",
  type: "office",
  name: "School office",
  category: "office",
  subtitle: "Office thread · Tola Teacher",
  officeTeacherId: TEACHER,
  participants: [admin, teacher, sub],
  unreadCount: 1,
  lastMessage: {
    _id: "m1",
    senderId: TEACHER,
    senderName: "Tola",
    preview: "Leaving early?",
    createdAt: "2026-10-01T08:00:00Z",
  },
});

/** A parent's office room as Part B sends it. */
const parentOffice = normalizeRoom({
  _id: "office-p",
  type: "office",
  name: "School office",
  category: "office",
  subtitle: "Office thread · Chidi Obi (parent of Ada Obi)",
  officeOwnerId: { _id: PARENT },
  ownerRole: "parent",
  participants: [admin, parent, sub],
  unreadCount: 2,
  lastMessage: {
    _id: "m2",
    senderId: PARENT,
    senderName: "Chidi",
    preview: "About the fees",
    createdAt: "2026-10-01T09:00:00Z",
  },
});

const group = normalizeRoom({
  _id: "group-1",
  type: "custom_group",
  name: "Staff room",
  category: "group",
  subtitle: "Group · 3 members",
  participants: [admin, teacher, sub],
});

beforeEach(() => {
  chatRooms = [parentOffice, teacherOffice, group];
});

describe("office room owners", () => {
  it("reads the B10 owner fields", () => {
    expect(parentOffice.ownerRole).toBe("parent");
    expect(parentOffice.officeOwnerId).toBe(PARENT);
    expect(officeOwnerRole(parentOffice)).toBe("parent");
    expect(officeOwnerRole(teacherOffice)).toBe("teacher");
  });

  it("lists a parent's thread under the parent, with the API's subtitle", () => {
    const display = toDisplayRoom(parentOffice, ME);
    expect(display).toMatchObject({
      displayName: "Chidi Obi",
      subtitle: "Office thread · Chidi Obi (parent of Ada Obi)",
      isOffice: true,
      category: "office",
      officeOwnerRole: "parent",
    });
  });

  it("lists a teacher's thread under the teacher, as before", () => {
    const display = toDisplayRoom(teacherOffice, ME);
    expect(display).toMatchObject({
      displayName: "Tola Teacher",
      subtitle: "Office thread · Tola Teacher",
      officeOwnerRole: "teacher",
    });
    expect(officeTeacherName(teacherOffice)).toBe("Tola Teacher");
  });

  it("handles a parent's thread before the API sends ownerRole or a subtitle", () => {
    const early = normalizeRoom({ _id: "o", type: "office", participants: [admin, parent, sub] });
    expect(officeOwnerRole(early)).toBe("parent");
    expect(toDisplayRoom(early, ME)).toMatchObject({
      displayName: "Chidi Obi",
      subtitle: "Office thread · Chidi Obi (parent)",
      isOffice: true,
    });
  });

  it("takes the parent's name from the subtitle when members are bare ids", () => {
    const bare = normalizeRoom({
      _id: "o",
      type: "office",
      subtitle: "Office thread · Chidi Obi (parent of Ada Obi, Kemi Obi)",
      participants: [ME, PARENT],
    });
    expect(officeOwnerRole(bare)).toBe("parent");
    expect(officeOwnerName(bare)).toBe("Chidi Obi");
  });

  it("finds the owner by id even when the owner is not the first non-staff member", () => {
    const room = normalizeRoom({
      _id: "o",
      type: "office",
      officeOwnerId: PARENT,
      participants: [admin, teacher, parent],
    });
    expect(officeOwnerName(room)).toBe("Chidi Obi");
  });

  it("offers no managing, editing or leaving, whoever owns it", () => {
    for (const room of [parentOffice, teacherOffice]) {
      expect(canManageRoom(room, { id: ME, role: "school_admin" })).toBe(false);
      expect(canEditRoomDetails(room, { id: ME, role: "school_admin" })).toBe(false);
      expect(canLeaveRoom(room)).toBe(false);
    }
  });
});

describe("in the Messages list", () => {
  const rooms = () => [parentOffice, teacherOffice, group].map((room) => toDisplayRoom(room, ME));

  it("puts both owners under School office and counts their unread threads", () => {
    expect(filterRooms(rooms(), "office", "").map((room) => room.roomId)).toEqual([
      "office-p",
      "office-t",
    ]);
    expect(filterRooms(rooms(), "groups", "").map((room) => room.roomId)).toEqual(["group-1"]);
    expect(filterRooms(rooms(), "all", "parent of ada").map((room) => room.roomId)).toEqual([
      "office-p",
    ]);
    expect(unreadOfficeThreads(rooms())).toBe(2);
  });

  it("renders both rows with their owner and subtitle", async () => {
    const user = userEvent.setup();
    const chats = {
      chatRooms,
      isRoomsLoading: false,
      roomsError: null,
      fetchChatRooms: jest.fn(),
      currentUserId: ME,
    } as unknown as UseChatsReturn;
    render(<ChatSidebar onSelectChat={jest.fn()} selectedRoomId={null} chats={chats} />);

    await user.click(screen.getByRole("button", { name: "Filter: All chats" }));
    await user.click(await screen.findByRole("menuitem", { name: /School office/ }));

    const parentRow = screen
      .getByText("Office thread · Chidi Obi (parent of Ada Obi)")
      .closest("[role='button']") as HTMLElement;
    expect(parentRow).toHaveAttribute("data-category", "office");
    expect(parentRow).toHaveAttribute("data-office-owner", "parent");
    expect(within(parentRow).getByText("Chidi Obi")).toBeInTheDocument();

    const teacherRow = screen
      .getByText("Office thread · Tola Teacher")
      .closest("[role='button']") as HTMLElement;
    expect(teacherRow).toHaveAttribute("data-office-owner", "teacher");
    expect(screen.queryByText("Staff room")).not.toBeInTheDocument();
  });
});

describe("a parent's office thread", () => {
  it("lists the parent with no Remove or Leave", () => {
    render(<GroupMemberList room={parentOffice} currentUserId={ME} canManage />);
    expect(screen.getByText("Chidi Obi")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Remove / })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Leave group/ })).not.toBeInTheDocument();
  });

  it("explains the shared inbox and offers no adding or editing", () => {
    render(
      <GroupInfoModal
        isOpen
        onClose={jest.fn()}
        avatar=""
        name="Chidi Obi"
        chatRoomId="office-p"
        roomType="office"
      />
    );
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByText("Office thread · Chidi Obi (parent of Ada Obi)")
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/Shared school office inbox/)).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /Add parents/i })).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: /Edit group name/i })
    ).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /^Remove / })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: /Leave group/ })).not.toBeInTheDocument();
  });
});
