/** @jest-environment jsdom */
import React from "react";
import { render, screen, waitFor, mockAdmin, mockSubAdmin } from "@/test-utils/render";
import userEvent from "@testing-library/user-event";
import AddTeacherModal from "@/components/AddTeacherModal";
import { ApiError } from "@/lib/apiError";
import { Permission } from "@/lib/permissions";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));

const mockToast = { success: jest.fn(), error: jest.fn() };
jest.mock("@/components/CustomToast", () => ({
  toast: {
    success: (...args: unknown[]) => mockToast.success(...args),
    error: (...args: unknown[]) => mockToast.error(...args),
  },
}));

jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

jest.mock("@/hooks/queries/reference", () => ({
  useClasses: () => ({
    data: [
      { _id: "c1", name: "JSS 1A" },
      { _id: "c2", name: "JSS 2A" },
    ],
    isPending: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

const mockRegister = jest.fn();
const mockCreateProfile = jest.fn();
jest.mock("@/app/services/teacher.service", () => ({
  registerTeacher: (...args: unknown[]) => mockRegister(...args),
  createTeacherProfile: (...args: unknown[]) => mockCreateProfile(...args),
  teacherService: {},
}));

async function fillAndAdvanceToLastStep(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/email address/i), "ada@school.edu");
  await user.type(screen.getByLabelText(/first name/i), "Ada");
  await user.type(screen.getByLabelText(/last name/i), "Okafor");
  await user.type(screen.getByLabelText(/phone number/i), "+234 801 234 5678");
  await user.type(screen.getByLabelText(/date of birth/i), "1990-04-02");
  await user.selectOptions(screen.getByLabelText(/^gender/i), "female");
  await user.click(screen.getByRole("button", { name: /continue/i }));

  await user.type(await screen.findByLabelText(/area of specialization/i), "Mathematics");
  await user.selectOptions(screen.getByLabelText(/years of experience/i), "5");
  await user.click(screen.getByRole("button", { name: /continue/i }));

  await user.click(await screen.findByRole("button", { name: "Mon" }));
  await user.click(screen.getByRole("button", { name: "JSS 1A" }));
  await user.click(screen.getByRole("button", { name: /8:00 AM - 2:00 PM/ }));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRegister.mockResolvedValue({ userId: "u1", message: "ok" });
  mockCreateProfile.mockResolvedValue({ _id: "t1" });
});

describe("AddTeacherModal", () => {
  it("does not advance past an incomplete step and says what is missing", async () => {
    const user = userEvent.setup();
    render(<AddTeacherModal onClose={jest.fn()} />);

    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(mockToast.error).toHaveBeenCalledWith(expect.stringMatching(/Please complete: email address/));
    expect(screen.getByText("Enter an email address.")).toBeTruthy();
    expect(screen.queryByLabelText(/area of specialization/i)).toBeNull();
  });

  it("creates the teacher with DTO-exact bodies and no password", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onSuccess = jest.fn();
    render(<AddTeacherModal onClose={onClose} onSuccess={onSuccess} />);

    await fillAndAdvanceToLastStep(user);
    await user.click(screen.getByRole("button", { name: /create teacher/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockRegister).toHaveBeenCalledTimes(1);
    const account = mockRegister.mock.calls[0][0];
    expect(account).toEqual({
      email: "ada@school.edu",
      role: "teacher",
      schoolId: "school-1",
      firstName: "Ada",
      lastName: "Okafor",
      phoneNumber: "+234 801 234 5678",
      dateOfBirth: "1990-04-02",
      gender: "female",
    });
    expect(account).not.toHaveProperty("password");
    expect(mockCreateProfile).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ assignedClasses: ["c1"], availabilityDays: ["Monday"], yearsOfExperience: 5 }),
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(mockToast.success).toHaveBeenCalled();
  });

  it("keeps the form and shows the server's field error when the email is taken", async () => {
    mockRegister.mockRejectedValue(new ApiError("CONFLICT", "exists", 409));
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<AddTeacherModal onClose={onClose} />);

    await fillAndAdvanceToLastStep(user);
    await user.click(screen.getByRole("button", { name: /create teacher/i }));

    // Jumps back to the account step, with what was typed still there.
    expect(await screen.findByDisplayValue("ada@school.edu")).toBeTruthy();
    expect(screen.getAllByText("An account with that email already exists.").length).toBeGreaterThan(0);
    expect(onClose).not.toHaveBeenCalled();

    // Lets the user go on: the last step still holds their choices.
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(await screen.findByRole("button", { name: /continue/i }));
    expect(screen.getByRole("button", { name: "Mon" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("retries only the profile after the account was created", async () => {
    mockCreateProfile.mockRejectedValueOnce(
      new ApiError("VALIDATION_FAILED", "Some fields need attention.", 400, [
        { field: "specialization", reason: "is not allowed" },
      ]),
    );
    const user = userEvent.setup();
    render(<AddTeacherModal onClose={jest.fn()} />);

    await fillAndAdvanceToLastStep(user);
    await user.click(screen.getByRole("button", { name: /create teacher/i }));

    expect(await screen.findByText(/login account was created/i)).toBeTruthy();
    // Jumped to the qualifications step, where the server pointed.
    expect(await screen.findByDisplayValue("Mathematics")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /continue/i }));
    await user.click(await screen.findByRole("button", { name: /create teacher/i }));

    await waitFor(() => expect(mockCreateProfile).toHaveBeenCalledTimes(2));
    expect(mockRegister).toHaveBeenCalledTimes(1);
  });

  it("blocks a double submit while the create is in flight", async () => {
    let release: (value: { userId: string; message: string }) => void = () => undefined;
    mockRegister.mockReturnValue(new Promise((resolve) => (release = resolve)));
    const user = userEvent.setup();
    render(<AddTeacherModal onClose={jest.fn()} />);

    await fillAndAdvanceToLastStep(user);
    const create = screen.getByRole("button", { name: /create teacher/i });
    await user.dblClick(create);

    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect((await screen.findByRole("button", { name: /processing/i })).hasAttribute("disabled")).toBe(true);
    release({ userId: "u1", message: "ok" });
    await waitFor(() => expect(mockCreateProfile).toHaveBeenCalledTimes(1));
  });

  it("locks body scroll while open and restores it", () => {
    const { unmount } = render(<AddTeacherModal onClose={jest.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("renders nothing for a sub-admin without MANAGE_TEACHERS", () => {
    render(<AddTeacherModal onClose={jest.fn()} />, {
      user: { ...mockSubAdmin, permissions: [Permission.MANAGE_STUDENTS] },
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders for a sub-admin who holds MANAGE_TEACHERS", () => {
    render(<AddTeacherModal onClose={jest.fn()} />, {
      user: { ...mockSubAdmin, permissions: [Permission.MANAGE_TEACHERS] },
    });
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("renders for the primary admin", () => {
    render(<AddTeacherModal onClose={jest.fn()} />, { user: mockAdmin });
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
