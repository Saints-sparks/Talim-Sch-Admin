import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Textarea } from "./textarea";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
    rows: { control: "number" },
  },
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: { placeholder: "Enter description...", rows: 4 },
};

export const WithValue: Story = {
  args: {
    defaultValue: "This assessment covers chapters 1 through 5.",
    rows: 4,
    "aria-label": "Assessment description",
  },
};

export const Disabled: Story = {
  args: { placeholder: "Cannot edit", disabled: true, rows: 4 },
};
