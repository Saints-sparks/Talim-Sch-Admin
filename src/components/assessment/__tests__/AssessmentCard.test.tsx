/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@/test-utils/render";
import AssessmentCard from "../AssessmentCard";
import { Assessment } from "../AssessmentForm.types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseAssessment: Assessment = {
  _id: "a1",
  name: "Mid-term Maths",
  description: "Covers chapters 1–5",
  termId: {
    _id: "t1",
    name: "Term 1",
    startDate: "2026-01-01",
    endDate: "2026-04-30",
  },
  schoolId: "school-1",
  startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
  endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
  status: "pending",
  createdBy: { _id: "u1", name: "Mrs. Adaeze", email: "adaeze@school.test" },
  createdAt: "2026-01-10T08:00:00Z",
  updatedAt: "2026-01-10T08:00:00Z",
};

const onEdit = jest.fn();
const onDelete = jest.fn();
const onView = jest.fn();

function renderCard(overrides: Partial<Assessment> = {}) {
  const assessment = { ...baseAssessment, ...overrides };
  return render(
    <AssessmentCard assessment={assessment} onEdit={onEdit} onDelete={onDelete} onView={onView} />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("AssessmentCard", () => {
  describe("content rendering", () => {
    it("renders the assessment name", () => {
      renderCard();
      expect(screen.getByText("Mid-term Maths")).toBeInTheDocument();
    });

    it("renders the description when provided", () => {
      renderCard();
      expect(screen.getByText("Covers chapters 1–5")).toBeInTheDocument();
    });

    it("does not render a description section when absent", () => {
      renderCard({ description: undefined });
      expect(screen.queryByText("Covers chapters 1–5")).not.toBeInTheDocument();
    });

    it("renders the term name", () => {
      renderCard();
      expect(screen.getByText("Term 1")).toBeInTheDocument();
    });

    it("renders the created-by attribution", () => {
      renderCard();
      expect(screen.getByText(/mrs\. adaeze/i)).toBeInTheDocument();
    });
  });

  describe("status badge", () => {
    it("shows Pending badge for pending status", () => {
      renderCard({ status: "pending" });
      expect(screen.getByText("Pending")).toBeInTheDocument();
    });

    it("shows Active badge for active status", () => {
      renderCard({ status: "active" });
      expect(screen.getByText("Active")).toBeInTheDocument();
    });

    it("shows Completed badge for completed status", () => {
      renderCard({ status: "completed" });
      expect(screen.getByText("Completed")).toBeInTheDocument();
    });

    it("shows Cancelled badge for cancelled status", () => {
      renderCard({ status: "cancelled" });
      expect(screen.getByText("Cancelled")).toBeInTheDocument();
    });
  });

  describe("countdown text", () => {
    it("shows days-left text when start date is in the future", () => {
      renderCard(); // 10 days away
      expect(screen.getByText(/days left/i)).toBeInTheDocument();
    });

    it("shows Started when start date is in the past", () => {
      renderCard({
        startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      });
      expect(screen.getByText("Started")).toBeInTheDocument();
    });

    it("shows Today when start date is today", () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      renderCard({ startDate: today.toISOString() });
      expect(screen.getByText("Today")).toBeInTheDocument();
    });
  });

  describe("action buttons", () => {
    it("calls onView when View is clicked", () => {
      renderCard();
      fireEvent.click(screen.getByRole("button", { name: /view/i }));
      expect(onView).toHaveBeenCalledWith(expect.objectContaining({ _id: "a1" }));
    });

    it("calls onEdit when Edit is clicked", () => {
      renderCard();
      fireEvent.click(screen.getByRole("button", { name: /edit/i }));
      expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ _id: "a1" }));
    });

    it("calls onDelete when Delete is clicked", () => {
      renderCard();
      fireEvent.click(screen.getByRole("button", { name: /delete/i }));
      expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ _id: "a1" }));
    });

    it("passes the full assessment object to each callback", () => {
      renderCard();
      fireEvent.click(screen.getByRole("button", { name: /view/i }));
      expect(onView).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Mid-term Maths", schoolId: "school-1" })
      );
    });
  });
});
