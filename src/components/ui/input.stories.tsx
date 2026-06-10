import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["text", "email", "password", "number", "search"],
    },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: "Enter value...", type: "text" },
};

export const Email: Story = {
  args: { placeholder: "admin@school.ng", type: "email" },
};

export const Password: Story = {
  args: { placeholder: "Password", type: "password" },
};

export const Disabled: Story = {
  args: { placeholder: "Cannot edit", disabled: true },
};

export const WithValue: Story = {
  args: { defaultValue: "Pre-filled value", type: "text", "aria-label": "Pre-filled input" },
};
