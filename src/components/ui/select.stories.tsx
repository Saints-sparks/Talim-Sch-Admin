import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

const meta: Meta = {
  title: "UI/Select",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56" aria-label="Select a term">
        <SelectValue placeholder="Select a term..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="term1">Term 1</SelectItem>
        <SelectItem value="term2">Term 2</SelectItem>
        <SelectItem value="term3">Term 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithDefaultValue: Story = {
  render: () => (
    <Select defaultValue="term1">
      <SelectTrigger className="w-56" aria-label="Select a term">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="term1">Term 1</SelectItem>
        <SelectItem value="term2">Term 2</SelectItem>
        <SelectItem value="term3">Term 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-56" aria-label="Locked select">
        <SelectValue placeholder="Locked" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="x">x</SelectItem>
      </SelectContent>
    </Select>
  ),
};
