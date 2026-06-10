import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InlineSpinner, SectionSkeleton, GridSkeleton, PageSkeleton } from "./loading";

const meta: Meta = {
  title: "UI/Loading",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <InlineSpinner />,
};

export const CustomLabel: Story = {
  render: () => <InlineSpinner label="Saving..." />,
};

export const Section: Story = {
  render: () => <SectionSkeleton rows={3} />,
};

export const Grid: Story = {
  render: () => <GridSkeleton cards={3} />,
};

export const Page: Story = {
  render: () => <PageSkeleton />,
};
