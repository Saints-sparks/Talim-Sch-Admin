"use client";

import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Lightbulb,
  MessageSquarePlus,
  Settings,
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
  steps: GuideStep[];
};

export const guideConfigs: GuideConfig[] = [
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
          "Use Add Student to enrol a learner. The flow creates the student account first, then collects profile and guardian details.",
        icon: GraduationCap,
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
          "Add Teacher registers the login account and then completes the teacher profile used across classes, courses, and messaging.",
        icon: GraduationCap,
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
];

export function findGuideConfig(pathname: string) {
  return guideConfigs.find((config) =>
    config.pathMatchers.some(
      (matcher) => pathname === matcher || pathname.startsWith(`${matcher}/`)
    )
  );
}
