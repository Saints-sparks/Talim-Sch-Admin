"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, ChevronRight, FileText, Users } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { Permission } from "@/lib/permissions";
import { Card, SectionHeader } from "@/components/settings/ui";

const LINKS = [
  {
    title: "Manage Classes",
    desc: "Add, edit and manage class levels for your school",
    icon: Users,
    link: "/classes",
    action: "Go to Classes",
    permission: Permission.MANAGE_CLASSES,
  },
  {
    title: "Manage Subjects",
    desc: "Add, edit and assign subjects to classes",
    icon: BookOpen,
    link: "/subject",
    action: "Go to Subjects",
    permission: Permission.MANAGE_CURRICULUM,
  },
  {
    title: "Curriculum Library",
    desc: "View and manage curriculum content linked to classes",
    icon: FileText,
    link: "/curriculum",
    action: "Go to Curriculum",
    permission: Permission.MANAGE_CURRICULUM,
  },
  {
    title: "Class Promotion Settings",
    desc: "Configure promotion rules and criteria",
    icon: ChevronRight,
    link: "/classes",
    action: "Configure",
    permission: Permission.MANAGE_CLASSES,
  },
];

/**
 * Settings → Classes & Curriculum: shortcuts into the modules that own this
 * data. Only the shortcuts the user's role can actually open are shown —
 * following one without its permission would land on Access Denied.
 */
export function ClassesCurriculumSection() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const links = LINKS.filter((c) => hasPermission(c.permission));

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Classes & Curriculum"
        desc="Quick access to class and curriculum management"
      />
      {links.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Your role doesn&apos;t manage classes or curriculum.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {links.map((c) => (
            <Card
              key={c.title}
              className="p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(c.link)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#EBF0F7] dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <c.icon className="w-5 h-5 text-[#003366] dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{c.title}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{c.desc}</p>
                </div>
                <span className="text-xs text-[#003366] dark:text-blue-400 font-medium shrink-0 flex items-center gap-1">
                  {c.action} <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
