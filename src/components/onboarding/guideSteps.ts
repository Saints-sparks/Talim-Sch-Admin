"use client";

import {
  BookOpen,
  CalendarDays,
  Clock,
  GraduationCap,
  LayoutGrid,
  Lightbulb,
  ListTree,
  Megaphone,
  MessageSquarePlus,
  Settings,
  UserPlus,
  UsersRound,
} from "lucide-react";
import type { ComponentType } from "react";

export type GuideStep = {
  target: string;
  title: string;
  description: string;
  eyebrow?: string;
  icon?: ComponentType<{ className?: string }>;
};

export type GuideConfig = {
  id: string;
  pathMatchers: string[];
  exactOnly?: boolean;
  steps: GuideStep[];
};

export const guideConfigs: GuideConfig[] = [
  {
    id: "classes",
    pathMatchers: ["/classes"],
    exactOnly: true,
    steps: [
      {
        target: "classes-header",
        eyebrow: "Academic setup",
        title: "Class Management",
        description:
          "Classes are the containers for students, courses, teachers, and timetables. Start here before connecting the rest of the school workflow.",
        icon: LayoutGrid,
      },
      {
        target: "classes-create",
        title: "Create a Class",
        description:
          "Use Add Class to define the class name, grade level, capacity, and description before assigning students or courses.",
        icon: Lightbulb,
      },
      {
        target: "classes-overview",
        title: "Review Class Coverage",
        description:
          "The class list shows each class with its grade level, course count, student capacity, and last update so admins can audit setup quickly.",
        icon: UsersRound,
      },
      {
        target: "classes-list",
        title: "Understand Class Cards",
        description:
          "Each class card gives quick access to edit actions and Manage Class, where admins connect students, courses, and teacher relationships.",
        icon: Settings,
      },
    ],
  },
  {
    id: "students",
    pathMatchers: ["/users/students"],
    steps: [
      {
        target: "students-header",
        eyebrow: "User management",
        title: "Student Directory",
        description:
          "This is where the school keeps every learner account, class assignment, and active status in one place.",
        icon: UsersRound,
      },
      {
        target: "students-add",
        title: "Create Student Accounts",
        description:
          "Use Add Student to enrol a learner. The modal first creates login credentials, then completes class placement and parent contact details.",
        icon: UserPlus,
      },
      {
        target: "students-filters",
        title: "Find Students Fast",
        description:
          "Search, class filters, and status filters help admins audit enrolment without opening every profile.",
        icon: Lightbulb,
      },
      {
        target: "students-list",
        title: "Student and Parent Relationship",
        description:
          "A student profile stores guardian details so parents can be connected to the learner for communication and records.",
        icon: UsersRound,
      },
    ],
  },
  {
    id: "teachers",
    pathMatchers: ["/users/teachers"],
    steps: [
      {
        target: "teachers-header",
        eyebrow: "Staff setup",
        title: "Teacher Directory",
        description:
          "Manage teacher accounts, employment status, and the classes or courses each teacher supports.",
        icon: UsersRound,
      },
      {
        target: "teachers-add",
        title: "Create Teacher Accounts",
        description:
          "Add Teacher registers the staff login first, then gathers personal, qualification, availability, and class assignment details.",
        icon: UserPlus,
      },
      {
        target: "teachers-filters",
        title: "Filter by Class or Status",
        description:
          "Use filters to quickly find active teachers or staff connected to a particular class.",
        icon: Lightbulb,
      },
      {
        target: "teachers-list",
        title: "Course and Class Ownership",
        description:
          "Teacher profiles become the source for assigning form teachers, course teachers, and message recipients.",
        icon: BookOpen,
      },
    ],
  },
  {
    id: "assessments",
    pathMatchers: ["/assessments"],
    steps: [
      {
        target: "assessments-header",
        eyebrow: "Academic tracking",
        title: "Assessment Management",
        description:
          "Assessments define exams, tests, projects, or activities that collect scores for a specific academic term.",
        icon: GraduationCap,
      },
      {
        target: "assessments-create",
        title: "Create an Assessment",
        description:
          "Set up the assessment name, term, type, and status so teachers know what to score and when.",
        icon: Lightbulb,
      },
      {
        target: "assessments-stats",
        title: "Track Assessment Status",
        description:
          "The summary cards show how many assessments are active, pending, completed, or still being prepared.",
        icon: CalendarDays,
      },
      {
        target: "assessments-list",
        title: "Publish When Ready",
        description:
          "Drafts stay internal. Published assessments become visible for scoring, and closed assessments preserve final results.",
        icon: BookOpen,
      },
    ],
  },
  {
    id: "settings",
    pathMatchers: ["/settings"],
    steps: [
      {
        target: "settings-header",
        eyebrow: "School calendar",
        title: "Academic Settings",
        description:
          "This page controls the academic years and terms that assessments, timetables, and reports depend on.",
        icon: Settings,
      },
      {
        target: "settings-add-year",
        title: "Add Academic Years",
        description:
          "Create the school year, such as 2025/2026, before adding terms underneath it.",
        icon: CalendarDays,
      },
      {
        target: "settings-year-select",
        title: "Choose the Working Year",
        description:
          "Selecting a year changes which terms and records are shown across the academic setup workflow.",
        icon: Lightbulb,
      },
      {
        target: "settings-add-term",
        title: "Add and Activate Terms",
        description:
          "Terms define active periods. Mark the current term so timetable entries and assessments default correctly.",
        icon: CalendarDays,
      },
    ],
  },
  {
    id: "messages",
    pathMatchers: ["/messages"],
    steps: [
      {
        target: "messages-shell",
        eyebrow: "Communication",
        title: "Chat and Messaging",
        description:
          "Messaging keeps school conversations organised between admins, teachers, parents, and groups.",
        icon: MessageSquarePlus,
      },
      {
        target: "messages-search",
        title: "Find Conversations",
        description:
          "Search and filters help separate one-to-one chats from group conversations when the school gets busy.",
        icon: Lightbulb,
      },
      {
        target: "messages-create-group",
        title: "Create Group Chats",
        description:
          "Use Create Group to bring teachers, parents, or class stakeholders into one shared conversation.",
        icon: UsersRound,
      },
      {
        target: "messages-chat-area",
        title: "Open and Reply",
        description:
          "Select a conversation to read messages, reply, and keep the school communication record in one place.",
        icon: MessageSquarePlus,
      },
    ],
  },
  {
    id: "curriculum",
    pathMatchers: ["/curriculum"],
    steps: [
      {
        target: "curriculum-header",
        eyebrow: "Curriculum setup",
        title: "Curriculum Management",
        description:
          "Curriculum connects subjects, courses, classes, and teachers into the structure students learn from.",
        icon: BookOpen,
      },
      {
        target: "curriculum-stats",
        title: "Subjects vs Courses",
        description:
          "Subjects are broad areas like Mathematics. Courses are the class-level units assigned to a teacher and learners.",
        icon: GraduationCap,
      },
      {
        target: "curriculum-actions",
        title: "Build the Structure",
        description:
          "Add subjects first, then create courses under them and assign each course to a class.",
        icon: Lightbulb,
      },
      {
        target: "curriculum-manage-structure",
        title: "Assign Classes and Teachers",
        description:
          "Manage Structure is where the school maps courses to classes and keeps the teaching plan organised.",
        icon: Settings,
      },
    ],
  },
  {
    id: "curriculum-structure",
    pathMatchers: ["/curriculum/structure"],
    steps: [
      {
        target: "curriculum-structure-header",
        eyebrow: "Curriculum structure",
        title: "Build the Academic Map",
        description:
          "This page is where Talim turns broad subjects into class-ready courses that can be assigned to teachers and reused in timetables.",
        icon: ListTree,
      },
      {
        target: "curriculum-structure-stats",
        title: "Check Setup Coverage",
        description:
          "Use these totals to see whether your school has enough subjects, courses, and classes connected for the current setup.",
        icon: GraduationCap,
      },
      {
        target: "curriculum-structure-filters",
        title: "Find a Subject Quickly",
        description:
          "Search by subject name or code, then filter by class when you need to audit one part of the curriculum.",
        icon: Lightbulb,
      },
      {
        target: "curriculum-structure-list",
        title: "Subject to Course Flow",
        description:
          "Create the subject first, expand it, then add courses under it with class and teacher assignments for daily learning.",
        icon: BookOpen,
      },
    ],
  },
  {
    id: "timetable",
    pathMatchers: ["/timetable"],
    steps: [
      {
        target: "timetable-header",
        eyebrow: "Class scheduling",
        title: "Class Timetable",
        description:
          "The timetable starts with a selected class, loads the courses assigned to that class, then lets you place each course into weekly time slots.",
        icon: Clock,
      },
      {
        target: "timetable-controls",
        title: "Choose the Working Class",
        description:
          "Pick the class before scheduling. Talim uses that class to fetch available courses and existing timetable entries.",
        icon: Settings,
      },
      {
        target: "timetable-subjects",
        title: "Drag Available Courses",
        description:
          "Courses in this panel come from Curriculum. Drag one into an empty slot or use Add Entry for a form-based flow.",
        icon: BookOpen,
      },
      {
        target: "timetable-grid",
        title: "Drop, Save, and Review",
        description:
          "Each grid cell represents a day and time range. Dropping a course creates the timetable entry and keeps the teacher attached.",
        icon: CalendarDays,
      },
      {
        target: "timetable-actions",
        title: "Reuse and Share Schedules",
        description:
          "Copy a template to start faster, refresh when data changes, and download the timetable as Excel for printing or sharing.",
        icon: Lightbulb,
      },
    ],
  },
  {
    id: "announcements",
    pathMatchers: ["/announcements"],
    steps: [
      {
        target: "announcements-header",
        eyebrow: "School communication",
        title: "Announcements",
        description:
          "Use this dashboard to create, schedule, monitor, and review official school announcements from one place.",
        icon: Megaphone,
      },
      {
        target: "announcements-create",
        title: "Create a New Update",
        description:
          "New Announcement opens the composer where admins choose the audience, publish timing, attachments, and preview before sending.",
        icon: MessageSquarePlus,
      },
      {
        target: "announcements-stats",
        title: "Track Announcement Volume",
        description:
          "These cards come from the backend and show total, published, scheduled, and draft counts with week-over-week changes.",
        icon: LayoutGrid,
      },
      {
        target: "announcements-list",
        title: "Filter by Workflow Stage",
        description:
          "Use the tabs to switch between published, scheduled, draft, and archived announcements, then scan audience, status, date, and read rate.",
        icon: BookOpen,
      },
      {
        target: "announcements-analytics",
        title: "Review Engagement",
        description:
          "The analytics panel summarizes read rate, parent engagement, student engagement, and daily views using live announcement data.",
        icon: Lightbulb,
      },
    ],
  },
];

export function findGuideConfig(pathname: string) {
  return guideConfigs
    .filter((config) =>
      config.pathMatchers.some(
        (matcher) =>
          pathname === matcher ||
          (!config.exactOnly && pathname.startsWith(`${matcher}/`))
      )
    )
    .sort((a, b) => {
      const longestA = Math.max(...a.pathMatchers.map((matcher) => matcher.length));
      const longestB = Math.max(...b.pathMatchers.map((matcher) => matcher.length));
      return longestB - longestA;
    })[0];
}
