import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

const meta: Meta = {
  title: "UI/Avatar",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const WithImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="User" />
      <AvatarFallback>SC</AvatarFallback>
    </Avatar>
  ),
};

export const FallbackInitials: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="/broken-link.png" alt="User" />
      <AvatarFallback>MA</AvatarFallback>
    </Avatar>
  ),
};

export const SizingExamples: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {(["h-6 w-6", "h-8 w-8", "h-10 w-10", "h-14 w-14"] as const).map((size) => (
        <Avatar key={size} className={size}>
          <AvatarFallback>TL</AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
};
