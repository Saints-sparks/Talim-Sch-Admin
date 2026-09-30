/** @jest-environment jsdom */
/**
 * "Report a problem" (Round 4 §35): Settings → Data & System sends a ticket to
 * Talim support (`POST /support/tickets`) and shows its reference.
 */
import React from "react";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor, within } from "@/test-utils/render";
import { toast } from "@/components/CustomToast";
import { ReportProblemModal } from "@/components/settings/support/ReportProblemModal";
import {
  APP_VERSION,
  toSupportTicketPayload,
  validateSupportTicket,
} from "@/components/settings/support/supportTicketForm";

const createSupportTicket = jest.fn();

jest.mock("@/components/CustomToast", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock("@/lib/logger", () => ({ logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() } }));
jest.mock("@/app/services/support.service", () => ({
  createSupportTicket: (body: unknown) => createSupportTicket(body),
}));

beforeEach(() => {
  jest.clearAllMocks();
  createSupportTicket.mockResolvedValue({ reference: "TS-4F2K9", createdAt: "2026-09-30T09:00:00Z" });
});

describe("support ticket form", () => {
  it("needs an area and 10–2000 characters", () => {
    expect(validateSupportTicket({ area: "", description: "short" })).toEqual({
      area: expect.any(String),
      description: expect.stringMatching(/at least 10/),
    });
    expect(validateSupportTicket({ area: "grading", description: "  a  b  c   " }).description).toBeTruthy();
    expect(validateSupportTicket({ area: "grading", description: "x".repeat(2001) }).description).toMatch(/2000/);
    expect(validateSupportTicket({ area: "other", description: "The page is blank" })).toEqual({});
  });

  it("sends the trimmed description with where it came from", () => {
    expect(
      toSupportTicketPayload({ area: "messages", description: "  Messages won't load  " }, { path: "/settings", userAgent: "UA" })
    ).toEqual({
      area: "messages",
      description: "Messages won't load",
      context: { path: "/settings", appVersion: APP_VERSION, userAgent: "UA" },
    });
  });
});

describe("ReportProblemModal", () => {
  it("checks the fields before sending", async () => {
    const user = userEvent.setup();
    render(<ReportProblemModal onClose={jest.fn()} />);
    await user.click(screen.getByRole("button", { name: "Send report" }));
    expect(createSupportTicket).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/What is it about/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/What happened/)).toHaveAccessibleDescription(/at least 10 characters/);
  });

  it("sends the ticket and shows the reference", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<ReportProblemModal onClose={onClose} />);
    await user.selectOptions(screen.getByLabelText(/What is it about/), "timetable");
    await user.type(screen.getByLabelText(/What happened/), "The timetable shows no periods on Monday");
    await user.click(screen.getByRole("button", { name: "Send report" }));

    await waitFor(() => expect(createSupportTicket).toHaveBeenCalledTimes(1));
    expect(createSupportTicket).toHaveBeenCalledWith({
      area: "timetable",
      description: "The timetable shows no periods on Monday",
      context: { path: "/", appVersion: APP_VERSION, userAgent: navigator.userAgent },
    });
    const dialog = await screen.findByRole("dialog", { name: "Report sent" });
    expect(within(dialog).getByText("TS-4F2K9")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps what was typed and says so when sending fails", async () => {
    const user = userEvent.setup();
    createSupportTicket.mockRejectedValue(new Error("offline"));
    render(<ReportProblemModal onClose={jest.fn()} />);
    await user.selectOptions(screen.getByLabelText(/What is it about/), "other");
    await user.type(screen.getByLabelText(/What happened/), "Something is broken here");
    await user.click(screen.getByRole("button", { name: "Send report" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByRole("dialog", { name: "Report a problem" })).toBeInTheDocument();
    expect(screen.getByLabelText(/What happened/)).toHaveValue("Something is broken here");
  });
});
