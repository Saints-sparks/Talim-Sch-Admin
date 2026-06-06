import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta: Meta = {
  title: "UI/Tabs",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="students" className="w-96">
      <TabsList>
        <TabsTrigger value="students">Students</TabsTrigger>
        <TabsTrigger value="teachers">Teachers</TabsTrigger>
        <TabsTrigger value="parents">Parents</TabsTrigger>
      </TabsList>
      <TabsContent value="students">Student list content goes here.</TabsContent>
      <TabsContent value="teachers">Teacher list content goes here.</TabsContent>
      <TabsContent value="parents">Parent list content goes here.</TabsContent>
    </Tabs>
  ),
};

export const SecondTabActive: Story = {
  render: () => (
    <Tabs defaultValue="teachers" className="w-96">
      <TabsList>
        <TabsTrigger value="students">Students</TabsTrigger>
        <TabsTrigger value="teachers">Teachers</TabsTrigger>
      </TabsList>
      <TabsContent value="students">Students tab</TabsContent>
      <TabsContent value="teachers">Teachers tab — active by default</TabsContent>
    </Tabs>
  ),
};
