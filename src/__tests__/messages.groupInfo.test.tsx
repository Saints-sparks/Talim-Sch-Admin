/** @jest-environment jsdom */
/**
 * Group info in Messages: the description, "Group admin" badges from the
 * room view's `admins`, who may edit the name and description
 * (`PATCH /chat/rooms/:id`), live updates from `room-updated`, and no
 * description for office threads or direct messages.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@testing-library/react";
import type { ChatRoom } from "@/types/chat.types";
import { ChatRoomType } from "@/types/chat.types";
import {
  applyRoomUpdated,
  canEditRoomDetails,
  normalizeRoom,
  upsertRoom,
} from "@/lib/chat/rooms";
import { DESCRIPTION_MAX, planDescriptionSave } from "@/app/components/messages/group-info/groupInfo";
import GroupInfoModal from "@/app/components/messages/GroupInfoModal";
import GroupMemberList from "@/app/components/messages/GroupMemberList";

const ME = "u-me";
const TEACHER = "u-teacher";
const PARENT = "u-parent";

let authUser: Record<string, unknown> = { role: "school_admin" };
let chatRooms: ChatRoom[] = [];
const updateRoomDetails = jest.fn();

jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: authUser }) }));
jest.mock("@/context/ChatsContext", () => ({
  useChatsContext: () => ({
    chatRooms,
    messages: [],
    currentRoomId: null,
    currentUserId: ME,
    updateRoomDetails,
    removeParticipant: jest.fn(),
    leaveRoom: jest.fn(),
  }),
}));
jest.mock("@/app/services/chat.service", () => ({ chatService: { uploadChatAttachment: jest.fn() } }));
jest.mock("@/app/components/messages/SharedMedia", () => ({ __esModule: true, default: () => null }));
jest.mock("@/app/components/messages/AddParentToGroupChat", () => ({ __esModule: true, default: () => null }));
jest.mock("@/app/components/messages/AddTeacherToGroupChat", () => ({ __esModule: true, default: () => null }));

const members = [
  { _id: ME, userId: ME, firstName: "Mo", lastName: "Me", role: "parent" },
  { _id: TEACHER, userId: TEACHER, firstName: "Tola", lastName: "Teacher", role: "teacher" },
  { _id: PARENT, userId: PARENT, firstName: "Ada", lastName: "Parent", role: "parent" },
];

function groupRoom(overrides: Record<string, unknown> = {}): ChatRoom {
  return normalizeRoom({
    _id: "g1",
    type: "parent_group",
    name: "5A Parents",
    description: "Notices for 5A families",
    createdBy: "someone-else",
    participants: members,
    admins: [{ id: TEACHER, name: "Tola Teacher" }],
    ...overrides,
  });
}

function openInfo(roomId = "g1", roomType = "parent_group") {
  return render(<GroupInfoModal isOpen onClose={jest.fn()} avatar="" name="5A Parents" chatRoomId={roomId} roomType={roomType} />);
}

beforeEach(() => {
  jest.clearAllMocks();
  authUser = { role: "school_admin" };
  chatRooms = [groupRoom()];
  updateRoomDetails.mockResolvedValue(undefined);
});

describe("room admins in the model", () => {
  it("reads admins, and a response without them keeps the ones the list has", () => {
    const room = groupRoom();
    expect(room.admins).toEqual([{ id: TEACHER, name: "Tola Teacher" }]);
    const patched = normalizeRoom({ _id: "g1", type: "parent_group", name: "Renamed", participants: members });
    expect(patched).not.toHaveProperty("admins");
    const [merged] = upsertRoom([room], patched);
    expect(merged.name).toBe("Renamed");
    expect(merged.admins).toEqual(room.admins);
    expect(merged.subtitle).toBe(room.subtitle);
  });

  it("lets staff and group admins edit the details, never in an office thread or a DM", () => {
    const room = groupRoom();
    expect(canEditRoomDetails(room, { id: ME, role: "school_admin" })).toBe(true);
    expect(canEditRoomDetails(room, { id: ME, role: "school_sub_admin" })).toBe(true);
    expect(canEditRoomDetails(room, { id: ME, role: "parent" })).toBe(false);
    expect(canEditRoomDetails(groupRoom({ admins: [{ id: ME, name: "Mo Me" }] }), { id: ME, role: "parent" })).toBe(true);
    expect(canEditRoomDetails(groupRoom({ type: "office" }), { id: ME, role: "school_admin" })).toBe(false);
    expect(canEditRoomDetails({ type: ChatRoomType.ONE_TO_ONE, createdBy: ME }, { id: ME, role: "school_admin" })).toBe(false);
  });

  it("applies room-updated live: name, description (cleared by ''), and admins when sent", () => {
    const rooms = [groupRoom()];
    const next = applyRoomUpdated(rooms, { roomId: "g1", name: "5A Families", description: "", avatarUrl: null });
    expect(next[0].name).toBe("5A Families");
    expect(next[0].description).toBeUndefined();
    expect(next[0].admins).toEqual(rooms[0].admins);
    const withAdmins = applyRoomUpdated(rooms, { roomId: "g1", admins: [{ id: ME, name: "Mo Me" }] });
    expect(withAdmins[0].admins).toEqual([{ id: ME, name: "Mo Me" }]);
    expect(applyRoomUpdated(rooms, { roomId: "other", name: "x" })).toBe(rooms);
  });

  it("caps the description at 500 characters", () => {
    expect(DESCRIPTION_MAX).toBe(500);
    expect(planDescriptionSave("x".repeat(501), undefined)).toEqual({ kind: "invalid" });
    expect(planDescriptionSave("x".repeat(500), undefined)).toEqual({ kind: "save", value: "x".repeat(500) });
  });
});

describe("GroupMemberList", () => {
  it("badges the group's admins and lists them after me", () => {
    render(<GroupMemberList room={groupRoom()} currentUserId={ME} canManage={false} />);
    const items = screen.getAllByRole("listitem");
    expect(within(items[0]).getByText("(You)")).toBeInTheDocument();
    expect(within(items[1]).getByText(/Tola Teacher/)).toBeInTheDocument();
    expect(within(items[1]).getByText("Group admin")).toBeInTheDocument();
    expect(within(items[2]).queryByText("Group admin")).not.toBeInTheDocument();
    expect(screen.getAllByText("Group admin")).toHaveLength(1);
  });
});

describe("GroupInfoModal", () => {
  it("shows the description, and staff can edit the name and description", async () => {
    const user = userEvent.setup();
    openInfo();
    expect(screen.getByText("Notices for 5A families")).toBeInTheDocument();
    expect(screen.getByText("Group admin")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit group description" }));
    const box = screen.getByLabelText("Group description");
    expect(box).toHaveAttribute("maxLength", "500");
    expect(box).toHaveAccessibleDescription("23/500");
    await user.clear(box);
    await user.type(box, "Term notices");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(updateRoomDetails).toHaveBeenCalledWith("g1", { description: "Term notices" }));

    await user.click(screen.getByRole("button", { name: "Edit group name" }));
    const name = screen.getByLabelText("Group name");
    await user.clear(name);
    await user.type(name, "5A Families");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(updateRoomDetails).toHaveBeenCalledWith("g1", { name: "5A Families" }));
  });

  it("lets a group admin edit the details but not the members or picture", () => {
    authUser = { role: "parent" };
    chatRooms = [groupRoom({ admins: [{ id: ME, name: "Mo Me" }] })];
    openInfo();
    expect(screen.getByRole("button", { name: "Edit group name" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit group description" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Parents" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Remove / })).not.toBeInTheDocument();
  });

  it("offers no editing to a member who is neither staff nor a group admin", () => {
    authUser = { role: "parent" };
    openInfo();
    expect(screen.getByText("Notices for 5A families")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit group name" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit group description" })).not.toBeInTheDocument();
  });

  it("updates live when room-updated changes the room", () => {
    const { rerender } = openInfo();
    expect(screen.getByText("Notices for 5A families")).toBeInTheDocument();
    chatRooms = applyRoomUpdated(chatRooms, { roomId: "g1", name: "5A Families", description: "New term, new notices" });
    rerender(<GroupInfoModal isOpen onClose={jest.fn()} avatar="" name="5A Parents" chatRoomId="g1" roomType="parent_group" />);
    expect(screen.getByRole("heading", { name: "5A Families" })).toBeInTheDocument();
    expect(screen.getByText("New term, new notices")).toBeInTheDocument();
  });

  it("has no description block for an office thread", () => {
    chatRooms = [groupRoom({ _id: "o1", type: "office", category: "office", description: undefined })];
    openInfo("o1", "office");
    expect(screen.queryByText("About")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit group description" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit group name" })).not.toBeInTheDocument();
  });

  it("has no description block for a direct message", () => {
    chatRooms = [normalizeRoom({ _id: "d1", type: "one_to_one", participants: members.slice(0, 2) })];
    openInfo("d1", "one_to_one");
    expect(screen.queryByText("About")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit group description" })).not.toBeInTheDocument();
  });
});
