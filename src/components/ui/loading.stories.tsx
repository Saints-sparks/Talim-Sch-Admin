import type { Meta, StoryObj } from "@storybook/nextjs-vite";

// Dynamically import Loading to see what the component exposes
const meta: Meta = {
  title: "UI/Loading",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

// Render the loading file as-is — adjust import path if the export name differs
export const Default: Story = {
  render: () => {
    const { default: Loading } = require("./loading");
    return <Loading />;
  },
};
