import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import DashboardCard from "./DashboardCard";

// Use inline SVG elements as icons — avoids importing from Icons.tsx which may
// have path issues in Storybook's Vite build
const StudentIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const TeacherIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
    <path d="M16 3H8v4h8V3z" />
  </svg>
);

const meta: Meta<typeof DashboardCard> = {
  title: "Dashboard/DashboardCard",
  component: DashboardCard,
  tags: ["autodocs"],
  args: { onNavigate: fn() },
  decorators: [
    (Story) => (
      <div className="grid grid-cols-2 gap-4 max-w-xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DashboardCard>;

export const Students: Story = {
  args: { id: 1, icon: StudentIcon, count: 342, label: "Total Students" },
};

export const Teachers: Story = {
  args: { id: 2, icon: TeacherIcon, count: 28, label: "Total Teachers" },
};

export const LargeNumber: Story = {
  args: { id: 3, icon: StudentIcon, count: 12480, label: "Messages Sent" },
};

export const ZeroCount: Story = {
  args: { id: 4, icon: TeacherIcon, count: 0, label: "Pending Complaints" },
};

export const AllCards: Story = {
  render: (args) => (
    <div className="grid grid-cols-2 gap-4 max-w-2xl">
      <DashboardCard {...args} id={1} icon={StudentIcon} count={342} label="Total Students" />
      <DashboardCard {...args} id={2} icon={TeacherIcon} count={28} label="Total Teachers" />
      <DashboardCard {...args} id={3} icon={StudentIcon} count={18} label="Active Classes" />
      <DashboardCard {...args} id={4} icon={TeacherIcon} count={5} label="Pending Complaints" />
    </div>
  ),
};
