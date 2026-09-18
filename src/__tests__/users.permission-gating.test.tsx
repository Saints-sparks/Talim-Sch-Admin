/** @jest-environment jsdom */
import React from "react";
import { render, screen } from "@/test-utils/render";
import { mockAdmin, mockSubAdmin } from "@/test-utils/render";
import TeacherRosterCard from "@/components/users/TeacherRosterCard";
import { Permission } from "@/lib/permissions";
import type { Teacher } from "@/app/services/teacher.service";

const teacher = {
  _id: "t1",
  userId: { _id: "u1", firstName: "Ada", lastName: "Okafor", email: "ada@school.edu", role: "teacher", phoneNumber: "" },
  staffNumber: "TCH-001",
  assignedClasses: [{ _id: "c1", name: "JSS1" }],
  isActive: true,
  hasTeacherProfile: true,
} as unknown as Teacher;

/** A sub-admin holding exactly the permissions given. */
const subAdminWith = (...permissions: string[]) => ({ ...mockSubAdmin, permissions });

function renderCard(user: typeof mockAdmin) {
  return render(
    <TeacherRosterCard
      teacher={teacher}
      menuOpen={false}
      onToggleMenu={jest.fn()}
      onViewProfile={jest.fn()}
      onEdit={jest.fn()}
      onDeactivate={jest.fn()}
    />,
    { user },
  );
}

describe("teacher roster card gating", () => {
  it("shows the actions menu to the primary school admin", () => {
    renderCard(mockAdmin);
    expect(screen.getByRole("button", { name: /actions for ada okafor/i })).toBeTruthy();
  });

  it("shows it to a sub-admin who may manage teachers", () => {
    renderCard(subAdminWith(Permission.MANAGE_TEACHERS));
    expect(screen.getByRole("button", { name: /actions for ada okafor/i })).toBeTruthy();
  });

  it("hides it from a sub-admin who may not, rather than letting the API refuse", () => {
    renderCard(subAdminWith(Permission.MANAGE_STUDENTS));
    expect(screen.queryByRole("button", { name: /actions for ada okafor/i })).toBeNull();
  });

  it("still lets that sub-admin open the profile", () => {
    renderCard(subAdminWith(Permission.MANAGE_STUDENTS));
    expect(screen.getByRole("button", { name: /view profile/i })).toBeTruthy();
  });
});
