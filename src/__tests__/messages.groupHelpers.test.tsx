/** @jest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChatRoomType } from "@/types/chat.types";
import {
  DESCRIPTION_MAX,
  NAME_MAX,
  membersHeading,
  pictureProblem,
  planDescriptionSave,
  planNameSave,
  roomSubtitle,
} from "@/app/components/messages/group-info/groupInfo";
import { GroupNameField } from "@/app/components/messages/group-info/GroupNameField";
import { GroupDescriptionField } from "@/app/components/messages/group-info/GroupDescriptionField";
import { GroupInfoMobilePicker, GroupInfoSidebar } from "@/app/components/messages/group-info/GroupInfoNav";
import {
  GROUP_TYPES,
  buildGroupPayload,
  classOptionLabel,
  courseOptionLabel,
  createdMessage,
  isGroupFormValid,
  namePlaceholder,
  nextSteps,
  submitButtonClass,
} from "@/app/components/messages/create-group/createGroup";
import { GroupTypePicker } from "@/app/components/messages/create-group/GroupTypePicker";

describe("group info helpers", () => {
  it("describes the room under its name", () => {
    expect(roomSubtitle(ChatRoomType.CLASS_GROUP, true, 1)).toBe("Class group · 1 member");
    expect(roomSubtitle(ChatRoomType.COURSE_GROUP, true, 12)).toBe("Subject group · 12 members");
    expect(roomSubtitle(ChatRoomType.CUSTOM_GROUP, true, 0)).toBe("Group");
    expect(roomSubtitle(ChatRoomType.ONE_TO_ONE, false, 2)).toBe("Direct message");
    expect(roomSubtitle(undefined, false, 0)).toBe("Chat");
  });

  it("heads the member list by room kind", () => {
    expect(membersHeading(true, 4)).toBe("Members (4)");
    expect(membersHeading(false, 2)).toBe("People");
  });

  it("plans a name save: invalid, unchanged or save the trimmed name", () => {
    expect(planNameSave("   ", "Old")).toEqual({ kind: "invalid" });
    expect(planNameSave("x".repeat(NAME_MAX + 1), "Old")).toEqual({ kind: "invalid" });
    expect(planNameSave(" Old ", "Old")).toEqual({ kind: "unchanged" });
    expect(planNameSave(" New ", "Old")).toEqual({ kind: "save", value: "New" });
    expect(planNameSave("New", undefined)).toEqual({ kind: "save", value: "New" });
  });

  it("plans a description save: too long, unchanged, save or clear", () => {
    expect(planDescriptionSave("x".repeat(DESCRIPTION_MAX + 1), "")).toEqual({ kind: "invalid" });
    expect(planDescriptionSave("", undefined)).toEqual({ kind: "unchanged" });
    expect(planDescriptionSave(" About us ", "About us")).toEqual({ kind: "unchanged" });
    expect(planDescriptionSave(" Fresh ", "Old")).toEqual({ kind: "save", value: "Fresh" });
    expect(planDescriptionSave("   ", "Old")).toEqual({ kind: "save", value: null });
  });

  it("only accepts a valid image as the group picture", () => {
    expect(pictureProblem(new File(["x"], "notes.pdf", { type: "application/pdf" }))).toBe(
      "Choose a JPG, PNG, GIF or WebP image",
    );
    expect(pictureProblem(new File(["x"], "logo.png", { type: "image/png" }))).toBeNull();
    expect(pictureProblem(new File([""], "empty.png", { type: "image/png" }))).toContain("empty");
  });
});

describe("group info parts", () => {
  it("shows the name with a pencil for managers and none for others", () => {
    const onStartEdit = jest.fn();
    const props = {
      editing: false,
      draft: "",
      name: "Class 5",
      saving: false,
      onDraftChange: jest.fn(),
      onStartEdit,
      onCancel: jest.fn(),
      onSave: jest.fn(),
    };
    const { rerender } = render(<GroupNameField {...props} canManage />);
    fireEvent.click(screen.getByRole("button", { name: "Edit group name" }));
    expect(onStartEdit).toHaveBeenCalled();
    rerender(<GroupNameField {...props} canManage={false} />);
    expect(screen.queryByRole("button", { name: "Edit group name" })).toBeNull();
  });

  it("saves on Enter, cancels on Escape and blocks Save on an empty name", () => {
    const onSave = jest.fn();
    const onCancel = jest.fn();
    const props = {
      editing: true,
      name: "Class 5",
      saving: false,
      canManage: true,
      onDraftChange: jest.fn(),
      onStartEdit: jest.fn(),
      onCancel,
      onSave,
    };
    const { rerender } = render(<GroupNameField {...props} draft="Class 6" />);
    const input = screen.getByLabelText("Group name");
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.getByText(`7/${NAME_MAX}`)).toBeInTheDocument();
    rerender(<GroupNameField {...props} draft="  " />);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("shows the description, an empty note, or the editor", () => {
    const base = {
      draft: "",
      saving: false,
      canManage: true,
      onDraftChange: jest.fn(),
      onStartEdit: jest.fn(),
      onCancel: jest.fn(),
      onSave: jest.fn(),
    };
    const { rerender } = render(<GroupDescriptionField {...base} editing={false} description="Weekly notices" />);
    expect(screen.getByText("Weekly notices")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Edit/ }));
    expect(base.onStartEdit).toHaveBeenCalled();

    rerender(<GroupDescriptionField {...base} editing={false} />);
    expect(screen.getByText("No description")).toBeInTheDocument();

    rerender(<GroupDescriptionField {...base} editing draft="Hi" />);
    expect(screen.getByLabelText("Group description")).toHaveValue("Hi");
    expect(screen.getByText(`2/${DESCRIPTION_MAX}`)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Edit$/ })).toBeNull();
  });

  it("switches panes from the sidebar and the phone picker", () => {
    const onSelect = jest.fn();
    render(
      <>
        <GroupInfoSidebar selected="" onSelect={onSelect} />
        <GroupInfoMobilePicker selected="" onSelect={onSelect} />
      </>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Videos" }));
    expect(onSelect).toHaveBeenLastCalledWith("Videos");
    fireEvent.change(screen.getByLabelText("Section"), { target: { value: "Links" } });
    expect(onSelect).toHaveBeenLastCalledWith("Links");
  });
});

describe("create group helpers", () => {
  it("needs a name, and a class or subject where the kind has one", () => {
    const base = { kind: "custom" as const, name: "Staff", classId: "", courseId: "" };
    expect(isGroupFormValid(base)).toBe(true);
    expect(isGroupFormValid({ ...base, name: "  " })).toBe(false);
    expect(isGroupFormValid({ ...base, kind: "class" })).toBe(false);
    expect(isGroupFormValid({ ...base, kind: "class", classId: "c1" })).toBe(true);
    expect(isGroupFormValid({ ...base, kind: "course" })).toBe(false);
    expect(isGroupFormValid({ ...base, kind: "course", courseId: "k1" })).toBe(true);
    expect(isGroupFormValid({ ...base, kind: "parent" })).toBe(true);
  });

  it("builds the DTO for each kind, carrying only the id that kind uses", () => {
    const v = { name: " Team ", classId: "c1", courseId: "k1" };
    expect(buildGroupPayload({ ...v, kind: "parent" })).toEqual({ name: "Team", type: ChatRoomType.ADMIN_PARENT_GROUP });
    expect(buildGroupPayload({ ...v, kind: "class" })).toEqual({
      name: "Team",
      classId: "c1",
      type: ChatRoomType.CLASS_GROUP,
    });
    expect(buildGroupPayload({ ...v, kind: "course" })).toEqual({
      name: "Team",
      courseId: "k1",
      type: ChatRoomType.COURSE_GROUP,
    });
    expect(buildGroupPayload({ ...v, kind: "custom" })).toEqual({ name: "Team", type: ChatRoomType.CUSTOM_GROUP });
    expect(buildGroupPayload({ ...v, kind: null }).type).toBe(ChatRoomType.CUSTOM_GROUP);
  });

  it("words the success toast, noting a reused group", () => {
    expect(createdMessage("class")).toBe("Class group created successfully!");
    expect(createdMessage("custom")).toBe("Group created successfully!");
    expect(createdMessage("course", true)).toBe("Opened the existing group");
  });

  it("gives each kind its own placeholder, next steps and button colour", () => {
    expect(namePlaceholder("class")).toBe("e.g., Grade 5A Chat");
    expect(namePlaceholder(null)).toBe("e.g., Staff Planning Team");
    expect(nextSteps("parent", "Sunrise")[0]).toBe("All parents in Sunrise are auto-added");
    expect(nextSteps("parent")[0]).toBe("All parents in your school are auto-added");
    expect(nextSteps("custom")).toHaveLength(3);
    expect(submitButtonClass("orange")).toBe("bg-orange-500 hover:bg-orange-600");
    expect(GROUP_TYPES.map((g) => submitButtonClass(g.color))).toHaveLength(4);
  });

  it("labels class and subject options", () => {
    expect(classOptionLabel({ name: "5A", gradeLevel: "JSS1" })).toBe("5A (JSS1)");
    expect(courseOptionLabel({ title: "Algebra", subjectName: "Maths" })).toBe("Algebra — Maths");
    expect(courseOptionLabel({ title: "Algebra" })).toBe("Algebra");
  });

  it("offers the four group kinds and reports the one picked", () => {
    const onSelect = jest.fn();
    render(<GroupTypePicker onSelect={onSelect} />);
    expect(screen.getAllByRole("button")).toHaveLength(4);
    fireEvent.click(screen.getByRole("button", { name: /Class Group/ }));
    expect(onSelect).toHaveBeenCalledWith("class");
  });
});
