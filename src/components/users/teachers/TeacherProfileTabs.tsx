"use client";

import React from "react";
import { Award, Badge, BookOpen, Briefcase, Clock, Mail, Phone, User } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { Pill } from "@/components/tl";
import type { TeacherById } from "@/app/services/teacher.service";
import { DetailTile, SectionCard, tileGrid } from "../parts";
import { orNotRecorded } from "./teacherProfileAtoms";

/**
 * Name, staff number, contact details and account status.
 *
 * @param props - The teacher.
 * @param props.teacher - The teacher's profile.
 * @returns The tab.
 */
export function TeacherPersonalTab({ teacher }: { teacher: TeacherById }) {
  const isActive = teacher.userId.isActive;

  return (
    <SectionCard title="Personal Details">
      <div className={tileGrid}>
        <DetailTile icon={Badge} label="Staff Number" value={teacher.staffNumber || "Not assigned"} mono />
        <DetailTile icon={User} label="First Name" value={orNotRecorded(teacher.userId.firstName)} />
        <DetailTile icon={User} label="Last Name" value={orNotRecorded(teacher.userId.lastName)} />
        <DetailTile icon={Phone} label="Phone Number" value={orNotRecorded(teacher.userId.phoneNumber)} />
        <DetailTile icon={Mail} label="Email Address" value={orNotRecorded(teacher.userId.email)} />
        <DetailTile
          icon={Badge}
          label="Account Status"
          value={
            <Pill tone={isActive ? "success" : "danger"} dot>
              {isActive ? "Active Account" : "Inactive Account"}
            </Pill>
          }
        />
      </div>
    </SectionCard>
  );
}

/**
 * Highest qualification, years of experience and specialization.
 *
 * @param props - The teacher.
 * @param props.teacher - The teacher's profile.
 * @returns The tab.
 */
export function TeacherQualificationsTab({ teacher }: { teacher: TeacherById }) {
  return (
    <SectionCard title="Qualifications & Experience">
      <div className={tileGrid}>
        <Tooltip content="Academic credential. For record-keeping only." side="top">
          <div>
            <DetailTile
              icon={Award}
              label="Highest Qualification"
              value={orNotRecorded(teacher.highestAcademicQualification)}
            />
          </div>
        </Tooltip>
        <DetailTile
          icon={Clock}
          label="Teaching Experience"
          value={
            <span className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold">{teacher.yearsOfExperience ?? 0}</span>
              <span>years</span>
            </span>
          }
        />
        <DetailTile
          icon={BookOpen}
          label="Subject Expertise"
          value={orNotRecorded(teacher.specialization)}
          hint="Primary teaching subject"
        />
      </div>
    </SectionCard>
  );
}

/**
 * Employment type and role.
 *
 * @param props - The teacher.
 * @param props.teacher - The teacher's profile.
 * @returns The tab.
 */
export function TeacherEmploymentTab({ teacher }: { teacher: TeacherById }) {
  return (
    <SectionCard title="Employment Details">
      <div className={tileGrid}>
        <DetailTile
          icon={Briefcase}
          label="Employment Type"
          value={orNotRecorded(teacher.employmentType)}
          hint="Work schedule"
        />
        <DetailTile
          icon={Badge}
          label="Employment Role"
          value={orNotRecorded(teacher.employmentRole)}
          hint="Position type"
        />
      </div>
    </SectionCard>
  );
}
