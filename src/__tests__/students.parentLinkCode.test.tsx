/** @jest-environment jsdom */
/**
 * Parent link codes (A11) on the student profile: generate, copy and
 * regenerate, gated like the profile's other student actions; and the
 * notice rules behind them.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within, mockAdmin, mockSubAdmin } from "@/test-utils/render";
import { ParentLinkCodeCard } from "@/components/users/students/ParentLinkCodeCard";
import {
  EXISTING_PARENT_NOTICE,
  linkCodeExpiry,
  parentLinkNotice,
} from "@/components/users/students/parentLink";
import StudentProfilePage from "@/app/users/students/[id]/view/page";
import type { StudentById } from "@/app/services/student.service";
import { api } from "@/lib/apiClient";
import { ApiError } from "@/lib/apiError";
import { toast } from "@/components/CustomToast";

const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace }),
  useParams: () => ({ id: "st1" }),
}));
jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/logger", () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));
jest.mock("@/lib/apiClient", () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mockPost = api.post as jest.Mock;
const mockGet = api.get as jest.Mock;

const IN_14_DAYS = new Date(Date.now() + 14 * 86_400_000).toISOString();

const student = {
  _id: "st1",
  admissionNumber: "ADM-7",
  userId: {
    _id: "u1",
    email: "ada@school.test",
    role: "student",
    firstName: "Ada",
    lastName: "Obi",
    phoneNumber: "",
  },
  classId: { _id: "c1", name: "JSS 1" },
  gradeLevel: "JSS1",
  parentId: {
    _id: "p1",
    email: "chidi@example.test",
    role: "parent",
    firstName: "Chidi",
    lastName: "Obi",
    phoneNumber: "",
  },
  parentContact: {
    fullName: "Chidi Obi",
    phoneNumber: "080",
    email: "chidi@example.test",
    relationship: "FATHER",
  },
  isActive: true,
} as unknown as StudentById;

beforeEach(() => {
  jest.clearAllMocks();
  mockPost
    .mockReset()
    .mockResolvedValueOnce({ code: "ABCD-2345", expiresAt: IN_14_DAYS })
    .mockResolvedValueOnce({ code: "WXYZ-6789", expiresAt: IN_14_DAYS });
  mockGet.mockImplementation(async (path: string) => {
    if (path === "/students/st1") return student;
    throw new Error(`unexpected GET ${path}`);
  });
});

describe("the parent link code card", () => {
  it("generates a code for the student record and shows it with its expiry", async () => {
    const user = userEvent.setup();
    render(<ParentLinkCodeCard studentId="st1" studentName="Ada Obi" />);

    await user.click(screen.getByRole("button", { name: "Generate parent link code" }));

    expect(await screen.findByRole("status", { name: "Parent link code" })).toHaveTextContent(
      "ABCD-2345"
    );
    expect(mockPost).toHaveBeenCalledWith("/students/st1/link-code");
    expect(screen.getByText(/^Expires .*\(in 1[34] days\)$/)).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Parent link code generated.");
  });

  it("copies the code", async () => {
    const user = userEvent.setup();
    render(<ParentLinkCodeCard studentId="st1" studentName="Ada Obi" />);
    await user.click(screen.getByRole("button", { name: "Generate parent link code" }));
    await screen.findByText("ABCD-2345");

    await user.click(screen.getByRole("button", { name: "Copy code" }));
    // user-event installs a clipboard stub; read back what was written.
    expect(await navigator.clipboard.readText()).toBe("ABCD-2345");
    expect(await screen.findByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Code copied.");
  });

  it("regenerates only after confirming, and replaces the old code", async () => {
    const user = userEvent.setup();
    render(<ParentLinkCodeCard studentId="st1" studentName="Ada Obi" />);
    await user.click(screen.getByRole("button", { name: "Generate parent link code" }));
    await screen.findByText("ABCD-2345");

    await user.click(screen.getByRole("button", { name: "Generate a new code" }));
    const dialog = screen.getByRole("dialog", { name: "Generate a new code?" });
    expect(within(dialog).getByText(/current code stops working/)).toBeInTheDocument();
    expect(mockPost).toHaveBeenCalledTimes(1);

    await user.click(within(dialog).getByRole("button", { name: "Generate new code" }));
    expect(await screen.findByText("WXYZ-6789")).toBeInTheDocument();
    expect(screen.queryByText("ABCD-2345")).not.toBeInTheDocument();
    expect(mockPost).toHaveBeenCalledTimes(2);
    expect(toast.success).toHaveBeenLastCalledWith(
      "New code generated. The previous code no longer works."
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("explains a refusal", async () => {
    mockPost.mockReset().mockRejectedValueOnce(new ApiError("FORBIDDEN", "no", 403));
    const user = userEvent.setup();
    render(<ParentLinkCodeCard studentId="st1" studentName="Ada Obi" />);
    await user.click(screen.getByRole("button", { name: "Generate parent link code" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "You need the Manage Students permission to issue link codes."
      )
    );
    expect(screen.queryByRole("status", { name: "Parent link code" })).not.toBeInTheDocument();
  });
});

describe("on the student profile", () => {
  /** Opens the Parent/Guardian tab of the profile. */
  async function openGuardianTab(user: ReturnType<typeof userEvent.setup>) {
    await user.click(await screen.findByRole("tab", { name: /parent/i }));
  }

  it("is offered to the school admin", async () => {
    const user = userEvent.setup();
    render(<StudentProfilePage />, { user: mockAdmin });
    await openGuardianTab(user);
    expect(
      await screen.findByRole("button", { name: "Generate parent link code" })
    ).toBeInTheDocument();
    expect(screen.getByText(/add Ada Obi to their account/)).toBeInTheDocument();
  });

  it("is offered to a sub-admin with manage:students", async () => {
    const user = userEvent.setup();
    render(<StudentProfilePage />, { user: { ...mockSubAdmin, permissions: ["manage:students"] } });
    await openGuardianTab(user);
    expect(
      await screen.findByRole("button", { name: "Generate parent link code" })
    ).toBeInTheDocument();
  });

  it("is never shown to a sub-admin without manage:students", async () => {
    render(<StudentProfilePage />, { user: { ...mockSubAdmin, permissions: ["manage:fees"] } });
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/access-denied"));
    expect(
      screen.queryByRole("button", { name: "Generate parent link code" })
    ).not.toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });
});

describe("parent link rules", () => {
  it("words the existing-parent notice only when the API says so", () => {
    expect(parentLinkNotice(undefined)).toBeNull();
    expect(parentLinkNotice({ ...student, parentLink: { existing: false } })).toBeNull();
    expect(parentLinkNotice({ ...student, parentLink: { existing: true } })).toBe(
      EXISTING_PARENT_NOTICE
    );
    expect(
      parentLinkNotice({ ...student, parentLink: { existing: true, parentName: " Chidi Obi " } })
    ).toBe("Linked to an existing parent account (Chidi Obi)");
  });

  it("states the expiry, and says when a code has expired", () => {
    const now = new Date("2026-10-03T09:00:00Z");
    expect(linkCodeExpiry("2026-10-17T09:00:00Z", now)).toMatch(/^Expires .* \(in 14 days\)$/);
    expect(linkCodeExpiry("2026-10-03T18:00:00Z", now)).toMatch(/\(today\)$/);
    expect(linkCodeExpiry("2026-10-04T10:00:00Z", now)).toMatch(/\(in 1 day\)$/);
    expect(linkCodeExpiry("2026-10-02T09:00:00Z", now)).toBe("Expired. Generate a new code.");
    expect(linkCodeExpiry("nonsense", now)).toBe("");
  });
});
