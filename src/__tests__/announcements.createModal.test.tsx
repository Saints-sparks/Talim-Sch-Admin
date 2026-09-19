/** @jest-environment jsdom */
import React from "react";
import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import { toast } from "@/components/CustomToast";
import { CreateAnnouncementModal } from "@/components/announcements/CreateAnnouncementModal";
import {
  emptyForm,
  toAnnouncementPayload,
  toggleAudience,
  validateAnnouncement,
} from "@/components/announcements/create/announcementForm";

const mutateAsync = jest.fn();
const upload = jest.fn();

jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/hooks/announcements/useAnnouncements", () => ({
  useCreateAnnouncement: () => ({ mutateAsync, isPending: false }),
}));
jest.mock("@/app/services/files.service", () => ({
  uploadFileAttachment: (...args: unknown[]) => upload(...args),
}));

const NOW = new Date("2026-09-19T10:00:00").getTime();

describe("announcement form logic", () => {
  it("never lets the last audience be unticked", () => {
    expect(toggleAudience(["all_parents"], "all_parents")).toEqual(["all_parents"]);
    expect(toggleAudience(["all_parents"], "all_teachers")).toEqual(["all_parents", "all_teachers"]);
    expect(toggleAudience(["all_parents", "all_teachers"], "all_parents")).toEqual(["all_teachers"]);
  });

  it("needs a title and content", () => {
    expect(validateAnnouncement(emptyForm, NOW)).toBe("Title and content are required.");
    expect(validateAnnouncement({ ...emptyForm, title: "Hi", content: "  " }, NOW)).toBe(
      "Title and content are required.",
    );
    expect(validateAnnouncement({ ...emptyForm, title: "Hi", content: "Body" }, NOW)).toBeNull();
  });

  it("needs a future time for a scheduled announcement", () => {
    const base = { ...emptyForm, title: "Hi", content: "Body", schedule: "later" as const };
    expect(validateAnnouncement(base, NOW)).toBe("Choose a date and time for scheduled announcements.");
    expect(validateAnnouncement({ ...base, scheduledFor: "2026-09-19T09:00" }, NOW)).toBe(
      "Scheduled announcements must be set for a future time.",
    );
    expect(validateAnnouncement({ ...base, scheduledFor: "2026-09-19T11:00" }, NOW)).toBeNull();
  });

  it("publishes now with trimmed text and an attachment list", () => {
    expect(
      toAnnouncementPayload({ ...emptyForm, title: " Hi ", content: " Body ", attachment: "https://x/y.pdf" }),
    ).toEqual({
      title: "Hi",
      content: "Body",
      attachment: "https://x/y.pdf",
      attachments: ["https://x/y.pdf"],
      audience: ["all_parents"],
      status: "PUBLISHED",
      scheduledFor: undefined,
    });
  });

  it("schedules with an ISO instant", () => {
    const payload = toAnnouncementPayload({
      ...emptyForm,
      title: "Hi",
      content: "Body",
      schedule: "later",
      scheduledFor: "2026-09-19T11:00",
    });
    expect(payload.status).toBe("SCHEDULED");
    expect(payload.scheduledFor).toBe(new Date("2026-09-19T11:00").toISOString());
    expect(payload.attachments).toBeUndefined();
  });
});

describe("CreateAnnouncementModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mutateAsync.mockResolvedValue({});
    document.body.style.overflow = "";
  });

  it("renders nothing when closed and locks scroll while open", () => {
    const { container, rerender } = render(<CreateAnnouncementModal open={false} onClose={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<CreateAnnouncementModal open onClose={jest.fn()} />);
    expect(document.body.style.overflow).toBe("hidden");
    rerender(<CreateAnnouncementModal open={false} onClose={jest.fn()} />);
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on Escape", () => {
    const onClose = jest.fn();
    render(<CreateAnnouncementModal open onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("toasts and sends nothing when the title is empty", async () => {
    const user = userEvent.setup();
    render(<CreateAnnouncementModal open onClose={jest.fn()} />);
    await user.click(screen.getByRole("button", { name: /Create Announcement/ }));
    expect(toast.error).toHaveBeenCalledWith("Title and content are required.");
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it("creates the announcement for the chosen audiences and closes", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<CreateAnnouncementModal open onClose={onClose} />);
    await user.type(screen.getByLabelText("Title"), "Sports day");
    await user.type(screen.getByLabelText("Content"), "Friday at 10am");
    await user.click(screen.getByRole("button", { name: "All Teachers" }));
    expect(screen.getByRole("button", { name: "All Teachers" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /Create Announcement/ }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Sports day",
        content: "Friday at 10am",
        audience: ["all_parents", "all_teachers"],
        status: "PUBLISHED",
      }),
    );
    expect(toast.success).toHaveBeenCalledWith("Announcement created successfully.");
  });

  it("reveals the date picker for a scheduled send and shows the preview", async () => {
    const user = userEvent.setup();
    render(<CreateAnnouncementModal open onClose={jest.fn()} />);
    expect(screen.queryByLabelText("Scheduled date and time")).toBeNull();
    await user.click(screen.getByRole("button", { name: /Schedule for later/ }));
    expect(screen.getByLabelText("Scheduled date and time")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Title"), "Hello");
    await user.click(screen.getByRole("button", { name: /Preview off/ }));
    expect(screen.getByRole("heading", { name: "Hello" })).toBeInTheDocument();
  });

  it("uploads an attachment and refuses one over 10MB", async () => {
    const user = userEvent.setup();
    upload.mockResolvedValue("https://cdn/file.pdf");
    const { container } = render(<CreateAnnouncementModal open onClose={jest.fn()} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, new File(["x"], "notice.pdf", { type: "application/pdf" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Attachment uploaded successfully."));
    expect(screen.getByText("notice.pdf")).toBeInTheDocument();

    const big = new File(["x"], "big.pdf", { type: "application/pdf" });
    Object.defineProperty(big, "size", { value: 11 * 1024 * 1024 });
    await user.upload(input, big);
    expect(toast.error).toHaveBeenCalledWith("File size must be less than 10MB");
    expect(upload).toHaveBeenCalledTimes(1);
  });
});
