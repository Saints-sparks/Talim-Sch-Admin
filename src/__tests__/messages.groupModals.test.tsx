/** @jest-environment jsdom */
import React from "react";
import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "@/components/CustomToast";
import { ChatRoomType } from "@/types/chat.types";
import CreateGroupModal from "@/app/components/messages/CreateGroupModal";
import GroupInfoModal from "@/app/components/messages/GroupInfoModal";

const createGroupChat = jest.fn();
const updateRoomDetails = jest.fn();
const getClasses = jest.fn();

let authUser: Record<string, unknown> = {
  role: "school_admin",
  schoolId: "s1",
  schoolName: "Sunrise Academy",
};
let chatState: Record<string, unknown> = {};

jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/context/AuthContext", () => ({ useAuth: () => ({ user: authUser }) }));
jest.mock("@/context/ChatsContext", () => ({
  useChatsContext: () => ({ createGroupChat, updateRoomDetails, ...chatState }),
}));
jest.mock("@/app/services/subjects.service", () => ({
  getClasses: (...a: unknown[]) => getClasses(...a),
  getCoursesBySchool: jest.fn().mockResolvedValue([]),
}));
jest.mock("@/app/components/messages/SharedMedia", () => ({
  __esModule: true,
  default: ({ section }: { section: string }) => <div>shared media: {section}</div>,
}));
jest.mock("@/app/components/messages/GroupMemberList", () => ({
  __esModule: true,
  default: () => <div>member list</div>,
}));
jest.mock("@/app/components/messages/AddParentToGroupChat", () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>add parents dialog</div> : null),
}));
jest.mock("@/app/components/messages/AddTeacherToGroupChat", () => ({
  __esModule: true,
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>add teachers dialog</div> : null),
}));
jest.mock("@/app/services/chat.service", () => ({ chatService: { uploadChatAttachment: jest.fn() } }));

beforeEach(() => {
  jest.clearAllMocks();
  authUser = { role: "school_admin", schoolId: "s1", schoolName: "Sunrise Academy" };
  chatState = {};
  getClasses.mockResolvedValue([{ _id: "c1", name: "5A", gradeLevel: "JSS1" }]);
});

describe("CreateGroupModal", () => {
  it("creates a custom group and reports it", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onSuccess = jest.fn();
    const room = { _id: "r1", reused: false };
    createGroupChat.mockResolvedValue(room);
    render(<CreateGroupModal open onClose={onClose} onSuccess={onSuccess} />);

    await user.click(screen.getByRole("button", { name: /Custom Group/ }));
    expect(screen.getByRole("heading", { name: "New Custom Group" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Sunrise Academy")).toBeDisabled();
    const create = screen.getByRole("button", { name: "Create Custom Group" });
    expect(create).toBeDisabled();
    await user.type(screen.getByPlaceholderText("e.g., Staff Planning Team"), "  Staff  ");
    await user.click(create);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(room));
    expect(createGroupChat).toHaveBeenCalledWith({ name: "Staff", type: ChatRoomType.CUSTOM_GROUP });
    expect(toast.success).toHaveBeenCalledWith("Group created successfully!");
    expect(onClose).toHaveBeenCalled();
  });

  it("loads classes for a class group and sends the chosen class", async () => {
    const user = userEvent.setup();
    createGroupChat.mockResolvedValue({ _id: "r2", reused: true });
    render(<CreateGroupModal open onClose={jest.fn()} />);

    await user.click(screen.getByRole("button", { name: /Class Group/ }));
    await user.type(screen.getByPlaceholderText("e.g., Grade 5A Chat"), "5A chat");
    expect(screen.getByRole("button", { name: "Create Class Group" })).toBeDisabled();
    await user.selectOptions(await screen.findByRole("combobox"), "c1");
    await user.click(screen.getByRole("button", { name: "Create Class Group" }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Opened the existing group"));
    expect(createGroupChat).toHaveBeenCalledWith({
      name: "5A chat",
      classId: "c1",
      type: ChatRoomType.CLASS_GROUP,
    });
  });

  it("shows the next steps for the chosen kind and goes back", async () => {
    const user = userEvent.setup();
    render(<CreateGroupModal open onClose={jest.fn()} />);
    await user.click(screen.getByRole("button", { name: /Parent Group/ }));
    expect(screen.getByText("All parents in Sunrise Academy are auto-added")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Create Group" })).toBeInTheDocument();
  });

  it("toasts the server's message when creation fails", async () => {
    const user = userEvent.setup();
    createGroupChat.mockRejectedValue(new Error("nope"));
    render(<CreateGroupModal open onClose={jest.fn()} />);
    await user.click(screen.getByRole("button", { name: /Custom Group/ }));
    await user.type(screen.getByPlaceholderText("e.g., Staff Planning Team"), "Staff");
    await user.click(screen.getByRole("button", { name: "Create Custom Group" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });

  it("renders nothing when closed", () => {
    const { container } = render(<CreateGroupModal open={false} onClose={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("GroupInfoModal", () => {
  const room = {
    _id: "r1",
    type: ChatRoomType.CLASS_GROUP,
    name: "Class 5",
    description: "Weekly notices",
    createdBy: "someone",
    participants: [{}, {}, {}],
  };

  function open(extra: Partial<React.ComponentProps<typeof GroupInfoModal>> = {}) {
    return render(
      <GroupInfoModal isOpen onClose={jest.fn()} avatar="" name="Class 5" chatRoomId="r1" roomType={room.type} {...extra} />,
    );
  }

  beforeEach(() => {
    chatState = { chatRooms: [room], messages: [], currentRoomId: "r1", currentUserId: "u1" };
    updateRoomDetails.mockResolvedValue(undefined);
  });

  it("shows the room, its subtitle, the description and the members", () => {
    open();
    expect(screen.getByRole("dialog", { name: "Class 5 info" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Class 5" })).toBeInTheDocument();
    expect(screen.getByText("Class group · 3 members")).toBeInTheDocument();
    expect(screen.getByText("Weekly notices")).toBeInTheDocument();
    expect(screen.getByText("Members (3)")).toBeInTheDocument();
  });

  it("lets an admin rename the group and skips the request when nothing changed", async () => {
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole("button", { name: "Edit group name" }));
    const input = screen.getByLabelText("Group name");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(updateRoomDetails).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Group name")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Edit group name" }));
    const next = screen.getByLabelText("Group name");
    await user.clear(next);
    await user.type(next, "Class 6");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(updateRoomDetails).toHaveBeenCalledWith("r1", { name: "Class 6" }));
    expect(input).toBeDefined();
  });

  it("clears the description when it is saved empty", async () => {
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole("button", { name: /Edit$/ }));
    await user.clear(screen.getByLabelText("Group description"));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(updateRoomDetails).toHaveBeenCalledWith("r1", { description: null }));
  });

  it("opens the add-member dialogs for a manager", async () => {
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole("button", { name: "Add Parents" }));
    expect(screen.getByText("add parents dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add Teachers" }));
    expect(screen.getByText("add teachers dialog")).toBeInTheDocument();
  });

  it("hides every editing control from someone who cannot manage the room", () => {
    authUser = { role: "parent" };
    open();
    expect(screen.queryByRole("button", { name: "Edit group name" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Add Parents" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Add picture|Change picture/ })).toBeNull();
  });

  it("shows shared media from the sidebar", async () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Images" }));
    expect(screen.getByText("shared media: Images")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Images" })).toBeInTheDocument();
  });

  it("closes on a backdrop click", () => {
    const onClose = jest.fn();
    const { container } = open({ onClose });
    fireEvent.click(container.firstElementChild!);
    expect(onClose).toHaveBeenCalled();
  });

  it("renders nothing when closed", () => {
    const { container } = open({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
  });
});
