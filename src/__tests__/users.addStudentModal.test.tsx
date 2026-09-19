/** @jest-environment jsdom */
import React from "react";
import { render, screen, waitFor, mockAdmin, mockSubAdmin } from "@/test-utils/render";
import userEvent from "@testing-library/user-event";
import AddStudentModal from "@/components/AddStudentModal";
import { ApiError } from "@/lib/apiError";
import { Permission } from "@/lib/permissions";

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
      { _id: "c1", name: "JSS 1A", gradeLevel: "JSS1", schoolId: "school-1" },
      { _id: "c2", name: "Nursery", schoolId: "school-1" },
    ],
    isPending: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

const mockRegister = jest.fn();
const mockCreateProfile = jest.fn();
jest.mock("@/app/services/student.service", () => ({
  registerStudent: (...args: unknown[]) => mockRegister(...args),
  createStudentProfile: (...args: unknown[]) => mockCreateProfile(...args),
  studentService: {},
}));

async function fillAccount(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/email address/i), "kemi@school.edu");
  await user.type(screen.getByLabelText(/first name/i), "Kemi");
  await user.type(screen.getByLabelText(/last name/i), "Bello");
  await user.type(screen.getByLabelText(/phone number/i), "+234 802 000 1111");
  await user.click(screen.getByRole("button", { name: /continue/i }));
}

async function fillProfile(user: ReturnType<typeof userEvent.setup>) {
  await user.selectOptions(await screen.findByLabelText(/^class/i), "c1");
  await user.type(screen.getByLabelText(/^first name/i), "Tunde");
  await user.type(screen.getByLabelText(/^last name/i), "Bello");
  await user.selectOptions(screen.getByLabelText(/relationship/i), "FATHER");
  const phones = screen.getAllByLabelText(/phone number/i);
  await user.type(phones[phones.length - 1], "08030001111");
  await user.type(screen.getByLabelText(/^email address/i), "tunde@example.com");
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRegister.mockResolvedValue({ userId: "s1", message: "ok", temporaryPassword: "Temp#1234" });
  mockCreateProfile.mockResolvedValue({ _id: "st1" });
});

describe("AddStudentModal", () => {
  it("does not advance with a bad step and shows the field errors", async () => {
    const user = userEvent.setup();
    render(<AddStudentModal onClose={jest.fn()} />);

    await user.type(screen.getByLabelText(/email address/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
    expect(mockToast.error).toHaveBeenCalledWith(expect.stringMatching(/Please complete: .*student first name/));
    expect(screen.queryByLabelText(/^class/i)).toBeNull();
  });

  it("auto-fills the grade level from the chosen class", async () => {
    const user = userEvent.setup();
    render(<AddStudentModal onClose={jest.fn()} />);
    await fillAccount(user);

    await user.selectOptions(await screen.findByLabelText(/^class/i), "c1");
    expect(screen.getByText("JSS1")).toBeTruthy();
  });

  it("lets the admin type a grade level for a class that has none", async () => {
    const user = userEvent.setup();
    render(<AddStudentModal onClose={jest.fn()} />);
    await fillAccount(user);

    await user.selectOptions(await screen.findByLabelText(/^class/i), "c2");
    const grade = screen.getByLabelText(/grade level/i);
    await user.type(grade, "KG1");
    expect((grade as HTMLInputElement).value).toBe("KG1");
  });

  it("creates the student with DTO-exact bodies, forwarding the generated password", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const onSuccess = jest.fn();
    render(<AddStudentModal onClose={onClose} onSuccess={onSuccess} />);

    await fillAccount(user);
    await fillProfile(user);
    await user.click(screen.getByRole("button", { name: /create student/i }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const account = mockRegister.mock.calls[0][0];
    expect(account).toEqual({
      email: "kemi@school.edu",
      role: "student",
      schoolId: "school-1",
      firstName: "Kemi",
      lastName: "Bello",
      phoneNumber: "+234 802 000 1111",
    });
    expect(account).not.toHaveProperty("password");
    expect(mockCreateProfile).toHaveBeenCalledWith({
      userId: "s1",
      classId: "c1",
      gradeLevel: "JSS1",
      parentContact: {
        fullName: "Tunde Bello",
        phoneNumber: "08030001111",
        email: "tunde@example.com",
        relationship: "FATHER",
      },
      password: "Temp#1234",
    });
    expect(onSuccess).toHaveBeenCalled();
  });

  it("keeps the form and shows the server's message when the email is taken", async () => {
    mockRegister.mockRejectedValue(new ApiError("CONFLICT", "exists", 409));
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<AddStudentModal onClose={onClose} />);

    await fillAccount(user);
    await fillProfile(user);
    await user.click(screen.getByRole("button", { name: /create student/i }));

    expect(await screen.findByDisplayValue("kemi@school.edu")).toBeTruthy();
    expect(screen.getAllByText("An account with that email already exists.").length).toBeGreaterThan(0);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("points at the parent email when the server refuses it, and retries without re-registering", async () => {
    mockCreateProfile.mockRejectedValueOnce(
      new ApiError("VALIDATION_FAILED", "Some fields need attention.", 400, [
        { field: "parentContact.email", reason: "must be an email" },
      ]),
    );
    const user = userEvent.setup();
    render(<AddStudentModal onClose={jest.fn()} />);

    await fillAccount(user);
    await fillProfile(user);
    await user.click(screen.getByRole("button", { name: /create student/i }));

    expect(await screen.findByText(/login account was created/i)).toBeTruthy();
    expect(screen.getByText("must be an email")).toBeTruthy();
    expect(screen.getByDisplayValue("tunde@example.com")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /create student/i }));
    await waitFor(() => expect(mockCreateProfile).toHaveBeenCalledTimes(2));
    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockCreateProfile.mock.calls[1][0]).toMatchObject({ userId: "s1", password: "Temp#1234" });
  });

  it("blocks a double submit while the create is in flight", async () => {
    let release: (value: { userId: string; message: string }) => void = () => undefined;
    mockRegister.mockReturnValue(new Promise((resolve) => (release = resolve)));
    const user = userEvent.setup();
    render(<AddStudentModal onClose={jest.fn()} />);

    await fillAccount(user);
    await fillProfile(user);
    await user.dblClick(screen.getByRole("button", { name: /create student/i }));

    expect(mockRegister).toHaveBeenCalledTimes(1);
    release({ userId: "s1", message: "ok" });
    await waitFor(() => expect(mockCreateProfile).toHaveBeenCalledTimes(1));
  });

  it("locks body scroll while open and restores it", () => {
    const { unmount } = render(<AddStudentModal onClose={jest.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("renders nothing for a sub-admin without MANAGE_STUDENTS", () => {
    render(<AddStudentModal onClose={jest.fn()} />, {
      user: { ...mockSubAdmin, permissions: [Permission.MANAGE_TEACHERS] },
    });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders for a sub-admin who holds MANAGE_STUDENTS and for the primary admin", () => {
    const { unmount } = render(<AddStudentModal onClose={jest.fn()} />, {
      user: { ...mockSubAdmin, permissions: [Permission.MANAGE_STUDENTS] },
    });
    expect(screen.getByRole("dialog")).toBeTruthy();
    unmount();
    render(<AddStudentModal onClose={jest.fn()} />, { user: mockAdmin });
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
