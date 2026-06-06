import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Button } from "./button";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardContent>Simple card with just content.</CardContent>
    </Card>
  ),
};

export const WithHeader: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>A helpful description for context.</CardDescription>
      </CardHeader>
      <CardContent>Card body content goes here.</CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Confirm Action</CardTitle>
        <CardDescription>This action cannot be undone.</CardDescription>
      </CardHeader>
      <CardContent>Are you sure you want to proceed?</CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="destructive">Delete</Button>
        <Button variant="outline">Cancel</Button>
      </CardFooter>
    </Card>
  ),
};
