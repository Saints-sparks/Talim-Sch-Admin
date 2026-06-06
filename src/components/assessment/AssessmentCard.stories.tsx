import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "@storybook/test";
import AssessmentCard from "./AssessmentCard";
import type { Assessment } from "./AssessmentForm.types";

// ─── Shared fixture ───────────────────────────────────────────────────────────

const futureDate = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

const baseAssessment: Assessment = {
  _id: "a1",
  name: "Mid-term Mathematics",
  description: "Covers algebra and geometry from chapters 1–5.",
  termId: { _id: "t1", name: "Term 1 2026", startDate: "2026-01-01", endDate: "2026-04-30" },
  schoolId: "school-1",
  startDate: futureDate(10),
  endDate: futureDate(20),
  status: "pending",
  createdBy: { _id: "u1", name: "Mrs. Adaeze Obi", email: "adaeze@school.ng" },
  createdAt: "2026-01-10T08:00:00Z",
  updatedAt: "2026-01-10T08:00:00Z",
};

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof AssessmentCard> = {
  title: "Assessment/AssessmentCard",
  component: AssessmentCard,
  tags: ["autodocs"],
  args: {
    onEdit: fn(),
    onDelete: fn(),
    onView: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AssessmentCard>;

// ─── Status variants ──────────────────────────────────────────────────────────

export const Pending: Story = {
  args: { assessment: { ...baseAssessment, status: "pending" } },
};

export const Active: Story = {
  args: { assessment: { ...baseAssessment, status: "active" } },
};

export const Completed: Story = {
  args: {
    assessment: {
      ...baseAssessment,
      status: "completed",
      startDate: futureDate(-30),
      endDate: futureDate(-5),
    },
  },
};

export const Cancelled: Story = {
  args: { assessment: { ...baseAssessment, status: "cancelled" } },
};

export const NoDescription: Story = {
  args: { assessment: { ...baseAssessment, description: undefined } },
};

export const StartingToday: Story = {
  args: {
    assessment: {
      ...baseAssessment,
      startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
    },
  },
};

export const AlreadyStarted: Story = {
  args: {
    assessment: {
      ...baseAssessment,
      startDate: futureDate(-3),
      status: "active",
    },
  },
};

// ─── Interaction tests (play functions) ───────────────────────────────────────

export const ClickView: Story = {
  args: { assessment: baseAssessment },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /view/i }));
    await expect(args.onView).toHaveBeenCalledOnce();
    await expect(args.onView).toHaveBeenCalledWith(expect.objectContaining({ _id: "a1" }));
  },
};

export const ClickEdit: Story = {
  args: { assessment: baseAssessment },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /edit/i }));
    await expect(args.onEdit).toHaveBeenCalledOnce();
    await expect(args.onEdit).toHaveBeenCalledWith(expect.objectContaining({ _id: "a1" }));
  },
};

export const ClickDelete: Story = {
  args: { assessment: baseAssessment },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /delete/i }));
    await expect(args.onDelete).toHaveBeenCalledOnce();
    await expect(args.onDelete).toHaveBeenCalledWith(expect.objectContaining({ _id: "a1" }));
  },
};

export const AllButtonsCallCorrectCallbacks: Story = {
  args: { assessment: baseAssessment },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole("button", { name: /view/i }));
    await expect(args.onView).toHaveBeenCalledTimes(1);
    await expect(args.onEdit).not.toHaveBeenCalled();
    await expect(args.onDelete).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByRole("button", { name: /edit/i }));
    await expect(args.onEdit).toHaveBeenCalledTimes(1);
    await expect(args.onDelete).not.toHaveBeenCalled();

    await userEvent.click(canvas.getByRole("button", { name: /delete/i }));
    await expect(args.onDelete).toHaveBeenCalledTimes(1);
  },
};
